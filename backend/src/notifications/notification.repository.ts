export type WechatIdentity = { userId: string; appId: string; openId: string };
export type DeliveryStatus =
  | 'sending'
  | 'sent'
  | 'failed'
  | 'unknown'
  | 'skipped';
export type NotificationDelivery = {
  id: string;
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  billingDate: string;
  offset: number;
  templateId: string;
  grantId: string;
  status: DeliveryStatus;
  attempts: number;
  errorCode: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type DeliveryInput = Pick<
  NotificationDelivery,
  | 'userId'
  | 'subscriptionId'
  | 'subscriptionName'
  | 'billingDate'
  | 'offset'
  | 'templateId'
>;
export type AuthorizationResult = 'accept' | 'reject' | 'ban';

export interface NotificationRepository {
  saveWechatIdentity(identity: WechatIdentity): Promise<void>;
  findWechatIdentity(userId: string): Promise<WechatIdentity | null>;
  recordNotificationAuthorization(
    userId: string,
    requestId: string,
    templateId: string,
    result: AuthorizationResult,
    longTerm?: boolean,
  ): Promise<void>;
  countNotificationCredits(userId: string, templateId: string): Promise<number>;
  listNotificationUsers(afterId?: string, limit?: number): Promise<string[]>;
  claimNotificationDelivery(
    input: DeliveryInput,
    now: Date,
    longTerm?: boolean,
  ): Promise<NotificationDelivery | null>;
  finishNotificationDelivery(
    id: string,
    status: DeliveryStatus,
    errorCode: string | null,
    retryAt?: Date,
  ): Promise<void>;
  recoverNotificationDeliveries(before: Date): Promise<void>;
  listNotificationDeliveries(userId: string): Promise<NotificationDelivery[]>;
}
