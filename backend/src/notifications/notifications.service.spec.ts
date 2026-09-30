import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { localClock, NotificationsService } from './notifications.service';
import { MessageError, WechatMessagesService } from './wechat-messages.service';

describe('WeChat reminder dispatch', () => {
  const now = new Date('2026-09-30T01:00:00Z');
  const templateId = 'reminder-template';
  let repository: MemorySubscriptionsRepository;
  let subscriptions: SubscriptionsService;
  let notifications: NotificationsService;
  let send: jest.Mock;
  let config: ConfigService;
  beforeEach(async () => {
    repository = new MemorySubscriptionsRepository([]);
    subscriptions = new SubscriptionsService(repository);
    send = jest.fn().mockResolvedValue(undefined);
    config = new ConfigService({
      app: {
        wechatAppId: 'wx-test',
        wechatAppSecret: 'secret',
        wechatReminderTemplateId: templateId,
        wechatSubscriptionType: 'once',
        persistenceDriver: 'memory',
      },
    });
    notifications = new NotificationsService(
      config,
      repository,
      subscriptions,
      { send } as unknown as WechatMessagesService,
    );
    await repository.saveWechatIdentity({
      userId: 'user',
      appId: 'wx-test',
      openId: 'private-openid',
    });
    await subscriptions.getSettings('user');
    await subscriptions.create('user', {
      name: '服务',
      category: 'other',
      cycle: 'monthly',
      nextBillingDate: '2026-10-03',
      amount: 25,
      currency: 'CNY',
      payment: 'wechat',
      reminders: [7, 3, 1],
    });
  });
  const authorize = (service: NotificationsService, id = randomUUID()) =>
    service.authorize('user', id, templateId, 'accept');
  it('retains long-term authorization across reminder nodes and billing periods without duplicates', async () => {
    config.set('app.wechatSubscriptionType', 'long_term');
    await authorize(notifications);
    await notifications.runOnce(now);
    await notifications.runOnce(now);
    await notifications.runOnce(new Date('2026-10-02T01:00:00Z'));
    const [record] = await repository.listSubscriptions('user');
    await repository.saveSubscription({
      ...record,
      nextBillingDate: '2026-11-03',
    });
    await notifications.runOnce(new Date('2026-10-31T01:00:00Z'));
    expect(send).toHaveBeenCalledTimes(3);
    expect(await notifications.status('user')).toMatchObject({
      subscriptionType: 'long_term',
      authorized: true,
      credits: null,
    });
  });
  it('pauses and resumes long-term reminders without consuming the grant, and revokes on reject', async () => {
    config.set('app.wechatSubscriptionType', 'long_term');
    await authorize(notifications);
    await subscriptions.updateSettings('user', { notificationEnabled: false });
    await notifications.runOnce(now);
    expect(send).not.toHaveBeenCalled();
    expect((await notifications.status('user')).authorized).toBe(true);
    await subscriptions.updateSettings('user', { notificationEnabled: true });
    await notifications.runOnce(now);
    await notifications.authorize('user', randomUUID(), templateId, 'reject');
    expect(await notifications.status('user')).toMatchObject({
      authorized: false,
      enabled: false,
    });
  });
  it('invalidates long-term authorization on provider refusal and requires new template authorization', async () => {
    config.set('app.wechatSubscriptionType', 'long_term');
    await authorize(notifications);
    send.mockRejectedValueOnce(new MessageError('43101'));
    await notifications.runOnce(now);
    expect(await notifications.status('user')).toMatchObject({
      authorized: false,
      enabled: false,
    });
    await authorize(notifications);
    config.set('app.wechatReminderTemplateId', 'replacement-template');
    expect((await notifications.status('user')).authorized).toBe(false);
    await expect(authorize(notifications)).rejects.toThrow('通知模板已更新');
  });
  it('records receipts once, isolates history and hides OpenID', async () => {
    const id = randomUUID();
    await authorize(notifications, id);
    await authorize(notifications, id);
    const status = await notifications.status('user');
    expect(status.credits).toBe(1);
    expect(JSON.stringify(status)).not.toContain('private-openid');
    expect((await notifications.status('other')).credits).toBe(0);
    await expect(
      notifications.authorize('other', randomUUID(), templateId, 'accept'),
    ).rejects.toThrow();
  });
  it('sends once at local reminder time and consumes one authorization', async () => {
    await authorize(notifications);
    await notifications.runOnce(new Date('2026-09-30T00:59:00Z'));
    expect(send).not.toHaveBeenCalled();
    await Promise.all([notifications.runOnce(now), notifications.runOnce(now)]);
    await notifications.runOnce(now);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      'private-openid',
      expect.any(String),
      '2026-10-03',
      25,
      'CNY',
    );
    expect((await notifications.status('user')).credits).toBe(0);
    expect(
      (await notifications.status('user')).recentDeliveries[0].status,
    ).toBe('sent');
  });
  it('does not send without authorization or for missing amounts and paused records', async () => {
    await notifications.runOnce(now);
    expect(send).not.toHaveBeenCalled();
    await authorize(notifications);
    const [record] = await repository.listSubscriptions('user');
    await repository.saveSubscription({ ...record, amount: null });
    await notifications.runOnce(now);
    await repository.saveSubscription({ ...record, status: 'paused' });
    await notifications.runOnce(now);
    expect(send).not.toHaveBeenCalled();
    expect((await notifications.status('user')).credits).toBe(1);
  });
  it('preserves grants on reject and revokes them on ban', async () => {
    await authorize(notifications);
    await notifications.authorize('user', randomUUID(), templateId, 'reject');
    expect((await notifications.status('user')).credits).toBe(1);
    await notifications.authorize('user', randomUUID(), templateId, 'ban');
    expect((await notifications.status('user')).credits).toBe(0);
    expect((await notifications.status('user')).enabled).toBe(false);
  });
  it('keeps uncertain deliveries consumed and never automatically resends', async () => {
    await authorize(notifications);
    send.mockRejectedValue(new MessageError('DELIVERY_UNKNOWN', true));
    await notifications.runOnce(now);
    await authorize(notifications);
    await notifications.runOnce(new Date(now.getTime() + 600000));
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      (await notifications.status('user')).recentDeliveries[0].status,
    ).toBe('unknown');
  });
  it('retries confirmed transient failures, with an upper bound', async () => {
    await authorize(notifications);
    send.mockRejectedValue(new MessageError('-1', false, true));
    await notifications.runOnce(now);
    expect((await notifications.status('user')).credits).toBe(1);
    await notifications.runOnce(new Date(now.getTime() + 60000));
    expect(send).toHaveBeenCalledTimes(1);
    for (let i = 1; i <= 4; i++)
      await notifications.runOnce(new Date(now.getTime() + i * 600000));
    expect(send).toHaveBeenCalledTimes(3);
  });
  it('disables notifications when WeChat reports absent authorization', async () => {
    await authorize(notifications);
    await authorize(notifications);
    send.mockRejectedValue(new MessageError('43101'));
    await notifications.runOnce(now);
    const status = await notifications.status('user');
    expect(status.enabled).toBe(false);
    expect(status.credits).toBe(0);
    send.mockResolvedValue(undefined);
    await authorize(notifications);
    await notifications.runOnce(new Date(now.getTime() + 600000));
    expect(
      (await notifications.status('user')).recentDeliveries[0].status,
    ).toBe('sent');
  });
  it('uses the configured timezone and rejects invalid timezone settings', async () => {
    expect(
      localClock(new Date('2026-09-29T17:00:00Z'), 'Asia/Shanghai'),
    ).toEqual({ date: '2026-09-30', time: '01:00' });
    await expect(
      subscriptions.updateSettings('user', { timezone: 'invalid' }),
    ).rejects.toThrow();
  });
});
