import { ConfigService } from '@nestjs/config';
import { MembershipPaymentsService } from './membership-payments.service';
import { MemorySubscriptionsRepository } from './repositories/memory-subscriptions.repository';

describe('simulated membership purchases', () => {
  let repository: MemorySubscriptionsRepository;
  let config: ConfigService;
  let service: MembershipPaymentsService;
  const requestId = 'purchase_request_123456789';
  beforeEach(() => {
    repository = new MemorySubscriptionsRepository();
    config = new ConfigService({ app: { membershipSimulationEnabled: true } });
    service = new MembershipPaymentsService(config, repository);
  });
  it('creates a server-priced order, reuses concurrent attempts and grants once', async () => {
    const [first, second] = await Promise.all([
      service.create('alice', { productId: 'lifetime', requestId }),
      service.create('alice', {
        productId: 'lifetime',
        requestId: 'another_request_123456789',
      }),
    ]);
    expect(second.id).toBe(first.id);
    expect(first.amount).toBe(2990);
    expect(first.channel).toBe('simulation');
    const results = await Promise.all([
      service.simulate('alice', first.id, { outcome: 'success' }),
      service.simulate('alice', first.id, { outcome: 'success' }),
    ]);
    expect(results[0].paidAt).toBe(results[1].paidAt);
    expect(await repository.findMembership('alice')).toMatchObject({
      status: 'active',
      source: 'simulation',
      startedAt: results[0].paidAt,
    });
    expect((await service.list('alice')).items).toHaveLength(1);
    expect(
      (await service.create('alice', { productId: 'lifetime', requestId })).id,
    ).toBe(first.id);
    await expect(
      service.create('alice', {
        productId: 'lifetime',
        requestId: 'new_request_123456789',
      }),
    ).rejects.toThrow('无需重复购买');
  });
  it.each(['cancel', 'failure'] as const)(
    'does not grant on %s and permits a new order',
    async (outcome) => {
      const order = await service.create('alice', {
        productId: 'lifetime',
        requestId,
      });
      await service.simulate('alice', order.id, { outcome });
      expect(await repository.findMembership('alice')).toBeNull();
      await expect(
        service.simulate('alice', order.id, { outcome: 'success' }),
      ).rejects.toThrow('订单已结束');
      const next = await service.create('alice', {
        productId: 'lifetime',
        requestId: requestId + '_retry',
      });
      expect(next.id).not.toBe(order.id);
    },
  );
  it('never reads or pays another account order', async () => {
    const order = await service.create('alice', {
      productId: 'lifetime',
      requestId,
    });
    expect((await service.list('bob')).items).toEqual([]);
    await expect(service.detail('bob', order.id)).rejects.toThrow('没有找到');
    await expect(
      service.simulate('bob', order.id, { outcome: 'success' }),
    ).rejects.toThrow('没有找到');
    await expect(service.simulateRefund('bob', order.id)).rejects.toThrow(
      '没有找到',
    );
  });
  it('refunds a simulated grant idempotently without revoking a later purchase', async () => {
    const order = await service.create('alice', {
      productId: 'lifetime',
      requestId,
    });
    await expect(service.simulateRefund('alice', order.id)).rejects.toThrow(
      '只有已完成',
    );
    await service.simulate('alice', order.id, { outcome: 'success' });
    const refunded = await service.simulateRefund('alice', order.id);
    expect(refunded.status).toBe('refunded');
    expect((await repository.findMembership('alice'))?.status).toBe('free');
    const next = await service.create('alice', {
      productId: 'lifetime',
      requestId: requestId + '_next',
    });
    await service.simulate('alice', next.id, { outcome: 'success' });
    await service.simulateRefund('alice', order.id);
    expect((await repository.findMembership('alice'))?.sourceOrderId).toBe(
      next.id,
    );
    expect((await repository.findMembership('alice'))?.status).toBe('active');
  });
  it('disables all simulated writes when the switch is off, keeping history readable', async () => {
    const order = await service.create('alice', {
      productId: 'lifetime',
      requestId,
    });
    config.set('app.membershipSimulationEnabled', false);
    await expect(
      service.simulate('alice', order.id, { outcome: 'success' }),
    ).rejects.toThrow('暂未开放');
    await expect(
      service.create('alice', { productId: 'lifetime', requestId }),
    ).rejects.toThrow('暂未开放');
    expect((await service.detail('alice', order.id)).status).toBe('pending');
    expect(
      new MembershipPaymentsService(new ConfigService(), repository).product()
        .available,
    ).toBe(false);
  });
  it('rolls back the entitlement if saving the paid order fails', async () => {
    const order = await service.create('alice', {
      productId: 'lifetime',
      requestId,
    });
    const original = repository.saveMembershipOrder.bind(repository);
    jest
      .spyOn(repository, 'saveMembershipOrder')
      .mockImplementation(async (value) => {
        if (value.status === 'paid') throw new Error('database unavailable');
        await original(value);
      });
    await expect(
      service.simulate('alice', order.id, { outcome: 'success' }),
    ).rejects.toThrow('database unavailable');
    expect(await repository.findMembership('alice')).toBeNull();
    expect((await service.detail('alice', order.id)).status).toBe('pending');
  });
});
