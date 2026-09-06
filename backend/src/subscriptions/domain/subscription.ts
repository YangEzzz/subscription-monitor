export const SUBSCRIPTION_STATUSES = [
  'active',
  'trial',
  'pending',
  'paused',
  'cancelled',
  'archived',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const DISPLAY_STATUSES = [
  'active',
  'trial',
  'upcoming',
  'pending',
  'overdue',
  'paused',
  'cancelled',
  'archived',
] as const;

export type DisplayStatus = (typeof DISPLAY_STATUSES)[number];

export const BILLING_CYCLES = [
  'weekly',
  'monthly',
  'quarterly',
  'semiannual',
  'yearly',
  'custom_days',
  'one_off',
] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_CATEGORIES = [
  'video',
  'music',
  'cloud',
  'ai',
  'productivity',
  'reading',
  'other',
] as const;

export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'wechat',
  'alipay',
  'app_store',
  'card',
  'official_site',
  'other',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface RenewalRecord {
  id: string;
  renewedAt: string;
  previousStatus: SubscriptionStatus;
  previousNextBillingDate: string;
  nextBillingDate: string;
  amount: number | null;
  currency: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  name: string;
  plan: string | null;
  logo: string | null;
  color: string;
  amount: number | null;
  currency: string;
  cycle: BillingCycle;
  cycleValue: number | null;
  nextBillingDate: string;
  payment: PaymentMethod;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  autoRenew: boolean;
  reminders: number[];
  trialEndDate: string | null;
  note: string;
  cancelGuide: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDemo: boolean;
  renewalHistory: RenewalRecord[];
  lastRenewedAt: string | null;
  lastRenewalNextBillingDate: string | null;
}

export interface UserSettings {
  userId: string;
  amountVisible: boolean;
  notificationEnabled: boolean;
  notificationAuthorization: string[];
  weeklySummary: boolean;
  defaultCurrency: string;
  defaultReminders: number[];
  reminderTime: string;
  timezone: string;
}

export interface Membership {
  userId: string;
  status: 'free' | 'active';
  plan: 'free' | 'member';
  startedAt: string | null;
}

export interface ServiceTemplate {
  name: string;
  shortName: string;
  plan: string;
  logo: string;
  color: string;
  category: SubscriptionCategory;
  amount: number | null;
  currency: string;
  cycle: BillingCycle;
  payment: PaymentMethod;
}
