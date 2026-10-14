import { ConfigService } from '@nestjs/config';
import { MembershipPaymentsService } from './membership-payments.service';
import { MemorySubscriptionsRepository } from './repositories/memory-subscriptions.repository';
import { WechatPayService, WechatTransaction } from './wechat-pay.service';

describe('ordinary WeChat membership payment', () => {
  let repository: MemorySubscriptionsRepository;
  let service: MembershipPaymentsService;
  let gateway: {
    settings: { enabled: boolean; mchId: string };
    assertEnabled: jest.Mock;
    query: jest.Mock;
    prepay: jest.Mock;
    close: jest.Mock;
    notification: jest.Mock;
  };
  let config: ConfigService;
  const input = { productId: 'lifetime', requestId: 'real_purchase_123456789' };
  beforeEach(async () => {
    repository = new MemorySubscriptionsRepository();
    await repository.saveWechatIdentity({
      userId: 'alice',
      appId: 'wx-app',
      openId: 'alice-openid',
    });
    config = new ConfigService({
      app: {
        wechatAppId: 'wx-app',
        membershipSimulationEnabled: true,
        wechatPay: { enabled: true },
      },
    });
    gateway = {
      settings: { enabled: true, mchId: '123' },
      assertEnabled: jest.fn(),
      query: jest.fn().mockResolvedValue(null),
      prepay: jest.fn().mockResolvedValue({ package: 'prepay_id=test' }),
      close: jest.fn(),
      notification: jest.fn(),
    };
    service = new MembershipPaymentsService(
      config,
      repository,
      gateway as unknown as WechatPayService,
    );
  });
  const transaction = (id: string): WechatTransaction => ({
    appid: 'wx-app',
    mchid: '123',
    out_trade_no: id,
    transaction_id: '420000000001',
    trade_state: 'SUCCESS',
    success_time: new Date().toISOString(),
    payer: { openid: 'alice-openid' },
    amount: { total: 2990, currency: 'CNY' },
  });

  it('uses fixed server pricing and a gateway-compatible order number, reuses pending orders', async () => {
    const orders = await Promise.all([
      service.create('alice', input),
      service.create('alice', { ...input, requestId: 'another_request_12345' }),
    ]);
    expect(orders[0]).toMatchObject({
      amount: 2990,
      channel: 'wechat',
      status: 'pending',
    });
    expect(orders[0].id).toMatch(/^[a-zA-Z0-9]{32}$/);
    expect(orders[1].id).toBe(orders[0].id);
    await service.payment('alice', orders[0].id);
    expect(gateway.prepay).toHaveBeenCalledWith(orders[0], 'alice-openid');
    expect(await repository.findMembership('alice')).toBeNull();
    await expect(service.payment('bob', orders[0].id)).rejects.toThrow(
      '没有找到',
    );
  });

  it('confirms payment and entitlement once, including concurrent duplicate notifications', async () => {
    const order = await service.create('alice', input);
    const tx = transaction(order.id);
    const results = await Promise.all([
      service.confirmWechatPayment(tx),
      service.confirmWechatPayment(tx),
    ]);
    expect(results[0].paidAt).toBe(results[1].paidAt);
    expect(await repository.findMembership('alice')).toMatchObject({
      status: 'active',
      source: 'wechat',
      sourceOrderId: order.id,
    });
    gateway.query.mockResolvedValue(tx);
    const payment = await service.payment('alice', order.id);
    expect(payment.payment).toBeNull();
    expect(gateway.prepay).not.toHaveBeenCalled();
    await expect(
      service.create('alice', { ...input, requestId: 'new_request_123456' }),
    ).rejects.toThrow('无需重复购买');
  });

  it.each([
    'amount',
    'payer',
    'appid',
    'mchid',
    'state',
    'transaction',
    'time',
  ])('rejects mismatched %s without granting', async (field) => {
    const order = await service.create('alice', input);
    const tx = transaction(order.id);
    if (field === 'amount') tx.amount.total = 1;
    if (field === 'payer') tx.payer.openid = 'bob-openid';
    if (field === 'appid') tx.appid = 'other-app';
    if (field === 'mchid') tx.mchid = 'other-merchant';
    if (field === 'state') tx.trade_state = 'NOTPAY';
    if (field === 'transaction') tx.transaction_id = '';
    if (field === 'time') tx.success_time = 'invalid';
    await expect(service.confirmWechatPayment(tx)).rejects.toThrow('不匹配');
    expect(
      (await repository.findMembershipOrder('alice', order.id))?.status,
    ).toBe('pending');
    expect(await repository.findMembership('alice')).toBeNull();
  });

  it('reconciles missed notifications through order query and list refresh', async () => {
    const order = await service.create('alice', input);
    gateway.query.mockResolvedValue(transaction(order.id));
    expect((await service.list('alice')).items[0].status).toBe('paid');
    expect(await repository.findMembership('alice')).toMatchObject({
      source: 'wechat',
      status: 'active',
    });
  });

  it('does not close or replace a transaction with an uncertain gateway result', async () => {
    const order = await service.create('alice', input);
    order.createdAt = new Date(Date.now() - 3 * 3600000).toISOString();
    await repository.saveMembershipOrder(order);
    gateway.query.mockRejectedValue(new Error('unavailable'));
    await expect(service.payment('alice', order.id)).rejects.toThrow(
      'unavailable',
    );
    expect(gateway.close).not.toHaveBeenCalled();
    expect(
      (await repository.findMembershipOrder('alice', order.id))?.status,
    ).toBe('pending');
  });

  it('closes an expired unpaid order before permitting a new purchase', async () => {
    const order = await service.create('alice', input);
    order.createdAt = new Date(Date.now() - 3 * 3600000).toISOString();
    await repository.saveMembershipOrder(order);
    gateway.query.mockResolvedValue({
      ...transaction(order.id),
      trade_state: 'NOTPAY',
    });
    expect((await service.payment('alice', order.id)).order.status).toBe(
      'cancelled',
    );
    expect(gateway.close).toHaveBeenCalledWith(order.id);
    const replacement = await service.create('alice', {
      ...input,
      requestId: 'new_request_123456',
    });
    expect(replacement.id).not.toBe(order.id);
  });

  it('disables simulation writes while real payments are enabled', async () => {
    const order = await service.create('alice', input);
    await expect(
      service.simulate('alice', order.id, { outcome: 'success' }),
    ).rejects.toThrow('模拟支付暂未开放');
    await expect(service.simulateRefund('alice', order.id)).rejects.toThrow(
      '模拟支付暂未开放',
    );
  });

  it('does not allow requestId to reinterpret a legacy simulation order', async () => {
    config.set('app.wechatPay.enabled', false);
    const simulated = await service.create('alice', input);
    config.set('app.wechatPay.enabled', true);
    await expect(service.create('alice', input)).rejects.toThrow(
      '支付方式已变更',
    );
    expect(
      (await repository.findMembershipOrder('alice', simulated.id))?.channel,
    ).toBe('simulation');
  });
});
