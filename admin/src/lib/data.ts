export type Section =
  | 'subscriptions'
  | 'users'
  | 'memberships'
  | 'membershipOrders'
  | 'notifications';
export type View = 'overview' | Section | 'connection';
export type Row = Record<string, unknown>;
export interface AdminPage {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Overview {
  users: number;
  subscriptions: number;
  notifications: number;
  failedNotifications: number;
  persistence: string;
  notificationsConfigured: boolean;
  schedulerEnabled: boolean;
}
export interface Column {
  key: string;
  label: string;
}

export const sections: Record<
  Section,
  { label: string; description: string; placeholder: string; columns: Column[] }
> = {
  subscriptions: {
    label: '订阅记录',
    description: '查看所有账号的订阅与下次扣费日期，包含已删除记录。',
    placeholder: '搜索订阅名称、用户 ID 或记录 ID',
    columns: [
      { key: 'name', label: '订阅名称' },
      { key: 'userId', label: '所属用户' },
      { key: 'amount', label: '订阅金额' },
      { key: 'nextBillingDate', label: '下次扣费' },
      { key: 'status', label: '订阅状态' },
      { key: 'deletedAt', label: '删除时间' },
    ],
  },
  users: {
    label: '用户列表',
    description:
      '查看已注册账号、订阅数量、最近访问 IP 与时间；未记录的历史数据显示为“—”。',
    placeholder: '搜索用户 ID',
    columns: [
      { key: 'id', label: '用户 ID' },
      { key: 'subscriptions', label: '未删除订阅' },
      { key: 'plan', label: '账号方案' },
      { key: 'notificationEnabled', label: '通知开关' },
      { key: 'lastAccessIp', label: '最近访问 IP' },
      { key: 'lastAccessAt', label: '最近访问时间' },
      { key: 'createdAt', label: '注册时间' },
    ],
  },
  memberships: {
    label: '会员权益',
    description: '查看账号方案、权益来源与开通时间。',
    placeholder: '搜索用户 ID',
    columns: [
      { key: 'userId', label: '用户 ID' },
      { key: 'plan', label: '账号方案' },
      { key: 'status', label: '权益状态' },
      { key: 'source', label: '权益来源' },
      { key: 'startedAt', label: '开通时间' },
    ],
  },
  membershipOrders: {
    label: '会员订单',
    description: '查看会员购买记录；模拟支付不会产生真实扣款。',
    placeholder: '搜索商品、用户 ID 或订单号',
    columns: [
      { key: 'productName', label: '商品名称' },
      { key: 'userId', label: '所属用户' },
      { key: 'amount', label: '订单金额' },
      { key: 'channel', label: '支付方式' },
      { key: 'status', label: '订单状态' },
      { key: 'createdAt', label: '创建时间' },
    ],
  },
  notifications: {
    label: '通知记录',
    description: '查看微信通知发送结果、重试次数与错误码。',
    placeholder: '搜索订阅名称、用户 ID 或错误码',
    columns: [
      { key: 'subscriptionName', label: '订阅名称' },
      { key: 'userId', label: '所属用户' },
      { key: 'billingDate', label: '通知账期' },
      { key: 'status', label: '发送状态' },
      { key: 'attempts', label: '尝试次数' },
      { key: 'errorCode', label: '错误码' },
      { key: 'createdAt', label: '创建时间' },
    ],
  },
};
const labels: Record<string, string> = {
  active: '正常',
  trial: '试用',
  pending: '待确认',
  paused: '已暂停',
  cancelled: '已取消',
  archived: '已归档',
  free: '免费用户',
  member: '会员',
  sent: '已发送',
  sending: '发送中',
  failed: '发送失败',
  unknown: '待核实',
  skipped: '已跳过',
  simulation: '模拟支付',
  wechat: '微信支付',
  virtual: '虚拟支付',
  legacy: '历史权益',
  refunded: '已撤销测试权益',
};
export function tone(
  value: unknown,
): 'neutral' | 'success' | 'warning' | 'danger' {
  if (['failed', 'unknown'].includes(String(value))) return 'danger';
  if (
    ['active', 'sent', 'paid', 'member', true].includes(
      value as string | boolean,
    )
  )
    return 'success';
  if (['pending', 'trial', 'sending'].includes(String(value))) return 'warning';
  return 'neutral';
}
export function format(
  key: string,
  value: unknown,
  row: Row = {},
  section?: Section,
): string {
  if (value === undefined || value === null || value === '') return '—';
  if (key === 'amount') {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    const currency = String(row.currency || 'CNY');
    try {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }
  if (key === 'notificationEnabled') return value ? '已开启' : '已关闭';
  if (
    [
      'createdAt',
      'paidAt',
      'startedAt',
      'updatedAt',
      'deletedAt',
      'lastAccessAt',
    ].includes(key)
  ) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date);
  }
  if (key === 'status' && value === 'paid')
    return row.channel === 'simulation' ? '模拟成功' : '已支付';
  if (key === 'status' && value === 'active' && section === 'memberships')
    return '已开通';
  if (['status', 'plan', 'source', 'channel'].includes(key))
    return labels[String(value)] || String(value);
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
}
export function detailColumns(section: Section): Column[] {
  const extra: Column[] = [
    { key: 'id', label: section === 'membershipOrders' ? '订单号' : '记录 ID' },
    { key: 'currency', label: '币种' },
    { key: 'paidAt', label: '完成时间' },
    { key: 'createdAt', label: '创建时间' },
  ];
  return [
    ...sections[section].columns,
    ...extra.filter(
      (column) =>
        !sections[section].columns.some(
          (existing) => existing.key === column.key,
        ),
    ),
  ];
}
export function defaultAddress(): string {
  return new URL(import.meta.env.VITE_ADMIN_API_BASE || './api/', location.href)
    .href;
}
export async function getJson<T>(
  base: string,
  path: string,
  signal: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      error instanceof Error && error.name === 'TimeoutError'
        ? '读取超时，请重新读取。'
        : '无法连接后台，请检查地址、后端运行状态和跨域配置。',
    );
  }
  if (response.status === 403)
    throw new Error('当前访问被拒绝，请检查管理后台的访问权限和接口代理配置。');
  if (!response.ok)
    throw new Error(
      `后台查询失败（${response.status}），请稍后重试或检查后端日志。`,
    );
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('后台返回了无效响应，请检查管理接口地址。');
  }
}
