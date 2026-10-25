export type Section =
  | 'billingIssues'
  | 'authEvents'
  | 'subscriptions'
  | 'users'
  | 'memberships'
  | 'membershipOrders'
  | 'notifications';
export type View = 'overview' | 'analytics' | Section;
export type Row = Record<string, unknown>;
export interface AdminPage {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Overview {
  today?: import('./stats').StatsDay;
  activeMembers: number;
  paidAmountCny: number;
  refundAmountCny: number;
  netAmountCny: number;
  paymentIssues: number;
  snapshotAt: string;
  users: number;
  subscriptions: number;
  notifications: number;
  failedNotifications: number;
}
export interface Column {
  key: string;
  label: string;
}

export const sections: Record<
  Section,
  { label: string; description: string; placeholder: string; columns: Column[] }
> = {
  billingIssues: {
    label: '支付与权益核对',
    description:
      '核对真实支付、会员权益和发货确认；仅提示异常，不自动补单或改权益。',
    placeholder: '搜索用户 ID、订单号或商品',
    columns: [
      { key: 'issue', label: '待核对问题' },
      { key: 'userId', label: '所属用户' },
      { key: 'productName', label: '商品 / 权益' },
      { key: 'amount', label: '订单金额' },
      { key: 'channel', label: '支付方式' },
      { key: 'createdAt', label: '创建时间' },
    ],
  },
  authEvents: {
    label: '操作日志',
    description:
      '查看注册与登录记录，按发生时间倒序；首次登录并创建账号记为注册。',
    placeholder: '搜索用户 ID',
    columns: [
      { key: 'createdAt', label: '发生时间' },
      { key: 'action', label: '操作' },
      { key: 'userId', label: '用户 ID' },
      { key: 'clientIp', label: '客户端 IP' },
      { key: 'peerIp', label: '直连 IP' },
    ],
  },
  subscriptions: {
    label: '订阅记录',
    description: '仅查看当前用户的订阅与下次扣费日期，包含已删除记录。',
    placeholder: '搜索订阅名称或记录 ID',
    columns: [
      { key: 'name', label: '订阅名称' },
      { key: 'amount', label: '订阅金额' },
      { key: 'nextBillingDate', label: '下次扣费' },
      { key: 'status', label: '订阅状态' },
      { key: 'deletedAt', label: '删除时间' },
    ],
  },
  users: {
    label: '用户列表',
    description: '查看账号、订阅与最近访问记录。点击订阅数量查看该用户的订阅。',
    placeholder: '搜索用户 ID',
    columns: [
      { key: 'id', label: '用户 ID' },
      { key: 'isTest', label: '账号类型' },
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
      { key: 'refundStatus', label: '退款进度' },
      { key: 'createdAt', label: '创建时间' },
    ],
  },
  notifications: {
    label: '通知记录',
    description: '查看微信接口调用结果。已受理不代表用户送达或已读。',
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
  rights_missing: '已支付，权益未开通',
  payment_metadata_missing: '支付凭据不完整',
  delivery_unconfirmed: '发货尚未确认',
  payment_unconfirmed: '支付结果待确认',
  membership_without_payment: '权益缺少有效支付订单',
  register: '注册',
  login: '登录',
  active: '正常',
  trial: '试用',
  pending: '待确认',
  paused: '已暂停',
  cancelled: '已取消',
  archived: '已归档',
  free: '免费用户',
  member: '会员',
  sent: '微信已受理',
  sending: '发送中',
  failed: '发送失败',
  unknown: '待核实',
  skipped: '已跳过',
  simulation: '模拟支付',
  wechat: '微信支付',
  virtual: '虚拟支付',
  legacy: '历史权益',
  refunded: '已退款',
};
export function displayId(value: unknown): string {
  const id = String(value ?? '');
  return id.length > 30 ? `${id.slice(0, 14)}…${id.slice(-8)}` : id;
}
export function tone(
  value: unknown,
): 'neutral' | 'success' | 'warning' | 'danger' {
  if (
    [
      'failed',
      'unknown',
      'rights_missing',
      'payment_metadata_missing',
      'membership_without_payment',
    ].includes(String(value))
  )
    return 'danger';
  if (
    ['active', 'sent', 'paid', 'member', true].includes(
      value as string | boolean,
    )
  )
    return 'success';
  if (
    [
      'pending',
      'trial',
      'sending',
      'delivery_unconfirmed',
      'payment_unconfirmed',
    ].includes(String(value))
  )
    return 'warning';
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
  if (key === 'isTest') return value ? '测试账号' : '普通账号';
  if (key === 'memberStatus')
    return value === 'active'
      ? '已开通'
      : value === 'free'
        ? '未开通'
        : String(value);
  if (key === 'notificationEnabled') return value ? '已开启' : '已关闭';
  if (
    [
      'createdAt',
      'paidAt',
      'startedAt',
      'updatedAt',
      'deletedAt',
      'lastAccessAt',
      'paymentRequestedAt',
      'deliveryConfirmedAt',
      'confirmedAt',
      'occurredAt',
      'lastSeenAt',
      'testUpdatedAt',
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
          ...(section === 'authEvents' ? { second: '2-digit' as const } : {}),
          hour12: false,
        }).format(date);
  }
  if (key === 'refundStatus')
    return (
      (
        {
          submitting: '正在提交',
          processing: '退款处理中',
          unknown: '退款待核实',
          succeeded: '退款完成',
          failed: '退款失败',
        } as Record<string, string>
      )[String(value)] || String(value)
    );
  if (key === 'status' && value === 'refunded')
    return row.channel === 'simulation' ? '已撤销测试权益' : '已退款';
  if (key === 'status' && value === 'failed' && section === 'membershipOrders')
    return '支付失败';
  if (key === 'status' && value === 'paid')
    return row.channel === 'simulation' ? '模拟成功' : '已支付';
  if (key === 'status' && value === 'active' && section === 'memberships')
    return '已开通';
  if (
    [
      'issue',
      'action',
      'status',
      'memberStatus',
      'plan',
      'source',
      'channel',
    ].includes(key)
  )
    return labels[String(value)] || String(value);
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
}
export function detailColumns(section: Section): Column[] {
  if (section === 'authEvents')
    return [
      ...sections.authEvents.columns,
      { key: 'appId', label: '小程序 AppID' },
      { key: 'requestId', label: '请求编号' },
      { key: 'id', label: '日志 ID' },
    ];
  const extra: Column[] = [
    { key: 'status', label: '订单状态' },
    { key: 'transactionId', label: '平台交易号' },
    { key: 'paymentRequestedAt', label: '发起支付时间' },
    { key: 'deliveryConfirmedAt', label: '发货确认时间' },
    { key: 'memberStatus', label: '当前会员状态' },
    { key: 'sourceOrderId', label: '权益来源订单' },
    { key: 'id', label: section === 'membershipOrders' ? '订单号' : '记录 ID' },
    ...(section === 'subscriptions'
      ? [{ key: 'userId', label: '所属用户' }]
      : []),
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
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
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
  if (response.status === 401 && path !== 'login')
    throw new AdminUnauthorizedError('登录已失效，请重新登录。');
  if (response.status === 429)
    throw new Error('尝试次数过多，请15分钟后重试。');
  if (options.method === 'POST' && !response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(
      typeof detail.message === 'string'
        ? detail.message
        : '操作失败，请稍后重试。',
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

export class AdminUnauthorizedError extends Error {}
export function adminPost<T>(
  base: string,
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<T> {
  return getJson<T>(base, path, signal, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
