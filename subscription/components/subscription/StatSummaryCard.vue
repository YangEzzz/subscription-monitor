<template>
  <view class="stats-summary">
    <view class="stats-summary-head">
      <text class="stats-label">{{ statsLabel }}</text>
      <picker
        :range="currencies"
        :value="currencies.indexOf(statsCurrency)"
        @change="changeCurrency"
        ><view class="currency-filter"
          >{{ statsCurrency }}
          <uni-icons type="down" size="12" color="#177e4b" /></view
      ></picker>
    </view>
    <text class="stats-total">{{
      formatMoney(statsTotal, statsCurrency)
    }}</text>
    <text class="stats-compare"
      >基于 {{ statsSubscriptionCount }} 项 {{ statsCurrency }} 有效订阅 ·
      不自动换汇</text
    >
    <view class="stats-period-switch"
      ><button
        role="button"
        tabindex="0"
        v-for="period in statPeriods"
        :key="period.value"
        :aria-pressed="statsPeriod === period.value"
        :class="{ active: statsPeriod === period.value }"
        @tap="$emit('period-change', period.value)"
      >
        {{ period.label }}
      </button></view
    >
  </view>
</template>

<script>
export default {
  name: "StatSummaryCard",
  emits: ["currency-change", "period-change"],
  props: {
    currencies: { type: Array, default: () => [] },
    statsCurrency: { type: String, default: "CNY" },
    statsLabel: { type: String, default: "" },
    statPeriods: { type: Array, default: () => [] },
    statsPeriod: { type: String, default: "month" },
    statsTotal: { type: Number, default: 0 },
    statsSubscriptionCount: { type: Number, default: 0 },
    formatMoney: { type: Function, required: true },
  },
  methods: {
    changeCurrency(event) {
      const currency = this.currencies[event.detail.value];
      // H5 picker 会在关闭动画结束时重新挂载节点，先让其完成清理。
      // #ifdef H5
      setTimeout(() => this.$emit("currency-change", currency), 300);
      // #endif
      // #ifndef H5
      this.$emit("currency-change", currency);
      // #endif
    },
  },
};
</script>
