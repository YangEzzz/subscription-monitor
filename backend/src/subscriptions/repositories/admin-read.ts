export type AdminSection =
  | 'users'
  | 'subscriptions'
  | 'notifications'
  | 'memberships'
  | 'membershipOrders';
export type AdminQuery = {
  section: AdminSection;
  page: number;
  search: string;
};
export type AdminPage = {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
};
export type AdminOverview = {
  users: number;
  subscriptions: number;
  notifications: number;
  failedNotifications: number;
};
