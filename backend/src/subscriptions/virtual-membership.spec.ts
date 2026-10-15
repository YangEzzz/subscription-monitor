import { ConfigService } from '@nestjs/config';
import { MembershipPaymentsService } from './membership-payments.service';
import { MemorySubscriptionsRepository } from './repositories/memory-subscriptions.repository';
import { VirtualPayService, VirtualTransaction } from './virtual-pay.service';

describe('virtual membership delivery', () => {
  let repo: MemorySubscriptionsRepository;
  let service: MembershipPaymentsService;
  let gateway: any;
  const input = {
    productId: 'lifetime',
    requestId: 'purchase_request_123456789',
  };
  const tx = (orderId: string): VirtualTransaction => ({
    orderId,
    wxOrderId: 'wx-order-123',
    openId: 'alice-openid',
    amount: 990,
    env: 0,
    paidAt: new Date().toISOString(),
    productId: 'lifetime_member',
    quantity: 1,
  });
  beforeEach(async () => {
    repo = new MemorySubscriptionsRepository();
    await repo.saveWechatIdentity({
      userId: 'alice',
      appId: 'wx-app',
      openId: 'alice-openid',
    });
    gateway = {
      settings: {
        enabled: true,
        productId: 'lifetime_member',
        iosEnabled: false,
      },
      assertEnabled: jest.fn(),
      payment: jest.fn().mockReturnValue({ mode: 'short_series_goods' }),
      query: jest.fn().mockResolvedValue(null),
      confirmDelivery: jest.fn().mockResolvedValue(undefined),
      notification: jest.fn(),
      reply: jest.fn().mockReturnValue({ ErrCode: 0 }),
    };
    service = new MembershipPaymentsService(
      new ConfigService({
        app: {
          wechatAppId: 'wx-app',
          virtualPay: gateway.settings,
          membershipSimulationEnabled: true,
        },
      }),
      repo,
      gateway as VirtualPayService,
    );
  });
  it('prices at 990, signs once, preserves pending and denies cross-account payments', async () => {
    const order = await service.create('alice', input);
    expect(order).toMatchObject({ amount: 990, channel: 'virtual' });
    expect(order.id).toMatch(/^[A-Za-z0-9]{32}$/);
    expect(service.product().iosEnabled).toBe(false);
    const results = await Promise.all([
      service.payment('alice', order.id),
      service.payment('alice', order.id),
    ]);
    expect(results.filter((r) => r.payment)).toHaveLength(1);
    expect(gateway.payment).toHaveBeenCalledTimes(1);
    expect(await repo.findMembership('alice')).toBeNull();
    await expect(service.payment('bob', order.id)).rejects.toThrow('没有找到');
    await expect(
      service.simulate('alice', order.id, { outcome: 'success' }),
    ).rejects.toThrow('模拟支付');
  });
  it('duplicate delivery is idempotent and rejects altered amount, user, product or platform order', async () => {
    const order = await service.create('alice', input);
    for (const alteration of [
      { amount: 2990 },
      { openId: 'bob' },
      { productId: 'other' },
      { env: 1 },
      { quantity: 2 },
    ])
      await expect(
        service.confirmVirtualPayment({ ...tx(order.id), ...alteration }),
      ).rejects.toThrow('信息不匹配');
    const results = await Promise.all([
      service.confirmVirtualPayment(tx(order.id)),
      service.confirmVirtualPayment(tx(order.id)),
    ]);
    expect(results[0].paidAt).toBe(results[1].paidAt);
    expect(await repo.findMembership('alice')).toMatchObject({
      source: 'virtual',
      sourceOrderId: order.id,
    });
    await expect(
      service.confirmVirtualPayment({
        ...tx(order.id),
        wxOrderId: 'different',
      }),
    ).rejects.toThrow('交易号');
  });
  it('fallback persists entitlement before delivery acknowledgment, retries a failed acknowledgment', async () => {
    const order = await service.create('alice', input);
    await service.payment('alice', order.id);
    gateway.query.mockResolvedValue({
      state: 'paid',
      transaction: tx(order.id),
      delivered: false,
    });
    gateway.confirmDelivery.mockRejectedValueOnce(new Error('offline'));
    await expect(service.detail('alice', order.id)).rejects.toThrow('offline');
    expect(await repo.findMembership('alice')).toMatchObject({
      status: 'active',
    });
    expect(await repo.listVirtualOrdersToReconcile()).toHaveLength(1);
    await service.reconcilePending();
    expect(await repo.listVirtualOrdersToReconcile()).toHaveLength(0);
    expect(gateway.confirmDelivery).toHaveBeenCalledTimes(2);
    const settled = await repo.findMembershipOrder('alice', order.id);
    expect(settled).toMatchObject({ status: 'paid' });
    expect(settled?.deliveryConfirmedAt).toBeTruthy();
    expect(await repo.listMembershipOrders('alice')).toHaveLength(1);
    expect(await service.list('alice')).toMatchObject({
      items: [{ id: order.id, status: 'paid' }],
    });
    expect(gateway.payment).toHaveBeenCalledTimes(1);
    expect(gateway.confirmDelivery).toHaveBeenCalledTimes(2);
  });
  it('full refund wins over delayed payment and never removes another entitlement source', async () => {
    const order = await service.create('alice', input);
    await service.refundVirtual(tx(order.id), 990);
    expect((await service.confirmVirtualPayment(tx(order.id))).status).toBe(
      'refunded',
    );
    expect(await repo.findMembership('alice')).toBeNull();
    await repo.saveMembership({
      userId: 'alice',
      status: 'active',
      plan: 'member',
      startedAt: new Date().toISOString(),
      source: 'virtual',
      sourceOrderId: 'another-order',
    });
    await service.refundVirtual(tx(order.id), 990);
    expect((await repo.findMembership('alice'))?.status).toBe('active');
  });
  it('full refund removes this grant; partial refund retains it', async () => {
    const order = await service.create('alice', input);
    await service.confirmVirtualPayment(tx(order.id));
    await service.refundVirtual(tx(order.id), 100);
    expect((await repo.findMembership('alice'))?.status).toBe('active');
    await service.refundVirtual(tx(order.id), 990);
    expect((await repo.findMembership('alice'))?.status).toBe('free');
  });
  it('accepts duplicate delivery pushes and validates full refund event fields', async () => {
    const order = await service.create('alice', input);
    gateway.notification.mockReturnValue({
      format: 'xml',
      event: {
        MsgType: 'event',
        Event: 'xpay_goods_deliver_notify',
        OpenId: 'alice-openid',
        OutTradeNo: order.id,
        Env: '0',
        GoodsInfo: {
          ProductId: 'lifetime_member',
          Quantity: '1',
          OrigPrice: '990',
        },
        WeChatPayInfo: {
          MchOrderNo: 'wx-order-123',
          PaidTime: String(Math.floor(Date.now() / 1000)),
        },
      },
    });
    await service.notify({ nonce: 'n' }, 'encrypted');
    await service.notify({ nonce: 'n' }, 'encrypted');
    expect(
      (await repo.findMembershipOrder('alice', order.id))?.deliveryConfirmedAt,
    ).toBeTruthy();
    gateway.notification.mockReturnValue({
      format: 'xml',
      event: {
        MsgType: 'event',
        Event: 'xpay_refund_notify',
        OpenId: 'alice-openid',
        MchOrderId: order.id,
        WxOrderId: 'wx-order-123',
        RefundFee: '990',
        RetCode: '0',
      },
    });
    await service.notify({ nonce: 'n' }, 'encrypted');
    expect((await repo.findMembership('alice'))?.status).toBe('free');
  });
});
