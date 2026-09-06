import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionDto } from './dto/query-subscription.dto';
import { StatsQueryDto } from './dto/stats-query.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  BILLING_CYCLES,
  DISPLAY_STATUSES,
  PAYMENT_METHODS,
  SUBSCRIPTION_CATEGORIES,
  BillingCycle,
  Membership,
  ServiceTemplate,
  SubscriptionRecord,
  UserSettings,
} from './domain/subscription';

export const DEFAULT_USER_ID = 'demo-user';
export const FREE_SUBSCRIPTION_LIMIT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REMINDERS = [7, 3, 1];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateAtNoon(dateKey: string): Date {
  return new Date(dateKey + 'T12:00:00.000Z');
}

function addDays(dateKey: string, days: number): string {
  const date = dateAtNoon(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysUntil(dateKey: string): number {
  return Math.ceil((dateAtNoon(dateKey).getTime() - dateAtNoon(todayKey()).getTime()) / DAY_MS);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function uniqueReminders(reminders?: number[] | null): number[] {
  const source = reminders && reminders.length > 0 ? reminders : DEFAULT_REMINDERS;
  return [...new Set(source)]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 30)
    .sort((left, right) => right - left);
}

function addCycle(dateKey: string, cycle: BillingCycle, cycleValue: number | null): string {
  if (cycle === 'one_off') {
    throw new BadRequestException('One-off subscriptions cannot be renewed');
  }

  if (cycle === 'weekly') return addDays(dateKey, 7);
  if (cycle === 'custom_days') return addDays(dateKey, Math.max(1, cycleValue ?? 1));

  const monthsByCycle: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    yearly: 12,
  };
  const months = monthsByCycle[cycle] ?? 1;
  const current = dateAtNoon(dateKey);
  const anchorDay = current.getUTCDate();
  current.setUTCDate(1);
  current.setUTCMonth(current.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  current.setUTCDate(Math.min(anchorDay, lastDay));
  return current.toISOString().slice(0, 10);
}

function monthlyEquivalent(record: SubscriptionRecord): number {
  if (
    record.amount === null ||
    ['cancelled', 'paused', 'archived'].includes(record.status) ||
    record.cycle === 'one_off'
  ) {
    return 0;
  }

  const monthsByCycle: Record<string, number> = {
    weekly: 7 / 30.4375,
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    yearly: 12,
  };
  const months =
    record.cycle === 'custom_days'
      ? Math.max(1, record.cycleValue ?? 1) / 30.4375
      : monthsByCycle[record.cycle] ?? 1;
  return roundMoney(record.amount / months);
}

function getDisplayStatus(record: SubscriptionRecord): string {
  if (record.deletedAt) return 'archived';
  if (['paused', 'cancelled', 'archived', 'pending'].includes(record.status)) {
    return record.status;
  }
  if (record.trialEndDate && daysUntil(record.trialEndDate) >= 0) return 'trial';
  const days = daysUntil(record.nextBillingDate);
  if (days < 0) return 'overdue';
  const reminderWindow = Math.max(...record.reminders, 0);
  if (days <= reminderWindow) return 'upcoming';
  return 'active';
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedRecord(
  input: Partial<SubscriptionRecord> & Pick<SubscriptionRecord, 'id' | 'name' | 'category'>,
): SubscriptionRecord {
  const now = new Date().toISOString();
  return {
    id: input.id,
    userId: input.userId ?? DEFAULT_USER_ID,
    name: input.name,
    plan: input.plan ?? null,
    logo: input.logo ?? null,
    color: input.color ?? '#16834d',
    amount: input.amount ?? null,
    currency: input.currency ?? 'CNY',
    cycle: input.cycle ?? 'monthly',
    cycleValue: input.cycleValue ?? null,
    nextBillingDate: input.nextBillingDate ?? addDays(todayKey(), 7),
    payment: input.payment ?? 'other',
    category: input.category,
    status: input.status ?? 'active',
    autoRenew: input.autoRenew ?? true,
    reminders: uniqueReminders(input.reminders),
    trialEndDate: input.trialEndDate ?? null,
    note: input.note ?? '',
    cancelGuide: input.cancelGuide ?? '',
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    deletedAt: input.deletedAt ?? null,
    isDemo: input.isDemo ?? true,
    renewalHistory: input.renewalHistory ?? [],
    lastRenewedAt: input.lastRenewedAt ?? null,
    lastRenewalNextBillingDate: input.lastRenewalNextBillingDate ?? null,
  };
}

function createDemoSubscriptions(): SubscriptionRecord[] {
  const today = todayKey();
  return [
    createSeedRecord({
      id: 'sub_1001',
      name: 'Netflix Premium',
      plan: 'Premium',
      logo: 'N',
      color: '#e50914',
      amount: 108,
      cycle: 'monthly',
      nextBillingDate: addDays(today, 10),
      payment: 'card',
      category: 'video',
      note: '家庭账号',
    }),
    createSeedRecord({
      id: 'sub_1002',
      name: 'iCloud+',
      plan: '200GB',
      logo: 'i',
      color: '#3f98ee',
      amount: 21,
      cycle: 'monthly',
      nextBillingDate: addDays(today, 4),
      payment: 'app_store',
      category: 'cloud',
    }),
    createSeedRecord({
      id: 'sub_1003',
      name: 'ChatGPT Plus',
      plan: 'Plus',
      logo: 'AI',
      color: '#1f9c70',
      amount: 145,
      cycle: 'monthly',
      nextBillingDate: addDays(today, 16),
      payment: 'card',
      category: 'ai',
      note: '工作账号',
    }),
    createSeedRecord({
      id: 'sub_1004',
      name: 'Adobe Creative Cloud',
      plan: 'Photography',
      logo: 'A',
      color: '#e43c86',
      amount: 173,
      cycle: 'yearly',
      nextBillingDate: addDays(today, 30),
      payment: 'card',
      category: 'productivity',
    }),
    createSeedRecord({
      id: 'sub_1005',
      name: 'YouTube Premium',
      plan: 'Individual',
      logo: 'Y',
      color: '#ed3338',
      amount: 68,
      cycle: 'monthly',
      nextBillingDate: addDays(today, -2),
      payment: 'wechat',
      category: 'video',
      status: 'active',
    }),
    createSeedRecord({
      id: 'sub_1006',
      name: '得到听书',
      plan: 'Annual',
      logo: 'D',
      color: '#c17d2f',
      amount: 199,
      cycle: 'yearly',
      nextBillingDate: addDays(today, 21),
      payment: 'wechat',
      category: 'reading',
      trialEndDate: addDays(today, 2),
    }),
    createSeedRecord({
      id: 'sub_1007',
      name: 'Keep',
      plan: 'Monthly',
      logo: 'K',
      color: '#6658d9',
      amount: 25,
      cycle: 'monthly',
      nextBillingDate: addDays(today, 8),
      payment: 'wechat',
      category: 'other',
      status: 'paused',
      autoRenew: false,
      note: '暂时停用，保留记录',
    }),
    createSeedRecord({
      id: 'sub_1008',
      name: 'Notion Plus',
      plan: 'Plus',
      logo: 'N',
      color: '#202622',
      amount: 72,
      cycle: 'monthly',
      nextBillingDate: addDays(today, 25),
      payment: 'card',
      category: 'productivity',
      status: 'cancelled',
      autoRenew: false,
    }),
    createSeedRecord({
      id: 'sub_1009',
      name: '百度网盘',
      plan: 'Super',
      logo: 'B',
      color: '#3f91ed',
      amount: 30,
      cycle: 'monthly',
      nextBillingDate: addDays(today, 14),
      payment: 'alipay',
      category: 'cloud',
      isDemo: true,
    }),
  ];
}

@Injectable()
export class SubscriptionsService {
  private readonly records = createDemoSubscriptions();
  private readonly settings = new Map<string, UserSettings>();
  private readonly memberships = new Map<string, Membership>();
  private nextId = 2000;

  private normalizeUserId(userId?: string): string {
    return userId?.trim() || DEFAULT_USER_ID;
  }

  private now(): string {
    return new Date().toISOString();
  }

  private getSettingsRecord(userId: string): UserSettings {
    const normalizedUserId = this.normalizeUserId(userId);
    const current = this.settings.get(normalizedUserId);
    if (current) return current;

    const created: UserSettings = {
      userId: normalizedUserId,
      amountVisible: true,
      notificationEnabled: false,
      notificationAuthorization: [],
      weeklySummary: true,
      defaultCurrency: 'CNY',
      defaultReminders: [...DEFAULT_REMINDERS],
      reminderTime: '09:00',
      timezone: 'Asia/Shanghai',
    };
    this.settings.set(normalizedUserId, created);
    return created;
  }

  private getMembershipRecord(userId: string): Membership {
    const normalizedUserId = this.normalizeUserId(userId);
    const current = this.memberships.get(normalizedUserId);
    if (current) return current;

    const created: Membership = {
      userId: normalizedUserId,
      status: 'free',
      plan: 'free',
      startedAt: null,
    };
    this.memberships.set(normalizedUserId, created);
    return created;
  }

  private ownedRecords(userId: string): SubscriptionRecord[] {
    const normalizedUserId = this.normalizeUserId(userId);
    return this.records.filter((record) => record.userId === normalizedUserId);
  }

  private findRecord(userId: string, id: string): SubscriptionRecord {
    const record = this.ownedRecords(userId).find((item) => item.id === id);
    if (!record) throw new NotFoundException('Subscription not found');
    return record;
  }

  private assertQuota(userId: string): void {
    const membership = this.getMembershipRecord(userId);
    if (membership.status === 'active') return;
    const used = this.ownedRecords(userId).filter(
      (record) => !record.deletedAt && !record.isDemo,
    ).length;
    if (used >= FREE_SUBSCRIPTION_LIMIT) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        message: 'Free plan allows up to ' + FREE_SUBSCRIPTION_LIMIT + ' subscriptions',
        limit: FREE_SUBSCRIPTION_LIMIT,
        used,
      });
    }
  }

  private toPublic(record: SubscriptionRecord): Record<string, unknown> {
    const { userId: _userId, ...publicRecord } = clone(record);
    return {
      ...publicRecord,
      displayStatus: getDisplayStatus(record),
      daysUntilBilling: daysUntil(record.nextBillingDate),
      monthlyEquivalent: monthlyEquivalent(record),
    };
  }

  list(userId: string | undefined, query: QuerySubscriptionDto) {
    const normalizedUserId = this.normalizeUserId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const includeDeleted = query.includeDeleted ?? false;
    let records = this.ownedRecords(normalizedUserId).filter(
      (record) => includeDeleted || !record.deletedAt,
    );

    if (query.category) {
      records = records.filter((record) => record.category === query.category);
    }
    if (query.search?.trim()) {
      const keyword = query.search.trim().toLowerCase();
      records = records.filter((record) =>
        [record.name, record.plan ?? '', record.note]
          .join(' ')
          .toLowerCase()
          .includes(keyword),
      );
    }
    if (query.status && query.status !== 'all') {
      records = records.filter(
        (record) => getDisplayStatus(record) === query.status,
      );
    }

    const sort = query.sort ?? 'date';
    records.sort((left, right) => {
      if (sort === 'amount') {
        return (right.amount ?? 0) - (left.amount ?? 0);
      }
      if (sort === 'created') {
        return right.createdAt.localeCompare(left.createdAt);
      }
      return left.nextBillingDate.localeCompare(right.nextBillingDate);
    });

    const total = records.length;
    const start = (page - 1) * limit;
    const data = records.slice(start, start + limit).map((record) => this.toPublic(record));
    return {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore: start + data.length < total,
      },
    };
  }

  findOne(userId: string | undefined, id: string) {
    return this.toPublic(this.findRecord(this.normalizeUserId(userId), id));
  }

  create(userId: string | undefined, dto: CreateSubscriptionDto) {
    const normalizedUserId = this.normalizeUserId(userId);
    this.assertQuota(normalizedUserId);
    if (!dto.name.trim()) {
      throw new BadRequestException('Subscription name cannot be empty');
    }
    const now = this.now();
    const trialEndDate = dto.trialEndDate ?? null;
    const record = createSeedRecord({
      id: 'sub_' + this.nextId++,
      userId: normalizedUserId,
      name: dto.name.trim(),
      plan: dto.plan?.trim() || null,
      logo: dto.logo?.trim() || null,
      color: dto.color || '#16834d',
      amount: dto.amount === undefined ? null : dto.amount,
      currency: (dto.currency || 'CNY').toUpperCase(),
      cycle: dto.cycle,
      cycleValue: dto.cycle === 'custom_days' ? dto.cycleValue ?? 1 : null,
      nextBillingDate: dto.nextBillingDate,
      payment: dto.payment ?? 'other',
      category: dto.category,
      status: trialEndDate && daysUntil(trialEndDate) >= 0 ? 'trial' : 'active',
      autoRenew: dto.autoRenew ?? dto.cycle !== 'one_off',
      reminders: uniqueReminders(dto.reminders),
      trialEndDate,
      note: dto.note?.trim() || '',
      cancelGuide: dto.cancelGuide?.trim() || '',
      createdAt: now,
      updatedAt: now,
      isDemo: false,
    });
    this.records.push(record);
    return this.toPublic(record);
  }

  update(userId: string | undefined, id: string, dto: UpdateSubscriptionDto) {
    const record = this.findRecord(this.normalizeUserId(userId), id);
    if (record.deletedAt) {
      throw new BadRequestException('Deleted subscriptions must be restored before editing');
    }

    const values = dto as unknown as Record<string, unknown>;
    if (typeof values.name === 'string' && !values.name.trim()) {
      throw new BadRequestException('Subscription name cannot be empty');
    }
    const allowedKeys = [
      'name',
      'plan',
      'logo',
      'color',
      'amount',
      'currency',
      'cycle',
      'cycleValue',
      'nextBillingDate',
      'payment',
      'category',
      'status',
      'autoRenew',
      'reminders',
      'trialEndDate',
      'note',
      'cancelGuide',
    ];
    for (const key of allowedKeys) {
      if (values[key] !== undefined) {
        (record as unknown as Record<string, unknown>)[key] = values[key];
      }
    }
    if (record.cycle !== 'custom_days') record.cycleValue = null;
    if (record.reminders) record.reminders = uniqueReminders(record.reminders);
    if (
      record.status === 'active' &&
      record.trialEndDate &&
      daysUntil(record.trialEndDate) >= 0
    ) {
      record.status = 'trial';
    }
    record.updatedAt = this.now();
    return this.toPublic(record);
  }

  remove(userId: string | undefined, id: string) {
    const record = this.findRecord(this.normalizeUserId(userId), id);
    if (record.deletedAt) throw new BadRequestException('Subscription is already deleted');
    record.deletedAt = this.now();
    record.updatedAt = this.now();
    return this.toPublic(record);
  }

  restore(userId: string | undefined, id: string) {
    const normalizedUserId = this.normalizeUserId(userId);
    const record = this.findRecord(normalizedUserId, id);
    if (!record.deletedAt) throw new BadRequestException('Subscription is not deleted');
    this.assertQuota(normalizedUserId);
    record.deletedAt = null;
    record.updatedAt = this.now();
    return this.toPublic(record);
  }

  renew(userId: string | undefined, id: string) {
    const record = this.findRecord(this.normalizeUserId(userId), id);
    if (record.deletedAt) throw new BadRequestException('Restore the subscription before renewing');
    if (['cancelled', 'archived', 'paused'].includes(record.status)) {
      throw new BadRequestException('This subscription cannot be renewed in its current state');
    }
    const renewedAt = this.now();
    if (
      record.lastRenewedAt &&
      record.lastRenewalNextBillingDate === record.nextBillingDate &&
      Date.now() - new Date(record.lastRenewedAt).getTime() < 10 * 60 * 1000
    ) {
      throw new ConflictException({
        code: 'RENEWAL_ALREADY_APPLIED',
        message: 'This subscription was renewed recently',
      });
    }

    const previousNextBillingDate = record.nextBillingDate;
    const nextBillingDate = addCycle(
      record.nextBillingDate,
      record.cycle,
      record.cycleValue,
    );
    const event = {
      id: 'renewal_' + Date.now(),
      renewedAt,
      previousStatus: record.status,
      previousNextBillingDate,
      nextBillingDate,
      amount: record.amount,
      currency: record.currency,
    };
    record.renewalHistory.push(event);
    record.nextBillingDate = nextBillingDate;
    record.status = 'active';
    record.lastRenewedAt = renewedAt;
    record.lastRenewalNextBillingDate = nextBillingDate;
    record.updatedAt = renewedAt;
    return {
      subscription: this.toPublic(record),
      renewal: clone(event),
    };
  }

  undoRenewal(userId: string | undefined, id: string) {
    const record = this.findRecord(this.normalizeUserId(userId), id);
    const history = record.renewalHistory;
    const event = history[history.length - 1];
    if (
      !event ||
      !record.lastRenewedAt ||
      Date.now() - new Date(record.lastRenewedAt).getTime() >= 10 * 60 * 1000 ||
      event.nextBillingDate !== record.nextBillingDate
    ) {
      throw new ConflictException({
        code: 'RENEWAL_UNDO_WINDOW_EXPIRED',
        message: 'Renewal can only be undone within 10 minutes',
      });
    }
    history.pop();
    record.nextBillingDate = event.previousNextBillingDate;
    record.status = event.previousStatus;
    record.lastRenewedAt = null;
    record.lastRenewalNextBillingDate = null;
    record.updatedAt = this.now();
    return this.toPublic(record);
  }

  stats(userId: string | undefined, query: StatsQueryDto) {
    const normalizedUserId = this.normalizeUserId(userId);
    const period = query.period ?? 'month';
    const currency = (query.currency ?? this.getSettingsRecord(normalizedUserId).defaultCurrency).toUpperCase();
    const records = this.ownedRecords(normalizedUserId).filter(
      (record) =>
        !record.deletedAt &&
        record.currency === currency &&
        !['cancelled', 'archived', 'paused'].includes(record.status) &&
        record.amount !== null,
    );
    const relevant =
      period === 'next30'
        ? records.filter((record) => {
            const days = daysUntil(record.nextBillingDate);
            return days >= 0 && days <= 30;
          })
        : records;
    const valueFor = (record: SubscriptionRecord): number => {
      if (period === 'next30') return record.amount ?? 0;
      const monthly = monthlyEquivalent(record);
      return period === 'year' ? monthly * 12 : monthly;
    };
    const total = roundMoney(relevant.reduce((sum, record) => sum + valueFor(record), 0));
    const categoryValues = new Map<string, number>();
    for (const record of relevant) {
      categoryValues.set(
        record.category,
        (categoryValues.get(record.category) ?? 0) + valueFor(record),
      );
    }
    const categoryStats = [...categoryValues.entries()]
      .map(([category, value]) => ({
        category,
        value: roundMoney(value),
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((left, right) => right.value - left.value);

    const trend: Array<{ month: string; value: number }> = [];
    const trendStart = new Date();
    trendStart.setUTCDate(1);
    for (let index = 0; index < 6; index += 1) {
      const month = new Date(
        Date.UTC(trendStart.getUTCFullYear(), trendStart.getUTCMonth() + index, 1, 12),
      );
      trend.push({
        month: monthKey(month),
        value: roundMoney(
          records.reduce((sum, record) => sum + (period === 'next30' ? 0 : monthlyEquivalent(record)), 0),
        ),
      });
    }

    return {
      period,
      currency,
      total,
      subscriptionCount: relevant.length,
      categoryStats,
      trend,
    };
  }

  reminders(userId: string | undefined, requestedDays?: number) {
    const horizon = Math.min(90, Math.max(1, Number(requestedDays) || 30));
    const records = this.ownedRecords(this.normalizeUserId(userId))
      .filter(
        (record) =>
          !record.deletedAt &&
          !['cancelled', 'archived', 'paused'].includes(record.status),
      )
      .map((record) => {
        const days = daysUntil(record.nextBillingDate);
        const eligibleOffsets = record.reminders.filter((offset) => offset <= days);
        const nextOffset = eligibleOffsets.length
          ? Math.max(...eligibleOffsets)
          : Math.max(...record.reminders, 0);
        return {
          subscription: this.toPublic(record),
          daysUntilBilling: days,
          urgency: days < 0 ? 'overdue' : days <= 3 ? 'urgent' : 'upcoming',
          nextReminderInDays: Math.max(0, days - nextOffset),
          nextReminderOffset: nextOffset,
        };
      })
      .filter((item) => item.daysUntilBilling <= horizon)
      .sort((left, right) => left.daysUntilBilling - right.daysUntilBilling);

    return {
      data: records,
      meta: { horizonDays: horizon, total: records.length },
    };
  }

  getMembership(userId: string | undefined) {
    const normalizedUserId = this.normalizeUserId(userId);
    const membership = this.getMembershipRecord(normalizedUserId);
    const used = this.ownedRecords(normalizedUserId).filter(
      (record) => !record.deletedAt && !record.isDemo,
    ).length;
    return {
      ...clone(membership),
      quota: {
        limit: membership.status === 'active' ? null : FREE_SUBSCRIPTION_LIMIT,
        used,
        remaining:
          membership.status === 'active'
            ? null
            : Math.max(0, FREE_SUBSCRIPTION_LIMIT - used),
      },
      benefits: {
        unlimitedSubscriptions: membership.status === 'active',
        reminderOffsets: [14, 7, 3, 1, 0],
        statistics: true,
        localOnlyDemo: true,
      },
    };
  }

  activateMembership(userId: string | undefined) {
    const membership = this.getMembershipRecord(this.normalizeUserId(userId));
    membership.status = 'active';
    membership.plan = 'member';
    membership.startedAt = this.now();
    return this.getMembership(membership.userId);
  }

  restoreMembership(userId: string | undefined) {
    const membership = this.getMembershipRecord(this.normalizeUserId(userId));
    membership.status = 'free';
    membership.plan = 'free';
    membership.startedAt = null;
    return this.getMembership(membership.userId);
  }

  getSettings(userId: string | undefined) {
    const settings = this.getSettingsRecord(this.normalizeUserId(userId));
    const { userId: _userId, ...publicSettings } = clone(settings);
    return publicSettings;
  }

  updateSettings(userId: string | undefined, dto: UpdateSettingsDto) {
    const settings = this.getSettingsRecord(this.normalizeUserId(userId));
    const values = dto as unknown as Record<string, unknown>;
    for (const key of [
      'amountVisible',
      'notificationEnabled',
      'notificationAuthorization',
      'weeklySummary',
      'defaultCurrency',
      'defaultReminders',
      'reminderTime',
      'timezone',
    ]) {
      if (values[key] !== undefined) {
        (settings as unknown as Record<string, unknown>)[key] = values[key];
      }
    }
    if (settings.defaultReminders) {
      settings.defaultReminders = uniqueReminders(settings.defaultReminders);
    }
    settings.defaultCurrency = settings.defaultCurrency.toUpperCase();
    const { userId: _userId, ...publicSettings } = clone(settings);
    return publicSettings;
  }

  catalog() {
    const templates: ServiceTemplate[] = [
      {
        name: 'Netflix Premium',
        shortName: 'Netflix',
        plan: 'Premium',
        logo: 'N',
        color: '#e50914',
        category: 'video',
        amount: 108,
        currency: 'CNY',
        cycle: 'monthly',
        payment: 'card',
      },
      {
        name: 'ChatGPT Plus',
        shortName: 'ChatGPT',
        plan: 'Plus',
        logo: 'AI',
        color: '#1f9c70',
        category: 'ai',
        amount: 145,
        currency: 'CNY',
        cycle: 'monthly',
        payment: 'card',
      },
      {
        name: 'iCloud+',
        shortName: 'iCloud',
        plan: '200GB',
        logo: 'i',
        color: '#3f98ee',
        category: 'cloud',
        amount: 21,
        currency: 'CNY',
        cycle: 'monthly',
        payment: 'app_store',
      },
    ];
    return {
      categories: [...SUBSCRIPTION_CATEGORIES],
      cycles: [...BILLING_CYCLES],
      paymentMethods: [...PAYMENT_METHODS],
      currencies: ['CNY', 'USD', 'HKD', 'JPY'],
      statuses: [...DISPLAY_STATUSES],
      templates,
    };
  }
}
