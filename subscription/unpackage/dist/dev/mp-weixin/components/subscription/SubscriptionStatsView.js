"use strict";
const common_vendor = require("../../common/vendor.js");
const StatSummaryCard = () => "./StatSummaryCard.js";
const _sfc_main = {
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
    compactAmount: { type: Function, required: true }
  }
};
if (!Array) {
  const _component_stat_summary_card = common_vendor.resolveComponent("stat-summary-card");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_stat_summary_card + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $props.navigationBarHeight + "px",
    b: common_vendor.o(($event) => _ctx.$emit("currency-change", $event), "1d"),
    c: common_vendor.o(($event) => _ctx.$emit("period-change", $event), "86"),
    d: common_vendor.p({
      currencies: $props.currencies,
      ["stats-currency"]: $props.statsCurrency,
      ["stats-label"]: $props.statsLabel,
      ["stat-periods"]: $props.statPeriods,
      ["stats-period"]: $props.statsPeriod,
      ["stats-total"]: $props.statsTotal,
      ["stats-subscription-count"]: $props.statsSubscriptionCount,
      ["format-money"]: $props.formatMoney
    }),
    e: common_vendor.t($props.statsPeriod === "year" ? "年度" : $props.statsPeriod === "next" ? "未来 30 天" : "月均"),
    f: common_vendor.t($props.statsPeriod === "year" ? "年度" : "月均"),
    g: $props.donutBackground,
    h: common_vendor.f($props.categoryStats, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t($props.formatMoney(item.value, $props.statsCurrency)),
        d: common_vendor.t(item.percent),
        e: item.name
      };
    }),
    i: common_vendor.t($props.statsCurrency),
    j: common_vendor.f($props.trendData, (bar, k0, i0) => {
      return {
        a: common_vendor.t($props.compactAmount(bar.value)),
        b: bar.height + "%",
        c: common_vendor.t(bar.month),
        d: bar.month
      };
    }),
    k: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "#177e4b"
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionStatsView.js.map
