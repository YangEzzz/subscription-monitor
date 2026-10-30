import { AdminMembershipsService } from './admin-memberships.service';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('Admin membership grants', () => {
  let repo: MemorySubscriptionsRepository;
  let service: AdminMembershipsService;
  beforeEach(async () => {
    repo = new MemorySubscriptionsRepository();
    void repo.saveRuntimePolicy({
      membershipEnabled: true,
      freeSubscriptionLimit: 10,
      updatedAt: null,
      updatedBy: null,
    });
    service = new AdminMembershipsService(repo);
    await repo.saveWechatIdentity({
      userId: 'wx-grant',
      appId: 'test',
      openId: 'grant',
    });
  });
  it('grants permanent rights and audit without a payment or income; duplicates are safe', async () => {
    await Promise.all([
      service.grant('wx-grant', { note: '活动奖励' }, 'administrator'),
      service.grant('wx-grant', { note: '重复提交' }, 'other'),
    ]);
    const result = await service.inspect('wx-grant');
    expect(result.membership).toMatchObject({
      status: 'active',
      plan: 'member',
      source: 'admin',
      sourceOrderId: null,
    });
    expect(result.grant).toMatchObject({
      note: '活动奖励',
      operator: 'administrator',
    });
    expect(await repo.listMembershipOrders('wx-grant')).toEqual([]);
    const overview = await repo.adminOverview();
    expect(overview).toMatchObject({
      activeMembers: 1,
      paidAmountCny: 0,
      paymentIssues: 0,
    });
    const memberships = await new SubscriptionsService(repo).getMembership(
      'wx-grant',
    );
    expect(memberships.quota.limit).toBeNull();
    expect(memberships.benefits.unlimitedSubscriptions).toBe(true);
  });
  it('does not create unknown accounts and validates the reason', async () => {
    await expect(
      service.grant('missing', { note: '活动奖励' }, 'admin'),
    ).rejects.toThrow('没有找到此账号');
    expect(await repo.findMembership('missing')).toBeNull();
    for (const note of [null, '', 'a', ' '.repeat(3), 'a'.repeat(201)])
      await expect(
        service.grant('wx-grant', { note }, 'admin'),
      ).rejects.toThrow('赠送原因');
  });
  it('preserves paid rights and upgrades simulation without linking its order', async () => {
    const paid = {
      userId: 'wx-grant',
      status: 'active' as const,
      plan: 'member' as const,
      source: 'virtual' as const,
      sourceOrderId: 'paid-order',
      startedAt: '2026-10-01T00:00:00.000Z',
    };
    await repo.saveMembership(paid);
    await service.grant('wx-grant', { note: '活动奖励' }, 'admin');
    expect(await repo.findMembership('wx-grant')).toEqual(paid);
    expect(await repo.findAdminMembershipGrant('wx-grant')).toBeNull();
    await repo.saveMembership({ ...paid, source: 'simulation' });
    await service.grant('wx-grant', { note: '正式赠送' }, 'admin');
    expect(await repo.findMembership('wx-grant')).toMatchObject({
      source: 'admin',
      sourceOrderId: null,
    });
  });
  it('rolls back rights if writing the audit fails', async () => {
    jest
      .spyOn(repo, 'recordAdminMembershipGrant')
      .mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.grant('wx-grant', { note: '活动奖励' }, 'admin'),
    ).rejects.toThrow('audit unavailable');
    expect(await repo.findMembership('wx-grant')).toBeNull();
    expect(await repo.findAdminMembershipGrant('wx-grant')).toBeNull();
  });
  it('respects the environment write switch', async () => {
    const previous = process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED;
    try {
      process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED = 'false';
      expect((await service.inspect('wx-grant')).canGrant).toBe(false);
      await expect(
        service.grant('wx-grant', { note: '活动奖励' }, 'admin'),
      ).rejects.toThrow('未开放');
    } finally {
      if (previous === undefined)
        delete process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED;
      else process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED = previous;
    }
  });
  it('revokes paid rights without changing payment history; repeated cancellation is safe', async () => {
    const membership = {
      userId: 'wx-grant',
      status: 'active' as const,
      plan: 'member' as const,
      source: 'virtual' as const,
      sourceOrderId: 'paid-order',
      startedAt: '2026-10-01T00:00:00.000Z',
    };
    await repo.saveMembership(membership);
    const saveOrder = jest.spyOn(repo, 'saveMembershipOrder');
    const input = { note: '违规取消', expectedMembership: membership };
    await Promise.all([
      service.revoke('wx-grant', input, 'admin'),
      service.revoke('wx-grant', input, 'other'),
    ]);
    const state = await service.inspect('wx-grant');
    expect(state.membership).toMatchObject({
      status: 'free',
      plan: 'free',
      source: 'admin_revoked',
      sourceOrderId: 'paid-order',
    });
    expect(state.revocation).toMatchObject({
      action: 'revoke',
      operator: 'admin',
      note: '违规取消',
      previousMembership: membership,
    });
    expect(saveOrder).not.toHaveBeenCalled();
    const rights = await new SubscriptionsService(repo).getMembership(
      'wx-grant',
    );
    expect(rights.quota.limit).toBe(10);
    expect(rights.benefits.unlimitedSubscriptions).toBe(false);
  });
  it('rejects a stale cancellation after regrant and rolls back a failed audit', async () => {
    await service.grant('wx-grant', { note: '活动赠送' }, 'admin');
    const original = await repo.findMembership('wx-grant');
    await expect(
      service.revoke(
        'wx-grant',
        {
          note: '取消会员',
          expectedMembership: {
            ...original,
            startedAt: '2000-01-01T00:00:00Z',
          },
        },
        'admin',
      ),
    ).rejects.toThrow('会员状态已变化');
    jest
      .spyOn(repo, 'recordAdminMembershipGrant')
      .mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.revoke(
        'wx-grant',
        { note: '取消会员', expectedMembership: original },
        'admin',
      ),
    ).rejects.toThrow('audit unavailable');
    expect(await repo.findMembership('wx-grant')).toEqual(original);
    expect((await service.inspect('wx-grant')).revocation).toBeNull();
    await service.revoke(
      'wx-grant',
      { note: '取消会员', expectedMembership: original },
      'admin',
    );
    await service.grant('wx-grant', { note: '重新赠送' }, 'admin');
    // A different source/order also distinguishes a replacement entitlement.
    await repo.saveMembership({
      ...original!,
      source: 'virtual',
      sourceOrderId: 'new-order',
    });
    await expect(
      service.revoke(
        'wx-grant',
        { note: '旧页面重试', expectedMembership: original },
        'admin',
      ),
    ).rejects.toThrow('会员状态已变化');
  });
  it('validates cancellation reason, state snapshot, user and write permissions', async () => {
    await expect(
      service.revoke(
        'wx-grant',
        { note: 'a', expectedMembership: {} },
        'admin',
      ),
    ).rejects.toThrow('取消原因');
    await expect(
      service.revoke('wx-grant', { note: '取消会员' }, 'admin'),
    ).rejects.toThrow('刷新会员状态');
    await expect(
      service.revoke(
        'missing',
        { note: '取消会员', expectedMembership: {} },
        'admin',
      ),
    ).rejects.toThrow('没有找到此账号');
    const previous = process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED;
    try {
      process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED = 'false';
      expect((await service.inspect('wx-grant')).canRevoke).toBe(false);
      await expect(
        service.revoke(
          'wx-grant',
          { note: '取消会员', expectedMembership: {} },
          'admin',
        ),
      ).rejects.toThrow('未开放');
    } finally {
      if (previous === undefined)
        delete process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED;
      else process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED = previous;
    }
  });
  it('keeps subscriptions over the free limit, permits edits and blocks only further additions', async () => {
    await service.grant('wx-grant', { note: '活动赠送' }, 'admin');
    const subscriptions = new SubscriptionsService(repo);
    const input = {
      name: '保留订阅',
      category: 'other' as const,
      cycle: 'monthly' as const,
      amount: 10,
      nextBillingDate: '2027-01-01',
    };
    for (let i = 0; i < 11; i++) await subscriptions.create('wx-grant', input);
    const before = await repo.listSubscriptions('wx-grant');
    await service.revoke(
      'wx-grant',
      {
        note: '取消会员',
        expectedMembership: await repo.findMembership('wx-grant'),
      },
      'admin',
    );
    expect(await repo.listSubscriptions('wx-grant')).toEqual(before);
    expect((await subscriptions.getMembership('wx-grant')).quota).toMatchObject(
      { limit: 10, used: 11, remaining: 0 },
    );
    await expect(subscriptions.create('wx-grant', input)).rejects.toMatchObject(
      { response: { code: 'SUBSCRIPTION_LIMIT_REACHED' } },
    );
    await subscriptions.update('wx-grant', before[0].id, { name: '仍可编辑' });
    expect((await repo.findSubscription('wx-grant', before[0].id))?.name).toBe(
      '仍可编辑',
    );
  });
});
