import { Injectable } from '@nestjs/common';
import {
  Membership,
  SubscriptionRecord,
  UserSettings,
} from '../domain/subscription';
import { SubscriptionsRepository } from './subscriptions.repository';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

@Injectable()
export class MemorySubscriptionsRepository implements SubscriptionsRepository {
  private records: SubscriptionRecord[];
  private settings = new Map<string, UserSettings>();
  private memberships = new Map<string, Membership>();

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
    const settingsSnapshot = new Map(
      [...this.settings.entries()].map(([key, value]) => [key, clone(value)]),
    );
    const membershipsSnapshot = new Map(
      [...this.memberships.entries()].map(([key, value]) => [key, clone(value)]),
    );

    try {
      return await work(this);
    } catch (error) {
      this.records = recordsSnapshot;
      this.settings = settingsSnapshot;
      this.memberships = membershipsSnapshot;
      throw error;
    }
  }
}
