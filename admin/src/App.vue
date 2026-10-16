<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  LayoutDashboard,
  ListFilter,
  Users,
  Crown,
  ReceiptText,
  Bell,
  Settings2,
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
  Check,
  Link2,
  CalendarDays,
  Database,
  LoaderCircle,
  CircleHelp,
} from '@lucide/vue';
import { useAdmin } from './lib/useAdmin';
import {
  sections,
  format,
  detailColumns,
  type View,
  type Row,
  type Overview,
} from './lib/data';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardHeader } from './components/ui/card';
import Badge from './components/StatusBadge.vue';
import AppDialog from './components/AppDialog.vue';
import AsyncState from './components/AsyncState.vue';
import AdminTable from './components/AdminTable.vue';
import ServiceStatus from './components/ServiceStatus.vue';

const {
  view,
  section,
  search,
  page,
  address,
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
} = useAdmin();
const navItems = [
  {
    view: 'overview' as View,
    label: '数据概览',
    icon: LayoutDashboard,
    group: '工作台',
  },
  {
    view: 'subscriptions' as View,
    label: '订阅记录',
    icon: ListFilter,
    group: '数据管理',
  },
  { view: 'users' as View, label: '用户列表', icon: Users },
  { view: 'memberships' as View, label: '会员权益', icon: Crown },
  { view: 'membershipOrders' as View, label: '会员订单', icon: ReceiptText },
  { view: 'notifications' as View, label: '通知记录', icon: Bell },
  {
    view: 'connection' as View,
    label: '连接设置',
    icon: Settings2,
    group: '系统',
  },
];
const title = computed(
  () => navItems.find((item) => item.view === view.value)?.label || '数据概览',
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
const lastUpdated = computed(() =>
  view.value === 'overview' || view.value === 'connection'
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
    key: 'subscriptions',
    label: '未删除订阅',
    description: '不含演示记录',
    icon: ListFilter,
    destination: 'subscriptions',
  },
  {
    key: 'notifications',
    label: '通知记录',
    description: '累计微信发送记录',
    icon: Bell,
    destination: 'notifications',
  },
  {
    key: 'failedNotifications',
    label: '待排查通知',
    description: '失败与结果待核实',
    icon: CircleAlert,
    destination: 'notifications',
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
      <div class="workspace-label">
        <span class="status-dot" /> <span>数据查看后台</span><Badge>只读</Badge>
      </div>
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
          ><strong>只读工作台</strong><small>查看跨账号数据</small></span
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
          <span class="connection-status"
            ><span
              class="status-dot"
              :class="{ 'dot-warning': !overview || !!overviewError }"
            />{{
              overviewError ? '连接异常' : overview ? '已连接后台' : '正在连接'
            }}</span
          ><Button
            variant="ghost"
            size="icon"
            :aria-label="dark ? '切换浅色主题' : '切换深色主题'"
            :title="dark ? '切换浅色主题' : '切换深色主题'"
            @click="toggleTheme"
            ><Sun v-if="dark" /><Moon v-else /></Button
          ><span class="topbar-divider" /><span
            class="profile-avatar small"
            title="只读数据查看"
            ><ShieldCheck :size="17"
          /></span>
        </div>
      </header>

      <main id="main" class="main-content">
        <div class="page-heading">
          <div>
            <p class="eyebrow">SUBSCRIPTION MONITOR</p>
            <h1 ref="heading" tabindex="-1">{{ title }}</h1>
            <p class="page-description">
              {{
                view === 'overview'
                  ? '看清订阅、用户与通知的运行情况。'
                  : view === 'connection'
                    ? '管理后台连接与数据读取状态。'
                    : sections[section].description
              }}
            </p>
          </div>
          <Button
            v-if="view !== 'connection'"
            variant="outline"
            :disabled="busy"
            @click="load"
            ><RefreshCw :class="{ spinning: busy }" />刷新数据</Button
          >
        </div>

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
          ><a :href="routeHref('connection')" @click.prevent="go('connection')"
            >连接设置</a
          >
        </div>

        <template v-if="view === 'overview'">
          <div class="metrics-grid" :aria-busy="busy">
            <a
              v-for="metric in metrics"
              :key="metric.key"
              :href="routeHref(metric.destination)"
              class="metric-card"
              :class="{
                'metric-warning': metric.key === 'failedNotifications',
              }"
              @click.prevent="go(metric.destination)"
              ><div class="metric-heading">
                <span>{{ metric.label }}</span
                ><component :is="metric.icon" :size="17" />
              </div>
              <strong class="metric-value numeric">{{
                overview
                  ? Number(overview[metric.key]).toLocaleString('zh-CN')
                  : '—'
              }}</strong>
              <div class="metric-caption">
                <span>{{ metric.description }}</span
                ><ArrowUpRight :size="15" /></div
            ></a>
          </div>
          <div class="overview-grid">
            <Card class="panel overview-table gap-0 py-0 ring-0">
              <CardHeader class="panel-heading">
                <div>
                  <h2>订阅速览</h2>
                  <p>订阅列表前 5 条 · 包含已删除记录</p>
                </div>
                <a
                  :href="routeHref('subscriptions')"
                  class="text-link"
                  @click.prevent="go('subscriptions')"
                  >全部订阅<ArrowUpRight :size="15"
                /></a>
              </CardHeader>
              <AdminTable
                section="subscriptions"
                :items="records?.items.slice(0, 5)"
                :loading="busy"
                :error="recordsError"
                compact
                @detail="openDetail"
                @retry="load"
              />
              <p
                v-if="recordsError && records?.items.length"
                class="panel-error"
                role="alert"
              >
                {{ recordsError }} 当前显示上次读取的数据。
              </p>
              <div class="panel-footnote">
                <CalendarDays :size="15" /><span
                  >扣费日期由各账号的订阅记录提供。</span
                >
              </div>
            </Card>
            <div class="overview-aside">
              <Card class="panel gap-0 py-0 ring-0">
                <CardHeader class="panel-heading">
                  <div>
                    <h2>服务状态</h2>
                    <p>来自后端的实际运行配置</p>
                  </div>
                  <Database :size="18" class="muted" />
                </CardHeader>
                <ServiceStatus :overview="overview" />
                <div class="panel-footnote">
                  <span
                    class="status-dot"
                    :class="{ 'dot-warning': !!overviewError || !overview }"
                  /><span>{{
                    overviewUpdated
                      ? `更新于 ${format('createdAt', overviewUpdated)}`
                      : '等待首次读取'
                  }}</span>
                </div>
              </Card>
              <section class="notification-panel">
                <div class="notification-icon"><Bell :size="21" /></div>
                <h2>通知需要关注吗？</h2>
                <p v-if="!overview">连接后台后，可查看需要排查的通知数量。</p>
                <p v-else-if="overview.failedNotifications">
                  有
                  <strong>{{ overview.failedNotifications }}</strong>
                  条通知发送失败或结果待核实，可查看错误码进一步排查。
                </p>
                <p v-else>当前没有失败或待核实的通知记录。</p>
                <a
                  :href="routeHref('notifications')"
                  class="text-link"
                  @click.prevent="go('notifications')"
                  >查看通知记录<ArrowUpRight :size="15"
                /></a>
              </section>
            </div>
          </div>
          <div class="read-only-note">
            <ShieldCheck :size="18" />
            <p>当前后台仅用于查看数据。会员订单中的模拟支付不产生实际扣款。</p>
          </div>
        </template>

        <template v-else-if="view !== 'connection'">
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
              <form class="search-form" novalidate @submit.prevent="runSearch">
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
                >{{ busy ? '正在读取…' : '每页 20 条' }} ·
                横向滚动查看更多</span
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
                section === 'subscriptions'
                  ? '概览的订阅总数只统计未删除记录；此列表也显示已删除记录。'
                  : section === 'membershipOrders'
                    ? '订单金额为该订单币种的实际标价；模拟支付不产生真实交易。'
                    : '点击行末箭头查看完整记录；点击所属用户可查看对应账号。'
              }}
            </p>
          </div>
        </template>

        <template v-else>
          <div class="settings-grid">
            <Card class="panel settings-panel gap-0 py-0 ring-0">
              <CardHeader class="panel-heading">
                <div>
                  <h2>后台连接</h2>
                  <p>通过部署环境配置的管理接口读取数据。</p>
                </div>
                <Link2 :size="19" class="muted" />
              </CardHeader>
              <div class="connection-form">
                <h3>管理接口地址</h3>
                <code class="address-box">{{ address }}</code>
                <p class="field-help">
                  连接地址由部署配置管理，检查连接会重新读取概览。
                </p>
                <Button :disabled="busy" class="connection-check" @click="load"
                  ><LoaderCircle v-if="busy" class="spinning" /><Link2
                    v-else
                  />检查连接</Button
                >
              </div>
              <div class="connection-result">
                <Check
                  v-if="overview && !overviewError"
                  :size="17"
                /><CircleAlert v-else :size="17" /><span>{{
                  busy
                    ? '正在检查连接…'
                    : overviewError ||
                      (overview
                        ? '连接成功，已读取后台概览。'
                        : '尚未连接成功。')
                }}</span>
              </div>
            </Card>
            <Card class="panel gap-0 py-0 ring-0">
              <CardHeader class="panel-heading">
                <div>
                  <h2>服务状态</h2>
                  <p>检查连接后重新读取</p>
                </div>
              </CardHeader>
              <ServiceStatus :overview="overview" />
              <div class="settings-note">
                <h3>数据读取说明</h3>
                <p>
                  数据来自后端，不生成演示记录。时间按北京时间显示，金额保留各记录原始币种。
                </p>
                <p>
                  接口不返回微信
                  OpenID、登录令牌和授权凭证。当前版本仅提供查询。
                </p>
              </div>
            </Card>
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
  <p class="sr-only" role="status" aria-live="polite">{{ notice }}</p>
  <AppDialog
    v-model:open="detailOpen"
    :title="`${sections[section].label}详情`"
    description="完整显示当前读取的记录，时间按北京时间显示。"
    ><dl v-if="selected" class="detail-list">
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
    <div class="dialog-footer">
      <Button variant="outline" @click="detailOpen = false">关闭详情</Button>
    </div></AppDialog
  >
  <AppDialog
    v-model:open="mobileNav"
    title="续订清单"
    description="管理工作台 · 只读数据查看"
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
