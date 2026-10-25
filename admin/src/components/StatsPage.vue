<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { Button } from './ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './ui/table';
import AsyncState from './AsyncState.vue';
import StatsChart from './StatsChart.vue';
import TodaySummary from './TodaySummary.vue';
import { getJson, defaultAddress, AdminUnauthorizedError } from '../lib/data';
import {
  metrics,
  numberText,
  percentText,
  validStats,
  type Stats,
  type Metric,
  type StatsSelection,
} from '../lib/stats';
const props = defineProps<{ rangeDays: number; excludeTest: boolean }>();
const emit = defineEmits<{
  'update:rangeDays': [number];
  unauthorized: [];
  busy: [boolean];
  updated: [string];
  inspect: [StatsSelection];
}>();
const data = ref<Stats>(),
  error = ref(''),
  loading = ref(false),
  metric = ref<Metric>('newUsers');
let controller: AbortController | undefined,
  generation = 0;
async function refresh() {
  controller?.abort();
  controller = new AbortController();
  const id = ++generation;
  if (
    data.value?.rangeDays !== props.rangeDays ||
    data.value?.excludeTest !== props.excludeTest
  )
    data.value = undefined;
  loading.value = true;
  emit('busy', true);
  error.value = '';
  try {
    const value = await getJson<Stats>(
      defaultAddress(),
      `stats?days=${props.rangeDays}&excludeTest=${props.excludeTest}`,
      controller.signal,
    );
    if (id !== generation) return;
    if (
      !validStats(value, props.rangeDays) ||
      value.excludeTest !== props.excludeTest
    )
      throw new Error('统计响应格式不正确，请重新读取。');
    data.value = value;
    emit('updated', value.generatedAt);
  } catch (e) {
    if (id !== generation) return;
    if (e instanceof AdminUnauthorizedError) emit('unauthorized');
    else
      error.value = e instanceof Error ? e.message : '统计读取失败，请重试。';
  } finally {
    if (id === generation) {
      loading.value = false;
      emit('busy', false);
    }
  }
}
watch(() => [props.rangeDays, props.excludeTest], refresh, { immediate: true });
onBeforeUnmount(() => {
  generation++;
  controller?.abort();
  emit('busy', false);
});
defineExpose({ refresh });
const cards = computed(() =>
  data.value
    ? [
        {
          metric: 'newUsers' as Metric,
          label: '新增账号',
          value: numberText(data.value.summary.newUsers),
          note: '首次成功登录创建账号',
        },
        {
          metric: 'activeUsers' as Metric,
          label: '区间活跃用户',
          value: numberText(data.value.summary.activeUsers),
          note: '期间访问用户去重',
        },
        {
          metric: 'newSubscriptions' as Metric,
          label: '新增订阅',
          value: numberText(data.value.summary.newSubscriptions),
          note: '不含示例，包含已软删除记录',
        },
        {
          label: '新增账号付费转化',
          value: percentText(data.value.summary.conversionRate),
          note: `${data.value.summary.convertedUsers} / ${data.value.summary.newUsers} 个新增账号在期间付费`,
        },
      ]
    : [],
);
function inspect(metric: Metric, day?: string) {
  if (data.value)
    emit('inspect', {
      metric,
      from: day || data.value.from,
      to: day || data.value.to,
      excludeTest: props.excludeTest,
    });
}
const finances = [
  { key: 'paidAmountCny', label: '支付金额' },
  { key: 'refundAmountCny', label: '退款金额' },
  { key: 'netAmountCny', label: '收支净额' },
] as const;
const activityLabels = [
  ['dau', '今日活跃 DAU'],
  ['wau', '近 7 日活跃 WAU'],
  ['mau', '近 30 日活跃 MAU'],
] as const;
const retentionLabels = [
  ['d1', '次日留存'],
  ['d7', '7 日留存'],
  ['d30', '30 日留存'],
] as const;
const cohortRate = (users: number, retained: number | null) =>
  retained === null ? '—' : percentText(retained / users);
const trackingDay = computed(() =>
  data.value?.trackingSince
    ? new Date(Date.parse(data.value.trackingSince) + 28800000)
        .toISOString()
        .slice(0, 10)
    : '',
);
</script>
<template>
  <section class="analytics-page" :aria-busy="loading">
    <div class="stats-range">
      <p>北京时间 · 今天的数据持续更新</p>
      <div role="group" aria-label="统计时间范围">
        <Button
          v-for="n in [7, 30, 90]"
          :key="n"
          size="sm"
          :variant="rangeDays === n ? 'default' : 'outline'"
          :aria-pressed="rangeDays === n"
          @click="emit('update:rangeDays', n)"
          >近 {{ n }} 天</Button
        >
      </div>
    </div>
    <AsyncState
      v-if="!data"
      :loading="loading"
      :error="error"
      @retry="refresh"
    />
    <template v-else>
      <TodaySummary
        :day="data.days[data.days.length - 1]"
        :exclude-test="excludeTest"
        @inspect="emit('inspect', $event)"
        :loading="loading"
      />
      <h2 class="stats-period-title">近 {{ rangeDays }} 天汇总</h2>
      <div v-if="error" role="alert" class="stats-error">
        <span>{{ error }} 当前显示上次读取的数据。</span
        ><Button variant="outline" size="sm" @click="refresh">重试</Button>
      </div>
      <div class="stats-cards">
        <article v-for="card in cards" :key="card.label">
          <p>{{ card.label }}</p>
          <Button
            v-if="'metric' in card"
            variant="link"
            class="summary-number"
            :disabled="
              card.metric === 'activeUsers' && data.summary.activeUsers === null
            "
            :aria-label="card.label + '明细'"
            @click="inspect(card.metric!)"
            >{{ card.value }}</Button
          ><strong v-else>{{ card.value }}</strong
          ><small>{{ card.note }}</small>
        </article>
      </div>
      <div class="stats-finances">
        <article v-for="item in finances" :key="item.key">
          <p>{{ item.label }}</p>
          <Button
            variant="link"
            class="summary-number"
            :aria-label="item.label + '明细'"
            @click="inspect(item.key)"
            >¥ {{ data.summary[item.key].toFixed(2) }}</Button
          ><small>{{
            item.key === 'paidAmountCny'
              ? '按付款日 · 包含后来退款的订单'
              : item.key === 'refundAmountCny'
                ? '按平台退款日期 · 仅确认成功'
                : '期间支付减期间退款，可为负数'
          }}</small>
        </article>
      </div>
      <p v-if="data.undatedRefunds.count" class="stats-note">
        另有 {{ data.undatedRefunds.count }} 笔退款（¥{{
          data.undatedRefunds.amountCny.toFixed(2)
        }}）缺少可靠退款日期，未计入日趋势和区间净额。
      </p>
      <div class="stats-panel">
        <div class="stats-panel-heading">
          <div>
            <h2>增长与使用趋势</h2>
            <p>{{ data.from }} — {{ data.to }}</p>
          </div>
          <span
            >新增订阅 {{ numberText(data.summary.newSubscriptions) }} 条</span
          >
        </div>
        <div class="stats-metrics" role="group" aria-label="趋势指标">
          <Button
            v-for="m in metrics"
            :key="m.key"
            size="sm"
            :variant="metric === m.key ? 'secondary' : 'ghost'"
            :aria-pressed="metric === m.key"
            @click="metric = m.key"
            >{{ m.label }}</Button
          >
        </div>
        <StatsChart
          :days="data.days"
          :metric="metric"
          @inspect="inspect(metric, $event)"
        />
      </div>
      <div class="stats-panel">
        <div class="stats-panel-heading">
          <div>
            <h2>用户活跃</h2>
            <p>成功登录或已认证的业务访问，同一用户每天只记一次。</p>
          </div>
        </div>
        <div class="stats-strip">
          <div v-for="[key, label] in activityLabels" :key="key">
            <p>{{ label }}</p>
            <strong>{{ numberText(data.activity[key]) }}</strong>
          </div>
        </div>
        <p class="stats-note">
          {{
            trackingDay
              ? `开始记录：${trackingDay}。首日仅覆盖启用后的访问，7／30 天窗口不足时为已采集部分。`
              : '尚未采集活跃数据。服务更新启用采集后开始记录，历史访问无法还原。'
          }}
          管理员访问不计入。
        </p>
      </div>
      <div class="stats-panel">
        <div class="stats-panel-heading">
          <div>
            <h2>新用户留存</h2>
            <p>所选期间注册的账号，在注册后第 1／7／30 天是否回来。</p>
          </div>
        </div>
        <div class="stats-strip">
          <div v-for="[key, label] in retentionLabels" :key="key">
            <p>{{ label }}</p>
            <strong>{{ percentText(data.retention[key]) }}</strong>
          </div>
        </div>
        <p class="stats-note">
          按可计算批次的注册人数加权。未到观察日、观察日仍是今天或缺少全天采集时显示「—」，不计作零。
        </p>
        <details class="stats-details">
          <summary>查看注册批次明细（{{ data.cohorts.length }} 天）</summary>
          <div class="stats-table-wrap">
            <Table>
              <TableCaption class="sr-only">
                按注册日期统计留存，括号内为回访人数与注册人数
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>注册日期</TableHead>
                  <TableHead>新增账号</TableHead>
                  <TableHead>次日留存</TableHead>
                  <TableHead>7 日留存</TableHead>
                  <TableHead>30 日留存</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="cohort in data.cohorts" :key="cohort.date">
                  <TableHead scope="row">{{ cohort.date }}</TableHead>
                  <TableCell>{{ cohort.users }}</TableCell>
                  <TableCell
                    v-for="key in ['d1', 'd7', 'd30'] as const"
                    :key="key"
                  >
                    {{ cohortRate(cohort.users, cohort[key])
                    }}<small v-if="cohort[key] !== null"
                      >（{{ cohort[key] }}/{{ cohort.users }}）</small
                    >
                  </TableCell>
                </TableRow>
                <TableRow v-if="!data.cohorts.length">
                  <TableCell colspan="5">所选期间没有新增账号。</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </details>
      </div>
      <div class="stats-panel">
        <details class="stats-details">
          <summary>每日数据明细（{{ data.days.length }} 天）</summary>
          <div class="stats-table-wrap">
            <Table>
              <TableCaption class="sr-only">
                每日新增、活跃、订阅及支付数据
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead v-for="m in metrics" :key="m.key">
                    {{ m.label }}{{ m.unit === '元' ? '（元）' : '' }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="day in [...data.days].reverse()"
                  :key="day.date"
                >
                  <TableHead scope="row">
                    {{ day.date }}{{ day.date === data.to ? ' · 今日' : '' }}
                  </TableHead>
                  <TableCell v-for="m in metrics" :key="m.key">
                    <Button
                      variant="link"
                      size="sm"
                      :disabled="day[m.key] === null"
                      @click="inspect(m.key, day.date)"
                      >{{ numberText(day[m.key]) }}</Button
                    >
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </details>
      </div>
      <p class="stats-note">
        统计基于当前保留的账号与业务记录；删除账号会影响历史统计。新增订阅包含已软删除的记录，排除示例。支付按付款日记录，包含后来退款的订单；退款单独按平台确认日期统计。净额为期间支付减退款，不等于平台结算收入。更新于
        {{
          new Date(data.generatedAt).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false,
          })
        }}。
      </p>
    </template>
  </section>
</template>
<style scoped>
.summary-number {
  padding: 0;
  height: auto;
  justify-content: flex-start;
  font-size: 29px;
  font-weight: 600;
  letter-spacing: -0.8px;
  font-variant-numeric: tabular-nums;
  white-space: normal;
  line-height: 1.4;
}
.stats-finances {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}
.stats-finances article {
  padding: 22px;
  display: grid;
  gap: 12px;
  align-content: start;
}
.stats-finances article + article {
  border-left: 1px solid var(--border);
}
.stats-finances p,
.stats-finances small {
  color: var(--muted-foreground);
  font-size: 12px;
  line-height: 1.6;
}
@media (max-width: 600px) {
  .stats-finances {
    grid-template-columns: 1fr;
  }
  .stats-finances article + article {
    border-left: 0;
    border-top: 1px solid var(--border);
  }
  .summary-number {
    font-size: 25px;
  }
}

.analytics-page :deep(.today-summary) {
  margin-bottom: 0;
}
.stats-period-title {
  font-size: 16px;
  font-weight: 600;
}
.analytics-page {
  display: grid;
  gap: 20px;
  min-width: 0;
}
.stats-range,
.stats-range > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stats-range {
  justify-content: space-between;
  gap: 16px;
}
.stats-range p,
.stats-panel-heading p,
.stats-panel-heading > span {
  font-size: 12px;
  color: var(--muted-foreground);
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}
.stats-cards article {
  padding: 22px;
  display: grid;
  gap: 12px;
  align-content: start;
}
.stats-cards article + article {
  border-left: 1px solid var(--border);
}
.stats-cards p,
.stats-strip p {
  font-size: 13px;
  color: var(--muted-foreground);
}
.stats-cards strong {
  font-size: 29px;
  font-weight: 600;
  letter-spacing: -0.8px;
  font-variant-numeric: tabular-nums;
}
.stats-cards small {
  font-size: 11px;
  color: var(--muted-foreground);
  line-height: 1.6;
}
.stats-panel {
  padding: 24px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  min-width: 0;
}
.stats-panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}
.stats-panel-heading h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}
.stats-metrics {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.stats-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}
.stats-strip strong {
  display: block;
  font-size: 28px;
  font-weight: 600;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}
.stats-note {
  font-size: 12px;
  color: var(--muted-foreground);
  line-height: 1.8;
}
.stats-details {
  font-size: 13px;
}
.stats-details summary {
  cursor: pointer;
  font-weight: 500;
  padding: 5px 0;
}
.stats-note + .stats-details {
  margin-top: 16px;
}
.stats-table-wrap {
  overflow-x: auto;
  margin-top: 16px;
  max-height: 480px;
}
.stats-table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.stats-table-wrap th,
.stats-table-wrap td {
  padding: 13px 16px;
  text-align: right;
  border-bottom: 1px solid var(--border);
  font-weight: 400;
}
.stats-table-wrap th:first-child {
  text-align: left;
}
.stats-table-wrap thead th {
  color: var(--muted-foreground);
  font-weight: 500;
  background: var(--card);
  position: sticky;
  top: 0;
}
.stats-table-wrap small {
  color: var(--muted-foreground);
}
.stats-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--destructive);
}
@media (max-width: 1000px) {
  .stats-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats-cards article:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--border);
  }
  .stats-cards article:nth-child(4) {
    border-top: 1px solid var(--border);
  }
}
@media (max-width: 600px) {
  .stats-range {
    align-items: flex-start;
    flex-direction: column;
  }
  .stats-panel {
    padding: 16px;
  }
  .stats-cards article {
    padding: 16px;
  }
  .stats-cards strong {
    font-size: 25px;
  }
  .stats-panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .stats-strip {
    gap: 10px;
  }
  .stats-strip p {
    font-size: 11px;
  }
  .stats-strip strong {
    font-size: 24px;
  }
}
</style>
