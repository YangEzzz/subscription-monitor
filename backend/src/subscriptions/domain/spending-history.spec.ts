import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HistoryQueryDto } from '../dto/history-query.dto';
import { MemorySubscriptionsRepository } from '../repositories/memory-subscriptions.repository';
import { SubscriptionsService } from '../subscriptions.service';

const input = {
  name: '音乐',
  category: 'music' as const,
  cycle: 'monthly' as const,
  nextBillingDate: '2026-01-31',
  amount: 12,
  currency: 'CNY',
  payment: 'card' as const,
  reminders: [1],
};

describe('Recorded spending history', () => {
  it('uses original billing month and price, retains cancelled/trashed records and isolates owners', async () => {
    const repository = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repository);
    const record = await service.create('alice', input);
    const other = await service.create('bob', { ...input, amount: 999 });
    await service.renew('alice', String(record.id), '2026-01-31');
    await service.renew('bob', String(other.id), '2026-01-31');
    await service.update('alice', String(record.id), {
      amount: 88,
      status: 'cancelled',
    });
    await service.remove('alice', String(record.id));
    const january = await service.history('alice', {
      month: '2026-01',
      currency: 'CNY',
    });
    expect(january.total).toBe(12);
    expect(january.count).toBe(1);
    expect(january.entries[0]).toMatchObject({
      billingDate: '2026-01-31',
      amount: 12,
      deleted: true,
    });
    expect(january.categoryStats[0]).toMatchObject({
      category: 'music',
      value: 12,
    });
    expect(january.trend.map((item) => item.month)).toEqual([
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
    ]);
    expect((await service.history('alice', { month: '2026-02' })).count).toBe(
      0,
    );
  });

  it('keeps currencies separate, counts unknown amounts, paginates and removes undone renewals', async () => {
    const repository = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repository);
    const cny = await service.create('alice', input);
    await service.renew('alice', String(cny.id), '2026-01-31');
    const usd = await service.create('alice', {
      ...input,
      name: 'USD service',
      currency: 'USD',
      amount: 5,
    });
    await service.renew('alice', String(usd.id), '2026-01-31');
    const unknown = await service.create('alice', { ...input, amount: 0 });
    await service.renew('alice', String(unknown.id), '2026-01-31');
    const legacy = await repository.findSubscription(
      'alice',
      String(unknown.id),
    );
    legacy!.renewalHistory[0].amount = null;
    await repository.saveSubscription(legacy!);
    const zero = await service.create('alice', { ...input, amount: 0 });
    await service.renew('alice', String(zero.id), '2026-01-31');
    const snapshot = await repository.findSubscription('alice', String(cny.id));
    // A long-lived account may have many confirmations in one month.
    snapshot!.renewalHistory = Array.from({ length: 22 }, (_, index) => ({
      ...snapshot!.renewalHistory[0],
      id: `entry-${index}`,
    }));
    await repository.saveSubscription(snapshot!);
    const first = await service.history('alice', {
      month: '2026-01',
      currency: 'CNY',
    });
    expect(first.total).toBe(264);
    expect(first.count).toBe(24);
    expect(first.unknownCount).toBe(1);
    expect(first.entries).toHaveLength(20);
    expect(first.meta.hasMore).toBe(true);
    expect(first.totalsByCurrency).toContainEqual({
      currency: 'USD',
      total: 5,
      count: 1,
      unknownCount: 0,
    });
    const second = await service.history('alice', {
      month: '2026-01',
      currency: 'CNY',
      page: 2,
    });
    expect(second.entries).toHaveLength(4);
    expect(second.total).toBe(264);
    expect(second.meta.hasMore).toBe(false);
    expect(
      new Set(
        [...first.entries, ...second.entries].map(
          (entry) => entry.subscriptionId + entry.id,
        ),
      ).size,
    ).toBe(24);
    await service.undoRenewal('alice', String(usd.id));
    expect(
      (await service.history('alice', { month: '2026-01', currency: 'USD' }))
        .count,
    ).toBe(0);
  });

  it('excludes demos, preserves zero as known and validates month/currency/page queries', async () => {
    const repository = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repository);
    const record = await service.create('alice', { ...input, amount: 0 });
    await service.renew('alice', String(record.id), '2026-01-31');
    const result = await service.history('alice', { month: '2026-01' });
    expect(result.total).toBe(0);
    expect(result.unknownCount).toBe(0);
    expect(result.trend[5].knownCount).toBe(1);
    const stored = await repository.findSubscription(
      'alice',
      String(record.id),
    );
    await repository.saveSubscription({ ...stored!, isDemo: true });
    expect((await service.history('alice', { month: '2026-01' })).count).toBe(
      0,
    );
    for (const query of [
      { month: '2026-13' },
      { month: '2026-1' },
      { month: ['2026-01'] },
      { currency: '12!' },
      { page: 0 },
      { page: 'abc' },
    ]) {
      expect(
        (await validate(plainToInstance(HistoryQueryDto, query))).length,
      ).toBeGreaterThan(0);
    }
    expect(
      await validate(
        plainToInstance(HistoryQueryDto, {
          month: '2026-01',
          currency: 'USD',
          page: '2',
        }),
      ),
    ).toHaveLength(0);
  });
});
