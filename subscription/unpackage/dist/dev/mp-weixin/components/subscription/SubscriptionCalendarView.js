"use strict";
const common_vendor = require("../../common/vendor.js");
const BrandLogo = () => "./brand-logo.js";
const _sfc_main = {
  name: "SubscriptionCalendarView",
  components: { BrandLogo },
  emits: ["change-month", "today", "select-date", "open-detail", "open-form"],
  props: {
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
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_brand_logo = common_vendor.resolveComponent("brand-logo");
  (_easycom_uni_icons2 + _component_brand_logo)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.navigationBarHeight + "px",
    b: common_vendor.p({
      type: "left",
      size: "19",
      color: "#5d655f"
    }),
    c: common_vendor.o(($event) => _ctx.$emit("change-month", -1), "d9"),
    d: common_vendor.t($props.calendarTitle),
    e: common_vendor.p({
      type: "right",
      size: "19",
      color: "#5d655f"
    }),
    f: common_vendor.o(($event) => _ctx.$emit("change-month", 1), "ba"),
    g: common_vendor.o(($event) => _ctx.$emit("today"), "d0"),
    h: common_vendor.f($props.weekdays, (day, k0, i0) => {
      return {
        a: common_vendor.t(day),
        b: day
      };
    }),
    i: common_vendor.f($props.calendarDays, (day, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(day.day),
        b: day.count
      }, day.count ? {
        c: common_vendor.t(day.count)
      } : {}, {
        d: day.amountText
      }, day.amountText ? {
        e: common_vendor.t(day.amountText)
      } : {}, {
        f: day.key,
        g: !day.currentMonth ? 1 : "",
        h: day.key === $props.selectedDate ? 1 : "",
        i: day.key === $props.todayKey ? 1 : "",
        j: common_vendor.o(($event) => _ctx.$emit("select-date", day.key), day.key)
      });
    }),
    j: common_vendor.t($props.selectedDateTitle),
    k: common_vendor.t($props.selectedWeekday),
    l: common_vendor.t($props.selectedDateSubscriptions.length),
    m: common_vendor.t($props.selectedDateTotalText),
    n: $props.selectedDateSubscriptions.length
  }, $props.selectedDateSubscriptions.length ? {
    o: common_vendor.f($props.selectedDateSubscriptions, (item, k0, i0) => {
      return {
        a: "64d86837-2-" + i0,
        b: common_vendor.p({
          item
        }),
        c: common_vendor.t(item.name),
        d: common_vendor.t($props.cycleText(item)),
        e: common_vendor.t(item.payment),
        f: common_vendor.t($props.formatMoney(item.amount, item.currency)),
        g: item.id,
        h: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id)
      };
    })
  } : {
    p: common_vendor.o(($event) => _ctx.$emit("open-form", $props.selectedDate), "ef")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionCalendarView.js.map
