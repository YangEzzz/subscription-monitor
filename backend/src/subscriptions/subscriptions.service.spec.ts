import { SubscriptionsService } from './subscriptions.service';

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
  it('should expose seeded records with calculated display fields', () => {
    const service = new SubscriptionsService();
    const result = service.list('demo-user', { page: 1, limit: 100 });

    expect(result.meta.total).toBe(9);
    expect(result.data[0]).toHaveProperty('displayStatus');
    expect(result.data[0]).toHaveProperty('daysUntilBilling');
    expect(result.data.every((item) => item.isDemo)).toBe(true);
  });

  it('should enforce the free quota only for non-demo records', () => {
    const service = new SubscriptionsService();
    const userId = 'quota-user';

    for (let index = 0; index < 5; index += 1) {
      service.create(userId, createInput(index));
    }

    expect(() => service.create(userId, createInput(5))).toThrow(
      'Free plan allows up to 5 subscriptions',
    );

    service.activateMembership(userId);
    expect(service.create(userId, createInput(5))).toHaveProperty('id');
  });

  it('should soft-delete and restore without losing the record', () => {
    const service = new SubscriptionsService();
    const created = service.create('restore-user', createInput(1)) as { id: string };

    const deleted = service.remove('restore-user', created.id) as { deletedAt: string };
    expect(deleted.deletedAt).toEqual(expect.any(String));
    expect(service.list('restore-user', { page: 1, limit: 20 }).meta.total).toBe(0);

    const restored = service.restore('restore-user', created.id) as { deletedAt: null };
    expect(restored.deletedAt).toBeNull();
    expect(service.list('restore-user', { page: 1, limit: 20 }).meta.total).toBe(1);
  });

  it('should renew and undo within the ten-minute window', () => {
    const service = new SubscriptionsService();
    const before = service.findOne('demo-user', 'sub_1001') as {
      nextBillingDate: string;
    };
    const renewed = service.renew('demo-user', 'sub_1001') as {
      renewal: {
        nextBillingDate: string;
        previousNextBillingDate: string;
        previousStatus: string;
      };
    };

    expect(renewed.renewal.nextBillingDate).not.toBe(before.nextBillingDate);
    expect(renewed.renewal.previousNextBillingDate).toBe(before.nextBillingDate);
    expect(renewed.renewal.previousStatus).toBe('active');
    expect(() => service.renew('demo-user', 'sub_1001')).toThrow(
      'This subscription was renewed recently',
    );
    expect(
      (service.undoRenewal('demo-user', 'sub_1001') as { nextBillingDate: string })
        .nextBillingDate,
    ).toBe(before.nextBillingDate);
  });

  it('should reject renewal for one-off subscriptions', () => {
    const service = new SubscriptionsService();
    const created = service.create('one-off-user', {
      ...createInput(1),
      cycle: 'one_off',
    }) as { id: string };

    expect(() => service.renew('one-off-user', created.id)).toThrow(
      'One-off subscriptions cannot be renewed',
    );
  });

  it('should return stats and reminders from the same in-memory state', () => {
    const service = new SubscriptionsService();
    const stats = service.stats('demo-user', { period: 'month', currency: 'CNY' });
    const reminders = service.reminders('demo-user', 30);

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.categoryStats.length).toBeGreaterThan(0);
    expect(reminders.meta.total).toBeGreaterThan(0);
    expect(reminders.data[0]).toHaveProperty('urgency');
  });
});
