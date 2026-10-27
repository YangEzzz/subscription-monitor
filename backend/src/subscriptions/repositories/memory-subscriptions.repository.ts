import {
  StatsDetailQuery,
  StatsDetailPage,
  RefundReceipt,
  DETAIL_COLUMNS,
} from './statistics-details';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MembershipRefund } from '../domain/membership-refund';
import { AdminStats, statsDays, finishStats, shanghaiDay } from './admin-stats';
import { billingIssues } from './billing-audit';
import { MembershipOrder } from '../domain/membership-order';
import { Injectable } from '@nestjs/common';
import {
  Membership,
  SubscriptionRecord,
  UserSettings,
} from '../domain/subscription';
import {
  AdminMembershipGrant,
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

@Injectable()
export class MemorySubscriptionsRepository implements SubscriptionsRepository {
  private membershipGrants: AdminMembershipGrant[] = [];
  findAdminMembershipGrant(
    userId: string,
    action: 'grant' | 'revoke' = 'grant',
  ): Promise<AdminMembershipGrant | null> {
    return Promise.resolve(
      clone(
        [...this.membershipGrants]
          .reverse()
          .find((g) => g.userId === userId && g.action === action) ?? null,
      ),
    );
  }
  recordAdminMembershipGrant(grant: AdminMembershipGrant): Promise<void> {
    this.membershipGrants.push(clone(grant));
    return Promise.resolve();
  }
  private labels = new Map<
    string,
    {
      isTest: boolean;
      testNote: string | null;
      testUpdatedBy: string | null;
      testUpdatedAt: string | null;
    }
  >();
  private receipts = new Map<string, RefundReceipt>();
  private labelEvents: {
    userId: string;
    isTest: boolean;
    note: string;
    operator: string;
  }[] = [];
  private eligible(userId: string, excludeTest: boolean) {
    return !excludeTest || !this.labels.get(userId)?.isTest;
  }
  private effectiveReceipts(): RefundReceipt[] {
    const rows = [...this.receipts.values()];
    for (const order of this.orders.values())
      if (order.status === 'refunded') {
        const known = rows
          .filter((r) => r.orderId === order.id)
          .reduce((s, r) => s + r.amount, 0);
        if (known < order.amount)
          rows.push({
            id: 'unrecorded:' + order.id,
            orderId: order.id,
            amount: order.amount - known,
            confirmedAt: null,
            observedAt: order.updatedAt,
            source: 'historical',
            timeSource: 'unknown',
          });
      }
    return rows;
  }
  private includedReceipt(r: RefundReceipt, excludeTest: boolean) {
    const order = this.orders.get(r.orderId);
    return (
      !!order &&
      this.eligible(order.userId, excludeTest) &&
      order.currency === 'CNY' &&
      ['wechat', 'virtual'].includes(order.channel)
    );
  }
  findUserTestFlag(userId: string) {
    if (!this.adminUsers().includes(userId))
      throw new NotFoundException('没有找到此账号');
    return Promise.resolve(
      clone(
        this.labels.get(userId) || {
          isTest: false,
          testNote: null,
          testUpdatedBy: null,
          testUpdatedAt: null,
        },
      ),
    );
  }
  async setUserTestFlag(
    userId: string,
    isTest: boolean,
    note: string,
    operator: string,
  ): Promise<void> {
    await this.findUserTestFlag(userId);
    this.labels.set(userId, {
      isTest,
      testNote: note,
      testUpdatedBy: operator,
      testUpdatedAt: new Date().toISOString(),
    });
    this.labelEvents.push({ userId, isTest, note, operator });
  }
  recordRefundReceipt(receipt: RefundReceipt): Promise<void> {
    const legacy = [...this.receipts.values()].find(
      (r) => r.orderId === receipt.orderId && r.id.startsWith('legacy:'),
    );
    if (legacy && legacy.amount === receipt.amount) {
      if (!legacy.confirmedAt && receipt.confirmedAt)
        this.receipts.set(legacy.id, {
          ...legacy,
          confirmedAt: receipt.confirmedAt,
          timeSource: 'platform',
        });
      return Promise.resolve();
    }
    const existing = this.receipts.get(receipt.id);
    if (existing) {
      if (
        existing.orderId !== receipt.orderId ||
        existing.amount !== receipt.amount
      )
        throw new ConflictException('退款凭据金额不一致');
      if (!existing.confirmedAt && receipt.confirmedAt)
        this.receipts.set(receipt.id, {
          ...existing,
          confirmedAt: receipt.confirmedAt,
          timeSource: 'platform',
        });
      return Promise.resolve();
    }
    const order = this.orders.get(receipt.orderId),
      total = [...this.receipts.values()]
        .filter((r) => r.orderId === receipt.orderId)
        .reduce((s, r) => s + r.amount, 0);
    if (!order || total + receipt.amount > order.amount)
      throw new ConflictException('累计退款超过订单金额');
    this.receipts.set(receipt.id, clone(receipt));
    return Promise.resolve();
  }
  listRefundReceipts(orderId: string): Promise<RefundReceipt[]> {
    return Promise.resolve(
      clone([...this.receipts.values()].filter((r) => r.orderId === orderId)),
    );
  }
  async statsDetails(q: StatsDetailQuery): Promise<StatsDetailPage> {
    const inRange = (at: string | null | undefined) =>
      !!at && shanghaiDay(at) >= q.from && shanghaiDay(at) <= q.to;
    const orders = [...this.orders.values()].filter(
      (o) =>
        this.eligible(o.userId, q.excludeTest) &&
        ['paid', 'refunded'].includes(o.status) &&
        ['wechat', 'virtual'].includes(o.channel) &&
        o.currency === 'CNY' &&
        inRange(o.paidAt),
    );
    const refunds = this.effectiveReceipts()
      .filter((r) => {
        const o = this.orders.get(r.orderId);
        return (
          o &&
          this.eligible(o.userId, q.excludeTest) &&
          ['wechat', 'virtual'].includes(o.channel) &&
          o.currency === 'CNY' &&
          (inRange(r.confirmedAt) || (q.includeUndated && !r.confirmedAt))
        );
      })
      .map((r) => ({
        ...r,
        userId: this.orders.get(r.orderId)!.userId,
        amount: r.amount / 100,
      }));
    let rows: Record<string, unknown>[],
      columns: { key: string; label: string }[];
    if (q.metric === 'newUsers') {
      rows = [...this.userCreatedAt]
        .filter(([id, at]) => this.eligible(id, q.excludeTest) && inRange(at))
        .map(([id, createdAt]) => ({
          id,
          createdAt,
          isTest: !!this.labels.get(id)?.isTest,
        }));
      columns = DETAIL_COLUMNS.users;
    } else if (q.metric === 'activeUsers') {
      const all = [...this.activity.values()].filter(
        (a) =>
          this.eligible(a.userId, q.excludeTest) &&
          a.date >= q.from &&
          a.date <= q.to,
      );
      rows = [...new Set(all.map((a) => a.userId))].map((id) => ({
        id,
        isTest: !!this.labels.get(id)?.isTest,
        activeDays: all.filter((a) => a.userId === id).length,
        lastSeenAt: all
          .filter((a) => a.userId === id)
          .map((a) => a.at)
          .sort()
          .pop(),
      }));
      columns = DETAIL_COLUMNS.active;
    } else if (q.metric === 'newSubscriptions') {
      rows = this.records
        .filter(
          (r) =>
            this.eligible(r.userId, q.excludeTest) &&
            !r.isDemo &&
            inRange(r.createdAt),
        )
        .map((r) => ({ ...r }));
      columns = DETAIL_COLUMNS.subscriptions;
    } else if (q.metric === 'paidUsers') {
      rows = [...new Set(orders.map((o) => o.userId))].map((id) => ({
        id,
        isTest: !!this.labels.get(id)?.isTest,
        orders: orders.filter((o) => o.userId === id).length,
        amount:
          orders
            .filter((o) => o.userId === id)
            .reduce((s, o) => s + o.amount, 0) / 100,
      }));
      columns = DETAIL_COLUMNS.payers;
    } else if (q.metric === 'refundAmountCny' || q.metric === 'refundOrders') {
      rows = refunds;
      columns = DETAIL_COLUMNS.refunds;
    } else if (q.metric === 'netAmountCny') {
      rows = [
        ...orders.map((o) => ({
          id: o.id,
          userId: o.userId,
          kind: '支付',
          amount: o.amount / 100,
          occurredAt: o.paidAt,
        })),
        ...refunds.map((r) => ({
          id: r.id,
          userId: r.userId,
          kind: '退款',
          amount: -r.amount,
          occurredAt: r.confirmedAt,
        })),
      ];
      columns = DETAIL_COLUMNS.net;
    } else {
      rows = orders.map((o) => ({ ...o, amount: o.amount / 100 }));
      columns = DETAIL_COLUMNS.payments;
    }
    rows = rows
      .filter((r) =>
        JSON.stringify(r).toLowerCase().includes(q.search.toLowerCase()),
      )
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return clone({
      items: rows.slice((q.page - 1) * 20, q.page * 20),
      total: rows.length,
      page: q.page,
      pageSize: 20,
      columns,
      ...(columns.some((c) => c.key === 'amount')
        ? {
            totalAmountCny:
              Math.round(
                rows.reduce(
                  (sum, r) => sum + Math.round(Number(r.amount) * 100),
                  0,
                ),
              ) / 100,
          }
        : {}),
    });
  }
  private refunds = new Map<string, MembershipRefund>();
  findMembershipRefund(orderId: string): Promise<MembershipRefund | null> {
    return Promise.resolve(clone(this.refunds.get(orderId) || null));
  }
  saveMembershipRefund(refund: MembershipRefund): Promise<void> {
    this.refunds.set(refund.orderId, clone(refund));
    return Promise.resolve();
  }
  listPendingRefunds(
    afterId: string,
    limit: number,
  ): Promise<MembershipRefund[]> {
    return Promise.resolve(
      clone(
        [...this.refunds.values()]
          .filter(
            (r) =>
              ['submitting', 'processing', 'unknown'].includes(r.status) &&
              r.orderId > afterId,
          )
          .sort((a, b) => a.orderId.localeCompare(b.orderId))
          .slice(0, limit),
      ),
    );
  }
  private userCreatedAt = new Map<string, string>();
  private authEvents: Record<string, unknown>[] = [];
  private orders = new Map<string, MembershipOrder>();
  private userTransactionQueue: Promise<unknown> = Promise.resolve();
  private records: SubscriptionRecord[];
  private settings = new Map<string, UserSettings>();
  private memberships = new Map<string, Membership>();
  private identities = new Map<string, WechatIdentity>();
  private access = new Map<
    string,
    { lastAccessIp: string; lastAccessAt: string }
  >();

  recordUserAccess(userId: string, ip: string, at: Date): Promise<void> {
    if (!this.identities.has(userId)) return Promise.resolve();
    const previous = this.access.get(userId);
    const elapsed = previous
      ? at.getTime() - Date.parse(previous.lastAccessAt)
      : Infinity;
    if (
      elapsed >= 0 &&
      (!previous || previous.lastAccessIp !== ip || elapsed >= 60000)
    )
      this.access.set(userId, {
        lastAccessIp: ip,
        lastAccessAt: at.toISOString(),
      });
    return Promise.resolve();
  }
  private grants = new Map<
    string,
    { id: string; userId: string; templateId: string; status: string }
  >();
  private deliveries = new Map<string, NotificationDelivery>();

  private adminUsers(): string[] {
    return [
      ...new Set([
        ...this.identities.keys(),
        ...this.settings.keys(),
        ...this.memberships.keys(),
        ...this.records.map((row) => row.userId),
      ]),
    ].sort();
  }

  private activity = new Map<
    string,
    { userId: string; date: string; at: string }
  >();
  recordUserActivity(userId: string, at: Date): Promise<void> {
    if (this.adminUsers().includes(userId)) {
      const date = shanghaiDay(at),
        key = userId + ':' + date;
      const old = this.activity.get(key);
      if (!old || at.toISOString() < old.at)
        this.activity.set(key, { userId, date, at: at.toISOString() });
    }
    return Promise.resolve();
  }
  adminStats(length: number, excludeTest = true): Promise<AdminStats> {
    const now = new Date(),
      days = statsDays(length, now),
      today = days[days.length - 1].date,
      from = days[0].date;
    const activities = [...this.activity.values()].filter(
      (a) => a.date <= today && this.eligible(a.userId, excludeTest),
    );
    const first =
      [...this.activity.values()].map((a) => a.at).sort()[0] || null;
    const regs = [...this.userCreatedAt]
      .map(([userId, at]) => ({ userId, date: shanghaiDay(at) }))
      .filter(
        (r) =>
          this.eligible(r.userId, excludeTest) &&
          r.date >= from &&
          r.date <= today,
      );
    const paid = [...this.orders.values()].filter(
      (o) =>
        this.eligible(o.userId, excludeTest) &&
        ['paid', 'refunded'].includes(o.status) &&
        o.currency === 'CNY' &&
        ['wechat', 'virtual'].includes(o.channel) &&
        o.paidAt &&
        shanghaiDay(o.paidAt) >= from &&
        shanghaiDay(o.paidAt) <= today,
    );
    const active = (start: string) =>
      first
        ? new Set(
            activities.filter((a) => a.date >= start).map((a) => a.userId),
          ).size
        : null;
    for (const day of days) {
      day.newUsers = regs.filter((r) => r.date === day.date).length;
      day.activeUsers =
        first && day.date >= shanghaiDay(first)
          ? new Set(
              activities
                .filter((a) => a.date === day.date)
                .map((a) => a.userId),
            ).size
          : null;
      day.newSubscriptions = this.records.filter(
        (r) =>
          this.eligible(r.userId, excludeTest) &&
          !r.isDemo &&
          shanghaiDay(r.createdAt) === day.date,
      ).length;
      const orders = paid.filter((o) => shanghaiDay(o.paidAt!) === day.date);
      day.paidOrders = orders.length;
      day.paidUsers = new Set(orders.map((o) => o.userId)).size;
      day.paidAmountCny = orders.reduce((s, o) => s + o.amount, 0) / 100;
      const refunds = this.effectiveReceipts().filter((r) => {
        const order = this.orders.get(r.orderId);
        return (
          order &&
          this.includedReceipt(r, excludeTest) &&
          r.confirmedAt &&
          shanghaiDay(r.confirmedAt) === day.date
        );
      });
      day.refundOrders = refunds.length;
      day.refundAmountCny = refunds.reduce((s, r) => s + r.amount, 0) / 100;
      day.netAmountCny =
        Math.round((day.paidAmountCny - day.refundAmountCny) * 100) / 100;
    }
    const cohorts = days
      .filter((d) => d.newUsers > 0)
      .map((d) => {
        const cohort = regs.filter((r) => r.date === d.date);
        const value = (lag: number) => {
          const target = new Date(
            Date.parse(d.date + 'T00:00:00Z') + lag * 86400000,
          )
            .toISOString()
            .slice(0, 10);
          return first && target > shanghaiDay(first) && target < today
            ? cohort.filter((r) =>
                activities.some(
                  (a) => a.userId === r.userId && a.date === target,
                ),
              ).length
            : null;
        };
        return {
          date: d.date,
          users: cohort.length,
          d1: value(1),
          d7: value(7),
          d30: value(30),
        };
      })
      .reverse();
    const converted = regs.filter((r) =>
      paid.some((o) => o.userId === r.userId),
    ).length;
    const before = (n: number) =>
      new Date(Date.parse(today + 'T00:00:00Z') - n * 86400000)
        .toISOString()
        .slice(0, 10);
    return Promise.resolve(
      finishStats(
        {
          days,
          excludeTest,
          undatedRefunds: {
            count: this.effectiveReceipts().filter(
              (r) => !r.confirmedAt && this.includedReceipt(r, excludeTest),
            ).length,
            amountCny:
              this.effectiveReceipts()
                .filter(
                  (r) => !r.confirmedAt && this.includedReceipt(r, excludeTest),
                )
                .reduce((s, r) => s + r.amount, 0) / 100,
          },
          cohorts,
          trackingSince: first,
          activity: {
            dau: active(today),
            wau: active(before(6)),
            mau: active(before(29)),
          },
          summary: {
            newUsers: regs.length,
            activeUsers: active(from),
            newSubscriptions: days.reduce((s, d) => s + d.newSubscriptions, 0),
            paidUsers: new Set(paid.map((o) => o.userId)).size,
            paidOrders: paid.length,
            paidAmountCny: paid.reduce((s, o) => s + o.amount, 0) / 100,
            refundOrders: days.reduce((s, d) => s + d.refundOrders, 0),
            refundAmountCny:
              days.reduce(
                (s, d) => s + Math.round(d.refundAmountCny * 100),
                0,
              ) / 100,
            netAmountCny:
              days.reduce((s, d) => s + Math.round(d.netAmountCny * 100), 0) /
              100,
            convertedUsers: converted,
            conversionRate: regs.length ? converted / regs.length : null,
          },
        },
        now,
      ),
    );
  }

  adminOverview(excludeTest = true): Promise<AdminOverview> {
    const eligible = (id: string) => this.eligible(id, excludeTest);
    const paid =
      [...this.orders.values()]
        .filter(
          (o) =>
            eligible(o.userId) &&
            ['paid', 'refunded'].includes(o.status) &&
            !!o.paidAt &&
            o.currency === 'CNY' &&
            ['wechat', 'virtual'].includes(o.channel),
        )
        .reduce((s, o) => s + o.amount, 0) / 100;
    const refunds =
      this.effectiveReceipts()
        .filter((r) => this.includedReceipt(r, excludeTest))
        .reduce((s, r) => s + r.amount, 0) / 100;
    return Promise.resolve({
      users: this.adminUsers().filter(eligible).length,
      subscriptions: this.records.filter(
        (r) => eligible(r.userId) && !r.deletedAt && !r.isDemo,
      ).length,
      notifications: [...this.deliveries.values()].filter((r) =>
        eligible(r.userId),
      ).length,
      failedNotifications: [...this.deliveries.values()].filter(
        (r) => eligible(r.userId) && ['failed', 'unknown'].includes(r.status),
      ).length,
      activeMembers: [...this.memberships.values()].filter(
        (m) =>
          eligible(m.userId) &&
          m.status === 'active' &&
          m.plan === 'member' &&
          m.source !== 'simulation',
      ).length,
      paidAmountCny: paid,
      refundAmountCny: refunds,
      netAmountCny: Math.round((paid - refunds) * 100) / 100,
      paymentIssues: billingIssues(
        [...this.orders.values()],
        [...this.memberships.values()],
      ).length,
      snapshotAt: new Date().toISOString(),
    });
  }

  adminRead({
    section,
    page,
    search,
    userId,
    failedOnly,
  }: AdminQuery): Promise<AdminPage> {
    let rows: Record<string, unknown>[];
    if (section === 'billingIssues')
      rows = billingIssues(
        [...this.orders.values()],
        [...this.memberships.values()],
      );
    else if (section === 'authEvents') rows = [...this.authEvents].reverse();
    else if (section === 'users')
      rows = this.adminUsers().map((id) => ({
        id,
        createdAt: this.userCreatedAt.get(id) || null,
        ...(this.labels.get(id) || { isTest: false }),
        lastAccessIp: this.access.get(id)?.lastAccessIp ?? null,
        lastAccessAt: this.access.get(id)?.lastAccessAt ?? null,
        subscriptions: this.records.filter(
          (row) => row.userId === id && !row.deletedAt && !row.isDemo,
        ).length,
        notificationEnabled:
          this.settings.get(id)?.notificationEnabled ?? false,
        plan: this.memberships.get(id)?.plan ?? 'free',
      }));
    else if (section === 'subscriptions')
      rows = this.records
        .filter((row) => !row.isDemo && (!userId || row.userId === userId))
        .map((row) => ({
          id: row.id,
          userId: row.userId,
          name: row.name,
          amount: row.amount,
          currency: row.currency,
          status: row.status,
          nextBillingDate: row.nextBillingDate,
          deletedAt: row.deletedAt,
        }));
    else if (section === 'memberships')
      rows = [...this.memberships.values()].map((row) => ({
        ...row,
        createdAt: row.startedAt,
      }));
    else if (section === 'membershipOrders')
      rows = [...this.orders.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ requestId: _requestId, ...row }) => ({
          ...row,
          amount: row.amount / 100,
          refundStatus: this.refunds.get(row.id)?.status || null,
        }));
    else
      rows = [...this.deliveries.values()]
        .filter(
          (row) =>
            (!userId || row.userId === userId) &&
            (!failedOnly || ['failed', 'unknown'].includes(row.status)),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((row) => ({
          id: row.id,
          userId: row.userId,
          subscriptionName: row.subscriptionName,
          billingDate: row.billingDate,
          status: row.status,
          attempts: row.attempts,
          errorCode: row.errorCode,
          createdAt: row.createdAt,
        }));
    const fields =
      section === 'billingIssues'
        ? ['id', 'userId', 'productName']
        : section === 'authEvents'
          ? ['userId']
          : section === 'users'
            ? ['id']
            : section === 'subscriptions'
              ? ['id', 'name', 'userId']
              : section === 'memberships'
                ? ['userId']
                : section === 'membershipOrders'
                  ? ['id', 'userId', 'productName']
                  : ['userId', 'subscriptionName', 'errorCode'];
    rows = rows.filter((row) =>
      fields.some((key) =>
        String(row[key] ?? '')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
    return Promise.resolve(
      clone({
        items: rows.slice((page - 1) * 20, page * 20),
        total: rows.length,
        page,
        pageSize: 20,
      }),
    );
  }

  async recordWechatLogin(
    identity: WechatIdentity,
    context: {
      clientIp: string | null;
      peerIp: string | null;
      requestId: string;
    },
  ): Promise<void> {
    const exists = this.adminUsers().includes(identity.userId);
    if (!this.adminUsers().includes(identity.userId))
      this.userCreatedAt.set(identity.userId, new Date().toISOString());
    this.identities.set(identity.userId, clone(identity));
    this.authEvents.push({
      id: randomUUID(),
      userId: identity.userId,
      action: exists ? 'login' : 'register',
      appId: identity.appId,
      ...context,
      createdAt: new Date().toISOString(),
    });
  }

  saveWechatIdentity(identity: WechatIdentity): Promise<void> {
    if (!this.adminUsers().includes(identity.userId))
      this.userCreatedAt.set(identity.userId, new Date().toISOString());
    this.identities.set(identity.userId, clone(identity));
    return Promise.resolve();
  }

  findWechatIdentity(userId: string): Promise<WechatIdentity | null> {
    const value = this.identities.get(userId);
    return Promise.resolve(value ? clone(value) : null);
  }

  recordNotificationAuthorization(
    userId: string,
    requestId: string,
    templateId: string,
    result: AuthorizationResult,
    longTerm = false,
  ): Promise<void> {
    const key = `${userId}:${requestId}`;
    if (this.grants.has(key)) return Promise.resolve();
    this.grants.set(key, {
      id: randomUUID(),
      userId,
      templateId,
      status: result === 'accept' ? 'available' : 'revoked',
    });
    const settings = this.settings.get(userId);
    if (result === 'accept' && settings) settings.notificationEnabled = true;
    if (result === 'ban' || (longTerm && result === 'reject')) {
      for (const grant of this.grants.values())
        if (
          grant.userId === userId &&
          grant.templateId === templateId &&
          grant.status === 'available'
        )
          grant.status = 'revoked';
      if (settings) settings.notificationEnabled = false;
    }
    return Promise.resolve();
  }

  countNotificationCredits(
    userId: string,
    templateId: string,
  ): Promise<number> {
    return Promise.resolve(
      [...this.grants.values()].filter(
        (g) =>
          g.userId === userId &&
          g.templateId === templateId &&
          g.status === 'available',
      ).length,
    );
  }

  listNotificationUsers(afterId = '', limit = 100): Promise<string[]> {
    return Promise.resolve(
      [...this.settings.values()]
        .filter(
          (s) =>
            s.notificationEnabled &&
            this.identities.has(s.userId) &&
            s.userId > afterId,
        )
        .map((s) => s.userId)
        .sort()
        .slice(0, limit),
    );
  }

  claimNotificationDelivery(
    input: DeliveryInput,
    now: Date,
    longTerm = false,
  ): Promise<NotificationDelivery | null> {
    const record = this.records.find(
      (r) => r.id === input.subscriptionId && r.userId === input.userId,
    );
    if (
      !this.settings.get(input.userId)?.notificationEnabled ||
      !record ||
      record.deletedAt ||
      record.isDemo ||
      ['paused', 'cancelled', 'archived'].includes(record.status) ||
      record.nextBillingDate !== input.billingDate ||
      record.amount === null ||
      !record.reminders.includes(input.offset)
    )
      return Promise.resolve(null);
    const key = `${input.userId}:${input.subscriptionId}:${input.billingDate}:${input.offset}`;
    const prior = this.deliveries.get(key);
    if (
      prior &&
      (prior.status !== 'failed' ||
        !prior.nextAttemptAt ||
        prior.attempts >= 3 ||
        Date.parse(prior.nextAttemptAt) > now.getTime())
    )
      return Promise.resolve(null);
    const grant = [...this.grants.values()].find(
      (g) =>
        g.userId === input.userId &&
        g.templateId === input.templateId &&
        g.status === 'available',
    );
    if (!grant) return Promise.resolve(null);
    if (!longTerm) grant.status = 'consumed';
    const delivery: NotificationDelivery = {
      ...input,
      id: prior?.id || randomUUID(),
      grantId: grant.id,
      status: 'sending',
      attempts: (prior?.attempts || 0) + 1,
      errorCode: null,
      nextAttemptAt: null,
      createdAt: prior?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.deliveries.set(key, delivery);
    return Promise.resolve(clone(delivery));
  }

  finishNotificationDelivery(
    id: string,
    status: DeliveryStatus,
    errorCode: string | null,
    retryAt?: Date,
  ): Promise<void> {
    const delivery = [...this.deliveries.values()].find((d) => d.id === id);
    if (!delivery || delivery.status !== 'sending') return Promise.resolve();
    Object.assign(delivery, {
      status,
      errorCode,
      nextAttemptAt: retryAt?.toISOString() || null,
      updatedAt: new Date().toISOString(),
    });
    const grant = [...this.grants.values()].find(
      (g) => g.id === delivery.grantId,
    );
    if (
      (status === 'failed' || status === 'skipped') &&
      grant?.status === 'consumed'
    )
      grant.status = 'available';
    if (errorCode === '43101') {
      for (const value of this.grants.values())
        if (
          value.userId === delivery.userId &&
          value.templateId === delivery.templateId
        )
          value.status = 'revoked';
      const settings = this.settings.get(delivery.userId);
      if (settings) settings.notificationEnabled = false;
    }
    return Promise.resolve();
  }

  recoverNotificationDeliveries(before: Date): Promise<void> {
    for (const delivery of this.deliveries.values())
      if (
        delivery.status === 'sending' &&
        Date.parse(delivery.updatedAt) < before.getTime()
      )
        Object.assign(delivery, {
          status: 'unknown',
          errorCode: 'DELIVERY_UNKNOWN',
          nextAttemptAt: null,
        });
    return Promise.resolve();
  }

  listNotificationDeliveries(userId: string): Promise<NotificationDelivery[]> {
    return Promise.resolve(
      clone(
        [...this.deliveries.values()]
          .filter((d) => d.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 20),
      ),
    );
  }

  constructor(initialRecords: SubscriptionRecord[] = []) {
    this.records = clone(initialRecords);
  }

  listSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
    return Promise.resolve(
      clone(this.records.filter((record) => record.userId === userId)),
    );
  }

  findSubscription(
    userId: string,
    id: string,
  ): Promise<SubscriptionRecord | null> {
    const record =
      this.records.find(
        (record) => record.userId === userId && record.id === id,
      ) ?? null;
    return Promise.resolve(record ? clone(record) : null);
  }

  saveSubscription(record: SubscriptionRecord): Promise<void> {
    const index = this.records.findIndex((item) => item.id === record.id);
    if (index === -1) this.records.push(clone(record));
    else this.records[index] = clone(record);
    return Promise.resolve();
  }

  findSettings(userId: string): Promise<UserSettings | null> {
    const settings = this.settings.get(userId);
    return Promise.resolve(settings ? clone(settings) : null);
  }

  saveSettings(settings: UserSettings): Promise<void> {
    this.settings.set(settings.userId, clone(settings));
    return Promise.resolve();
  }

  findMembership(userId: string): Promise<Membership | null> {
    const membership = this.memberships.get(userId);
    return Promise.resolve(membership ? clone(membership) : null);
  }

  saveMembership(membership: Membership): Promise<void> {
    this.memberships.set(membership.userId, clone(membership));
    return Promise.resolve();
  }

  listMembershipOrders(userId: string): Promise<MembershipOrder[]> {
    return Promise.resolve(
      clone(
        [...this.orders.values()]
          .filter((order) => order.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
    );
  }
  findMembershipOrder(
    userId: string,
    id: string,
  ): Promise<MembershipOrder | null> {
    const order = this.orders.get(id);
    return Promise.resolve(order?.userId === userId ? clone(order) : null);
  }
  saveMembershipOrder(order: MembershipOrder): Promise<void> {
    if (
      order.transactionId &&
      [...this.orders.values()].some(
        (existing) =>
          existing.id !== order.id &&
          existing.transactionId === order.transactionId,
      )
    )
      throw new Error(
        'Platform transaction ID is already assigned to another order',
      );
    this.orders.set(order.id, clone(order));
    return Promise.resolve();
  }
  findMembershipOrderById(id: string): Promise<MembershipOrder | null> {
    return Promise.resolve(clone(this.orders.get(id) || null));
  }
  listVirtualOrdersToReconcile(
    afterId = '',
    limit = 100,
  ): Promise<MembershipOrder[]> {
    return Promise.resolve(
      clone(
        [...this.orders.values()]
          .filter(
            (order) =>
              order.channel === 'virtual' &&
              !!order.paymentRequestedAt &&
              (order.status === 'pending' ||
                (order.status === 'paid' && !order.deliveryConfirmedAt)) &&
              order.id > afterId,
          )
          .sort((a, b) => a.id.localeCompare(b.id))
          .slice(0, limit),
      ),
    );
  }
  transactionForUser<T>(
    _userId: string,
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T> {
    // Memory transactions share snapshot maps: serialize all of these operations.
    const next = this.userTransactionQueue.then(() => this.transaction(work));
    this.userTransactionQueue = next.catch(() => undefined);
    return next;
  }
  async transaction<T>(
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T> {
    const membershipGrantsSnapshot = clone(this.membershipGrants);
    const receiptsSnapshot = new Map(
      [...this.receipts].map(([key, value]) => [key, clone(value)]),
    );
    const ordersSnapshot = new Map(
      [...this.orders.entries()].map(([key, value]) => [key, clone(value)]),
    );
    const refundsSnapshot = new Map(
      [...this.refunds].map(([key, value]) => [key, clone(value)]),
    );
    const recordsSnapshot = clone(this.records);
    const identitiesSnapshot = new Map(
      [...this.identities.entries()].map(([key, value]) => [key, clone(value)]),
    );
    const grantsSnapshot = new Map(
      [...this.grants.entries()].map(([key, value]) => [key, clone(value)]),
    );
    const deliveriesSnapshot = new Map(
      [...this.deliveries.entries()].map(([key, value]) => [key, clone(value)]),
    );
    const settingsSnapshot = new Map(
      [...this.settings.entries()].map(([key, value]) => [key, clone(value)]),
    );
    const membershipsSnapshot = new Map(
      [...this.memberships.entries()].map(([key, value]) => [
        key,
        clone(value),
      ]),
    );

    try {
      return await work(this);
    } catch (error) {
      this.membershipGrants = membershipGrantsSnapshot;
      this.orders = ordersSnapshot;
      this.receipts = receiptsSnapshot;
      this.refunds = refundsSnapshot;
      this.records = recordsSnapshot;
      this.identities = identitiesSnapshot;
      this.grants = grantsSnapshot;
      this.deliveries = deliveriesSnapshot;
      this.settings = settingsSnapshot;
      this.memberships = membershipsSnapshot;
      throw error;
    }
  }
}
