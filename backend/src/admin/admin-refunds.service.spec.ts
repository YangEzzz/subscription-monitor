import { ConfigService } from '@nestjs/config';
import { AdminRefundsService } from './admin-refunds.service';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';
import { MembershipPaymentsService } from '../subscriptions/membership-payments.service';
import { VirtualPayService } from '../subscriptions/virtual-pay.service';
import { MembershipOrder } from '../subscriptions/domain/membership-order';
describe('administrator full refunds', () => {
  let repo: MemorySubscriptionsRepository,
    service: AdminRefundsService,
    gateway: any,
    order: MembershipOrder;
  const prior = process.env.ADMIN_REFUNDS_ENABLED;
  const input = () => ({
    reason: '用户主动申请退款',
    reasonCode: '3',
    amount: 990,
    confirmOrderId: order.id,
  });
  beforeEach(async () => {
    process.env.ADMIN_REFUNDS_ENABLED = 'true';
    repo = new MemorySubscriptionsRepository([]);
    await repo.saveWechatIdentity({
      userId: 'alice',
      appId: 'app',
      openId: 'private',
    });
    const now = new Date().toISOString();
    order = {
      id: 'mo-test',
      userId: 'alice',
      requestId: 'request',
      productId: 'lifetime',
      productName: '永久会员',
      amount: 990,
      currency: 'CNY',
      channel: 'virtual',
      status: 'paid',
      paidAt: now,
      createdAt: now,
      updatedAt: now,
      transactionId: 'tx-test',
    };
    await repo.saveMembershipOrder(order);
    await repo.saveMembership({
      userId: 'alice',
      plan: 'member',
      status: 'active',
      source: 'virtual',
      sourceOrderId: order.id,
      startedAt: now,
    });
    gateway = {
      settings: { enabled: true },
      query: jest.fn().mockResolvedValue({
        state: 'paid',
        leftFee: 990,
        orderType: 0,
        transaction: {
          orderId: order.id,
          wxOrderId: order.transactionId,
          amount: 990,
          openId: 'private',
          paidAt: now,
        },
      }),
      refund: jest.fn().mockResolvedValue(undefined),
      queryRefund: jest.fn().mockResolvedValue({ status: 5, amount: 990 }),
    };
    const config = new ConfigService({ app: { wechatAppId: 'app' } });
    service = new AdminRefundsService(
      repo,
      gateway as VirtualPayService,
      new MembershipPaymentsService(config, repo, gateway),
      config,
    );
  });
  afterAll(() => {
    if (prior === undefined) delete process.env.ADMIN_REFUNDS_ENABLED;
    else process.env.ADMIN_REFUNDS_ENABLED = prior;
  });
  it('deduplicates concurrent and repeat submissions, records the operator before the upstream request', async () => {
    gateway.refund.mockImplementation(async () => {
      const row = await repo.findMembershipRefund(order.id);
      expect(row).toMatchObject({
        operator: 'admin',
        status: 'submitting',
        amount: 990,
      });
    });
    const rows = await Promise.all([
      service.submit(order.id, input(), 'admin'),
      service.submit(order.id, input(), 'admin'),
    ]);
    expect(rows[0].refundId).toBe(rows[1].refundId);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    await service.submit(order.id, input(), 'admin');
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect((await repo.findMembership('alice'))?.status).toBe('active');
  });
  it('keeps timeout uncertain and recovers through the original refund ID after restart', async () => {
    gateway.refund.mockRejectedValue(new Error('timeout'));
    const record = await service.submit(order.id, input(), 'admin');
    expect(record.status).toBe('unknown');
    gateway.queryRefund.mockResolvedValue({ status: 8, amount: 990 });
    await service.reconcile();
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(gateway.queryRefund).toHaveBeenCalledWith(
      record.refundId,
      'private',
    );
    expect((await repo.findMembershipOrderById(order.id))?.status).toBe(
      'refunded',
    );
    expect((await repo.findMembership('alice'))?.status).toBe('free');
    expect((await repo.findMembershipRefund(order.id))?.status).toBe(
      'succeeded',
    );
  });
  it('does not mistake merchant deduction or rejection for a completed user refund', async () => {
    await service.submit(order.id, input(), 'admin');
    expect((await service.check(order.id)).status).toBe('processing');
    expect((await repo.findMembership('alice'))?.status).toBe('active');
    gateway.queryRefund.mockResolvedValue({ status: 7, amount: 990 });
    expect((await service.check(order.id)).status).toBe('failed');
    expect((await repo.findMembershipOrderById(order.id))?.status).toBe('paid');
  });
  it('preserves callback completion that arrives before the submission response', async () => {
    gateway.refund.mockImplementation(async () => {
      const payments = new MembershipPaymentsService(
        new ConfigService({ app: { wechatAppId: 'app' } }),
        repo,
        gateway,
      );
      await payments.refundVirtual(
        {
          orderId: order.id,
          wxOrderId: order.transactionId!,
          openId: 'private',
        },
        990,
      );
    });
    const row = await service.submit(order.id, input(), 'admin');
    expect(row.status).toBe('succeeded');
    expect((await repo.findMembership('alice'))?.status).toBe('free');
  });
  it('rejects unverified types, iOS, partial balance, stale payments, tampering and development writes', async () => {
    for (const extra of [
      { orderType: 7 },
      { orderType: undefined },
      { leftFee: 100 },
      {
        transaction: {
          orderId: order.id,
          wxOrderId: 'wrong',
          amount: 990,
          openId: 'private',
          paidAt: order.paidAt,
        },
      },
    ]) {
      const base = gateway.query.getMockImplementation()!();
      gateway.query.mockResolvedValueOnce({ ...(await base), ...extra });
      expect((await service.inspect(order.id)).eligible).toBe(false);
    }
    await expect(
      service.submit(order.id, { ...input(), amount: 1 }, 'admin'),
    ).rejects.toThrow('金额');
    await expect(
      service.submit(
        order.id,
        { ...input(), confirmOrderId: 'wrong' },
        'admin',
      ),
    ).rejects.toThrow('核对');
    await expect(
      service.submit(order.id, { ...input(), reasonCode: '9' }, 'admin'),
    ).rejects.toThrow();
    process.env.ADMIN_REFUNDS_ENABLED = 'false';
    await expect(service.submit(order.id, input(), 'admin')).rejects.toThrow(
      '未开放',
    );
    expect(gateway.refund).not.toHaveBeenCalled();
  });
  it('preserves newer/other entitlement and receives verified callback completion idempotently', async () => {
    await service.submit(order.id, input(), 'admin');
    await repo.saveMembership({
      userId: 'alice',
      plan: 'member',
      status: 'active',
      source: 'legacy',
      sourceOrderId: null,
      startedAt: order.paidAt,
    });
    gateway.queryRefund.mockResolvedValue({ status: 8, amount: 990 });
    await service.check(order.id);
    await service.check(order.id);
    expect((await repo.findMembership('alice'))?.status).toBe('active');
    expect(
      (await repo.findMembershipRefund(order.id))?.completedAt,
    ).toBeTruthy();
  });
});
