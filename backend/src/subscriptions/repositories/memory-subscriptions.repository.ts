import { Injectable } from '@nestjs/common';
import {
  Membership,
  SubscriptionRecord,
  UserSettings,
} from '../domain/subscription';
import { SubscriptionsRepository } from './subscriptions.repository';
import { randomUUID } from 'node:crypto';
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
  private records: SubscriptionRecord[];
  private settings = new Map<string, UserSettings>();
  private memberships = new Map<string, Membership>();
  private identities = new Map<string, WechatIdentity>();
  private grants = new Map<
    string,
    { id: string; userId: string; templateId: string; status: string }
  >();
  private deliveries = new Map<string, NotificationDelivery>();

  saveWechatIdentity(identity: WechatIdentity): Promise<void> {
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
    if (result === 'ban') {
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
    grant.status = 'consumed';
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
    if ((status === 'failed' || status === 'skipped') && grant)
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

  async transaction<T>(
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T> {
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
