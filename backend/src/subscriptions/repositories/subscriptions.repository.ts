import {
  Membership,
  SubscriptionRecord,
  UserSettings,
} from '../domain/subscription';
import { NotificationRepository } from '../../notifications/notification.repository';
import { AdminOverview, AdminPage, AdminQuery } from './admin-read';
import { MembershipOrder } from '../domain/membership-order';

export const SUBSCRIPTIONS_REPOSITORY = Symbol('SUBSCRIPTIONS_REPOSITORY');

export interface SubscriptionsRepository extends NotificationRepository {
  adminOverview(): Promise<AdminOverview>;
  adminRead(query: AdminQuery): Promise<AdminPage>;
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
  listMembershipOrders(userId: string): Promise<MembershipOrder[]>;
  findMembershipOrder(
    userId: string,
    id: string,
  ): Promise<MembershipOrder | null>;
  saveMembershipOrder(order: MembershipOrder): Promise<void>;
  transactionForUser<T>(
    userId: string,
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T>;

  transaction<T>(
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T>;
}
