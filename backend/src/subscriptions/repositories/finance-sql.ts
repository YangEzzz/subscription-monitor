// Old production instances may confirm a refund before this receipt collector is
// deployed. Preserve that amount as undated instead of showing a false zero.
// This is a read model only; it never fabricates a platform confirmation date.
export const REFUND_RECEIPTS_SQL = `
SELECT id,order_id,amount,confirmed_at FROM payment_refund_receipts
UNION ALL
SELECT 'unrecorded:'||o.id AS id,o.id AS order_id,
 (o.amount-COALESCE(r.amount,0))::int AS amount,NULL::timestamptz AS confirmed_at
FROM membership_orders o
LEFT JOIN (SELECT order_id,SUM(amount) amount FROM payment_refund_receipts GROUP BY order_id) r ON r.order_id=o.id
WHERE o.status='refunded' AND o.amount>COALESCE(r.amount,0)`;
