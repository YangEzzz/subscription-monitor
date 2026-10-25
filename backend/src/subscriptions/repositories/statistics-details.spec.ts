import { ConfigService } from '@nestjs/config';
import { MemorySubscriptionsRepository } from './memory-subscriptions.repository';
import { MembershipPaymentsService } from '../membership-payments.service';
import { StatsDetailQuery, validStatsDates } from './statistics-details';
describe('accounting dates, test audience and drilldown', () => {
  let repo: MemorySubscriptionsRepository;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-20T01:00:00Z'));
    repo = new MemorySubscriptionsRepository([]);
  });
  afterEach(() => jest.useRealTimers());
  const identity = (id: string) => ({ userId: id, appId: 'app', openId: id });
  const query = (
    metric: StatsDetailQuery['metric'],
    overrides: Partial<StatsDetailQuery> = {},
  ): StatsDetailQuery => ({
    metric,
    from: '2026-10-20',
    to: '2026-10-25',
    excludeTest: true,
    page: 1,
    search: '',
    ...overrides,
  });
  it('retains payments on payment day, separately records partial refunds, and does not count duplicate confirmations', async () => {
    await repo.saveWechatIdentity(identity('real'));
    await repo.saveMembershipOrder({
      id: 'order',
      userId: 'real',
      requestId: 'request',
      productId: 'lifetime',
      productName: '会员',
      channel: 'virtual',
      amount: 990,
      currency: 'CNY',
      status: 'paid',
      transactionId: 'wx-order',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await repo.saveMembership({
      userId: 'real',
      status: 'active',
      plan: 'member',
      source: 'virtual',
      sourceOrderId: 'order',
      startedAt: new Date().toISOString(),
    });
    const service = new MembershipPaymentsService(
      new ConfigService({ app: { wechatAppId: 'app' } }),
      repo,
    );
    jest.setSystemTime(new Date('2026-10-23T01:00:00Z'));
    await service.refundVirtual(
      { orderId: 'order', wxOrderId: 'wx-order', openId: 'real' },
      100,
      {
        refundId: 'refund-one',
        confirmedAt: new Date().toISOString(),
        source: 'callback',
      },
    );
    expect((await repo.findMembership('real'))?.status).toBe('active');
    jest.setSystemTime(new Date('2026-10-25T01:00:00Z'));
    const confirmation = {
      refundId: 'refund-two',
      confirmedAt: new Date().toISOString(),
      source: 'callback',
    };
    await service.refundVirtual(
      { orderId: 'order', wxOrderId: 'wx-order', openId: 'real' },
      890,
      confirmation,
    );
    await service.refundVirtual(
      { orderId: 'order', wxOrderId: 'wx-order', openId: 'real' },
      890,
      confirmation,
    );
    const stats = await repo.adminStats(7);
    expect(stats.days.find((d) => d.date === '2026-10-20')?.paidAmountCny).toBe(
      9.9,
    );
    expect(
      stats.days.find((d) => d.date === '2026-10-23')?.refundAmountCny,
    ).toBe(1);
    expect(stats.days.find((d) => d.date === '2026-10-25')?.netAmountCny).toBe(
      -8.9,
    );
    expect(stats.summary).toMatchObject({
      paidAmountCny: 9.9,
      refundAmountCny: 9.9,
      netAmountCny: 0,
      refundOrders: 2,
    });
    expect((await repo.findMembership('real'))?.status).toBe('free');
    for (const metric of [
      'paidOrders',
      'paidAmountCny',
      'paidUsers',
      'refundOrders',
      'refundAmountCny',
      'netAmountCny',
    ] as const) {
      const detail = await repo.statsDetails(query(metric));
      expect(detail.totalAmountCny).toBe(metric === 'netAmountCny' ? 0 : 9.9);
    }
  });
  it('excludes marked accounts consistently and permits explicit inclusion without deleting them', async () => {
    for (const id of ['normal', 'test']) {
      await repo.saveWechatIdentity(identity(id));
      await repo.recordUserActivity(id, new Date());
    }
    await repo.setUserTestFlag('test', true, '开发测试使用', 'admin');
    expect((await repo.adminStats(7)).summary).toMatchObject({
      newUsers: 1,
      activeUsers: 1,
    });
    expect((await repo.adminStats(7, false)).summary).toMatchObject({
      newUsers: 2,
      activeUsers: 2,
    });
    for (const metric of ['newUsers', 'activeUsers'] as const) {
      expect((await repo.statsDetails(query(metric))).total).toBe(1);
      expect(
        (await repo.statsDetails(query(metric, { excludeTest: false }))).total,
      ).toBe(2);
    }
    expect((await repo.findUserTestFlag('test')).testUpdatedBy).toBe('admin');
    await repo.setUserTestFlag('test', false, '恢复真实使用', 'admin');
    expect((await repo.adminStats(7)).summary.newUsers).toBe(2);
  });
  it('paginates within the same date and audience scope and rejects impossible dates', async () => {
    for (let i = 0; i < 25; i++)
      await repo.saveWechatIdentity(
        identity('user-' + String(i).padStart(2, '0')),
      );
    expect((await repo.statsDetails(query('newUsers'))).items).toHaveLength(20);
    expect(
      (await repo.statsDetails(query('newUsers', { page: 2 }))).items,
    ).toHaveLength(5);
    expect(
      (await repo.statsDetails(query('newUsers', { search: 'user-24' }))).total,
    ).toBe(1);
    expect(
      (await repo.statsDetails(query('newUsers', { from: '2026-10-21' })))
        .total,
    ).toBe(0);
    expect(validStatsDates('2026-02-31', '2026-03-05')).toBe(false);
    expect(validStatsDates('2026-10-25', '2026-10-20')).toBe(false);
  });
  it('keeps missing refund dates separate and upgrades them only with a verified platform time', async () => {
    await repo.saveWechatIdentity(identity('a'));
    await repo.saveMembershipOrder({
      id: 'o',
      userId: 'a',
      requestId: 'r',
      productId: 'lifetime',
      productName: '会员',
      channel: 'virtual',
      amount: 990,
      currency: 'CNY',
      status: 'refunded',
      transactionId: 'wx-o',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const receipt = {
      id: 'refund:r',
      orderId: 'o',
      amount: 990,
      confirmedAt: null,
      observedAt: new Date().toISOString(),
      source: 'query',
      timeSource: 'unknown' as const,
    };
    await repo.recordRefundReceipt(receipt);
    expect((await repo.adminStats(7)).undatedRefunds).toEqual({
      count: 1,
      amountCny: 9.9,
    });
    expect((await repo.statsDetails(query('refundAmountCny'))).total).toBe(0);
    expect(
      (
        await repo.statsDetails(
          query('refundAmountCny', { includeUndated: true }),
        )
      ).total,
    ).toBe(1);
    await repo.recordRefundReceipt({
      ...receipt,
      confirmedAt: new Date().toISOString(),
      timeSource: 'platform',
    });
    expect((await repo.adminStats(7)).summary.refundAmountCny).toBe(9.9);
  });
});
