<template>
  <view class="card hero rd-stats-hero"
    ><view class="rd-hero-top"
      ><text class="rd-eyebrow">{{ statsLabel }}</text
      ><picker
        :range="currencies"
        :value="currencies.indexOf(statsCurrency)"
        @change="changeCurrency"
        ><view
          class="rd-currency pressable"
          role="button"
          aria-label="选择统计币种"
          >{{ statsCurrency }} ▾</view
        ></picker
      ></view
    ><display-amount :value="formatMoney(statsTotal, statsCurrency)" /><text
      class="rd-stats-compare"
      >基于 <text class="num">{{ statsSubscriptionCount }}</text> 项
      {{ statsCurrency }} 有效订阅 · 不自动换汇</text
    ><ui-selection
      :options="statPeriods"
      :model-value="statsPeriod"
      variant="segmented"
      label="统计口径"
      @select="$emit('period-change', $event)"
  /></view>
</template>

<script>
import DisplayAmount from "./DisplayAmount.vue";
import UiSelection from "./UiSelection.vue";
export default {
  name: "StatSummaryCard",
  components: { DisplayAmount, UiSelection },
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
