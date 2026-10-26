<template>
  <view class="page stats-page redesign-page"
    ><page-header
      title="统计"
      secondary
      @back="$emit('back')"
    /><stat-summary-card
      :currencies="currencies"
      :stats-currency="statsCurrency"
      :stats-label="statsLabel"
      :stat-periods="statPeriods"
      :stats-period="statsPeriod"
      :stats-total="statsTotal"
      :stats-subscription-count="statsSubscriptionCount"
      :format-money="formatMoney"
      @currency-change="$emit('currency-change', $event)"
      @period-change="$emit('period-change', $event)"
    />
    <view v-if="statsSubscriptionCount === 0" class="rd-inset"
      ><empty-state-view
        icon="wallet"
        title="暂无可统计的订阅"
        description="添加包含金额的有效订阅后，这里会显示分类和趋势"
        action-label="新增订阅"
        @action="$emit('open-form')"
    /></view>
    <template v-if="statsSubscriptionCount > 0"
      ><view class="card rd-chart-card"
        ><view class="rd-chart-head"
          ><text class="card-title">分类构成</text
          ><text class="pill gray">{{ periodLabel }}</text></view
        ><view class="rd-category-body"
          ><donut-chart :segments="chartCategories" :title="periodLabel" /><view
            class="rd-legend"
            ><view
              v-for="item in chartCategories"
              :key="item.name"
              class="rd-legend-row"
              ><view class="rd-legend-top"
                ><view
                  class="rd-legend-dot"
                  :style="{ backgroundColor: item.color }"
                ></view
                ><text class="rd-legend-name">{{ item.name }}</text
                ><text class="rd-legend-percent num"
                  >{{ item.percent }}%</text
                ></view
              ><text class="rd-legend-value num">{{
                formatMoney(item.value, statsCurrency)
              }}</text
              ><view class="rd-legend-track"
                ><view
                  class="rd-legend-fill"
                  :style="{
                    width: item.percent + '%',
                    backgroundColor: item.color,
                  }"
                ></view></view></view></view></view
      ></view>
      <view class="card rd-chart-card"
        ><view class="rd-chart-head"
          ><view
            ><text class="card-title">未来支出估算</text
            ><text class="rd-chart-sub">按当前月均估算（6个月）</text></view
          ><text class="pill gray">币种：{{ statsCurrency }}</text></view
        ><view class="rd-bars"
          ><view
            v-for="bar in chartTrend"
            :key="bar.month"
            class="rd-bar-column"
            ><view class="rd-bar-track"
              ><view
                class="rd-bar-fill"
                :style="{ height: bar.plotHeight + '%' }"
                ><text class="rd-bar-value num">{{
                  compactAmount(bar.value)
                }}</text></view
              ></view
            ><text class="rd-bar-month num">{{ bar.month }}</text></view
          ></view
        ></view
      >
      <view class="card rd-insight"
        ><uni-icons type="info-filled" size="20" color="var(--blue)" /><view
          ><text class="rd-insight-title">先确认金额，再看估算</text
          ><text class="rd-insight-copy"
            >不同币种按参考汇率统一折算，结果仅供支出估算。未填写金额的订阅不计入，可在详情中补充。</text
          ><text v-if="exchangeRateNote" class="rd-insight-copy">{{ exchangeRateNote }}</text
          ></view
        ></view
      ></template
    ></view
  >
</template>
<script>
import PageHeader from "./PageHeader.vue";
import DonutChart from "./DonutChart.vue";
import { UI_COLORS } from "../../styles/ui-palette.js";
import StatSummaryCard from "./StatSummaryCard.vue";
import EmptyStateView from "./EmptyStateView.vue";

export default {
  name: "SubscriptionStatsView",
  components: { StatSummaryCard, EmptyStateView, PageHeader, DonutChart },
  emits: ["currency-change", "period-change", "open-form", "back"],
  computed: {
    chartTrend() {
      const max = Math.max(
        0,
        ...this.trendData.map((item) => Number(item.value) || 0),
      );
      return this.trendData.map((item) => ({
        ...item,
        plotHeight: max > 0 ? (Number(item.value) / max) * 100 : 0,
      }));
    },
    periodLabel() {
      return this.statsPeriod === "year"
        ? "年度"
        : this.statsPeriod === "next"
          ? "未来30天"
          : "月均";
    },
    chartCategories() {
      const fixed = {
        影音娱乐: UI_COLORS["cat-video"],
        云存储: UI_COLORS["cat-cloud"],
        音乐: UI_COLORS["cat-music"],
      };
      const extra = [
        ...new Set([
          ...this.categoryOrder,
          ...this.categoryStats.map((item) => item.name).sort(),
        ]),
      ].filter((name) => !fixed[name]);
      const palette = ["blue", "violet", "orange", "gold"];
      return this.categoryStats.map((item) => ({
        ...item,
        color:
          fixed[item.name] ||
          UI_COLORS[palette[extra.indexOf(item.name) % palette.length]],
      }));
    },
  },
  props: {
    categoryOrder: { type: Array, default: () => [] },
    navigationBarHeight: { type: Number, default: 0 },
    currencies: { type: Array, default: () => [] },
    statsCurrency: { type: String, default: "CNY" },
    exchangeRateNote: { type: String, default: "" },
    statsLabel: { type: String, default: "本月预计支出" },
    statPeriods: { type: Array, default: () => [] },
    statsPeriod: { type: String, default: "month" },
    statsTotal: { type: Number, default: 0 },
    statsSubscriptionCount: { type: Number, default: 0 },
    categoryStats: { type: Array, default: () => [] },
    donutBackground: { type: String, default: "var(--surface-sunken)" },
    trendData: { type: Array, default: () => [] },
    formatMoney: { type: Function, required: true },
    compactAmount: { type: Function, required: true },
  },
};
</script>
