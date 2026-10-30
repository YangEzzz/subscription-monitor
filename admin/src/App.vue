<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Users,
  Crown,
  ReceiptText,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Moon,
  Sun,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Search,
  X,
  ShieldCheck,
  CircleAlert,
  CalendarDays,
  CircleHelp,
} from '@lucide/vue';
import { useAdminSession } from './lib/useAdminSession';
import AdminLogin from './components/AdminLogin.vue';
import StatsPage from './components/StatsPage.vue';
import StatsDetailDialog from './components/StatsDetailDialog.vue';
import UserTestFlag from './components/UserTestFlag.vue';
import RuntimePolicy from './components/RuntimePolicy.vue';
import UserMembership from './components/UserMembership.vue';
import type { StatsSelection, Metric } from './lib/stats';
import { useAdmin } from './lib/useAdmin';
import {
  sections,
  format,
  detailColumns,
  displayId,
  tone as toneForPlan,
  type View,
  type Row,
  type Overview,
} from './lib/data';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import Badge from './components/StatusBadge.vue';
import AppDialog from './components/AppDialog.vue';
import AsyncState from './components/AsyncState.vue';
import AdminTable from './components/AdminTable.vue';
import TodaySummary from './components/TodaySummary.vue';
import RefundPanel from './components/RefundPanel.vue';

const session = useAdminSession();
const {
  authenticated,
  configured,
  username: adminUsername,
  checking: sessionBusy,
  error: sessionError,
} = session;
const {
  view,
  rangeDays,
  excludeTest,
  userId,
  section,
  search,
  page,
  overview,
  records,
  overviewError,
  recordsError,
  overviewUpdated,
  recordsUpdated,
  busy,
  navigate,
  commitSearch,
  routeHref,
  load,
} = useAdmin(authenticated, session.expire);
const statsPage = ref<InstanceType<typeof StatsPage>>();
const statsBusy = ref(false);
const statsUpdated = ref('');
function refreshCurrent() {
  if (view.value === 'analytics') void statsPage.value?.refresh();
  else void load();
}
const navItems = [
  {
    view: 'overview' as View,
    label: '数据概览',
    icon: LayoutDashboard,
    group: '运行总览',
  },
  { view: 'analytics' as View, label: '数据统计', icon: ChartNoAxesCombined },
  {
    view: 'users' as View,
    label: '用户列表',
    icon: Users,
    group: '用户与访问',
  },
  { view: 'billingIssues' as View, label: '支付与权益核对', icon: CircleAlert },
  { view: 'authEvents' as View, label: '操作日志', icon: ReceiptText },
  {
    view: 'memberships' as View,
    label: '会员权益',
    icon: Crown,
    group: '会员与消息',
  },
  { view: 'membershipOrders' as View, label: '会员订单', icon: ReceiptText },
];
const title = computed(() =>
  view.value === 'notifications'
    ? userId.value
      ? '用户通知'
      : '通知排查'
    : view.value === 'subscriptions'
      ? '用户订阅'
      : navItems.find((item) => item.view === view.value)?.label || '数据概览',
);
const heading = ref<HTMLElement>();
const collapsed = ref(false);
const mobileNav = ref(false);
const dark = ref(document.documentElement.classList.contains('dark'));
const draft = ref(search.value);
const input = ref<InstanceType<typeof Input>>();
const composing = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
const selected = ref<Row>();
const detailOpen = ref(false);
const notice = ref('');
const statsSelection = ref<StatsSelection>();
const statsDetailOpen = ref(false);
function inspectStats(selection: StatsSelection) {
  statsSelection.value = selection;
  statsDetailOpen.value = true;
}
function inspectOverview(key: keyof Overview, destination: View) {
  const metric = (
    {
      users: 'newUsers',
      paidAmountCny: 'paidAmountCny',
      refundAmountCny: 'refundAmountCny',
      netAmountCny: 'netAmountCny',
    } as Record<string, Metric>
  )[key];
  if (metric)
    inspectStats({
      metric,
      from: '1970-01-01',
      to:
        overview.value?.today?.date ||
        new Date(Date.now() + 28800000).toISOString().slice(0, 10),
      excludeTest: excludeTest.value,
      includeUndated: metric === 'refundAmountCny' || metric === 'netAmountCny',
    });
  else go(destination);
}
watch([view, excludeTest, rangeDays, authenticated], () => {
  statsDetailOpen.value = false;
});
const lastUpdated = computed(() =>
  view.value === 'analytics'
    ? statsUpdated.value
    : view.value === 'overview'
      ? overviewUpdated.value
      : recordsUpdated.value,
);
const metrics: {
  key: keyof Overview;
  label: string;
  description: string;
  icon: typeof Users;
  destination: View;
}[] = [
  {
    key: 'users',
    label: '用户总数',
    description: '所有已注册账号',
    icon: Users,
    destination: 'users',
  },
  {
    key: 'activeMembers',
    label: '会员人数',
    description: '当前已开通 · 不含模拟权益',
    icon: Crown,
    destination: 'memberships',
  },
  {
    key: 'paidAmountCny',
    label: '支付金额',
    description: '按付款记录 · 包含后来退款的订单',
    icon: ReceiptText,
    destination: 'membershipOrders',
  },
  {
    key: 'refundAmountCny',
    label: '退款金额',
    description: '已确认退款 · 包含日期未知历史',
    icon: ReceiptText,
    destination: 'membershipOrders',
  },
  {
    key: 'netAmountCny',
    label: '收支净额',
    description: '支付减退款 · 不等于平台结算',
    icon: ReceiptText,
    destination: 'membershipOrders',
  },
  {
    key: 'paymentIssues',
    label: '支付待核对',
    description: '全量异常排查 · 包含测试账号',
    icon: CircleAlert,
    destination: 'billingIssues',
  },
];
const totalPages = computed(() =>
  Math.max(1, Math.ceil((records.value?.total || 0) / 20)),
);
const range = computed(() =>
  !records.value
    ? '每页 20 条'
    : records.value.total === 0
      ? '共 0 条记录'
      : `共 ${records.value.total.toLocaleString('zh-CN')} 条 · 第 ${(page.value - 1) * 20 + 1}–${Math.min(page.value * 20, records.value.total)} 条`,
);

function go(next: View, query?: string) {
  clearTimeout(timer);
  mobileNav.value = false;
  navigate(next, query);
  if (next === view.value) nextTick(() => heading.value?.focus());
}
function openDetail(row: Row) {
  selected.value = row;
  detailOpen.value = true;
}
async function refreshOrder() {
  await load();
  if (['membershipOrders', 'users'].includes(section.value) && selected.value) {
    const latest = records.value?.items.find(
      (row) => row.id === selected.value?.id,
    );
    if (latest) selected.value = latest;
  }
}
function runSearch() {
  if (composing.value) return;
  clearTimeout(timer);
  commitSearch(draft.value);
}
function scheduleSearch() {
  clearTimeout(timer);
  if (!composing.value) timer = setTimeout(runSearch, 300);
}
function beginComposition() {
  composing.value = true;
  clearTimeout(timer);
}
function clearSearch() {
  clearTimeout(timer);
  draft.value = '';
  commitSearch('');
  nextTick(() => input.value?.$el.focus());
}
function toggleTheme() {
  dark.value = !dark.value;
  document.documentElement.classList.toggle('dark', dark.value);
  try {
    localStorage.setItem(
      'subscription-admin-theme',
      dark.value ? 'dark' : 'light',
    );
  } catch {
    /* Private browsing still supports an in-memory theme. */
  }
}
watch([view, search], () => {
  draft.value = search.value;
  clearTimeout(timer);
});
watch(view, async () => {
  detailOpen.value = false;
  document.title = `${title.value} · 续订清单管理后台`;
  await nextTick();
  heading.value?.focus();
});
document.title = `${title.value} · 续订清单管理后台`;
watch(busy, (value) => {
  if (!value)
    notice.value =
      recordsError.value || overviewError.value
        ? '部分数据读取失败，请检查页面提示。'
        : '数据已更新。';
});
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <AdminLogin
    v-if="!authenticated"
    :busy="sessionBusy"
    :error="sessionError"
    :configured="configured"
    @login="session.login"
    @retry="session.check"
  />
  <template v-else>
    <a href="#main" class="skip-link">跳到主要内容</a>
    <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">
      <aside class="sidebar" aria-label="管理后台侧栏">
        <a
          :href="routeHref('overview')"
          class="brand"
          @click.prevent="go('overview')"
          ><span class="brand-symbol"><CalendarDays :size="22" /></span
          ><span class="brand-copy"
            ><strong>续订清单</strong><small>管理工作台</small></span
          ></a
        >

        <nav aria-label="主导航" class="nav-list">
          <template v-for="item in navItems" :key="item.view">
            <p v-if="item.group" class="nav-group">{{ item.group }}</p>
            <a
              :href="routeHref(item.view)"
              :aria-current="view === item.view ? 'page' : undefined"
              :title="collapsed ? item.label : undefined"
              :aria-label="item.label"
              class="nav-item"
              @click.prevent="go(item.view)"
              ><component :is="item.icon" :size="18" /><span>{{
                item.label
              }}</span
              ><span
                v-if="
                  item.view === 'notifications' && overview?.failedNotifications
                "
                class="nav-count"
                >{{ overview.failedNotifications }}</span
              ></a
            >
          </template>
        </nav>
        <div class="sidebar-footer">
          <span class="profile-avatar"><ShieldCheck :size="19" /></span
          ><span class="brand-copy"
            ><strong>管理后台</strong><small>订阅与用户管理</small></span
          ><Button
            variant="ghost"
            size="icon"
            :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
            @click="collapsed = !collapsed"
            ><PanelLeftOpen v-if="collapsed" /><PanelLeftClose v-else
          /></Button>
        </div>
      </aside>

      <div class="workspace">
        <header class="topbar">
          <Button
            class="mobile-menu"
            variant="ghost"
            size="icon"
            aria-label="打开导航菜单"
            @click="mobileNav = true"
            ><Menu
          /></Button>
          <nav class="breadcrumb" aria-label="当前位置">
            <a :href="routeHref('overview')" @click.prevent="go('overview')"
              >工作台</a
            ><ChevronRight :size="14" aria-hidden="true" /><span
              aria-current="page"
              >{{ title }}</span
            >
          </nav>
          <div class="topbar-actions">
            <Button
              variant="ghost"
              size="sm"
              :disabled="sessionBusy"
              @click="session.logout"
              >退出登录</Button
            >
            <Button
              variant="ghost"
              size="icon"
              :aria-label="dark ? '切换浅色主题' : '切换深色主题'"
              :title="dark ? '切换浅色主题' : '切换深色主题'"
              @click="toggleTheme"
              ><Sun v-if="dark" /><Moon v-else /></Button
            ><span class="topbar-divider" /><span
              class="profile-avatar small"
              :title="`管理员 ${adminUsername}`"
              ><ShieldCheck :size="17"
            /></span>
          </div>
        </header>

        <main id="main" class="main-content">
          <div class="page-heading">
            <div>
              <h1 ref="heading" tabindex="-1">{{ title }}</h1>
              <p class="page-description">
                {{
                  view === 'overview'
                    ? '查看今日新增、活跃和支付，处理订单与用户问题。'
                    : view === 'analytics'
                      ? '查看新增、活跃、留存与付费趋势。'
                      : view === 'notifications'
                        ? userId
                          ? '查看微信调用结果；已受理不代表送达或已读。'
                          : '仅显示微信明确返回失败或调用结果未知的记录。'
                        : sections[section].description
                }}
              </p>
            </div>
            <div class="heading-actions">
              <Button
                v-if="view === 'overview' || view === 'analytics'"
                :variant="excludeTest ? 'secondary' : 'outline'"
                :aria-pressed="excludeTest"
                title="点击切换是否包含测试账号"
                @click="excludeTest = !excludeTest"
                >{{ excludeTest ? '已排除测试账号' : '包含测试账号' }}</Button
              >
              <Button
                variant="outline"
                :disabled="busy || statsBusy"
                @click="refreshCurrent"
                ><RefreshCw
                  :class="{ spinning: busy || statsBusy }"
                />刷新数据</Button
              >
            </div>
          </div>

          <p v-if="sessionError" class="panel-error" role="alert">
            {{ sessionError }}
          </p>
          <div v-if="overviewError" class="inline-alert" role="alert">
            <CircleAlert :size="18" />
            <div>
              <strong>概览读取失败</strong>
              <p>
                {{ overviewError
                }}{{ overview ? ' 当前显示上次读取的数据。' : '' }}
              </p>
            </div>
            <Button variant="outline" size="sm" :disabled="busy" @click="load"
              >重新读取</Button
            >
          </div>

          <template v-if="view === 'overview'">
            <RuntimePolicy @unauthorized="session.expire" />
            <TodaySummary
              :day="overview?.today"
              :loading="busy"
              :exclude-test="excludeTest"
              @inspect="inspectStats"
            />
            <h2 class="overview-section-title">累计概况</h2>
            <div class="metrics-grid" :aria-busy="busy">
              <a
                v-for="metric in metrics"
                :key="metric.key"
                :href="routeHref(metric.destination)"
                class="metric-card"
                :class="{
                  'metric-warning':
                    metric.key === 'paymentIssues' && !!overview?.paymentIssues,
                }"
                @click.prevent="inspectOverview(metric.key, metric.destination)"
                ><div class="metric-heading">
                  <span>{{ metric.label }}</span
                  ><component :is="metric.icon" :size="17" />
                </div>
                <strong class="metric-value numeric">{{
                  overview
                    ? [
                        'paidAmountCny',
                        'refundAmountCny',
                        'netAmountCny',
                      ].includes(String(metric.key))
                      ? format('amount', overview[metric.key], {
                          currency: 'CNY',
                        })
                      : Number(overview[metric.key]).toLocaleString('zh-CN')
                    : '—'
                }}</strong>
                <div class="metric-caption">
                  <span>{{ metric.description }}</span
                  ><ArrowUpRight :size="15" /></div
              ></a>
            </div>
            <div v-if="overview?.paymentIssues" class="inline-alert">
              <CircleAlert :size="18" />
              <p>有 {{ overview.paymentIssues }} 笔支付或权益记录需要核对。</p>
              <Button variant="outline" size="sm" @click="go('billingIssues')"
                >查看待核对订单</Button
              >
            </div>
          </template>

          <StatsPage
            v-else-if="view === 'analytics'"
            ref="statsPage"
            v-model:range-days="rangeDays"
            :exclude-test="excludeTest"
            @inspect="inspectStats"
            @unauthorized="session.expire"
            @busy="statsBusy = $event"
            @updated="statsUpdated = $event"
          />
          <template v-else>
            <div
              v-if="userId && ['subscriptions', 'notifications'].includes(view)"
              class="user-context"
            >
              <Button variant="outline" size="sm" @click="go('users', userId)"
                >返回用户列表</Button
              >
              <p class="min-w-0 break-all">
                当前用户 <code :title="userId">{{ displayId(userId) }}</code>
              </p>
            </div>
            <Card class="panel data-panel gap-0 py-0 ring-0">
              <div class="data-toolbar">
                <div class="table-title">
                  <h2>{{ title }}</h2>
                  <Badge>{{
                    records
                      ? `${records.total.toLocaleString('zh-CN')} 条`
                      : '待读取'
                  }}</Badge>
                </div>
                <form
                  class="search-form"
                  novalidate
                  @submit.prevent="runSearch"
                >
                  <div class="search-field">
                    <Search :size="17" aria-hidden="true" /><label
                      for="record-search"
                      class="sr-only"
                      >{{ sections[section].placeholder }}</label
                    ><Input
                      id="record-search"
                      ref="input"
                      v-model="draft"
                      type="search"
                      maxlength="128"
                      :placeholder="sections[section].placeholder"
                      @input="scheduleSearch"
                      @compositionstart="beginComposition"
                      @compositionend="
                        composing = false;
                        scheduleSearch();
                      "
                    /><Button
                      v-if="draft"
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      class="search-clear"
                      aria-label="清除搜索"
                      @click="clearSearch"
                    >
                      <X :size="15" />
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    :disabled="busy || composing"
                    >查询</Button
                  >
                </form>
              </div>
              <div class="table-meta">
                <span>{{ search ? `搜索：${search}` : '全部记录' }}</span
                ><span
                  >{{ busy ? '正在读取…' : '每页 20 条' }}
                  <span class="table-scroll-hint">
                    · 横向滚动查看更多</span
                  ></span
                >
              </div>
              <p
                v-if="recordsError && records?.items.length"
                class="panel-error"
                role="alert"
              >
                {{ recordsError }} 当前显示上次读取的数据。<Button
                  variant="outline"
                  size="sm"
                  :disabled="busy"
                  @click="load"
                  >重新读取</Button
                >
              </p>
              <AdminTable
                :section="section"
                :items="records?.items"
                :loading="busy"
                :error="recordsError"
                :search="search"
                @detail="openDetail"
                @user="go('users', $event)"
                @subscriptions="navigate('subscriptions', '', $event)"
                @retry="load"
                @clear="clearSearch"
              />
              <div class="pagination">
                <span class="muted">{{ range }}</span>
                <div>
                  <span class="page-number"
                    >第 {{ page }} / {{ totalPages }} 页</span
                  ><Button
                    variant="outline"
                    size="icon"
                    aria-label="上一页"
                    :disabled="busy || page <= 1 || !records"
                    @click="page--"
                    ><ChevronLeft /></Button
                  ><Button
                    variant="outline"
                    size="icon"
                    aria-label="下一页"
                    :disabled="busy || page >= totalPages || !records"
                    @click="page++"
                    ><ChevronRight
                  /></Button>
                </div>
              </div>
            </Card>
            <div class="read-only-note">
              <CircleHelp :size="17" />
              <p>
                {{
                  section === 'billingIssues'
                    ? '基于本库订单与权益核对。支付待确认指发起支付超过15分钟，不等于支付失败；模拟订单不计入。'
                    : section === 'authEvents'
                      ? '仅记录启用后的注册与登录；历史记录不补录。客户端 IP 为识别结果，直连 IP 为连接后端的地址。'
                      : section === 'subscriptions'
                        ? '概览的订阅总数只统计未删除记录；此列表也显示已删除记录。'
                        : section === 'users'
                          ? '点击订阅数量查看订阅；点击行末箭头查看账号详情。'
                          : section === 'membershipOrders'
                            ? '订单金额为该订单币种的实际标价；模拟支付不产生真实交易。'
                            : '点击行末箭头查看完整记录；点击所属用户可查看对应账号。'
                }}
              </p>
            </div>
          </template>

          <footer class="page-footer">
            <span>续订清单 <span class="footer-dot">·</span> 管理后台</span
            ><span>{{
              lastUpdated
                ? `上次读取 ${format('createdAt', lastUpdated)} · 北京时间`
                : '尚未读取数据'
            }}</span>
          </footer>
        </main>
      </div>
    </div>
    <StatsDetailDialog
      v-model:open="statsDetailOpen"
      :selection="statsSelection"
      @unauthorized="session.expire"
    />
    <p class="sr-only" role="status" aria-live="polite">{{ notice }}</p>
    <AppDialog
      v-model:open="detailOpen"
      :title="
        section === 'users'
          ? '用户详情'
          : section === 'subscriptions'
            ? '订阅详情'
            : `${sections[section].label}详情`
      "
      description="完整显示当前读取的记录，时间按北京时间显示。"
      ><div v-if="section === 'users' && selected" class="detail-account">
        <span class="account-avatar large" aria-hidden="true">{{
          String(selected.id).replace(/^wx_/, '').slice(0, 2).toUpperCase()
        }}</span>
        <div>
          <strong>微信账号</strong><code>{{ displayId(selected.id) }}</code>
        </div>
        <Badge :tone="toneForPlan(selected.plan)">{{
          format('plan', selected.plan)
        }}</Badge>
      </div>
      <dl v-if="selected" class="detail-list">
        <template
          v-for="column in detailColumns(section).filter(
            (column) => column.key in selected!,
          )"
          :key="column.key"
          ><dt>{{ column.label }}</dt>
          <dd>
            {{ format(column.key, selected[column.key], selected, section) }}
          </dd></template
        >
      </dl>
      <UserTestFlag
        v-if="section === 'users' && selected"
        :key="String(selected.id)"
        :user="selected"
        @unauthorized="session.expire"
        @changed="refreshOrder"
      />
      <UserMembership
        v-if="section === 'users' && selected"
        :key="String(selected.id)"
        :user="selected"
        @unauthorized="session.expire"
        @changed="refreshOrder"
      />
      <RefundPanel
        v-if="section === 'membershipOrders' && selected"
        :key="String(selected.id)"
        :order="selected"
        @unauthorized="session.expire"
        @changed="refreshOrder"
      />
      <div class="dialog-footer">
        <Button
          v-if="section === 'users' && selected?.id"
          variant="outline"
          @click="
            detailOpen = false;
            navigate('notifications', '', String(selected.id));
          "
          >查看该用户的通知</Button
        >
        <Button
          v-if="section === 'users' && selected?.id"
          variant="default"
          @click="
            detailOpen = false;
            navigate('subscriptions', '', String(selected.id));
          "
          >查看该用户的订阅</Button
        >
        <Button
          v-if="section === 'users' && selected?.id"
          variant="outline"
          @click="
            detailOpen = false;
            go('authEvents', String(selected.id));
          "
          >查看操作日志</Button
        >
        <Button variant="outline" @click="detailOpen = false">关闭详情</Button>
      </div></AppDialog
    >
    <AppDialog
      v-model:open="mobileNav"
      title="续订清单"
      description="管理后台"
      drawer
      ><nav aria-label="移动端主导航" class="nav-list">
        <a
          v-for="item in navItems"
          :key="item.view"
          :href="routeHref(item.view)"
          class="nav-item"
          :aria-current="view === item.view ? 'page' : undefined"
          @click.prevent="go(item.view)"
          ><component :is="item.icon" :size="18" /><span>{{
            item.label
          }}</span></a
        >
      </nav></AppDialog
    >
  </template>
</template>
