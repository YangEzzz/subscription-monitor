import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from '../subscriptions/repositories/subscriptions.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuthorizationResult } from './notification.repository';
import { MessageError, WechatMessagesService } from './wechat-messages.service';

export function localClock(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running: Promise<void> | null = null;
  constructor(
    private readonly config: ConfigService,
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repository: SubscriptionsRepository,
    private readonly subscriptions: SubscriptionsService,
    private readonly messages: WechatMessagesService,
  ) {}

  get templateId(): string {
    return this.config.get<string>('app.wechatReminderTemplateId') || '';
  }
  get configured(): boolean {
    return Boolean(
      this.templateId &&
      this.config.get('app.wechatAppId') &&
      this.config.get('app.wechatAppSecret'),
    );
  }
  get longTerm(): boolean {
    return this.config.get('app.wechatSubscriptionType') === 'long_term';
  }
  get schedulerEnabled(): boolean {
    return (
      this.config.get('app.persistenceDriver') === 'prisma' &&
      this.config.get('app.notificationSchedulerEnabled') !== false
    );
  }

  async status(userId: string) {
    const settings = await this.subscriptions.getSettings(userId);
    const identity = await this.repository.findWechatIdentity(userId);
    const deliveries = await this.repository.listNotificationDeliveries(userId);
    const available = await this.repository.countNotificationCredits(
      userId,
      this.templateId,
    );
    return {
      configured: this.configured,
      schedulerEnabled: this.schedulerEnabled,
      templateId: this.configured ? this.templateId : null,
      enabled: settings.notificationEnabled,
      identityLinked: identity?.appId === this.config.get('app.wechatAppId'),
      subscriptionType: this.longTerm ? 'long_term' : 'once',
      authorized: available > 0,
      credits: this.longTerm ? null : available,
      recentDeliveries: deliveries.map(
        ({
          id,
          subscriptionId,
          subscriptionName,
          billingDate,
          status,
          errorCode,
          createdAt,
          updatedAt,
        }) => ({
          id,
          subscriptionId,
          subscriptionName,
          billingDate,
          status,
          errorCode,
          createdAt,
          updatedAt,
        }),
      ),
    };
  }

  async authorize(
    userId: string,
    requestId: string,
    templateId: string,
    result: AuthorizationResult,
  ) {
    if (!this.configured)
      throw new ServiceUnavailableException('微信通知服务尚未配置');
    if (templateId !== this.templateId)
      throw new BadRequestException('通知模板已更新，请刷新后重试');
    const identity = await this.repository.findWechatIdentity(userId);
    if (!identity || identity.appId !== this.config.get('app.wechatAppId'))
      throw new BadRequestException('请重新微信登录后授权');
    await this.subscriptions.getSettings(userId);
    await this.repository.recordNotificationAuthorization(
      userId,
      requestId,
      templateId,
      result,
      this.longTerm,
    );
    return this.status(userId);
  }

  onModuleInit() {
    if (!this.configured || !this.schedulerEnabled) return;
    const tick = () => {
      void this.runOnce().catch(() =>
        this.logger.error('通知任务运行失败，请检查数据库和通知配置'),
      );
    };
    this.timer = setInterval(tick, 60000);
    this.timer.unref();
    tick();
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }
  runOnce(now = new Date()): Promise<void> {
    if (this.running) return this.running;
    this.running = this.dispatch(now).finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async dispatch(now: Date) {
    if (!this.configured) return;
    await this.repository.recoverNotificationDeliveries(
      new Date(now.getTime() - 600000),
    );
    let afterId = '';
    for (;;) {
      const users = await this.repository.listNotificationUsers(afterId, 100);
      if (!users.length) break;
      for (const userId of users) {
        try {
          await this.dispatchUser(userId, now);
        } catch {
          this.logger.warn('一个账号的通知任务失败，将在下次轮询检查');
        }
      }
      afterId = users[users.length - 1];
    }
  }
  private async dispatchUser(userId: string, now: Date) {
    const identity = await this.repository.findWechatIdentity(userId);
    const settings = await this.repository.findSettings(userId);
    if (
      !settings?.notificationEnabled ||
      identity?.appId !== this.config.get('app.wechatAppId')
    )
      return;
    const clock = localClock(now, settings.timezone);
    if (clock.time < settings.reminderTime) return;
    const records = (await this.repository.listSubscriptions(userId)).sort(
      (a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate),
    );
    for (const record of records) {
      if (
        record.deletedAt ||
        record.isDemo ||
        record.amount === null ||
        ['paused', 'cancelled', 'archived'].includes(record.status)
      )
        continue;
      const days = Math.round(
        (Date.parse(record.nextBillingDate) - Date.parse(clock.date)) /
          86400000,
      );
      const eligible = record.reminders.filter((offset) => offset >= days);
      if (days < 0 || !eligible.length) continue;
      const offset = Math.min(...eligible);
      const delivery = await this.repository.claimNotificationDelivery(
        {
          userId,
          subscriptionId: record.id,
          subscriptionName: record.name,
          billingDate: record.nextBillingDate,
          offset,
          templateId: this.templateId,
        },
        now,
        this.longTerm,
      );
      if (!delivery) continue;
      const current = await this.repository.findSubscription(userId, record.id);
      const latestSettings = await this.repository.findSettings(userId);
      if (
        !latestSettings?.notificationEnabled ||
        !current ||
        current.deletedAt ||
        current.amount === null ||
        current.nextBillingDate !== delivery.billingDate ||
        !current.reminders.includes(offset) ||
        ['paused', 'cancelled', 'archived'].includes(current.status)
      ) {
        await this.repository.finishNotificationDelivery(
          delivery.id,
          'skipped',
          'RECORD_CHANGED',
        );
        continue;
      }
      try {
        await this.messages.send(
          identity!.openId,
          current.id,
          current.nextBillingDate,
          current.amount,
          current.currency,
        );
        await this.repository.finishNotificationDelivery(
          delivery.id,
          'sent',
          null,
        );
      } catch (error) {
        const failure =
          error instanceof MessageError
            ? error
            : new MessageError('DELIVERY_UNKNOWN', true);
        await this.repository.finishNotificationDelivery(
          delivery.id,
          failure.uncertain ? 'unknown' : 'failed',
          failure.code,
          (failure.retryable || failure.code === '43101') &&
            delivery.attempts < 3
            ? new Date(now.getTime() + delivery.attempts * 300000)
            : undefined,
        );
        if (failure.code === '43101') break;
      }
    }
  }
}
