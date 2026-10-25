<script setup lang="ts">
import { computed } from 'vue';
import {
  numberText,
  type StatsDay,
  type StatsSelection,
  type Metric,
} from '../lib/stats';
import { Button } from './ui/button';
const props = defineProps<{
  day?: StatsDay;
  loading?: boolean;
  excludeTest?: boolean;
}>();
const emit = defineEmits<{ inspect: [StatsSelection] }>();
function inspect(metric: Metric) {
  if (props.day)
    emit('inspect', {
      metric,
      from: props.day.date,
      to: props.day.date,
      excludeTest: props.excludeTest !== false,
    });
}
const date = computed(
  () =>
    props.day?.date ||
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(
      new Date(),
    ),
);
const cards = computed(() => [
  {
    metric: 'newUsers' as Metric,
    label: '今日新增账号',
    value: numberText(props.day?.newUsers),
    unit: '人',
  },
  {
    metric: 'activeUsers' as Metric,
    label: '今日活跃用户',
    value: numberText(props.day?.activeUsers),
    unit: '人',
  },
  {
    metric: 'paidOrders' as Metric,
    label: '今日支付订单',
    value: numberText(props.day?.paidOrders),
    unit: '笔',
  },
  {
    metric: 'paidAmountCny' as Metric,
    label: '今日支付金额',
    value: props.day ? '¥ ' + props.day.paidAmountCny.toFixed(2) : '—',
    unit: '',
  },
]);
</script>
<template>
  <section
    class="today-summary"
    aria-labelledby="today-title"
    :aria-busy="loading"
  >
    <div class="today-heading">
      <h2 id="today-title">
        今天 <span>{{ date }}</span>
      </h2>
      <p>北京时间 · 截至当前</p>
    </div>
    <div class="today-values">
      <div v-for="card in cards" :key="card.label">
        <p>{{ card.label }}</p>
        <Button
          variant="ghost"
          class="today-metric-link"
          :disabled="
            !day || (card.metric === 'activeUsers' && day.activeUsers === null)
          "
          :aria-label="card.label + '明细'"
          @click="inspect(card.metric)"
          ><strong
            >{{ card.value
            }}<small v-if="card.value !== '—'">{{ card.unit }}</small></strong
          ></Button
        >
      </div>
    </div>
    <div class="today-secondary">
      <Button
        variant="link"
        size="sm"
        :disabled="!day"
        @click="inspect('newSubscriptions')"
        >今日新增订阅 {{ numberText(day?.newSubscriptions) }} 条</Button
      >
      <Button
        variant="link"
        size="sm"
        :disabled="!day"
        @click="inspect('paidUsers')"
        >今日付费用户 {{ numberText(day?.paidUsers) }} 人</Button
      >
      <Button
        variant="link"
        size="sm"
        :disabled="!day"
        @click="inspect('refundAmountCny')"
        >今日退款 ¥{{ day?.refundAmountCny?.toFixed(2) ?? '—' }}</Button
      >
      <Button
        variant="link"
        size="sm"
        :disabled="!day"
        @click="inspect('netAmountCny')"
        >今日净额 ¥{{ day?.netAmountCny?.toFixed(2) ?? '—' }}</Button
      >
      <span v-if="day && day.activeUsers === null">活跃尚无采集记录</span>
    </div>
  </section>
</template>
<style scoped>
.today-metric-link {
  padding: 0;
  height: auto;
  justify-content: flex-start;
  display: block;
  white-space: normal;
}
.today-metric-link:not(:disabled) {
  color: var(--primary);
}
.today-metric-link strong {
  margin-top: 0;
}
.today-secondary button {
  padding: 0;
  height: auto;
  font-size: 12px;
}
.today-summary {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}
.today-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}
.today-heading h2 {
  font-size: 20px;
  font-weight: 600;
}
.today-heading h2 span {
  margin-left: 10px;
  font-size: 13px;
  font-weight: 400;
  color: var(--muted-foreground);
}
.today-heading > p,
.today-values p {
  color: var(--muted-foreground);
  font-size: 12px;
}
.today-values {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.today-values strong {
  display: block;
  margin-top: 12px;
  font-size: 32px;
  line-height: 1.3;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.6px;
}
.today-values small {
  font-size: 12px;
  margin-left: 6px;
  font-weight: 400;
  color: var(--muted-foreground);
}
.today-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted-foreground);
}
.today-secondary b {
  font-weight: 500;
  color: var(--foreground);
  margin: 0 4px;
}
@media (max-width: 600px) {
  .today-summary {
    padding: 18px;
    margin-bottom: 16px;
  }
  .today-heading {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 18px;
  }
  .today-values {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 12px;
  }
  .today-values strong {
    font-size: 28px;
  }
}
</style>
