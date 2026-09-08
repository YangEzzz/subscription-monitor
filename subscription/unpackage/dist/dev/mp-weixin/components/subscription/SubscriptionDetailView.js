"use strict";
const common_vendor = require("../../common/vendor.js");
const BrandLogo = () => "./brand-logo.js";
const _sfc_main = {
  name: "SubscriptionDetailView",
  components: { BrandLogo },
  emits: [
    "back",
    "confirm-renewal",
    "undo-renewal",
    "snooze",
    "cancel",
    "manage",
    "edit"
  ],
  props: {
    subscription: { type: Object, required: true },
    notificationEnabled: { type: Boolean, default: false },
    renewalHistory: { type: Array, default: () => [] },
    renewalLocked: { type: Boolean, default: false },
    selectedNextReminderText: { type: String, default: "" },
    formatDate: { type: Function, required: true },
    formatMoney: { type: Function, required: true },
    daysText: { type: Function, required: true },
    cycleText: { type: Function, required: true },
    getStatus: { type: Function, required: true },
    statusText: { type: Function, required: true },
    daysUntil: { type: Function, required: true },
    processTitle: { type: Function, required: true }
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
    a: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    b: common_vendor.o(($event) => _ctx.$emit("back"), "86"),
    c: common_vendor.p({
      item: $props.subscription
    }),
    d: common_vendor.t($props.subscription.name),
    e: common_vendor.t($props.subscription.plan || $props.subscription.category),
    f: common_vendor.t($props.statusText($props.subscription)),
    g: common_vendor.n($props.getStatus($props.subscription)),
    h: common_vendor.t($props.subscription.cycle === "一次性" ? "预计付款" : $props.subscription.autoRenew ? "下次预计扣费" : "下次到期"),
    i: common_vendor.t($props.subscription.amount === null ? "金额待补充" : $props.formatMoney($props.subscription.amount, $props.subscription.currency)),
    j: common_vendor.t($props.formatDate($props.subscription.nextBillingDate)),
    k: common_vendor.t($props.daysText($props.subscription)),
    l: common_vendor.t($props.cycleText($props.subscription)),
    m: common_vendor.t($props.subscription.payment),
    n: common_vendor.t($props.subscription.category),
    o: common_vendor.t($props.subscription.autoRenew ? "已开启" : "未开启"),
    p: $props.subscription.trialEndDate && $props.daysUntil($props.subscription.trialEndDate) >= 0
  }, $props.subscription.trialEndDate && $props.daysUntil($props.subscription.trialEndDate) >= 0 ? {
    q: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "#a86210"
    }),
    r: common_vendor.t($props.formatDate($props.subscription.trialEndDate))
  } : {}, {
    s: common_vendor.t($props.notificationEnabled ? "通知可用" : "仅站内提醒"),
    t: common_vendor.f($props.subscription.reminders, (day, k0, i0) => {
      return {
        a: common_vendor.t(day === 0 ? "当天" : `提前 ${day} 天`),
        b: day
      };
    }),
    v: common_vendor.t($props.selectedNextReminderText),
    w: $props.renewalHistory.length
  }, $props.renewalHistory.length ? {
    x: common_vendor.t($props.subscription.renewalHistory.length),
    y: common_vendor.f($props.renewalHistory, (record, k0, i0) => {
      return {
        a: common_vendor.t($props.formatDate(record.billingDate)),
        b: common_vendor.t($props.formatMoney(record.amount, record.currency || $props.subscription.currency)),
        c: record.confirmedAt
      };
    })
  } : {}, {
    z: $props.subscription.note || $props.subscription.cancelGuide
  }, $props.subscription.note || $props.subscription.cancelGuide ? common_vendor.e({
    A: $props.subscription.note
  }, $props.subscription.note ? {
    B: common_vendor.t($props.subscription.note)
  } : {}, {
    C: $props.subscription.cancelGuide
  }, $props.subscription.cancelGuide ? {
    D: common_vendor.t($props.subscription.cancelGuide)
  } : {}) : {}, {
    E: !["cancelled", "archived", "paused"].includes($props.subscription.status) || $props.renewalLocked && $props.subscription.status === "archived" && $props.subscription.cycle === "一次性"
  }, !["cancelled", "archived", "paused"].includes($props.subscription.status) || $props.renewalLocked && $props.subscription.status === "archived" && $props.subscription.cycle === "一次性" ? common_vendor.e({
    F: $props.renewalLocked
  }, $props.renewalLocked ? {
    G: common_vendor.p({
      type: "checkbox-filled",
      size: "24",
      color: "#177e4b"
    }),
    H: common_vendor.t($props.subscription.cycle === "一次性" ? "本次付款已记录，订阅已归档。" : $props.formatDate($props.subscription.lastRenewedBillingDate, false) + " 已记录，下次预计 " + $props.formatDate($props.subscription.nextBillingDate, false) + " 扣费。"),
    I: common_vendor.o(($event) => _ctx.$emit("undo-renewal"), "62")
  } : $props.daysUntil($props.subscription.nextBillingDate) > 7 ? {
    K: common_vendor.p({
      type: "calendar",
      size: "20",
      color: "#8a9590"
    }),
    L: common_vendor.t($props.subscription.autoRenew ? "扣费" : "到期"),
    M: common_vendor.t($props.daysUntil($props.subscription.nextBillingDate)),
    N: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "#8a9590"
    }),
    O: common_vendor.o(($event) => _ctx.$emit("confirm-renewal"), "9b")
  } : {
    P: common_vendor.t($props.processTitle($props.subscription)),
    Q: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "#177e4b"
    }),
    R: common_vendor.o(($event) => _ctx.$emit("confirm-renewal"), "9f"),
    S: common_vendor.p({
      type: "redo",
      size: "20",
      color: "#9a601b"
    }),
    T: common_vendor.o(($event) => _ctx.$emit("snooze"), "6e"),
    U: common_vendor.p({
      type: "closeempty",
      size: "20",
      color: "#bd4048"
    }),
    V: common_vendor.o(($event) => _ctx.$emit("cancel"), "10")
  }, {
    J: $props.daysUntil($props.subscription.nextBillingDate) > 7,
    W: $props.renewalLocked ? 1 : ""
  }) : {}, {
    X: common_vendor.p({
      type: "more-filled",
      size: "19",
      color: "#177e4b"
    }),
    Y: common_vendor.o(($event) => _ctx.$emit("manage"), "86"),
    Z: common_vendor.p({
      type: "compose",
      size: "19",
      color: "#ffffff"
    }),
    aa: common_vendor.o(($event) => _ctx.$emit("edit"), "1b")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionDetailView.js.map
