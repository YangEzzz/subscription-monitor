import {
  Prisma,
  PrismaClient,
} from '../../generated/prisma/client';
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

type PersistedSubscription = Prisma.SubscriptionGetPayload<{
  include: { reminders: true; renewalHistory: true };
}>;

type PrismaExecutor = Pick<
  Prisma.TransactionClient,
  'appUser' | 'subscription' | 'userSettings' | 'membership'
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
      .sort((left, right) => left.renewedAt.getTime() - right.renewedAt.getTime())
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
    const row = await this.executor.membership.findUnique({ where: { userId } });
    return row
      ? {
          userId: row.userId,
          status: row.status,
          plan: row.plan,
          startedAt: row.startedAt?.toISOString() ?? null,
        }
      : null;
  }

  async saveMembership(membership: Membership): Promise<void> {
    await this.ensureUser(membership.userId);
    const data = {
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
