import {
  Membership,
  SubscriptionRecord,
  UserSettings,
} from '../domain/subscription';
import { NotificationRepository } from '../../notifications/notification.repository';

export const SUBSCRIPTIONS_REPOSITORY = Symbol('SUBSCRIPTIONS_REPOSITORY');

export interface SubscriptionsRepository extends NotificationRepository {
  listSubscriptions(userId: string): Promise<SubscriptionRecord[]>;
  findSubscription(
    userId: string,
    id: string,
  ): Promise<SubscriptionRecord | null>;
  saveSubscription(record: SubscriptionRecord): Promise<void>;

  findSettings(userId: string): Promise<UserSettings | null>;
  saveSettings(settings: UserSettings): Promise<void>;

  findMembership(userId: string): Promise<Membership | null>;
  saveMembership(membership: Membership): Promise<void>;

  transaction<T>(
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T>;
}
