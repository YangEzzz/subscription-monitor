import { MemorySubscriptionsRepository } from './repositories/memory-subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

function createService(): SubscriptionsService {
  return new SubscriptionsService(new MemorySubscriptionsRepository());
}

function futureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createInput(index: number) {
  return {
    name: 'Quota item ' + index,
    category: 'other' as const,
    cycle: 'monthly' as const,
    nextBillingDate: futureDate(14),
    amount: 10 + index,
    currency: 'CNY',
    payment: 'card' as const,
    reminders: [7, 3, 1],
  };
}

describe('SubscriptionsService', () => {
  it('hides legacy demo records from account reads, quota and statistics', async () => {
    const repository = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repository);
    const created = (await service.create('user', createInput(1))) as {
      id: string;
    };
    const record = await repository.findSubscription('user', created.id);
    await repository.saveSubscription({ ...record!, isDemo: true });
    expect(
      (await service.list('user', { page: 1, limit: 20 })).meta.total,
    ).toBe(0);
    expect((await service.getMembership('user')).quota.used).toBe(0);
    expect(
      (await service.stats('user', { period: 'month', currency: 'CNY' })).total,
    ).toBe(0);
    await expect(service.findOne('user', created.id)).rejects.toThrow(
      'Subscription not found',
    );
  });
  it('rejects missing identities instead of using a shared demo account', async () => {
    await expect(
      createService().list(undefined, { page: 1, limit: 20 }),
    ).rejects.toThrow('微信登录未完成');
  });
  it('starts empty and exposes backend-calculated fields for saved records', async () => {
    const service = createService();
    expect(
      (await service.list('user', { page: 1, limit: 100 })).meta.total,
    ).toBe(0);
    await service.create('user', createInput(1));
    const result = await service.list('user', { page: 1, limit: 100 });

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).toHaveProperty('displayStatus');
    expect(result.data[0]).toHaveProperty('daysUntilBilling');
    expect(result.data.every((item) => item.isDemo === undefined)).toBe(true);
  });

  it('enforces quota and reads membership only from repository', async () => {
    const service = createService();
    const userId = 'quota-user';

    for (let index = 0; index < 5; index += 1) {
      await service.create(userId, createInput(index));
    }

    await expect(service.create(userId, createInput(5))).rejects.toThrow(
      'Free plan allows up to 5 subscriptions',
    );

    const repository = new MemorySubscriptionsRepository();
    await repository.saveMembership({
      userId,
      status: 'active',
      plan: 'member',
      startedAt: new Date().toISOString(),
    });
    const memberService = new SubscriptionsService(repository);
    expect(await memberService.create(userId, createInput(5))).toHaveProperty(
      'id',
    );
  });

  it('serializes concurrent creation at the free quota boundary', async () => {
    const service = createService();
    for (let index = 0; index < 4; index++)
      await service.create('parallel-user', createInput(index));
    const results = await Promise.allSettled([
      service.create('parallel-user', createInput(4)),
      service.create('parallel-user', createInput(5)),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect((await service.getMembership('parallel-user')).quota.used).toBe(5);
  });

  it('should soft-delete and restore without losing the record', async () => {
    const service = createService();
    const created = (await service.create('restore-user', createInput(1))) as {
      id: string;
    };

    const deleted = (await service.remove('restore-user', created.id)) as {
      deletedAt: string;
    };
    expect(deleted.deletedAt).toEqual(expect.any(String));
    expect(
      (await service.list('restore-user', { page: 1, limit: 20 })).meta.total,
    ).toBe(0);

    const restored = (await service.restore('restore-user', created.id)) as {
      deletedAt: null;
    };
    expect(restored.deletedAt).toBeNull();
    expect(
      (await service.list('restore-user', { page: 1, limit: 20 })).meta.total,
    ).toBe(1);
  });

  it('should renew and undo within the ten-minute window', async () => {
    const service = createService();
    const created = (await service.create('renew-user', createInput(1))) as {
      id: string;
    };
    const before = (await service.findOne('renew-user', created.id)) as {
      nextBillingDate: string;
    };
    const renewed = (await service.renew('renew-user', created.id)) as {
      renewal: {
        nextBillingDate: string;
        previousNextBillingDate: string;
        previousStatus: string;
      };
    };

    expect(renewed.renewal.nextBillingDate).not.toBe(before.nextBillingDate);
    expect(renewed.renewal.previousNextBillingDate).toBe(
      before.nextBillingDate,
    );
    expect(renewed.renewal.previousStatus).toBe('active');
    await expect(service.renew('renew-user', created.id)).rejects.toThrow(
      'This subscription was renewed recently',
    );
    expect(
      (
        (await service.undoRenewal('renew-user', created.id)) as {
          nextBillingDate: string;
        }
      ).nextBillingDate,
    ).toBe(before.nextBillingDate);
  });

  it('should complete and archive one-off subscriptions, and allow undo', async () => {
    const service = createService();
    const created = (await service.create('one-off-user', {
      ...createInput(1),
      cycle: 'one_off',
    })) as { id: string };

    const result = await service.renew('one-off-user', created.id);
    expect(result.subscription.status).toBe('archived');
    expect(result.subscription.renewalHistory).toHaveLength(1);
    expect((await service.undoRenewal('one-off-user', created.id)).status).toBe(
      'active',
    );
  });

  it('should preserve the month-end anchor and accept retries of an old period', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2028-01-01T12:00:00Z'));
    try {
      const service = createService();
      const created = (await service.create('month-end-user', {
        ...createInput(1),
        nextBillingDate: '2028-01-31',
      })) as { id: string };
      expect(
        (await service.renew('month-end-user', created.id, '2028-01-31'))
          .subscription.nextBillingDate,
      ).toBe('2028-02-29');
      jest.advanceTimersByTime(11 * 60 * 1000);
      const retried = await service.renew(
        'month-end-user',
        created.id,
        '2028-01-31',
      );
      expect(retried.subscription.nextBillingDate).toBe('2028-02-29');
      expect(retried.subscription.renewalHistory).toHaveLength(1);
      expect(
        (await service.renew('month-end-user', created.id, '2028-02-29'))
          .subscription.nextBillingDate,
      ).toBe('2028-03-31');
      await expect(
        service.renew('month-end-user', created.id, '2028-03-30'),
      ).rejects.toThrow('Billing period has changed');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should return stats and reminders from the same in-memory state', async () => {
    const service = createService();
    await service.create('stats-user', createInput(1));
    const stats = await service.stats('stats-user', {
      period: 'month',
      currency: 'CNY',
    });
    const reminders = await service.reminders('stats-user', 30);

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.categoryStats.length).toBeGreaterThan(0);
    expect(reminders.meta.total).toBeGreaterThan(0);
    expect(reminders.data[0]).toHaveProperty('urgency');
  });
});
