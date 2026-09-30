"use strict";
const common_vendor = require("../../common/vendor.js");
const StatSummaryCard = () => "./StatSummaryCard.js";
const EmptyStateView = () => "./EmptyStateView.js";
const _sfc_main = {
  name: "SubscriptionStatsView",
  components: { StatSummaryCard, EmptyStateView },
  emits: ["currency-change", "period-change", "open-form"],
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
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_stat_summary_card + _component_empty_state_view + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.navigationBarHeight + "px",
    b: common_vendor.o(($event) => _ctx.$emit("currency-change", $event), "9b"),
    c: common_vendor.o(($event) => _ctx.$emit("period-change", $event), "2f"),
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
    e: $props.statsSubscriptionCount === 0
  }, $props.statsSubscriptionCount === 0 ? {
    f: common_vendor.o(($event) => _ctx.$emit("open-form"), "cd"),
    g: common_vendor.p({
      icon: "wallet",
      title: "暂无可统计的订阅",
      description: "添加包含金额的有效订阅后，这里会显示分类和趋势",
      ["action-label"]: "新增订阅",
      ["action-class"]: "primary-button empty-add"
    })
  } : {}, {
    h: $props.statsSubscriptionCount > 0
  }, $props.statsSubscriptionCount > 0 ? {
    i: common_vendor.t($props.statsPeriod === "year" ? "年度" : $props.statsPeriod === "next" ? "未来 30 天" : "月均"),
    j: common_vendor.t($props.statsPeriod === "year" ? "年度" : "月均"),
    k: $props.donutBackground,
    l: common_vendor.f($props.categoryStats, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t($props.formatMoney(item.value, $props.statsCurrency)),
        d: common_vendor.t(item.percent),
        e: item.name
      };
    })
  } : {}, {
    m: $props.statsSubscriptionCount > 0
  }, $props.statsSubscriptionCount > 0 ? {
    n: common_vendor.t($props.statsCurrency),
    o: common_vendor.f($props.trendData, (bar, k0, i0) => {
      return {
        a: common_vendor.t($props.compactAmount(bar.value)),
        b: bar.height + "%",
        c: common_vendor.t(bar.month),
        d: bar.month
      };
    })
  } : {}, {
    p: $props.statsSubscriptionCount > 0
  }, $props.statsSubscriptionCount > 0 ? {
    q: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "#177e4b"
    })
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionStatsView.js.map
