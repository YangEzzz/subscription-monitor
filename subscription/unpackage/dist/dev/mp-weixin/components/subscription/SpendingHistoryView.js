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
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  const _component_ui_skeleton = common_vendor.resolveComponent("ui-skeleton");
  const _component_display_amount = common_vendor.resolveComponent("display-amount");
  const _component_donut_chart = common_vendor.resolveComponent("donut-chart");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_async_state_view + _component_ui_skeleton + _component_display_amount + _component_donut_chart + _component_empty_state_view + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => $options.selectMonth($options.shiftMonth($props.month, -1)), "d9"),
    b: common_vendor.t($options.monthLabel),
    c: "选择支出月份，当前" + $props.month,
    d: $props.month,
    e: $data.todayMonth,
    f: common_vendor.o(($event) => $options.selectMonth($event.detail.value), "83"),
    g: $props.month >= $data.todayMonth,
    h: common_vendor.o(($event) => $options.selectMonth($options.shiftMonth($props.month, 1)), "cc"),
    i: $props.month !== $data.todayMonth
  }, $props.month !== $data.todayMonth ? {
    j: common_vendor.o(($event) => $options.selectMonth($data.todayMonth), "51")
  } : {}, {
    k: common_vendor.t($props.currency),
    l: $options.currencyOptions,
    m: $options.currencyOptions.indexOf($props.currency),
    n: common_vendor.o(($event) => _ctx.$emit("currency-change", $options.currencyOptions[$event.detail.value]), "d7"),
    o: $data.error
  }, $data.error ? {
    p: common_vendor.o(($event) => $options.load(Boolean($data.result)), "a1"),
    q: common_vendor.p({
      compact: true,
      title: "支出记录暂时不可用",
      description: $data.error,
      busy: $data.loading,
      ["action-label"]: "重试"
    })
  } : {}, {
    r: $data.loading && !$data.result
  }, $data.loading && !$data.result ? {
    s: common_vendor.p({
      variant: "hero"
    }),
    t: common_vendor.p({
      variant: "list"
    })
  } : {}, {
    v: $data.result
  }, $data.result ? common_vendor.e({
    w: common_vendor.t($options.monthLabel),
    x: common_vendor.t($props.currency),
    y: $data.result.count > $data.result.unknownCount
  }, $data.result.count > $data.result.unknownCount ? {
    z: common_vendor.p({
      value: $props.formatMoney($data.result.total, $props.currency)
    })
  } : {
    A: common_vendor.t($data.result.count ? "金额待补充" : "暂无支出记录")
  }, {
    B: common_vendor.t($data.result.count),
    C: $data.result.unknownCount
  }, $data.result.unknownCount ? {
    D: common_vendor.t($data.result.unknownCount)
  } : {}, {
    E: $data.result.totalsByCurrency.length
  }, $data.result.totalsByCurrency.length ? {
    F: common_vendor.f($data.result.totalsByCurrency, (group, k0, i0) => {
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
    G: $data.result.categoryStats.length
  }, $data.result.categoryStats.length ? {
    H: common_vendor.t($props.currency),
    I: common_vendor.p({
      segments: $options.categories,
      title: Number($props.month.slice(5)) + "月"
    }),
    J: common_vendor.f($options.categories, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.percent),
        d: common_vendor.t($props.formatMoney(item.value, $props.currency)),
        e: item.name
      };
    })
  } : {}, {
    K: common_vendor.t($props.currency),
    L: common_vendor.f($options.trend, (bar, k0, i0) => {
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
    M: common_vendor.t($props.currency),
    N: common_vendor.t($data.result.count),
    O: !$data.result.count
  }, !$data.result.count ? {
    P: common_vendor.p({
      embedded: true,
      icon: "wallet",
      title: "暂无支出记录",
      description: "本月此币种没有已确认的续费记录，可切换月份或币种查看"
    })
  } : {}, {
    Q: common_vendor.f($data.result.entries, (entry, k0, i0) => {
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
    R: $data.result.meta.hasMore
  }, $data.result.meta.hasMore ? {
    S: common_vendor.t($data.loading ? "正在加载…" : "加载更多"),
    T: $data.loading,
    U: common_vendor.o(($event) => $options.load(true), "41")
  } : {}, {
    V: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "var(--blue)"
    })
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SpendingHistoryView.js.map
