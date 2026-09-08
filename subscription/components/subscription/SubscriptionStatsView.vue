<template>
  <view class="page stats-page">
    <view
      class="primary-titlebar"
      :style="{ height: navigationBarHeight + 'px' }"
      ><text class="page-title">支出统计</text></view
    >
    <stat-summary-card
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
    <view class="chart-card category-chart-card"
      ><view class="card-heading"
        ><text class="section-title">分类构成</text
        ><text>{{
          statsPeriod === "year"
            ? "年度"
            : statsPeriod === "next"
              ? "未来 30 天"
              : "月均"
        }}</text></view
      ><view class="category-chart-body"
        ><view class="donut" :style="{ background: donutBackground }"
          ><view class="donut-hole"
            ><text class="donut-value">{{
              statsPeriod === "year" ? "年度" : "月均"
            }}</text
            ><text class="donut-label">分类占比</text></view
          ></view
        ><view class="legend"
          ><view
            v-for="item in categoryStats"
            :key="item.name"
            class="legend-row"
            ><view
              class="legend-color"
              :style="{ backgroundColor: item.color }"
            ></view
            ><text class="legend-name">{{ item.name }}</text
            ><text class="legend-value">{{
              formatMoney(item.value, statsCurrency)
            }}</text
            ><text class="legend-percent">{{ item.percent }}%</text></view
          ></view
        ></view
      ></view
    >
    <view class="trend-card"
      ><view class="trend-head"
        ><view
          ><text class="section-title">支出趋势</text
          ><text class="trend-sub">按当前月均估算（6个月）</text></view
        ><text class="unit-label">币种：{{ statsCurrency }}</text></view
      ><view class="bar-chart"
        ><view v-for="bar in trendData" :key="bar.month" class="bar-column"
          ><text class="bar-value">{{ compactAmount(bar.value) }}</text
          ><view class="bar-track"
            ><view
              class="bar-fill"
              :style="{ height: bar.height + '%' }"
            ></view></view
          ><text>{{ bar.month }}</text></view
        ></view
      ></view
    >
    <view class="insight-card"
      ><view class="insight-icon"
        ><uni-icons type="info-filled" size="20" color="#177e4b" /></view
      ><view
        ><text class="insight-title">年度订阅可重点检查</text
        ><text class="insight-desc"
          >年度订阅单次扣费更高，建议至少提前 14 天确认是否继续使用。</text
        ></view
      ></view
    >
  </view>
</template>

<script>
import StatSummaryCard from "./StatSummaryCard.vue";

export default {
  name: "SubscriptionStatsView",
  components: { StatSummaryCard },
  emits: ["currency-change", "period-change"],
  props: {
    navigationBarHeight: { type: Number, default: 0 },
    currencies: { type: Array, default: () => [] },
    statsCurrency: { type: String, default: "CNY" },
    statsLabel: { type: String, default: "本月预计支出" },
    statPeriods: { type: Array, default: () => [] },
    statsPeriod: { type: String, default: "month" },
    statsTotal: { type: Number, default: 0 },
    statsSubscriptionCount: { type: Number, default: 0 },
    categoryStats: { type: Array, default: () => [] },
    donutBackground: { type: String, default: "#dfe9e2" },
    trendData: { type: Array, default: () => [] },
    formatMoney: { type: Function, required: true },
    compactAmount: { type: Function, required: true },
  },
};
</script>
