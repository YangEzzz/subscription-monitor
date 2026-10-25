import {REFUND_RECEIPTS_SQL} from './finance-sql';
import { AdminPage } from './admin-read';
export type StatsMetric =
  | 'newUsers'
  | 'activeUsers'
  | 'newSubscriptions'
  | 'paidUsers'
  | 'paidOrders'
  | 'paidAmountCny'
  | 'refundAmountCny'
  | 'netAmountCny'
  | 'refundOrders';
export const STATS_METRICS: StatsMetric[] = [
  'newUsers',
  'activeUsers',
  'newSubscriptions',
  'paidUsers',
  'paidOrders',
  'paidAmountCny',
  'refundAmountCny',
  'netAmountCny',
  'refundOrders',
];
export type StatsDetailQuery = {
  metric: StatsMetric;
  from: string;
  to: string;
  excludeTest: boolean;
  includeUndated?: boolean;
  page: number;
  search: string;
};
export type StatsDetailPage = AdminPage & {
  columns: { key: string; label: string }[];
  totalAmountCny?: number;
};
export type RefundReceipt = {
  id: string;
  orderId: string;
  amount: number;
  confirmedAt: string | null;
  observedAt: string;
  source: string;
  timeSource: 'platform' | 'unknown';
};
export function validStatsDates(from: string, to: string): boolean {
  const date = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  return (
    date(from) &&
    date(to) &&
    from <= to &&
    (Date.parse(to) - Date.parse(from)) / 86400000 < 36525
  );
}
export const DETAIL_COLUMNS = {
  users: [
    { key: 'id', label: '用户 ID' },
    { key: 'isTest', label: '账号类型' },
    { key: 'createdAt', label: '注册时间' },
  ],
  active: [
    { key: 'id', label: '用户 ID' },
    { key: 'isTest', label: '账号类型' },
    { key: 'activeDays', label: '期间活跃天数' },
    { key: 'lastSeenAt', label: '期间最近访问' },
  ],
  subscriptions: [
    { key: 'id', label: '订阅 ID' },
    { key: 'userId', label: '用户 ID' },
    { key: 'name', label: '订阅名称' },
    { key: 'createdAt', label: '创建时间' },
    { key: 'deletedAt', label: '删除时间' },
  ],
  payments: [
    { key: 'id', label: '订单号' },
    { key: 'userId', label: '用户 ID' },
    { key: 'amount', label: '支付金额（元）' },
    { key: 'paidAt', label: '支付时间' },
    { key: 'status', label: '当前状态' },
  ],
  refunds: [
    { key: 'id', label: '退款凭据' },
    { key: 'orderId', label: '原订单号' },
    { key: 'userId', label: '用户 ID' },
    { key: 'amount', label: '退款金额（元）' },
    { key: 'confirmedAt', label: '平台退款时间' },
  ],
  net: [
    { key: 'id', label: '记录编号' },
    { key: 'userId', label: '用户 ID' },
    { key: 'kind', label: '收支类型' },
    { key: 'amount', label: '金额（元）' },
    { key: 'occurredAt', label: '发生时间' },
  ],
  payers: [
    { key: 'id', label: '用户 ID' },
    { key: 'isTest', label: '账号类型' },
    { key: 'orders', label: '支付笔数' },
    { key: 'amount', label: '支付金额（元）' },
  ],
};
// Produces only allowlisted static SQL. All dates, searches and pages are bound parameters.
export function detailSql(metric: StatsMetric): {
  sql: string;
  columns: { key: string; label: string }[];
  hasAmount: boolean;
} {
  const audience = '(NOT $3::boolean OR NOT u.is_test)';
  const between = (field: string) =>
    `${field} >= ($1::date::timestamp AT TIME ZONE 'Asia/Shanghai') AND ${field} < (($2::date+1)::timestamp AT TIME ZONE 'Asia/Shanghai')`;
  const payments = `SELECT o.id,o.user_id AS "userId",o.amount::double precision/100 amount,o.paid_at AS "paidAt",o.status FROM membership_orders o JOIN app_users u ON u.id=o.user_id WHERE ${audience} AND o.channel IN ('virtual','wechat') AND o.currency='CNY' AND o.status IN ('paid','refunded') AND ${between('o.paid_at')}`;
  const refunds = `SELECT r.id,r.order_id AS "orderId",o.user_id AS "userId",r.amount::double precision/100 amount,r.confirmed_at AS "confirmedAt" FROM (${REFUND_RECEIPTS_SQL}) r JOIN membership_orders o ON o.id=r.order_id JOIN app_users u ON u.id=o.user_id WHERE ${audience} AND o.channel IN ('virtual','wechat') AND o.currency='CNY' AND (${between('r.confirmed_at')} OR ($6::boolean AND r.confirmed_at IS NULL))`;
  if (metric === 'newUsers')
    return {
      sql: `SELECT u.id,u.is_test AS "isTest",u.created_at AS "createdAt" FROM app_users u WHERE ${audience} AND ${between('u.created_at')}`,
      columns: DETAIL_COLUMNS.users,
      hasAmount: false,
    };
  if (metric === 'activeUsers')
    return {
      sql: `SELECT u.id,u.is_test AS "isTest",COUNT(*)::int AS "activeDays",MAX(a.last_seen_at) AS "lastSeenAt" FROM user_daily_activity a JOIN app_users u ON u.id=a.user_id WHERE ${audience} AND a.activity_date BETWEEN $1::date AND $2::date GROUP BY u.id,u.is_test`,
      columns: DETAIL_COLUMNS.active,
      hasAmount: false,
    };
  if (metric === 'newSubscriptions')
    return {
      sql: `SELECT s.id,s.user_id AS "userId",s.name,s.created_at AS "createdAt",s.deleted_at AS "deletedAt" FROM subscriptions s JOIN app_users u ON u.id=s.user_id WHERE ${audience} AND NOT s.is_demo AND ${between('s.created_at')}`,
      columns: DETAIL_COLUMNS.subscriptions,
      hasAmount: false,
    };
  if (metric === 'paidUsers')
    return {
      sql: `SELECT p."userId" id,u.is_test AS "isTest",COUNT(*)::int orders,SUM(p.amount)::double precision amount FROM (${payments}) p JOIN app_users u ON u.id=p."userId" GROUP BY p."userId",u.is_test`,
      columns: DETAIL_COLUMNS.payers,
      hasAmount: true,
    };
  if (metric === 'refundAmountCny' || metric === 'refundOrders')
    return { sql: refunds, columns: DETAIL_COLUMNS.refunds, hasAmount: true };
  if (metric === 'netAmountCny')
    return {
      sql: `SELECT id,"userId",'支付'::text kind,amount,"paidAt" AS "occurredAt" FROM (${payments}) p UNION ALL SELECT id,"userId",'退款'::text kind,-amount,"confirmedAt" AS "occurredAt" FROM (${refunds}) r`,
      columns: DETAIL_COLUMNS.net,
      hasAmount: true,
    };
  return { sql: payments, columns: DETAIL_COLUMNS.payments, hasAmount: true };
}
