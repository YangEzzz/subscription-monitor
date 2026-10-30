import {
  StatsDetailQuery,
  StatsDetailPage,
  RefundReceipt,
} from './statistics-details';
import { MembershipRefund } from '../domain/membership-refund';
import {
  Membership,
  SubscriptionRecord,
  UserSettings,
} from '../domain/subscription';
import { NotificationRepository } from '../../notifications/notification.repository';
import { AdminOverview, AdminPage, AdminQuery } from './admin-read';
import { WechatIdentity } from '../../notifications/notification.repository';
import { AdminStats } from './admin-stats';
import { MembershipOrder } from '../domain/membership-order';

export interface RuntimePolicy {
  membershipEnabled: boolean;
  freeSubscriptionLimit: number;
  updatedAt: string | null;
  updatedBy: string | null;
}
export const DEFAULT_RUNTIME_POLICY: RuntimePolicy = {
  membershipEnabled: false,
  freeSubscriptionLimit: 10,
  updatedAt: null,
  updatedBy: null,
};
export const SUBSCRIPTIONS_REPOSITORY = Symbol('SUBSCRIPTIONS_REPOSITORY');

export interface AdminMembershipGrant {
  action: 'grant' | 'revoke';
  previousMembership: Membership | null;
  id: string;
  userId: string;
  note: string;
  operator: string;
  createdAt: string;
}

export interface SubscriptionsRepository extends NotificationRepository {
  getRuntimePolicy(): Promise<RuntimePolicy>;
  saveRuntimePolicy(policy: RuntimePolicy): Promise<RuntimePolicy>;
  findAdminMembershipGrant(
    userId: string,
    action?: 'grant' | 'revoke',
  ): Promise<AdminMembershipGrant | null>;
  recordAdminMembershipGrant(grant: AdminMembershipGrant): Promise<void>;
  findUserTestFlag(userId: string): Promise<{
    isTest: boolean;
    testNote: string | null;
    testUpdatedBy: string | null;
    testUpdatedAt: string | null;
  }>;
  setUserTestFlag(
    userId: string,
    isTest: boolean,
    note: string,
    operator: string,
  ): Promise<void>;
  recordRefundReceipt(receipt: RefundReceipt): Promise<void>;
  listRefundReceipts(orderId: string): Promise<RefundReceipt[]>;
  statsDetails(query: StatsDetailQuery): Promise<StatsDetailPage>;
  recordWechatLogin(
    identity: WechatIdentity,
    context: {
      clientIp: string | null;
      peerIp: string | null;
      requestId: string;
    },
  ): Promise<void>;
  recordUserAccess(userId: string, ip: string, at: Date): Promise<void>;
  recordUserActivity(userId: string, at: Date): Promise<void>;
  findMembershipRefund(orderId: string): Promise<MembershipRefund | null>;
  saveMembershipRefund(refund: MembershipRefund): Promise<void>;
  listPendingRefunds(
    afterId: string,
    limit: number,
  ): Promise<MembershipRefund[]>;
  adminStats(days: number, excludeTest?: boolean): Promise<AdminStats>;
  adminOverview(excludeTest?: boolean): Promise<AdminOverview>;
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
  findMembershipOrderById(id: string): Promise<MembershipOrder | null>;
  listVirtualOrdersToReconcile(
    afterId?: string,
    limit?: number,
  ): Promise<MembershipOrder[]>;
  transactionForUser<T>(
    userId: string,
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T>;

  transaction<T>(
    work: (repository: SubscriptionsRepository) => Promise<T>,
  ): Promise<T>;
}
