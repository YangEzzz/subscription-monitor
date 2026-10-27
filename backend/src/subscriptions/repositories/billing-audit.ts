import { MembershipOrder } from '../domain/membership-order';
import { Membership } from '../domain/subscription';

export const PAYMENT_PENDING_MS = 15 * 60 * 1000;

// Each row is one object requiring review, never an instruction to grant/refund automatically.
export function billingIssues(
  orders: MembershipOrder[],
  members: Membership[],
  now = Date.now(),
) {
  const byUser = new Map(members.map((x) => [x.userId, x]));
  const rows: Record<string, unknown>[] = [];
  for (const order of orders) {
    if (!['virtual', 'wechat'].includes(order.channel)) continue;
    const member = byUser.get(order.userId);
    const issue =
      order.status === 'paid' &&
      (member?.status !== 'active' || member.plan !== 'member') &&
      !(member?.source === 'admin_revoked' && member.sourceOrderId === order.id)
        ? 'rights_missing'
        : order.status === 'paid' && (!order.transactionId || !order.paidAt)
          ? 'payment_metadata_missing'
          : order.status === 'paid' &&
              order.channel === 'virtual' &&
              !order.deliveryConfirmedAt
            ? 'delivery_unconfirmed'
            : order.status === 'pending' &&
                order.paymentRequestedAt &&
                Date.parse(order.paymentRequestedAt) <= now - PAYMENT_PENDING_MS
              ? 'payment_unconfirmed'
              : null;
    if (issue)
      rows.push({
        id: order.id,
        userId: order.userId,
        issue,
        productName: order.productName,
        amount: order.amount / 100,
        currency: order.currency,
        channel: order.channel,
        status: order.status,
        paidAt: order.paidAt,
        paymentRequestedAt: order.paymentRequestedAt ?? null,
        deliveryConfirmedAt: order.deliveryConfirmedAt ?? null,
        transactionId: order.transactionId ?? null,
        memberStatus: member?.status ?? 'free',
        createdAt: order.createdAt,
      });
  }
  for (const member of members) {
    if (
      member.status !== 'active' ||
      member.plan !== 'member' ||
      !['virtual', 'wechat'].includes(member.source || '')
    )
      continue;
    if (
      !orders.some(
        (x) =>
          x.id === member.sourceOrderId &&
          x.userId === member.userId &&
          x.status === 'paid' &&
          ['virtual', 'wechat'].includes(x.channel),
      )
    ) {
      rows.push({
        id: `membership:${member.userId}`,
        userId: member.userId,
        issue: 'membership_without_payment',
        productName: '会员权益',
        amount: null,
        currency: 'CNY',
        channel: member.source,
        status: 'active',
        memberStatus: member.status,
        sourceOrderId: member.sourceOrderId ?? null,
        createdAt: member.startedAt,
      });
    }
  }
  return rows.sort(
    (a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')) ||
      String(a.id).localeCompare(String(b.id)),
  );
}

// Static SQL only. Search values and paging are bound separately, never interpolated.
export const BILLING_AUDIT_SQL = `
WITH order_checks AS (
 SELECT o.id, o.user_id AS "userId", o.product_name AS "productName", o.amount::double precision / 100 AS amount,
 o.currency, o.channel, o.status, o.paid_at AS "paidAt", o.payment_requested_at AS "paymentRequestedAt",
 o.delivery_confirmed_at AS "deliveryConfirmedAt", o.transaction_id AS "transactionId",
 COALESCE(m.status::text, 'free') AS "memberStatus", m.source_order_id AS "sourceOrderId", o.created_at AS "createdAt",
 CASE WHEN o.status='paid' AND (m.status IS DISTINCT FROM 'active' OR m.plan IS DISTINCT FROM 'member') AND NOT (m.source IS NOT DISTINCT FROM 'admin_revoked' AND m.source_order_id IS NOT DISTINCT FROM o.id) THEN 'rights_missing'
 WHEN o.status='paid' AND (o.transaction_id IS NULL OR o.paid_at IS NULL) THEN 'payment_metadata_missing'
 WHEN o.status='paid' AND o.channel='virtual' AND o.delivery_confirmed_at IS NULL THEN 'delivery_unconfirmed'
 WHEN o.status='pending' AND o.payment_requested_at <= NOW() - INTERVAL '15 minutes' THEN 'payment_unconfirmed'
 ELSE NULL END AS issue
 FROM membership_orders o LEFT JOIN memberships m ON m.user_id=o.user_id
 WHERE o.channel IN ('virtual','wechat')
), membership_checks AS (
 SELECT 'membership:' || m.user_id AS id, m.user_id AS "userId", '会员权益' AS "productName", NULL::double precision AS amount,
 'CNY' AS currency, m.source AS channel, 'active' AS status, NULL::timestamptz AS "paidAt", NULL::timestamptz AS "paymentRequestedAt",
 NULL::timestamptz AS "deliveryConfirmedAt", NULL::varchar AS "transactionId", m.status::text AS "memberStatus",
 m.source_order_id AS "sourceOrderId", m.started_at AS "createdAt", 'membership_without_payment' AS issue
 FROM memberships m WHERE m.status='active' AND m.plan='member' AND m.source IN ('virtual','wechat')
 AND NOT EXISTS(SELECT 1 FROM membership_orders o WHERE o.id=m.source_order_id AND o.user_id=m.user_id AND o.status='paid' AND o.channel IN ('virtual','wechat'))
)
SELECT * FROM order_checks WHERE issue IS NOT NULL UNION ALL SELECT * FROM membership_checks`;
