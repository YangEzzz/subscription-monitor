import {REFUND_RECEIPTS_SQL} from './finance-sql';
export type StatsDay = {
  date: string;
  newUsers: number;
  activeUsers: number | null;
  newSubscriptions: number;
  paidUsers: number;
  paidOrders: number;
  paidAmountCny: number;
  refundAmountCny: number;
  netAmountCny: number;
  refundOrders: number;
};
export type RetentionDay = {
  date: string;
  users: number;
  d1: number | null;
  d7: number | null;
  d30: number | null;
};
export type AdminStats = {
  rangeDays: number;
  excludeTest: boolean;
  undatedRefunds: { count: number; amountCny: number };
  timezone: 'Asia/Shanghai';
  from: string;
  to: string;
  generatedAt: string;
  trackingSince: string | null;
  summary: {
    newUsers: number;
    activeUsers: number | null;
    newSubscriptions: number;
    paidUsers: number;
    paidOrders: number;
    paidAmountCny: number;
    refundAmountCny: number;
    netAmountCny: number;
    refundOrders: number;
    convertedUsers: number;
    conversionRate: number | null;
  };
  activity: { dau: number | null; wau: number | null; mau: number | null };
  retention: { d1: number | null; d7: number | null; d30: number | null };
  cohorts: RetentionDay[];
  days: StatsDay[];
};
export function shanghaiDay(value: Date | string): string {
  return new Date(new Date(value).getTime() + 28800000)
    .toISOString()
    .slice(0, 10);
}
export function statsDays(length: number, now = new Date()): StatsDay[] {
  const end = Date.parse(shanghaiDay(now) + 'T00:00:00Z');
  return Array.from({ length }, (_, i) => ({
    date: new Date(end - (length - i - 1) * 86400000)
      .toISOString()
      .slice(0, 10),
    newUsers: 0,
    activeUsers: null,
    newSubscriptions: 0,
    paidUsers: 0,
    paidOrders: 0,
    paidAmountCny: 0,
    refundAmountCny: 0,
    netAmountCny: 0,
    refundOrders: 0,
  }));
}
export function finishStats(
  input: Omit<
    AdminStats,
    'rangeDays' | 'timezone' | 'from' | 'to' | 'generatedAt' | 'retention'
  >,
  now = new Date(),
): AdminStats {
  const retention = {
    d1: null,
    d7: null,
    d30: null,
  } as AdminStats['retention'];
  for (const key of ['d1', 'd7', 'd30'] as const) {
    const known = input.cohorts.filter((c) => c[key] !== null);
    const base = known.reduce((s, c) => s + c.users, 0);
    retention[key] = base
      ? known.reduce((s, c) => s + (c[key] || 0), 0) / base
      : null;
  }
  return {
    ...input,
    rangeDays: input.days.length,
    timezone: 'Asia/Shanghai',
    from: input.days[0].date,
    to: input.days[input.days.length - 1].date,
    generatedAt: now.toISOString(),
    retention,
  };
}
// All time bounds use Shanghai calendar days. Parameters remain bound, never interpolated.
export const ADMIN_STATS_SQL = `
WITH bounds AS (SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date today),
dates AS (SELECT generate_series(today-($1::int-1),today,'1 day'::interval)::date AS day FROM bounds),
coverage AS (SELECT MIN(first_seen_at) first FROM user_daily_activity),
eligible_users AS (SELECT * FROM app_users WHERE NOT $2::boolean OR NOT is_test),
eligible_activity AS (SELECT a.* FROM user_daily_activity a JOIN eligible_users u ON u.id=a.user_id),
refund_rows AS (SELECT r.* FROM (${REFUND_RECEIPTS_SQL}) r JOIN membership_orders o ON o.id=r.order_id JOIN eligible_users u ON u.id=o.user_id WHERE o.channel IN ('wechat','virtual') AND o.currency='CNY'),
refund_counts AS (SELECT (confirmed_at AT TIME ZONE 'Asia/Shanghai')::date AS day,COUNT(*)::int n,SUM(amount)::bigint cents FROM refund_rows WHERE confirmed_at >= ((SELECT MIN(day) FROM dates)::timestamp AT TIME ZONE 'Asia/Shanghai') AND confirmed_at < (((SELECT MAX(day) FROM dates)+1)::timestamp AT TIME ZONE 'Asia/Shanghai') GROUP BY 1),
regs AS (SELECT id, (created_at AT TIME ZONE 'Asia/Shanghai')::date AS day FROM eligible_users
 WHERE created_at >= ((SELECT MIN(day) FROM dates)::timestamp AT TIME ZONE 'Asia/Shanghai') AND created_at < (((SELECT MAX(day) FROM dates)+1)::timestamp AT TIME ZONE 'Asia/Shanghai')),
pay AS (SELECT user_id,(paid_at AT TIME ZONE 'Asia/Shanghai')::date AS day,amount FROM membership_orders
 WHERE user_id IN (SELECT id FROM eligible_users) AND status IN ('paid','refunded') AND channel IN ('wechat','virtual') AND currency='CNY'
 AND paid_at >= ((SELECT MIN(day) FROM dates)::timestamp AT TIME ZONE 'Asia/Shanghai') AND paid_at < (((SELECT MAX(day) FROM dates)+1)::timestamp AT TIME ZONE 'Asia/Shanghai')),
reg_counts AS (SELECT day,COUNT(*)::int n FROM regs GROUP BY day),
sub_counts AS (SELECT (created_at AT TIME ZONE 'Asia/Shanghai')::date AS day,COUNT(*)::int n FROM subscriptions
 WHERE user_id IN (SELECT id FROM eligible_users) AND NOT is_demo AND created_at >= ((SELECT MIN(day) FROM dates)::timestamp AT TIME ZONE 'Asia/Shanghai') AND created_at < (((SELECT MAX(day) FROM dates)+1)::timestamp AT TIME ZONE 'Asia/Shanghai') GROUP BY 1),
active_counts AS (SELECT activity_date AS day,COUNT(*)::int n FROM eligible_activity WHERE activity_date BETWEEN (SELECT MIN(day) FROM dates) AND (SELECT MAX(day) FROM dates) GROUP BY 1),
pay_counts AS (SELECT day,COUNT(*)::int n,COUNT(DISTINCT user_id)::int users,SUM(amount)::bigint cents FROM pay GROUP BY day),
daily AS (SELECT to_char(d.day,'YYYY-MM-DD') date,COALESCE(r.n,0)::int "newUsers",
 CASE WHEN c.first IS NULL OR d.day < (c.first AT TIME ZONE 'Asia/Shanghai')::date THEN NULL ELSE COALESCE(a.n,0)::int END "activeUsers",
 COALESCE(s.n,0)::int "newSubscriptions",COALESCE(p.users,0)::int "paidUsers",COALESCE(p.n,0)::int "paidOrders",COALESCE(p.cents,0)::double precision/100 "paidAmountCny",
 COALESCE(f.cents,0)::double precision/100 "refundAmountCny",(COALESCE(p.cents,0)-COALESCE(f.cents,0))::double precision/100 "netAmountCny",COALESCE(f.n,0)::int "refundOrders"
 FROM dates d LEFT JOIN reg_counts r ON r.day=d.day LEFT JOIN sub_counts s ON s.day=d.day LEFT JOIN active_counts a ON a.day=d.day LEFT JOIN pay_counts p ON p.day=d.day LEFT JOIN refund_counts f ON f.day=d.day CROSS JOIN coverage c ORDER BY d.day),
cohorts AS (SELECT to_char(r.day,'YYYY-MM-DD') date,COUNT(*)::int users,
 CASE WHEN r.day+1 < b.today AND r.day+1 > (c.first AT TIME ZONE 'Asia/Shanghai')::date THEN COUNT(a1.user_id)::int ELSE NULL END d1,
 CASE WHEN r.day+7 < b.today AND r.day+7 > (c.first AT TIME ZONE 'Asia/Shanghai')::date THEN COUNT(a7.user_id)::int ELSE NULL END d7,
 CASE WHEN r.day+30 < b.today AND r.day+30 > (c.first AT TIME ZONE 'Asia/Shanghai')::date THEN COUNT(a30.user_id)::int ELSE NULL END d30
 FROM regs r CROSS JOIN bounds b CROSS JOIN coverage c
 LEFT JOIN eligible_activity a1 ON a1.user_id=r.id AND a1.activity_date=r.day+1
 LEFT JOIN eligible_activity a7 ON a7.user_id=r.id AND a7.activity_date=r.day+7
 LEFT JOIN eligible_activity a30 ON a30.user_id=r.id AND a30.activity_date=r.day+30
 GROUP BY r.day,b.today,c.first ORDER BY r.day DESC)
SELECT c.first AS "trackingSince",
 json_build_object('count',(SELECT COUNT(*)::int FROM refund_rows WHERE confirmed_at IS NULL),'amountCny',(SELECT COALESCE(SUM(amount),0)::double precision/100 FROM refund_rows WHERE confirmed_at IS NULL)) AS "undatedRefunds",
 (SELECT json_agg(daily) FROM daily) days,COALESCE((SELECT json_agg(cohorts) FROM cohorts),'[]'::json) cohorts,
 json_build_object('newUsers',(SELECT COUNT(*)::int FROM regs),'activeUsers',CASE WHEN c.first IS NULL THEN NULL ELSE (SELECT COUNT(DISTINCT user_id)::int FROM eligible_activity WHERE activity_date BETWEEN (SELECT MIN(day) FROM dates) AND b.today) END,
 'newSubscriptions',(SELECT SUM("newSubscriptions")::int FROM daily),'paidUsers',(SELECT COUNT(DISTINCT user_id)::int FROM pay),'paidOrders',(SELECT COUNT(*)::int FROM pay),'paidAmountCny',(SELECT COALESCE(SUM(amount),0)::double precision/100 FROM pay),
 'refundAmountCny',(SELECT SUM(ROUND("refundAmountCny"*100))::double precision/100 FROM daily),'netAmountCny',(SELECT SUM(ROUND("netAmountCny"*100))::double precision/100 FROM daily),'refundOrders',(SELECT SUM("refundOrders")::int FROM daily),
 'convertedUsers',(SELECT COUNT(*)::int FROM regs r WHERE EXISTS(SELECT 1 FROM pay p WHERE p.user_id=r.id)),
 'conversionRate',(SELECT COUNT(*) FILTER(WHERE EXISTS(SELECT 1 FROM pay p WHERE p.user_id=r.id))::double precision/NULLIF(COUNT(*),0) FROM regs r)) summary,
 json_build_object('dau',CASE WHEN c.first IS NULL THEN NULL ELSE (SELECT COUNT(*)::int FROM eligible_activity WHERE activity_date=b.today) END,
 'wau',CASE WHEN c.first IS NULL THEN NULL ELSE (SELECT COUNT(DISTINCT user_id)::int FROM eligible_activity WHERE activity_date BETWEEN b.today-6 AND b.today) END,
 'mau',CASE WHEN c.first IS NULL THEN NULL ELSE (SELECT COUNT(DISTINCT user_id)::int FROM eligible_activity WHERE activity_date BETWEEN b.today-29 AND b.today) END) activity
 FROM coverage c CROSS JOIN bounds b`;
