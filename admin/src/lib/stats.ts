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
export type Cohort = {
  date: string;
  users: number;
  d1: number | null;
  d7: number | null;
  d30: number | null;
};
export type Stats = {
  rangeDays: number;
  excludeTest: boolean;
  undatedRefunds: { count: number; amountCny: number };
  timezone: string;
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
  days: StatsDay[];
  cohorts: Cohort[];
};
export const metrics = [
  { key: 'newUsers', label: '新增账号', unit: '人' },
  { key: 'activeUsers', label: '活跃用户', unit: '人' },
  { key: 'newSubscriptions', label: '新增订阅', unit: '条' },
  { key: 'paidUsers', label: '付费用户', unit: '人' },
  { key: 'paidOrders', label: '支付订单', unit: '笔' },
  { key: 'paidAmountCny', label: '支付金额', unit: '元' },
  { key: 'refundAmountCny', label: '退款金额', unit: '元' },
  { key: 'netAmountCny', label: '收支净额', unit: '元' },
  { key: 'refundOrders', label: '退款笔数', unit: '笔' },
] as const;
export type Metric = (typeof metrics)[number]['key'];
export const numberText = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
export const percentText = (v: number | null) =>
  v === null ? '—' : (v * 100).toFixed(1) + '%';
export function validStats(value: Stats, range: number): boolean {
  const numeric = (n: unknown, nullable = false) =>
    (nullable && n === null) ||
    (typeof n === 'number' && Number.isFinite(n) && n >= 0);
  return (
    !!value &&
    value.rangeDays === range &&
    value.timezone === 'Asia/Shanghai' &&
    typeof value.excludeTest === 'boolean' &&
    Array.isArray(value.days) &&
    value.days.length === range &&
    value.days.every(
      (d) =>
        /^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
        metrics.every((m) =>
          m.key === 'netAmountCny'
            ? typeof d[m.key] === 'number' && Number.isFinite(d[m.key])
            : numeric(d[m.key], m.key === 'activeUsers'),
        ),
    ) &&
    !!value.summary &&
    [
      'newUsers',
      'newSubscriptions',
      'paidUsers',
      'paidOrders',
      'paidAmountCny',
      'refundAmountCny',
      'refundOrders',
      'convertedUsers',
    ].every((k) => numeric(value.summary[k as keyof Stats['summary']])) &&
    typeof value.summary.netAmountCny === 'number' &&
    Number.isFinite(value.summary.netAmountCny) &&
    !!value.undatedRefunds &&
    numeric(value.undatedRefunds.count) &&
    numeric(value.undatedRefunds.amountCny) &&
    numeric(value.summary.activeUsers, true) &&
    numeric(value.summary.conversionRate, true) &&
    !!value.activity &&
    ['dau', 'wau', 'mau'].every((k) =>
      numeric(value.activity[k as keyof Stats['activity']], true),
    ) &&
    !!value.retention &&
    ['d1', 'd7', 'd30'].every((k) =>
      numeric(value.retention[k as keyof Stats['retention']], true),
    ) &&
    Array.isArray(value.cohorts) &&
    value.cohorts.every(
      (c) =>
        typeof c.date === 'string' &&
        numeric(c.users) &&
        [c.d1, c.d7, c.d30].every((n) => numeric(n, true)),
    )
  );
}

export type StatsSelection = {
  metric: Metric;
  from: string;
  to: string;
  excludeTest: boolean;
  includeUndated?: boolean;
};
export function statsDetailTitle(metric: Metric) {
  return metrics.find((m) => m.key === metric)?.label || '统计明细';
}
