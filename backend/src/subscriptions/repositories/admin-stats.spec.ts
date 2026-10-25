import { MemorySubscriptionsRepository } from './memory-subscriptions.repository';
import { shanghaiDay, statsDays } from './admin-stats';
describe('admin analytics', () => {
  afterEach(() => jest.useRealTimers());
  it('uses Shanghai midnight and builds inclusive ranges', () => {
    expect(shanghaiDay('2026-10-23T16:00:00Z')).toBe('2026-10-24');
    expect(shanghaiDay('2026-10-23T15:59:59Z')).toBe('2026-10-23');
    expect(
      statsDays(7, new Date('2026-10-23T16:00:00Z')).map((d) => d.date),
    ).toEqual([
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
    ]);
  });
  it('preserves missing activity, deduplicates visits, and observes mature cohorts only', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-10T01:00:00Z'));
    const repo = new MemorySubscriptionsRepository([]);
    expect((await repo.adminStats(30)).activity.dau).toBeNull();
    await repo.saveWechatIdentity({ userId: 'a', appId: 'app', openId: 'a' });
    await repo.recordUserActivity('a', new Date());
    jest.setSystemTime(new Date('2026-10-11T01:00:00Z'));
    await repo.recordUserActivity('a', new Date());
    await repo.recordUserActivity('a', new Date());
    expect((await repo.adminStats(30)).cohorts[0].d1).toBeNull();
    jest.setSystemTime(new Date('2026-10-12T01:00:00Z'));
    let stats = await repo.adminStats(30);
    expect(stats.summary.newUsers).toBe(1);
    expect(stats.summary.activeUsers).toBe(1);
    expect(stats.retention.d1).toBe(1);
    expect(stats.retention.d7).toBeNull();
    expect(stats.days.find((d) => d.date === '2026-10-11')?.activeUsers).toBe(
      1,
    );
    expect(stats.days[0].activeUsers).toBeNull();
    expect(stats.activity.dau).toBe(0);
    jest.setSystemTime(new Date('2026-10-18T01:00:00Z'));
    stats = await repo.adminStats(30);
    expect(stats.retention.d7).toBe(0);
  });
});
