import { REFUND_RECEIPTS_SQL } from './finance-sql';
import {
  StatsDetailQuery,
  StatsDetailPage,
  RefundReceipt,
  detailSql,
} from './statistics-details';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MembershipRefund } from '../domain/membership-refund';
import { ADMIN_STATS_SQL, AdminStats, finishStats } from './admin-stats';
import { BILLING_AUDIT_SQL } from './billing-audit';
import { MembershipOrder } from '../domain/membership-order';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { OnApplicationShutdown } from '@nestjs/common';
import {
  BillingCycle,
  Membership,
  PaymentMethod,
  SubscriptionCategory,
  SubscriptionRecord,
  SubscriptionStatus,
  UserSettings,
} from '../domain/subscription';
import {
  AdminMembershipGrant,
  RuntimePolicy,
  DEFAULT_RUNTIME_POLICY,
  SubscriptionsRepository,
} from './subscriptions.repository';
import { randomUUID } from 'node:crypto';
import { AdminOverview, AdminPage, AdminQuery } from './admin-read';
import {
  AuthorizationResult,
  DeliveryInput,
  DeliveryStatus,
  NotificationDelivery,
  WechatIdentity,
} from '../../notifications/notification.repository';

type PersistedSubscription = Prisma.SubscriptionGetPayload<{
  include: { reminders: true; renewalHistory: true };
}>;

type PrismaExecutor = Pick<
  Prisma.TransactionClient,
  | 'appUser'
  | 'subscription'
  | 'userSettings'
  | 'membership'
  | 'membershipOrder'
  | 'notificationGrant'
  | 'notificationDelivery'
  | '$queryRawUnsafe'
  | '$queryRaw'
>;

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toDate(value: string): Date {
  return new Date(value + 'T12:00:00.000Z');
}

function toRecord(value: PersistedSubscription): SubscriptionRecord {
  return {
    id: value.id,
    userId: value.userId,
    name: value.name,
    plan: value.plan,
    logo: value.logo,
    color: value.color,
    amount: value.amount?.toNumber() ?? null,
    currency: value.currency,
    cycle: value.cycle as BillingCycle,
    cycleValue: value.cycleValue,
    nextBillingDate: dateKey(value.nextBillingDate),
    payment: value.payment as PaymentMethod,
    anchorDay: value.anchorDay,
    category: value.category as SubscriptionCategory,
    status: value.status as SubscriptionStatus,
    autoRenew: value.autoRenew,
    reminders: value.reminders
      .map((reminder) => reminder.offsetDays)
      .sort((left, right) => right - left),
    trialEndDate: value.trialEndDate ? dateKey(value.trialEndDate) : null,
    note: value.note,
    cancelGuide: value.cancelGuide,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
    deletedAt: value.deletedAt?.toISOString() ?? null,
    isDemo: value.isDemo,
    renewalHistory: value.renewalHistory
      .sort(
        (left, right) => left.renewedAt.getTime() - right.renewedAt.getTime(),
      )
      .map((event) => ({
        id: event.id,
        renewedAt: event.renewedAt.toISOString(),
        previousStatus: event.previousStatus as SubscriptionStatus,
        previousNextBillingDate: dateKey(event.previousNextBillingDate),
        nextBillingDate: dateKey(event.nextBillingDate),
        amount: event.amount?.toNumber() ?? null,
        currency: event.currency,
      })),
    lastRenewedAt: value.lastRenewedAt?.toISOString() ?? null,
    lastRenewalNextBillingDate: value.lastRenewalNextBillingDate
      ? dateKey(value.lastRenewalNextBillingDate)
      : null,
  };
}

export class PrismaSubscriptionsRepository
  implements SubscriptionsRepository, OnApplicationShutdown
{
  constructor(
    private readonly executor: PrismaExecutor,
    private readonly rootClient?: PrismaClient,
  ) {}

  async getRuntimePolicy(): Promise<RuntimePolicy> {
    const [row] = await this.executor.$queryRaw<
      RuntimePolicy[]
    >`SELECT membership_enabled AS "membershipEnabled",free_subscription_limit AS "freeSubscriptionLimit",to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",updated_by AS "updatedBy" FROM runtime_policy WHERE id=1`;
    return row ?? { ...DEFAULT_RUNTIME_POLICY };
  }
  async saveRuntimePolicy(policy: RuntimePolicy): Promise<RuntimePolicy> {
    await this.executor
      .$queryRaw`INSERT INTO runtime_policy (id,membership_enabled,free_subscription_limit,updated_at,updated_by) VALUES (1,${policy.membershipEnabled},${policy.freeSubscriptionLimit},${new Date(policy.updatedAt!)},${policy.updatedBy}) ON CONFLICT (id) DO UPDATE SET membership_enabled=EXCLUDED.membership_enabled,free_subscription_limit=EXCLUDED.free_subscription_limit,updated_at=EXCLUDED.updated_at,updated_by=EXCLUDED.updated_by RETURNING id`;
    return policy;
  }
  static create(client: PrismaClient): PrismaSubscriptionsRepository {
    return new PrismaSubscriptionsRepository(client, client);
  }

  async findAdminMembershipGrant(
    userId: string,
    action: 'grant' | 'revoke' = 'grant',
  ): Promise<AdminMembershipGrant | null> {
    const [row] = await this.executor.$queryRaw<
      AdminMembershipGrant[]
    >`SELECT id,user_id AS "userId",action,previous_membership AS "previousMembership",note,operator,to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt" FROM admin_membership_grants WHERE user_id=${userId} AND action=${action} ORDER BY created_at DESC,id DESC LIMIT 1`;
    return row ?? null;
  }

  async recordAdminMembershipGrant(grant: AdminMembershipGrant): Promise<void> {
    await this.executor
      .$queryRaw`INSERT INTO admin_membership_grants(id,user_id,action,previous_membership,note,operator,created_at) VALUES(${grant.id}::uuid,${grant.userId},${grant.action},${JSON.stringify(grant.previousMembership)}::jsonb,${grant.note},${grant.operator},${new Date(grant.createdAt)}) RETURNING id`;
  }

  async recordUserAccess(userId: string, ip: string, at: Date): Promise<void> {
    await this.executor.appUser.updateMany({
      where: {
        id: userId,
        AND: [
          { OR: [{ lastAccessAt: null }, { lastAccessAt: { lte: at } }] },
          {
            OR: [
              { lastAccessAt: null },
              { lastAccessIp: null },
              { lastAccessIp: { not: ip } },
              { lastAccessAt: { lte: new Date(at.getTime() - 60000) } },
            ],
          },
        ],
      },
      data: { lastAccessIp: ip, lastAccessAt: at },
    });
  }

  async findUserTestFlag(userId: string) {
    const [row] = await this.executor.$queryRaw<
      {
        isTest: boolean;
        testNote: string | null;
        testUpdatedBy: string | null;
        testUpdatedAt: string | null;
      }[]
    >`SELECT is_test AS "isTest",test_note AS "testNote",test_updated_by AS "testUpdatedBy",to_char(test_updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "testUpdatedAt" FROM app_users WHERE id=${userId}`;
    if (!row) throw new NotFoundException('没有找到此账号');
    return row;
  }
  async setUserTestFlag(
    userId: string,
    isTest: boolean,
    note: string,
    operator: string,
  ): Promise<void> {
    const write = async (repo: PrismaSubscriptionsRepository) => {
      const before = await (
        repo as PrismaSubscriptionsRepository
      ).findUserTestFlag(userId);
      await (repo as PrismaSubscriptionsRepository).executor
        .$queryRaw`UPDATE app_users SET is_test=${isTest},test_note=${note},test_updated_by=${operator},test_updated_at=CURRENT_TIMESTAMP WHERE id=${userId} RETURNING id`;
      await (repo as PrismaSubscriptionsRepository).executor
        .$queryRaw`INSERT INTO admin_user_label_events(id,user_id,previous_is_test,is_test,note,operator) VALUES(${randomUUID()}::uuid,${userId},${before.isTest},${isTest},${note},${operator}) RETURNING id`;
    };
    if (this.rootClient) {
      // This dedicated admin operation writes classification metadata only.
      // Local business connections keep their default read-only transaction mode.
      await this.rootClient.$transaction(async (tx) => {
        await tx.$executeRaw`SET TRANSACTION READ WRITE`;
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId},0))::text`;
        await write(new PrismaSubscriptionsRepository(tx));
      });
    } else await write(this);
  }
  async recordRefundReceipt(r: RefundReceipt): Promise<void> {
    const existing = await this.listRefundReceipts(r.orderId);
    const legacy = existing.find((x) => x.id.startsWith('legacy:'));
    if (legacy && existing.length === 1 && legacy.amount === r.amount) {
      if (!legacy.confirmedAt && r.confirmedAt)
        await this.executor
          .$queryRaw`UPDATE payment_refund_receipts SET confirmed_at=${r.confirmedAt}::timestamptz,time_source='platform' WHERE id=${legacy.id} AND confirmed_at IS NULL RETURNING id`;
      return;
    }
    const repeated = existing.find((x) => x.id === r.id);
    if (repeated) {
      if (repeated.amount !== r.amount)
        throw new ConflictException('退款凭据金额不一致');
      if (!repeated.confirmedAt && r.confirmedAt)
        await this.executor
          .$queryRaw`UPDATE payment_refund_receipts SET confirmed_at=${r.confirmedAt}::timestamptz,time_source='platform' WHERE id=${r.id} AND confirmed_at IS NULL RETURNING id`;
      return;
    }
    const order = await this.findMembershipOrderById(r.orderId);
    if (
      !order ||
      existing.reduce((s, x) => s + x.amount, 0) + r.amount > order.amount
    )
      throw new ConflictException('累计退款超过订单金额');
    const inserted = await this.executor.$queryRaw<
      { id: string }[]
    >`INSERT INTO payment_refund_receipts(id,order_id,amount,confirmed_at,observed_at,source,time_source) VALUES(${r.id},${r.orderId},${r.amount},${r.confirmedAt}::timestamptz,${r.observedAt}::timestamptz,${r.source},${r.timeSource}) ON CONFLICT(id) DO NOTHING RETURNING id`;
    if (!inserted.length)
      throw new ConflictException('退款凭据已被其他记录使用');
  }
  async listRefundReceipts(orderId: string): Promise<RefundReceipt[]> {
    return this.executor.$queryRaw<
      RefundReceipt[]
    >`SELECT id,order_id AS "orderId",amount,to_char(confirmed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "confirmedAt",to_char(observed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "observedAt",source,time_source AS "timeSource" FROM payment_refund_receipts WHERE order_id=${orderId}`;
  }
  async statsDetails(q: StatsDetailQuery): Promise<StatsDetailPage> {
    const spec = detailSql(q.metric),
      base = `WITH detail_rows AS (${spec.sql}), filtered AS (SELECT * FROM detail_rows r WHERE strpos(lower(row_to_json(r)::text),lower($4))>0 AND ($6::boolean OR NOT $6::boolean))`;
    const [result] = await this.executor.$queryRawUnsafe<
      {
        items: Record<string, unknown>[];
        total: number;
        totalAmountCny: number | null;
      }[]
    >(
      base +
        ` SELECT COALESCE((SELECT json_agg(p) FROM (SELECT * FROM filtered ORDER BY id LIMIT 20 OFFSET $5) p),'[]'::json) items,(SELECT COUNT(*)::int FROM filtered) total,` +
        (spec.hasAmount
          ? `(SELECT COALESCE(SUM(ROUND(amount*100)),0)::double precision/100 FROM filtered)`
          : 'NULL::double precision') +
        ` AS "totalAmountCny"`,
      q.from,
      q.to,
      q.excludeTest,
      q.search,
      (q.page - 1) * 20,
      q.includeUndated === true,
    );
    return {
      ...result,
      totalAmountCny: result.totalAmountCny ?? undefined,
      page: q.page,
      pageSize: 20,
      columns: spec.columns,
    };
  }
  async findMembershipRefund(
    orderId: string,
  ): Promise<MembershipRefund | null> {
    const rows = await this.executor.$queryRaw<MembershipRefund[]>`
      SELECT order_id AS "orderId",refund_id AS "refundId",amount,status,reason,reason_code AS "reasonCode",operator,error_code AS "errorCode",
      to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
      to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
      to_char(completed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "completedAt"
      FROM membership_refunds WHERE order_id=${orderId}`;
    return rows[0] || null;
  }
  async saveMembershipRefund(r: MembershipRefund): Promise<void> {
    await this.executor.$queryRaw`
      INSERT INTO membership_refunds(order_id,refund_id,amount,status,reason,reason_code,operator,error_code,created_at,updated_at,completed_at)
      VALUES(${r.orderId},${r.refundId},${r.amount},${r.status},${r.reason},${r.reasonCode},${r.operator},${r.errorCode},${r.createdAt}::timestamptz,${r.updatedAt}::timestamptz,${r.completedAt}::timestamptz)
      ON CONFLICT(order_id) DO UPDATE SET status=EXCLUDED.status,error_code=EXCLUDED.error_code,updated_at=EXCLUDED.updated_at,completed_at=EXCLUDED.completed_at
      RETURNING order_id`;
  }
  async listPendingRefunds(
    afterId: string,
    limit: number,
  ): Promise<MembershipRefund[]> {
    const ids = await this.executor.$queryRaw<
      { orderId: string }[]
    >`SELECT order_id AS "orderId" FROM membership_refunds WHERE status IN ('submitting','processing','unknown') AND order_id>${afterId} ORDER BY order_id LIMIT ${limit}`;
    const rows = await Promise.all(
      ids.map((r) => this.findMembershipRefund(r.orderId)),
    );
    return rows.filter((r): r is MembershipRefund => r !== null);
  }
  async recordUserActivity(userId: string, at: Date): Promise<void> {
    await this.executor.$queryRaw`
      INSERT INTO user_daily_activity (user_id,activity_date,first_seen_at,last_seen_at)
      SELECT id,(${at}::timestamptz AT TIME ZONE 'Asia/Shanghai')::date,${at},${at}
      FROM app_users WHERE id=${userId}
      ON CONFLICT(user_id,activity_date) DO UPDATE
      SET first_seen_at=LEAST(user_daily_activity.first_seen_at,EXCLUDED.first_seen_at),
          last_seen_at=GREATEST(user_daily_activity.last_seen_at,EXCLUDED.last_seen_at)
      WHERE user_daily_activity.last_seen_at <= EXCLUDED.last_seen_at - interval '60 seconds'
         OR user_daily_activity.first_seen_at > EXCLUDED.first_seen_at
      RETURNING user_id`;
  }
  async adminStats(length: number, excludeTest = true): Promise<AdminStats> {
    const [row] = await this.executor.$queryRawUnsafe<
      (Pick<
        AdminStats,
        'days' | 'cohorts' | 'summary' | 'activity' | 'undatedRefunds'
      > & {
        trackingSince: Date | null;
      })[]
    >(ADMIN_STATS_SQL, length, excludeTest);
    return finishStats({
      ...row,
      excludeTest,
      trackingSince: row.trackingSince?.toISOString() || null,
    });
  }

  async adminOverview(excludeTest = true): Promise<AdminOverview> {
    const [row] = await this.executor.$queryRaw<AdminOverview[]>`
      WITH eligible AS (SELECT id FROM app_users WHERE NOT ${excludeTest}::boolean OR NOT is_test),
      payments AS (SELECT COALESCE(SUM(amount),0)::bigint cents FROM membership_orders WHERE user_id IN(SELECT id FROM eligible) AND status IN('paid','refunded') AND paid_at IS NOT NULL AND channel IN('wechat','virtual') AND currency='CNY'),
      refunds AS (SELECT COALESCE(SUM(r.amount),0)::bigint cents FROM (${Prisma.raw(REFUND_RECEIPTS_SQL)}) r JOIN membership_orders o ON o.id=r.order_id WHERE o.user_id IN(SELECT id FROM eligible) AND o.channel IN('wechat','virtual') AND o.currency='CNY')
      SELECT (SELECT COUNT(*)::int FROM eligible) users,
      (SELECT COUNT(*)::int FROM subscriptions WHERE user_id IN(SELECT id FROM eligible) AND deleted_at IS NULL AND NOT is_demo) subscriptions,
      (SELECT COUNT(*)::int FROM notification_deliveries WHERE user_id IN(SELECT id FROM eligible)) notifications,
      (SELECT COUNT(*)::int FROM notification_deliveries WHERE user_id IN(SELECT id FROM eligible) AND status IN('failed','unknown')) AS "failedNotifications",
      (SELECT COUNT(*)::int FROM memberships WHERE user_id IN(SELECT id FROM eligible) AND status='active' AND plan='member' AND source!='simulation') AS "activeMembers",
      p.cents::double precision/100 AS "paidAmountCny",r.cents::double precision/100 AS "refundAmountCny",(p.cents-r.cents)::double precision/100 AS "netAmountCny"
      FROM payments p CROSS JOIN refunds r`;
    const [audit] = await this.executor.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*) total FROM (${BILLING_AUDIT_SQL}) audit`,
    );
    return {
      ...row,
      paymentIssues: Number(audit.total),
      snapshotAt: new Date().toISOString(),
    };
  }

  async adminRead({
    section,
    page,
    search,
    userId,
    failedOnly,
  }: AdminQuery): Promise<AdminPage> {
    const paging = { skip: (page - 1) * 20, take: 20 };
    const contains = { contains: search, mode: 'insensitive' as const };
    if (section === 'billingIssues') {
      const filter = ` WHERE (strpos(lower("userId"), lower($1)) > 0 OR strpos(lower(id), lower($1)) > 0 OR strpos(lower("productName"), lower($1)) > 0)`;
      const [items, counts] = await Promise.all([
        this.executor.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT * FROM (${BILLING_AUDIT_SQL}) audit${filter} ORDER BY "createdAt" DESC NULLS LAST, id ASC LIMIT 20 OFFSET $2`,
          search,
          (page - 1) * 20,
        ),
        this.executor.$queryRawUnsafe<{ total: bigint }[]>(
          `SELECT COUNT(*) AS total FROM (${BILLING_AUDIT_SQL}) audit${filter}`,
          search,
        ),
      ]);
      return { items, total: Number(counts[0].total), page, pageSize: 20 };
    }
    if (section === 'memberships') {
      const where = search ? { userId: contains } : {};
      const [items, total] = await Promise.all([
        this.executor.membership.findMany({
          where,
          ...paging,
          orderBy: [{ createdAt: 'desc' }, { userId: 'asc' }],
          select: {
            userId: true,
            status: true,
            plan: true,
            source: true,
            startedAt: true,
            createdAt: true,
          },
        }),
        this.executor.membership.count({ where }),
      ]);
      return { items, total, page, pageSize: 20 };
    }
    if (section === 'membershipOrders') {
      const where = search
        ? {
            OR: [
              { id: contains },
              { userId: contains },
              { productName: contains },
            ],
          }
        : {};
      const [rows, total] = await Promise.all([
        this.executor.membershipOrder.findMany({
          where,
          ...paging,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          select: {
            id: true,
            userId: true,
            productName: true,
            amount: true,
            currency: true,
            channel: true,
            status: true,
            paidAt: true,
            transactionId: true,
            paymentRequestedAt: true,
            deliveryConfirmedAt: true,
            createdAt: true,
          },
        }),
        this.executor.membershipOrder.count({ where }),
      ]);
      return {
        items: await Promise.all(
          rows.map(async (row) => ({
            ...row,
            amount: row.amount / 100,
            refundStatus:
              (await this.findMembershipRefund(row.id))?.status || null,
          })),
        ),
        total,
        page,
        pageSize: 20,
      };
    }
    if (section === 'authEvents') {
      const [items, counts] = await Promise.all([
        this.executor.$queryRaw<Record<string, unknown>[]>`
          SELECT id, user_id AS "userId", action, app_id AS "appId",
                 client_ip AS "clientIp", peer_ip AS "peerIp",
                 request_id AS "requestId", created_at AS "createdAt"
          FROM auth_events WHERE strpos(user_id, ${search}) > 0
          ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
        this.executor.$queryRaw<{ total: bigint }[]>`
          SELECT COUNT(*) AS total FROM auth_events WHERE strpos(user_id, ${search}) > 0`,
      ]);
      return { items, total: Number(counts[0].total), page, pageSize: 20 };
    }
    if (section === 'users') {
      const where = search ? { id: contains } : {};
      const [rows, total] = await Promise.all([
        this.executor.appUser.findMany({
          where,
          ...paging,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          select: {
            id: true,
            createdAt: true,
            lastAccessIp: true,
            lastAccessAt: true,
            settings: { select: { notificationEnabled: true } },
            membership: { select: { plan: true } },
            _count: {
              select: {
                subscriptions: { where: { deletedAt: null, isDemo: false } },
              },
            },
          },
        }),
        this.executor.appUser.count({ where }),
      ]);
      return {
        items: await Promise.all(
          rows.map(async (row) => ({
            ...(await this.findUserTestFlag(row.id)),
            id: row.id,
            createdAt: row.createdAt,
            lastAccessIp: row.lastAccessIp,
            lastAccessAt: row.lastAccessAt,
            subscriptions: row._count.subscriptions,
            notificationEnabled: row.settings?.notificationEnabled ?? false,
            plan: row.membership?.plan ?? 'free',
          })),
        ),
        total,
        page,
        pageSize: 20,
      };
    }
    if (section === 'subscriptions') {
      const where = {
        isDemo: false,
        ...(userId ? { userId } : {}),
        ...(search
          ? { OR: [{ name: contains }, { userId: contains }, { id: contains }] }
          : {}),
      };
      const [rows, total] = await Promise.all([
        this.executor.subscription.findMany({
          where,
          ...paging,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          select: {
            id: true,
            userId: true,
            name: true,
            amount: true,
            currency: true,
            status: true,
            nextBillingDate: true,
            deletedAt: true,
          },
        }),
        this.executor.subscription.count({ where }),
      ]);
      return {
        items: rows.map((row) => ({
          ...row,
          amount: row.amount?.toNumber() ?? null,
          nextBillingDate: dateKey(row.nextBillingDate),
        })),
        total,
        page,
        pageSize: 20,
      };
    }
    const where = {
      ...(userId ? { userId } : {}),
      ...(failedOnly ? { status: { in: ['failed', 'unknown'] } } : {}),
      ...(search
        ? {
            OR: [
              { userId: contains },
              { subscriptionName: contains },
              { errorCode: contains },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.executor.notificationDelivery.findMany({
        where,
        ...paging,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          userId: true,
          subscriptionName: true,
          billingDate: true,
          status: true,
          attempts: true,
          errorCode: true,
          createdAt: true,
        },
      }),
      this.executor.notificationDelivery.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        ...row,
        billingDate: dateKey(row.billingDate),
      })),
      total,
      page,
      pageSize: 20,
    };
  }

  private async locked<T>(
    userId: string,
    work: (repository: PrismaSubscriptionsRepository) => Promise<T>,
  ): Promise<T> {
    if (this.rootClient)
      return this.rootClient.$transaction(async (tx) => {
        const repository = new PrismaSubscriptionsRepository(tx);
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))::text`;
        return work(repository);
      });
    return work(this);
  }

  async recordWechatLogin(
    identity: WechatIdentity,
    context: {
      clientIp: string | null;
      peerIp: string | null;
      requestId: string;
    },
  ): Promise<void> {
    await this.locked(identity.userId, async (repository) => {
      // RETURNING identifies actual creation, even with concurrent ensureUser calls.
      const created = await repository.executor.$queryRaw<{ id: string }[]>`
        INSERT INTO app_users (id, created_at, updated_at)
        VALUES (${identity.userId}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING RETURNING id`;
      await repository.saveWechatIdentity(identity);
      const action = created.length ? 'register' : 'login';
      const eventId = randomUUID();
      await repository.executor.$queryRaw`
        INSERT INTO auth_events (id, user_id, action, app_id, client_ip, peer_ip, request_id)
        VALUES (${eventId}::uuid, ${identity.userId}, ${action}, ${identity.appId},
                ${context.clientIp}, ${context.peerIp}, ${context.requestId}) RETURNING id`;
    });
  }

  async saveWechatIdentity(identity: WechatIdentity): Promise<void> {
    const data = {
      wechatAppId: identity.appId,
      wechatOpenId: identity.openId,
      wechatSessionKeyEncrypted: identity.sessionKeyEncrypted ?? null,
      wechatSessionUpdatedAt: identity.sessionUpdatedAt
        ? new Date(identity.sessionUpdatedAt)
        : null,
    };
    await this.executor.appUser.upsert({
      where: { id: identity.userId },
      create: { id: identity.userId, ...data },
      update: data,
    });
  }

  async findWechatIdentity(userId: string): Promise<WechatIdentity | null> {
    const row = await this.executor.appUser.findUnique({
      where: { id: userId },
    });
    return row?.wechatAppId && row.wechatOpenId
      ? {
          userId,
          appId: row.wechatAppId,
          openId: row.wechatOpenId,
          sessionKeyEncrypted: row.wechatSessionKeyEncrypted,
          sessionUpdatedAt: row.wechatSessionUpdatedAt?.toISOString() || null,
        }
      : null;
  }

  async recordNotificationAuthorization(
    userId: string,
    requestId: string,
    templateId: string,
    result: AuthorizationResult,
    longTerm = false,
  ): Promise<void> {
    await this.locked(userId, async (repository) => {
      const executor = repository.executor;
      const existing = await executor.notificationGrant.findUnique({
        where: { userId_requestId: { userId, requestId } },
      });
      if (existing) return;
      await executor.notificationGrant.create({
        data: {
          id: randomUUID(),
          userId,
          requestId,
          templateId,
          result,
          status: result === 'accept' ? 'available' : 'revoked',
        },
      });
      if (result === 'accept')
        await executor.userSettings.update({
          where: { userId },
          data: { notificationEnabled: true },
        });
      if (result === 'ban' || (longTerm && result === 'reject')) {
        await executor.notificationGrant.updateMany({
          where: { userId, templateId, status: 'available' },
          data: { status: 'revoked' },
        });
        await executor.userSettings.update({
          where: { userId },
          data: { notificationEnabled: false },
        });
      }
    });
  }

  countNotificationCredits(
    userId: string,
    templateId: string,
  ): Promise<number> {
    return this.executor.notificationGrant.count({
      where: { userId, templateId, status: 'available' },
    });
  }

  async listNotificationUsers(afterId = '', limit = 100): Promise<string[]> {
    const rows = await this.executor.appUser.findMany({
      where: {
        id: { gt: afterId },
        wechatOpenId: { not: null },
        settings: { notificationEnabled: true },
      },
      orderBy: { id: 'asc' },
      take: limit,
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async claimNotificationDelivery(
    input: DeliveryInput,
    now: Date,
    longTerm = false,
  ): Promise<NotificationDelivery | null> {
    return this.locked(input.userId, async (repository) => {
      const executor = repository.executor;
      const settings = await repository.findSettings(input.userId);
      const record = await repository.findSubscription(
        input.userId,
        input.subscriptionId,
      );
      if (
        !settings?.notificationEnabled ||
        !record ||
        record.deletedAt ||
        record.isDemo ||
        record.amount === null ||
        ['paused', 'cancelled', 'archived'].includes(record.status) ||
        record.nextBillingDate !== input.billingDate ||
        !record.reminders.includes(input.offset)
      )
        return null;
      const key = {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        billingDate: toDate(input.billingDate),
        offset: input.offset,
      };
      const previous = await executor.notificationDelivery.findUnique({
        where: { userId_subscriptionId_billingDate_offset: key },
      });
      if (
        previous &&
        (previous.status !== 'failed' ||
          !previous.nextAttemptAt ||
          previous.nextAttemptAt > now ||
          previous.attempts >= 3)
      )
        return null;
      const grant = await executor.notificationGrant.findFirst({
        where: {
          userId: input.userId,
          templateId: input.templateId,
          status: 'available',
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!grant) return null;
      if (!longTerm)
        await executor.notificationGrant.update({
          where: { id: grant.id },
          data: { status: 'consumed' },
        });
      const data = {
        ...input,
        billingDate: toDate(input.billingDate),
        grantId: grant.id,
        status: 'sending',
        errorCode: null,
        nextAttemptAt: null,
        updatedAt: now,
      };
      const row = previous
        ? await executor.notificationDelivery.update({
            where: { id: previous.id },
            data: { ...data, attempts: { increment: 1 } },
          })
        : await executor.notificationDelivery.create({
            data: { id: randomUUID(), ...data, createdAt: now },
          });
      return this.toDelivery(row);
    });
  }

  async finishNotificationDelivery(
    id: string,
    status: DeliveryStatus,
    errorCode: string | null,
    retryAt?: Date,
  ): Promise<void> {
    const row = await this.executor.notificationDelivery.findUnique({
      where: { id },
    });
    if (!row) return;
    await this.locked(row.userId, async (repository) => {
      const executor = repository.executor;
      const delivery = await executor.notificationDelivery.findUnique({
        where: { id },
      });
      if (!delivery || delivery.status !== 'sending') return;
      await executor.notificationDelivery.update({
        where: { id },
        data: { status, errorCode, nextAttemptAt: retryAt ?? null },
      });
      if (status === 'failed' || status === 'skipped')
        await executor.notificationGrant.updateMany({
          where: { id: delivery.grantId, status: 'consumed' },
          data: { status: 'available' },
        });
      if (errorCode === '43101') {
        await executor.notificationGrant.updateMany({
          where: {
            userId: delivery.userId,
            templateId: delivery.templateId,
            status: 'available',
          },
          data: { status: 'revoked' },
        });
        await executor.userSettings.update({
          where: { userId: delivery.userId },
          data: { notificationEnabled: false },
        });
      }
    });
  }

  async recoverNotificationDeliveries(before: Date): Promise<void> {
    await this.executor.notificationDelivery.updateMany({
      where: { status: 'sending', updatedAt: { lt: before } },
      data: {
        status: 'unknown',
        errorCode: 'DELIVERY_UNKNOWN',
        nextAttemptAt: null,
      },
    });
  }

  private toDelivery(
    row: Prisma.NotificationDeliveryGetPayload<object>,
  ): NotificationDelivery {
    return {
      ...row,
      status: row.status as DeliveryStatus,
      billingDate: dateKey(row.billingDate),
      nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listNotificationDeliveries(
    userId: string,
  ): Promise<NotificationDelivery[]> {
    const rows = await this.executor.notificationDelivery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((row) => this.toDelivery(row));
  }

  async listSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
    const rows = await this.executor.subscription.findMany({
      where: { userId },
      include: { reminders: true, renewalHistory: true },
    });
    return rows.map(toRecord);
  }

  async findSubscription(
    userId: string,
    id: string,
  ): Promise<SubscriptionRecord | null> {
    const row = await this.executor.subscription.findFirst({
      where: { id, userId },
      include: { reminders: true, renewalHistory: true },
    });
    return row ? toRecord(row) : null;
  }

  async saveSubscription(record: SubscriptionRecord): Promise<void> {
    await this.ensureUser(record.userId);
    const scalar = {
      userId: record.userId,
      name: record.name,
      plan: record.plan,
      logo: record.logo,
      color: record.color,
      amount: record.amount,
      currency: record.currency,
      cycle: record.cycle,
      cycleValue: record.cycleValue,
      anchorDay: record.anchorDay,
      nextBillingDate: toDate(record.nextBillingDate),
      payment: record.payment,
      category: record.category,
      status: record.status,
      autoRenew: record.autoRenew,
      trialEndDate: record.trialEndDate ? toDate(record.trialEndDate) : null,
      note: record.note,
      cancelGuide: record.cancelGuide,
      isDemo: record.isDemo,
      lastRenewedAt: record.lastRenewedAt
        ? new Date(record.lastRenewedAt)
        : null,
      lastRenewalNextBillingDate: record.lastRenewalNextBillingDate
        ? toDate(record.lastRenewalNextBillingDate)
        : null,
      deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
    };
    const reminders = record.reminders.map((offsetDays) => ({ offsetDays }));
    const renewalHistory = record.renewalHistory.map((event) => ({
      id: event.id,
      renewedAt: new Date(event.renewedAt),
      previousStatus: event.previousStatus,
      previousNextBillingDate: toDate(event.previousNextBillingDate),
      nextBillingDate: toDate(event.nextBillingDate),
      amount: event.amount,
      currency: event.currency,
    }));

    await this.executor.subscription.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        ...scalar,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        reminders: { createMany: { data: reminders } },
        renewalHistory: { createMany: { data: renewalHistory } },
      },
      update: {
        ...scalar,
        updatedAt: new Date(record.updatedAt),
        reminders: {
          deleteMany: {},
          createMany: { data: reminders },
        },
        renewalHistory: {
          deleteMany: {},
          createMany: { data: renewalHistory },
        },
      },
    });
  }

  async findSettings(userId: string): Promise<UserSettings | null> {
    const row = await this.executor.userSettings.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return {
      userId: row.userId,
      amountVisible: row.amountVisible,
      notificationEnabled: row.notificationEnabled,
      notificationAuthorization: row.notificationAuthorization,
      weeklySummary: row.weeklySummary,
      defaultCurrency: row.defaultCurrency,
      defaultReminders: row.defaultReminders,
      reminderTime: row.reminderTime,
      timezone: row.timezone,
    };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.ensureUser(settings.userId);
    const data = {
      amountVisible: settings.amountVisible,
      notificationEnabled: settings.notificationEnabled,
      notificationAuthorization: settings.notificationAuthorization,
      weeklySummary: settings.weeklySummary,
      defaultCurrency: settings.defaultCurrency,
      defaultReminders: settings.defaultReminders,
      reminderTime: settings.reminderTime,
      timezone: settings.timezone,
    };
    await this.executor.userSettings.upsert({
      where: { userId: settings.userId },
      create: { userId: settings.userId, ...data },
      update: data,
    });
  }

  async findMembership(userId: string): Promise<Membership | null> {
    const row = await this.executor.membership.findUnique({
      where: { userId },
    });
    return row
      ? {
          userId: row.userId,
          status: row.status,
          plan: row.plan,
          source: row.source as Membership['source'],
          sourceOrderId: row.sourceOrderId,
          startedAt: row.startedAt?.toISOString() ?? null,
        }
      : null;
  }

  async saveMembership(membership: Membership): Promise<void> {
    await this.ensureUser(membership.userId);
    const data = {
      source: membership.source || 'legacy',
      sourceOrderId: membership.sourceOrderId || null,
      status: membership.status,
      plan: membership.plan,
      startedAt: membership.startedAt ? new Date(membership.startedAt) : null,
    };
    await this.executor.membership.upsert({
      where: { userId: membership.userId },
      create: { userId: membership.userId, ...data },
      update: data,
    });
  }

  async listMembershipOrders(userId: string): Promise<MembershipOrder[]> {
    const rows = await this.executor.membershipOrder.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => ({
      ...row,
      channel: row.channel as MembershipOrder['channel'],
      status: row.status as MembershipOrder['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      paidAt: row.paidAt?.toISOString() || null,
      paymentRequestedAt: row.paymentRequestedAt?.toISOString() || null,
      deliveryConfirmedAt: row.deliveryConfirmedAt?.toISOString() || null,
    }));
  }
  async findMembershipOrder(
    userId: string,
    id: string,
  ): Promise<MembershipOrder | null> {
    const row = await this.executor.membershipOrder.findFirst({
      where: { id, userId },
    });
    return row
      ? {
          ...row,
          channel: row.channel as MembershipOrder['channel'],
          status: row.status as MembershipOrder['status'],
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          paidAt: row.paidAt?.toISOString() || null,
          paymentRequestedAt: row.paymentRequestedAt?.toISOString() || null,
          deliveryConfirmedAt: row.deliveryConfirmedAt?.toISOString() || null,
        }
      : null;
  }
  async saveMembershipOrder(order: MembershipOrder): Promise<void> {
    await this.ensureUser(order.userId);
    const data = {
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      paidAt: order.paidAt ? new Date(order.paidAt) : null,
      paymentRequestedAt: order.paymentRequestedAt
        ? new Date(order.paymentRequestedAt)
        : null,
      deliveryConfirmedAt: order.deliveryConfirmedAt
        ? new Date(order.deliveryConfirmedAt)
        : null,
    };
    await this.executor.membershipOrder.upsert({
      where: { id: order.id },
      create: data,
      update: data,
    });
  }
  async findMembershipOrderById(id: string): Promise<MembershipOrder | null> {
    const row = await this.executor.membershipOrder.findUnique({
      where: { id },
    });
    return row ? this.findMembershipOrder(row.userId, id) : null;
  }
  async listVirtualOrdersToReconcile(
    afterId = '',
    limit = 100,
  ): Promise<MembershipOrder[]> {
    const rows = await this.executor.membershipOrder.findMany({
      where: {
        channel: 'virtual',
        paymentRequestedAt: { not: null },
        id: { gt: afterId },
        OR: [
          { status: 'pending' },
          { status: 'paid', deliveryConfirmedAt: null },
        ],
      },
      orderBy: { id: 'asc' },
      take: limit,
    });
    return rows.map((row) => ({
      ...row,
      channel: row.channel as MembershipOrder['channel'],
      status: row.status as MembershipOrder['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      paidAt: row.paidAt?.toISOString() || null,
      paymentRequestedAt: row.paymentRequestedAt?.toISOString() || null,
      deliveryConfirmedAt: row.deliveryConfirmedAt?.toISOString() || null,
    }));
  }
  transactionForUser<T>(
    userId: string,
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T> {
    return this.locked(userId, work);
  }
  async transaction<T>(
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T> {
    if (!this.rootClient) return work(this);
    return this.rootClient.$transaction((transaction) =>
      work(new PrismaSubscriptionsRepository(transaction)),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.rootClient) await this.rootClient.$disconnect();
  }

  private async ensureUser(userId: string): Promise<void> {
    await this.executor.appUser.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });
  }
}
