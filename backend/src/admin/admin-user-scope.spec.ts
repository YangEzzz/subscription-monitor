import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('admin subscriptions exact user scope', () => {
  it('keeps an exact owner filter across keyword searches and pagination', async () => {
    const repo = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repo);
    const input = {
      name: 'Shared service',
      category: 'other' as const,
      cycle: 'monthly' as const,
      nextBillingDate: '2027-01-01',
      amount: 10,
      currency: 'CNY',
      payment: 'card' as const,
      reminders: [1],
    };
    await service.create('wx-user-1', input);
    await service.create('wx-user-10', input);
    for (const search of ['', 'Shared', 'wx-user-1']) {
      const page = await repo.adminRead({
        section: 'subscriptions',
        userId: 'wx-user-1',
        search,
        page: 1,
      });
      expect(page.total).toBe(1);
      expect(page.items.every((row) => row.userId === 'wx-user-1')).toBe(true);
    }
    expect(
      (
        await repo.adminRead({
          section: 'subscriptions',
          userId: 'missing',
          search: '',
          page: 1,
        })
      ).total,
    ).toBe(0);
    expect(
      (
        await repo.adminRead({
          section: 'subscriptions',
          userId: 'wx-user-1',
          search: '',
          page: 2,
        })
      ).items,
    ).toEqual([]);
  });
});

describe('admin notification scope', () => {
  it('separates exact user history from the global failure queue', async () => {
    const repo = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repo);
    for (const userId of ['wx-user-1', 'wx-user-10']) {
      await service.getSettings(userId);
      await repo.saveSettings({
        ...(await repo.findSettings(userId))!,
        notificationEnabled: true,
      });
      const sub = (await service.create(userId, {
        name: 'Shared service',
        category: 'other',
        cycle: 'monthly',
        nextBillingDate: '2027-01-01',
        amount: 10,
        currency: 'CNY',
        payment: 'card',
        reminders: [1, 3],
      })) as { id: string };
      await repo.recordNotificationAuthorization(
        userId,
        userId,
        'template',
        'accept',
        true,
      );
      for (const offset of [1, 3]) {
        const delivery = await repo.claimNotificationDelivery(
          {
            userId,
            subscriptionId: sub.id,
            subscriptionName: 'Shared service',
            billingDate: '2027-01-01',
            offset,
            templateId: 'template',
          },
          new Date('2026-12-29T00:00:00Z'),
          true,
        );
        expect(delivery).not.toBeNull();
        const status =
          userId === 'wx-user-1'
            ? offset === 1
              ? 'sent'
              : 'failed'
            : offset === 1
              ? 'unknown'
              : 'sent';
        await repo.finishNotificationDelivery(
          delivery!.id,
          status,
          status === 'sent' ? null : 'ERROR',
        );
      }
    }
    const history = await repo.adminRead({
      section: 'notifications',
      userId: 'wx-user-1',
      page: 1,
      search: '',
    });
    expect(history.total).toBe(2);
    expect(history.items.every((row) => row.userId === 'wx-user-1')).toBe(true);
    const failures = await repo.adminRead({
      section: 'notifications',
      failedOnly: true,
      page: 1,
      search: 'Shared',
    });
    expect(failures.total).toBe(2);
    expect(failures.items.map((row) => row.status).sort()).toEqual([
      'failed',
      'unknown',
    ]);
    expect(
      (
        await repo.adminRead({
          section: 'notifications',
          userId: 'wx-user-1',
          failedOnly: true,
          page: 1,
          search: '',
        })
      ).total,
    ).toBe(1);
  });
});
