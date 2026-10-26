"use strict";
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const SubscriptionRow = () => "./subscription-row.js";
const EmptyStateView = () => "./EmptyStateView.js";
const _sfc_main = {
  name: "SubscriptionCalendarView",
  components: { PageHeader, SubscriptionRow, EmptyStateView },
  emits: ["change-month", "today", "select-date", "open-detail", "open-form"],
  methods: {
    markersFor(key) {
      return this.renewalSubscriptions.filter(
        (item) => item.nextBillingDate === key
      );
    }
  },
  props: {
    renewalSubscriptions: { type: Array, default: () => [] },
    decorateItem: { type: Function, required: true },
    navigationBarHeight: { type: Number, default: 0 },
    calendarTitle: { type: String, default: "" },
    weekdays: { type: Array, default: () => [] },
    calendarDays: { type: Array, default: () => [] },
    selectedDate: { type: String, default: "" },
    selectedDateSubscriptions: { type: Array, default: () => [] },
    selectedDateTitle: { type: String, default: "" },
    selectedWeekday: { type: String, default: "" },
    selectedDateTotalText: { type: String, default: "¥0.00" },
    todayKey: { type: String, default: "" },
    formatMoney: { type: Function, required: true },
    cycleText: { type: Function, required: true }
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _component_subscription_row = common_vendor.resolveComponent("subscription-row");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  (_component_page_header + _component_subscription_row + _component_empty_state_view)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      title: "续费日历",
      subtitle: "按日期安排续费，查看每天的扣费明细"
    }),
    b: common_vendor.t($props.calendarTitle),
    c: common_vendor.o(($event) => _ctx.$emit("change-month", -1), "01"),
    d: common_vendor.o(($event) => _ctx.$emit("change-month", 1), "1c"),
    e: common_vendor.o(($event) => _ctx.$emit("today"), "22"),
    f: common_vendor.f($props.weekdays, (day, index, i0) => {
      return {
        a: common_vendor.t(day),
        b: day,
        c: index === 0 || index === 6 ? 1 : ""
      };
    }),
    g: common_vendor.f($props.calendarDays, (day, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(day.day),
        b: day.count
      }, day.count ? common_vendor.e({
        c: common_vendor.f($options.markersFor(day.key).slice(0, 3), (item, k1, i1) => {
          return {
            a: item.id,
            b: item.color || "var(--blue)"
          };
        }),
        d: day.count > 3
      }, day.count > 3 ? {
        e: common_vendor.t(day.count - 3)
      } : {}) : {}, {
        f: day.amountText
      }, day.amountText ? {
        g: common_vendor.t(day.amountText)
      } : {}, {
        h: day.key,
        i: !day.currentMonth ? 1 : "",
        j: day.key === $props.selectedDate ? 1 : "",
        k: day.key === $props.todayKey ? 1 : "",
        l: day.key === $props.selectedDate,
        m: day.key + "，" + (day.count ? day.count + "项续费" : "无续费") + (day.amountText ? "，" + day.amountText : ""),
        n: common_vendor.o(($event) => _ctx.$emit("select-date", day.key), day.key)
      });
    }),
    h: common_vendor.t($props.selectedDateTitle),
    i: common_vendor.t($props.selectedWeekday),
    j: common_vendor.t($props.selectedDateSubscriptions.length),
    k: common_vendor.t($props.selectedDateSubscriptions.length && $props.selectedDateSubscriptions.every((item) => item.amount === null) ? "金额待补充" : $props.selectedDateTotalText),
    l: common_vendor.f($props.selectedDateSubscriptions, (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id),
        c: "64d86837-1-" + i0,
        d: common_vendor.p({
          item: {
            ...$props.decorateItem(item),
            cycle: $props.cycleText(item),
            amountText: item.amount === null ? "金额待补充" : $props.formatMoney(item.amount, item.currency)
          }
        })
      };
    }),
    m: !$props.selectedDateSubscriptions.length
  }, !$props.selectedDateSubscriptions.length ? {
    n: common_vendor.o(($event) => _ctx.$emit("open-form", $props.selectedDate), "6b"),
    o: common_vendor.p({
      icon: "calendar",
      title: "当天没有续费项目",
      ["action-label"]: "添加到这一天"
    })
  } : {}, {
    p: $props.selectedDate
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionCalendarView.js.map
