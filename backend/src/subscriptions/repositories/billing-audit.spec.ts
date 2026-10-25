import { billingIssues } from './billing-audit';
import { MembershipOrder } from '../domain/membership-order';
import { Membership } from '../domain/subscription';
import { MemorySubscriptionsRepository } from './memory-subscriptions.repository';

const now = Date.parse('2026-10-24T12:00:00Z');
const order = (
  id: string,
  extra: Partial<MembershipOrder> = {},
): MembershipOrder => ({
  id,
  userId: id,
  requestId: id,
  productId: 'lifetime_member',
  productName: '永久会员',
  amount: 990,
  currency: 'CNY',
  channel: 'virtual',
  status: 'paid',
  transactionId: 'tx-' + id,
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:00:00Z',
  paidAt: '2026-10-24T10:00:00Z',
  deliveryConfirmedAt: '2026-10-24T10:00:01Z',
  ...extra,
});
const member = (
  userId: string,
  extra: Partial<Membership> = {},
): Membership => ({
  userId,
  status: 'active',
  plan: 'member',
  source: 'virtual',
  sourceOrderId: userId,
  startedAt: '2026-10-24T10:00:00Z',
  ...extra,
});

describe('payment and membership review', () => {
  it('flags missing rights, missing evidence, unconfirmed delivery, stale payment attempts and orphan rights without flagging normal or simulated purchases', () => {
    const orders = [
      order('normal'),
      order('rights-missing'),
      order('metadata', { transactionId: null }),
      order('delivery', { deliveryConfirmedAt: null }),
      order('stale', {
        status: 'pending',
        paidAt: null,
        paymentRequestedAt: '2026-10-24T11:40:00Z',
      }),
      order('new', {
        status: 'pending',
        paidAt: null,
        paymentRequestedAt: '2026-10-24T11:59:00Z',
      }),
      order('never-started', { status: 'pending', paidAt: null }),
      order('simulation', { channel: 'simulation' }),
      order('refunded', { status: 'refunded' }),
    ];
    const members = [
      member('normal'),
      member('metadata'),
      member('delivery'),
      member('orphan'),
      member('legacy', { source: 'legacy', sourceOrderId: null }),
      member('simulation', { source: 'simulation' }),
    ];
    const rows = billingIssues(orders, members, now);
    expect(rows.map((x) => x.issue).sort()).toEqual(
      [
        'delivery_unconfirmed',
        'membership_without_payment',
        'payment_metadata_missing',
        'payment_unconfirmed',
        'rights_missing',
      ].sort(),
    );
    expect(rows.find((x) => x.id === 'rights-missing')?.amount).toBe(9.9);
  });
  it('retains gross real CNY payments and records refunds separately, excluding simulation and unpaid', async () => {
    const repo = new MemorySubscriptionsRepository();
    for (const row of [
      order('one'),
      order('two'),
      order('simulation', { channel: 'simulation', amount: 99900 }),
      order('refund', { status: 'refunded' }),
      order('pending', { status: 'pending' }),
      order('usd', { currency: 'USD', amount: 1000 }),
    ])
      await repo.saveMembershipOrder(row);
    await repo.saveMembership(member('real-member', { source: 'legacy' }));
    await repo.saveMembership(member('test-member', { source: 'simulation' }));
    const counts = await repo.adminOverview();
    expect(counts.activeMembers).toBe(1);
    expect(counts.paidAmountCny).toBe(29.7);
    expect(counts.refundAmountCny).toBe(9.9);
    expect(counts.netAmountCny).toBe(19.8);
  });
});
