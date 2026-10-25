"use strict";
const styles_uiPalette = require("../../styles/ui-palette.js");
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const DonutChart = () => "./DonutChart.js";
const StatSummaryCard = () => "./StatSummaryCard.js";
const EmptyStateView = () => "./EmptyStateView.js";
const _sfc_main = {
  name: "SubscriptionStatsView",
  components: { StatSummaryCard, EmptyStateView, PageHeader, DonutChart },
  emits: ["currency-change", "period-change", "open-form", "back"],
  computed: {
    chartTrend() {
      const max = Math.max(
        0,
        ...this.trendData.map((item) => Number(item.value) || 0)
      );
      return this.trendData.map((item) => ({
        ...item,
        plotHeight: max > 0 ? Number(item.value) / max * 100 : 0
      }));
    },
    periodLabel() {
      return this.statsPeriod === "year" ? "年度" : this.statsPeriod === "next" ? "未来30天" : "月均";
    },
    chartCategories() {
      const fixed = {
        影音娱乐: styles_uiPalette.UI_COLORS["cat-video"],
        云存储: styles_uiPalette.UI_COLORS["cat-cloud"],
        音乐: styles_uiPalette.UI_COLORS["cat-music"]
      };
      const extra = [
        .../* @__PURE__ */ new Set([
          ...this.categoryOrder,
          ...this.categoryStats.map((item) => item.name).sort()
        ])
      ].filter((name) => !fixed[name]);
      const palette = ["blue", "violet", "orange", "gold"];
      return this.categoryStats.map((item) => ({
        ...item,
        color: fixed[item.name] || styles_uiPalette.UI_COLORS[palette[extra.indexOf(item.name) % palette.length]]
      }));
    }
  },
  props: {
    categoryOrder: { type: Array, default: () => [] },
    navigationBarHeight: { type: Number, default: 0 },
    currencies: { type: Array, default: () => [] },
    statsCurrency: { type: String, default: "CNY" },
    statsLabel: { type: String, default: "本月预计支出" },
    statPeriods: { type: Array, default: () => [] },
    statsPeriod: { type: String, default: "month" },
    statsTotal: { type: Number, default: 0 },
    statsSubscriptionCount: { type: Number, default: 0 },
    categoryStats: { type: Array, default: () => [] },
    donutBackground: { type: String, default: "var(--surface-sunken)" },
    trendData: { type: Array, default: () => [] },
    formatMoney: { type: Function, required: true },
    compactAmount: { type: Function, required: true }
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _component_stat_summary_card = common_vendor.resolveComponent("stat-summary-card");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  const _component_donut_chart = common_vendor.resolveComponent("donut-chart");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_page_header + _component_stat_summary_card + _component_empty_state_view + _component_donut_chart + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => _ctx.$emit("back"), "b6"),
    b: common_vendor.p({
      title: "统计",
      secondary: true
    }),
    c: common_vendor.o(($event) => _ctx.$emit("currency-change", $event), "f4"),
    d: common_vendor.o(($event) => _ctx.$emit("period-change", $event), "47"),
    e: common_vendor.p({
      currencies: $props.currencies,
      ["stats-currency"]: $props.statsCurrency,
      ["stats-label"]: $props.statsLabel,
      ["stat-periods"]: $props.statPeriods,
      ["stats-period"]: $props.statsPeriod,
      ["stats-total"]: $props.statsTotal,
      ["stats-subscription-count"]: $props.statsSubscriptionCount,
      ["format-money"]: $props.formatMoney
    }),
    f: $props.statsSubscriptionCount === 0
  }, $props.statsSubscriptionCount === 0 ? {
    g: common_vendor.o(($event) => _ctx.$emit("open-form"), "06"),
    h: common_vendor.p({
      icon: "wallet",
      title: "暂无可统计的订阅",
      description: "添加包含金额的有效订阅后，这里会显示分类和趋势",
      ["action-label"]: "新增订阅"
    })
  } : {}, {
    i: $props.statsSubscriptionCount > 0
  }, $props.statsSubscriptionCount > 0 ? {
    j: common_vendor.t($options.periodLabel),
    k: common_vendor.p({
      segments: $options.chartCategories,
      title: $options.periodLabel
    }),
    l: common_vendor.f($options.chartCategories, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.percent),
        d: common_vendor.t($props.formatMoney(item.value, $props.statsCurrency)),
        e: item.percent + "%",
        f: item.color,
        g: item.name
      };
    }),
    m: common_vendor.t($props.statsCurrency),
    n: common_vendor.f($options.chartTrend, (bar, k0, i0) => {
      return {
        a: common_vendor.t($props.compactAmount(bar.value)),
        b: bar.plotHeight + "%",
        c: common_vendor.t(bar.month),
        d: bar.month
      };
    }),
    o: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "var(--blue)"
    })
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
