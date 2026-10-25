<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { metrics, numberText, type StatsDay, type Metric } from '../lib/stats';
const props = defineProps<{ days: StatsDay[]; metric: Metric }>();
const host = ref<HTMLElement>();
const width = ref(800),
  selected = ref<number | null>(null);
const lastSelected = ref(0);
watch(
  selected,
  (value) => {
    if (value !== null) lastSelected.value = value;
  },
  { flush: 'sync' },
);
const label = computed(() => metrics.find((m) => m.key === props.metric)!);
const values = computed(() => props.days.map((d) => d[props.metric]));
const hasData = computed(() => values.value.some((v) => v !== null));
const emit = defineEmits<{ inspect: [string] }>();
const low = computed(() => Math.min(...values.value.map((v) => v || 0), 0));
const high = computed(() => Math.max(...values.value.map((v) => v || 0), 0));
const axis = computed(() => {
  const magnitude = Math.max(Math.abs(low.value), high.value, 1),
    base = 10 ** Math.floor(Math.log10(magnitude));
  let ceiling = Math.ceil(magnitude / base) * base;
  if (!props.metric.endsWith('Cny')) ceiling = Math.ceil(ceiling / 2) * 2;
  return {
    min: low.value < 0 ? -ceiling : 0,
    max: high.value > 0 || low.value === 0 ? ceiling : 0,
  };
});
const axisTicks = computed(() => [
  axis.value.min,
  (axis.value.min + axis.value.max) / 2,
  axis.value.max,
]);
const plot = computed(() => Math.max(width.value - 66, 100));
const x = (i: number) => 52 + ((i + 0.5) * plot.value) / props.days.length;
const y = (n: number) =>
  226 - ((n - axis.value.min) / (axis.value.max - axis.value.min)) * 190;
const ticks = computed(() =>
  props.days
    .map((d, i) => ({ d, i }))
    .filter(
      (_, i) =>
        i === 0 ||
        i === props.days.length - 1 ||
        (i % Math.ceil(props.days.length / (width.value < 500 ? 3 : 7)) === 0 &&
          i < props.days.length - 2),
    ),
);
const active = computed(() =>
  selected.value === null ? undefined : props.days[selected.value],
);
let observer: ResizeObserver;
onMounted(() => {
  observer = new ResizeObserver(
    ([entry]) => (width.value = Math.max(260, entry.contentRect.width)),
  );
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => observer?.disconnect());
watch(
  () => props.metric,
  () => (selected.value = null),
);
function point(event: PointerEvent) {
  const rect = host.value!.getBoundingClientRect();
  selected.value = Math.max(
    0,
    Math.min(
      props.days.length - 1,
      Math.floor(
        ((event.clientX - rect.left - 52) / plot.value) * props.days.length,
      ),
    ),
  );
}
function key(event: KeyboardEvent) {
  if (
    event.key === 'Enter' &&
    selected.value !== null &&
    values.value[selected.value] !== null
  ) {
    event.preventDefault();
    emit('inspect', props.days[selected.value].date);
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    selected.value =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? props.days.length - 1
          : Math.max(
              0,
              Math.min(
                props.days.length - 1,
                (selected.value ?? -1) + (event.key === 'ArrowRight' ? 1 : -1),
              ),
            );
  }
}
</script>
<template>
  <div
    ref="host"
    class="stats-chart"
    tabindex="0"
    role="group"
    :aria-label="`${label.label}趋势图，左右方向键逐日查看，下方有每日明细表`"
    @pointermove="point"
    @pointerleave="selected = null"
    @keydown="key"
    @focus="selected = Math.min(lastSelected, days.length - 1)"
    @blur="selected = null"
    @click="
      selected !== null &&
      values[selected] !== null &&
      emit('inspect', days[selected].date)
    "
  >
    <div class="chart-readout" aria-live="polite">
      <span>{{ active?.date || '每日趋势' }}</span
      ><strong
        >{{ active ? numberText(active[metric]) : label.label
        }}<small v-if="active && active[metric] !== null">{{
          label.unit
        }}</small></strong
      >
    </div>
    <svg
      v-if="hasData"
      :viewBox="`0 0 ${width} 264`"
      role="img"
      :aria-label="label.label + '每日趋势'"
    >
      <g v-for="step in axisTicks" :key="step">
        <line
          x1="52"
          :x2="width - 14"
          :y1="y(step)"
          :y2="y(step)"
          class="chart-grid"
        />
        <text x="44" :y="y(step) + 4" text-anchor="end">
          {{ numberText(step) }}
        </text>
      </g>
      <template v-for="(value, i) in values" :key="i">
        <rect
          v-if="value !== null"
          :x="x(i) - (plot / days.length) * 0.31"
          :y="Math.min(y(value), y(0))"
          :width="(plot / days.length) * 0.62"
          :height="Math.abs(y(value) - y(0))"
          rx="1"
          class="chart-bar"
          :class="{ 'chart-selected': selected === i }"
        />
      </template>
      <line
        v-if="selected !== null"
        :x1="x(selected)"
        :x2="x(selected)"
        y1="30"
        y2="226"
        class="chart-guide"
      />
      <text
        v-for="tick in ticks"
        :key="tick.i"
        :x="x(tick.i)"
        y="250"
        text-anchor="middle"
      >
        {{ tick.d.date.slice(5).replace('-', '/') }}
      </text>
    </svg>
    <div v-else class="chart-empty">
      <strong>尚无活跃采集记录</strong>
      <p>启用采集后显示趋势；历史缺失日期保留为空。</p>
    </div>
  </div>
</template>
<style scoped>
.stats-chart {
  position: relative;
  min-width: 0;
  padding-top: 4px;
  outline-offset: 4px;
}
.chart-readout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 40px;
  font-size: 13px;
  color: var(--muted-foreground);
}
.chart-readout strong {
  font-size: 16px;
  color: var(--foreground);
  font-variant-numeric: tabular-nums;
}
.chart-readout small {
  margin-left: 5px;
  font-weight: 400;
}
svg {
  width: 100%;
  display: block;
}
svg text {
  fill: var(--muted-foreground);
  font-size: 11px;
}
.chart-grid {
  stroke: var(--border);
  stroke-dasharray: 3 4;
}
.chart-bar {
  fill: var(--primary);
  opacity: 0.7;
}
.chart-selected {
  opacity: 1;
}
.chart-guide {
  stroke: var(--muted-foreground);
  stroke-dasharray: 3 3;
  pointer-events: none;
}
.chart-empty {
  min-height: 245px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--muted-foreground);
  text-align: center;
  font-size: 13px;
  gap: 10px;
}
</style>
