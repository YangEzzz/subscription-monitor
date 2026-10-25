export type AdminSection =
  | 'billingIssues'
  | 'authEvents'
  | 'users'
  | 'subscriptions'
  | 'notifications'
  | 'memberships'
  | 'membershipOrders';
export type AdminQuery = {
  section: AdminSection;
  page: number;
  search: string;
  userId?: string;
  failedOnly?: boolean;
};
export type AdminPage = {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
};
export type AdminOverview = {
  activeMembers: number;
  paidAmountCny: number;
  refundAmountCny: number;
  netAmountCny: number;
  paymentIssues: number;
  snapshotAt: string;
  users: number;
  subscriptions: number;
  notifications: number;
  failedNotifications: number;
};
