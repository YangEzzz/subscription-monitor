"use strict";
const api_subscriptions = require("../../api/subscriptions.js");
const pages_subscription_subscriptionData = require("../../pages/subscription/subscription-data.js");
const components_subscription_spendingHistory = require("./spending-history.js");
const common_vendor = require("../../common/vendor.js");
const AsyncStateView = () => "./AsyncStateView.js";
const UiSkeleton = () => "./UiSkeleton.js";
const DisplayAmount = () => "./DisplayAmount.js";
const DonutChart = () => "./DonutChart.js";
const EmptyStateView = () => "./EmptyStateView.js";
const _sfc_main = {
  name: "SpendingHistoryView",
  components: {
    AsyncStateView,
    UiSkeleton,
    DisplayAmount,
    DonutChart,
    EmptyStateView
  },
  emits: ["month-change", "currency-change", "open-detail"],
  props: {
    month: { type: String, required: true },
    currency: { type: String, default: "CNY" },
    currencies: { type: Array, default: () => [] },
    revision: { type: Array, default: () => [] },
    formatMoney: { type: Function, required: true },
    compactAmount: { type: Function, required: true }
  },
  data() {
    return {
      result: null,
      loading: false,
      error: "",
      requestId: 0,
      todayMonth: components_subscription_spendingHistory.currentMonth()
    };
  },
  computed: {
    showCurrencyBreakdown() {
      var _a;
      return ((_a = this.result) == null ? void 0 : _a.totalsByCurrency.some(
        (group) => group.currency !== this.currency
      )) || false;
    },
    monthLabel() {
      const [year, month] = this.month.split("-");
      return `${year}年${Number(month)}月`;
    },
    currencyOptions() {
      var _a;
      return [
        .../* @__PURE__ */ new Set([
          this.currency,
          ...this.currencies,
          ...((_a = this.result) == null ? void 0 : _a.currencies) || []
        ])
      ];
    },
    categories() {
      return this.result.categoryStats.map((item) => {
        const name = api_subscriptions.CATEGORIES[item.category] || item.category;
        return {
          ...item,
          name,
          color: pages_subscription_subscriptionData.CATEGORY_COLORS[name] || pages_subscription_subscriptionData.CATEGORY_COLORS["其他"]
        };
      });
    },
    trend() {
      const max = Math.max(1, ...this.result.trend.map((item) => item.value));
      return this.result.trend.map((item) => ({
        ...item,
        plotHeight: item.value / max * 100
      }));
    }
  },
  watch: {
    month() {
      this.load();
    },
    currency() {
      this.load();
    },
    revision: {
      deep: true,
      handler() {
        this.load();
      }
    }
  },
  mounted() {
    this.load();
  },
  beforeUnmount() {
    this.requestId++;
  },
  methods: {
    shiftMonth: components_subscription_spendingHistory.shiftMonth,
    load(append = false) {
      return components_subscription_spendingHistory.loadSpendingHistory(this, append);
    },
    selectMonth(value) {
      if (/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value) && value <= this.todayMonth && value !== this.month)
        this.$emit("month-change", value);
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  const _component_ui_skeleton = common_vendor.resolveComponent("ui-skeleton");
  const _component_display_amount = common_vendor.resolveComponent("display-amount");
  const _component_donut_chart = common_vendor.resolveComponent("donut-chart");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  (_easycom_uni_icons2 + _component_async_state_view + _component_ui_skeleton + _component_display_amount + _component_donut_chart + _component_empty_state_view)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      type: "left",
      size: "18",
      color: "var(--ink-2)"
    }),
    b: common_vendor.o(($event) => $options.selectMonth($options.shiftMonth($props.month, -1)), "d8"),
    c: common_vendor.t($options.monthLabel),
    d: "选择支出月份，当前" + $props.month,
    e: $props.month,
    f: $data.todayMonth,
    g: common_vendor.o(($event) => $options.selectMonth($event.detail.value), "44"),
    h: common_vendor.p({
      type: "right",
      size: "18",
      color: "var(--ink-2)"
    }),
    i: $props.month >= $data.todayMonth ? 1 : "",
    j: $props.month >= $data.todayMonth,
    k: common_vendor.o(($event) => $options.selectMonth($options.shiftMonth($props.month, 1)), "43"),
    l: common_vendor.t($props.currency),
    m: $options.currencyOptions,
    n: $options.currencyOptions.indexOf($props.currency),
    o: common_vendor.o(($event) => _ctx.$emit("currency-change", $options.currencyOptions[$event.detail.value]), "e5"),
    p: $props.month !== $data.todayMonth
  }, $props.month !== $data.todayMonth ? {
    q: common_vendor.o(($event) => $options.selectMonth($data.todayMonth), "f8")
  } : {}, {
    r: $data.error
  }, $data.error ? {
    s: common_vendor.o(($event) => $options.load(Boolean($data.result)), "8f"),
    t: common_vendor.p({
      compact: true,
      title: "支出记录暂时不可用",
      description: $data.error,
      busy: $data.loading,
      ["action-label"]: "重试"
    })
  } : {}, {
    v: $data.loading && !$data.result
  }, $data.loading && !$data.result ? {
    w: common_vendor.p({
      variant: "hero"
    }),
    x: common_vendor.p({
      variant: "list"
    })
  } : {}, {
    y: $data.result
  }, $data.result ? common_vendor.e({
    z: common_vendor.t($props.currency),
    A: $data.result.count > $data.result.unknownCount
  }, $data.result.count > $data.result.unknownCount ? {
    B: common_vendor.p({
      value: $props.formatMoney($data.result.total, $props.currency)
    })
  } : {
    C: common_vendor.t($data.result.count ? "金额待补充" : "暂无支出记录")
  }, {
    D: common_vendor.t($data.result.count),
    E: $data.result.unknownCount
  }, $data.result.unknownCount ? {
    F: common_vendor.t($data.result.unknownCount)
  } : {}, {
    G: $options.showCurrencyBreakdown
  }, $options.showCurrencyBreakdown ? {
    H: common_vendor.f($data.result.totalsByCurrency, (group, k0, i0) => {
      return {
        a: common_vendor.t(group.currency),
        b: common_vendor.t(group.count),
        c: common_vendor.t(group.count === group.unknownCount ? "金额待补充" : $props.formatMoney(group.total, group.currency)),
        d: group.currency,
        e: group.currency === $props.currency ? 1 : "",
        f: "查看" + group.currency + "支出",
        g: group.currency === $props.currency,
        h: common_vendor.o(($event) => _ctx.$emit("currency-change", group.currency), group.currency)
      };
    })
  } : {}, {
    I: $data.result.categoryStats.length
  }, $data.result.categoryStats.length ? {
    J: common_vendor.t($props.currency),
    K: common_vendor.p({
      segments: $options.categories,
      title: Number($props.month.slice(5)) + "月"
    }),
    L: common_vendor.f($options.categories, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.percent),
        d: common_vendor.t($props.formatMoney(item.value, $props.currency)),
        e: item.name
      };
    })
  } : {}, {
    M: common_vendor.t($props.currency),
    N: common_vendor.f($options.trend, (bar, k0, i0) => {
      return {
        a: common_vendor.t(bar.knownCount ? $props.compactAmount(bar.value) : "—"),
        b: bar.plotHeight + "%",
        c: common_vendor.t(Number(bar.month.slice(5))),
        d: bar.month,
        e: bar.month === $props.month ? 1 : "",
        f: bar.month === $props.month,
        g: bar.month + "，" + (bar.knownCount ? $props.formatMoney(bar.value, $props.currency) : bar.count ? "金额待补充" : "暂无支出记录"),
        h: common_vendor.o(($event) => $options.selectMonth(bar.month), bar.month)
      };
    }),
    O: common_vendor.t($props.currency),
    P: common_vendor.t($data.result.count),
    Q: !$data.result.count
  }, !$data.result.count ? {
    R: common_vendor.p({
      embedded: true,
      icon: "wallet",
      title: "暂无支出记录",
      description: "本月此币种没有已确认的续费记录，可切换月份或币种查看"
    })
  } : {}, {
    S: common_vendor.f($data.result.entries, (entry, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(entry.name),
        b: common_vendor.t(entry.billingDate),
        c: entry.deleted
      }, entry.deleted ? {} : {}, {
        d: common_vendor.t(entry.amount === null ? "金额待补充" : $props.formatMoney(entry.amount, entry.currency)),
        e: !entry.deleted
      }, !entry.deleted ? {} : {}, {
        f: entry.subscriptionId + "-" + entry.id,
        g: entry.deleted,
        h: entry.name + "，账期" + entry.billingDate + (entry.deleted ? "，订阅已移入回收站" : "，查看订阅详情"),
        i: common_vendor.o(($event) => _ctx.$emit("open-detail", {
          id: entry.subscriptionId
        }), entry.subscriptionId + "-" + entry.id)
      });
    }),
    T: $data.result.meta.hasMore
  }, $data.result.meta.hasMore ? {
    U: common_vendor.t($data.loading ? "正在加载…" : "加载更多"),
    V: $data.loading,
    W: common_vendor.o(($event) => $options.load(true), "ac")
  } : {}, {
    X: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "var(--blue)"
    })
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SpendingHistoryView.js.map
