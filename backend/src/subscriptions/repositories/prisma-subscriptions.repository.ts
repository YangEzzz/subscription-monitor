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
import { SubscriptionsRepository } from './subscriptions.repository';
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

  static create(client: PrismaClient): PrismaSubscriptionsRepository {
    return new PrismaSubscriptionsRepository(client, client);
  }

  async adminOverview(): Promise<AdminOverview> {
    const [users, subscriptions, notifications, failedNotifications] =
      await Promise.all([
        this.executor.appUser.count(),
        this.executor.subscription.count({
          where: { deletedAt: null, isDemo: false },
        }),
        this.executor.notificationDelivery.count(),
        this.executor.notificationDelivery.count({
          where: { status: { in: ['failed', 'unknown'] } },
        }),
      ]);
    return { users, subscriptions, notifications, failedNotifications };
  }

  async adminRead({ section, page, search }: AdminQuery): Promise<AdminPage> {
    const paging = { skip: (page - 1) * 20, take: 20 };
    const contains = { contains: search, mode: 'insensitive' as const };
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
            createdAt: true,
          },
        }),
        this.executor.membershipOrder.count({ where }),
      ]);
      return {
        items: rows.map((row) => ({ ...row, amount: row.amount / 100 })),
        total,
        page,
        pageSize: 20,
      };
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
        items: rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt,
          subscriptions: row._count.subscriptions,
          notificationEnabled: row.settings?.notificationEnabled ?? false,
          plan: row.membership?.plan ?? 'free',
        })),
        total,
        page,
        pageSize: 20,
      };
    }
    if (section === 'subscriptions') {
      const where = {
        isDemo: false,
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
    const where = search
      ? {
          OR: [
            { userId: contains },
            { subscriptionName: contains },
            { errorCode: contains },
          ],
        }
      : {};
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

  async saveWechatIdentity(identity: WechatIdentity): Promise<void> {
    const data = { wechatAppId: identity.appId, wechatOpenId: identity.openId };
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
      ? { userId, appId: row.wechatAppId, openId: row.wechatOpenId }
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
    };
    await this.executor.membershipOrder.upsert({
      where: { id: order.id },
      create: data,
      update: data,
    });
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
