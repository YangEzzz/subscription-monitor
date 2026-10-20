"use strict";
const components_subscription_subscriptionPresentation = require("./subscription-presentation.js");
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const _sfc_main = {
  name: "SubscriptionDetailView",
  components: { PageHeader },
  methods: { dueTone: components_subscription_subscriptionPresentation.dueTone, logoPaint: components_subscription_subscriptionPresentation.logoPaint },
  computed: {
    progress() {
      return components_subscription_subscriptionPresentation.cycleProgress(this.subscription);
    },
    reminderWarning() {
      return !this.notificationEnabled || this.subscription.amount === null || ["paused", "cancelled", "archived"].includes(this.subscription.status);
    }
  },
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
    scrollOffset: { type: Number, default: 0 },
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
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_page_header + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => _ctx.$emit("back"), "33"),
    b: common_vendor.p({
      title: "订阅详情",
      secondary: true,
      pinned: true,
      scrolled: $props.scrollOffset > 8
    }),
    c: common_vendor.t($props.subscription.logo),
    d: common_vendor.s($options.logoPaint($props.subscription.color)),
    e: common_vendor.t($props.subscription.name),
    f: common_vendor.t($props.subscription.category),
    g: $props.subscription.plan
  }, $props.subscription.plan ? {
    h: common_vendor.t($props.subscription.plan)
  } : {}, {
    i: common_vendor.t($props.statusText($props.subscription)),
    j: common_vendor.n($props.getStatus($props.subscription)),
    k: common_vendor.t($props.subscription.cycle === "一次性" ? "预计付款" : $props.subscription.autoRenew ? "下次预计扣费" : "下次到期"),
    l: common_vendor.t($props.subscription.amount === null ? "金额待补充" : $props.formatMoney($props.subscription.amount, $props.subscription.currency)),
    m: $props.subscription.amount === null ? 1 : "",
    n: common_vendor.t($props.formatDate($props.subscription.nextBillingDate)),
    o: common_vendor.t($props.daysText($props.subscription)),
    p: common_vendor.n($options.dueTone($props.subscription.nextBillingDate)),
    q: $options.progress
  }, $options.progress ? {
    r: "scaleX(" + $options.progress.percent / 100 + ")",
    s: $options.progress.percent + "%",
    t: Math.round($options.progress.percent),
    v: common_vendor.t($props.formatDate($options.progress.start, false)),
    w: common_vendor.t($props.formatDate($options.progress.end, false)),
    x: common_vendor.t($props.subscription.autoRenew ? "扣费" : "到期")
  } : {}, {
    y: common_vendor.n("detail-tone-" + $props.getStatus($props.subscription)),
    z: common_vendor.p({
      type: "loop",
      size: "18",
      color: "var(--blue)"
    }),
    A: common_vendor.t($props.cycleText($props.subscription)),
    B: $props.subscription.cycle === "自定义天数" ? 1 : "",
    C: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "var(--green)"
    }),
    D: common_vendor.t($props.subscription.payment),
    E: common_vendor.p({
      type: "paperclip",
      size: "18",
      color: "var(--violet)"
    }),
    F: common_vendor.t($props.subscription.category),
    G: common_vendor.p({
      type: "reload",
      size: "18",
      color: "var(--orange)"
    }),
    H: $props.subscription.autoRenew ? 1 : "",
    I: common_vendor.t($props.subscription.autoRenew ? "已开启" : "未开启"),
    J: $props.subscription.trialEndDate && $props.daysUntil($props.subscription.trialEndDate) >= 0
  }, $props.subscription.trialEndDate && $props.daysUntil($props.subscription.trialEndDate) >= 0 ? {
    K: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "var(--violet)"
    }),
    L: common_vendor.t($props.formatDate($props.subscription.trialEndDate))
  } : {}, {
    M: common_vendor.t($props.notificationEnabled ? "通知可用" : "仅站内提醒"),
    N: common_vendor.n($props.notificationEnabled ? "blue" : "gray"),
    O: common_vendor.f($props.subscription.reminders, (day, k0, i0) => {
      return {
        a: common_vendor.t(day === 0 ? "当天" : `提前 ${day} 天`),
        b: day
      };
    }),
    P: common_vendor.p({
      type: "calendar",
      size: "18",
      color: "var(--orange)"
    }),
    Q: common_vendor.t($props.subscription.autoRenew ? "扣费日" : "到期日"),
    R: common_vendor.p({
      type: "notification",
      size: "16",
      color: $options.reminderWarning ? "var(--orange)" : "var(--blue)"
    }),
    S: common_vendor.n($options.reminderWarning ? "orange" : "blue"),
    T: common_vendor.t($props.selectedNextReminderText),
    U: $options.reminderWarning ? 1 : "",
    V: $props.renewalHistory.length
  }, $props.renewalHistory.length ? {
    W: common_vendor.t($props.subscription.renewalHistory.length),
    X: common_vendor.f($props.renewalHistory, (record, k0, i0) => {
      return {
        a: common_vendor.t($props.formatDate(record.billingDate)),
        b: common_vendor.t($props.formatMoney(record.amount, record.currency || $props.subscription.currency)),
        c: record.confirmedAt
      };
    })
  } : {}, {
    Y: $props.subscription.note || $props.subscription.cancelGuide
  }, $props.subscription.note || $props.subscription.cancelGuide ? common_vendor.e({
    Z: $props.subscription.note
  }, $props.subscription.note ? {
    aa: common_vendor.t($props.subscription.note)
  } : {}, {
    ab: $props.subscription.cancelGuide
  }, $props.subscription.cancelGuide ? {
    ac: common_vendor.t($props.subscription.cancelGuide)
  } : {}) : {}, {
    ad: !["cancelled", "archived", "paused"].includes($props.subscription.status) || $props.renewalLocked && $props.subscription.status === "archived" && $props.subscription.cycle === "一次性"
  }, !["cancelled", "archived", "paused"].includes($props.subscription.status) || $props.renewalLocked && $props.subscription.status === "archived" && $props.subscription.cycle === "一次性" ? common_vendor.e({
    ae: $props.renewalLocked
  }, $props.renewalLocked ? {
    af: common_vendor.p({
      type: "checkbox-filled",
      size: "24",
      color: "var(--blue)"
    }),
    ag: common_vendor.t($props.subscription.cycle === "一次性" ? "本次付款已记录，订阅已归档。" : $props.formatDate($props.subscription.lastRenewedBillingDate, false) + " 已记录，下次预计 " + $props.formatDate($props.subscription.nextBillingDate, false) + " 扣费。"),
    ah: common_vendor.o(($event) => _ctx.$emit("undo-renewal"), "7c")
  } : $props.daysUntil($props.subscription.nextBillingDate) > 7 ? {
    aj: common_vendor.p({
      type: "calendar",
      size: "20",
      color: "var(--ink-3)"
    }),
    ak: common_vendor.t($props.subscription.autoRenew ? "扣费" : "到期"),
    al: common_vendor.t($props.daysUntil($props.subscription.nextBillingDate)),
    am: common_vendor.p({
      type: "checkbox-filled",
      size: "18",
      color: "var(--blue)"
    }),
    an: common_vendor.o(($event) => _ctx.$emit("confirm-renewal"), "df")
  } : {
    ao: common_vendor.f($props.processTitle($props.subscription).split(/(\d+)/), (part, index, i0) => {
      return {
        a: common_vendor.t(part),
        b: index,
        c: /^\d+$/.test(part) ? 1 : ""
      };
    }),
    ap: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "var(--blue)"
    }),
    aq: common_vendor.o(($event) => _ctx.$emit("confirm-renewal"), "e2"),
    ar: common_vendor.p({
      type: "redo",
      size: "20",
      color: "var(--orange)"
    }),
    as: common_vendor.o(($event) => _ctx.$emit("snooze"), "fe"),
    at: common_vendor.p({
      type: "closeempty",
      size: "20",
      color: "var(--red)"
    }),
    av: common_vendor.o(($event) => _ctx.$emit("cancel"), "28")
  }, {
    ai: $props.daysUntil($props.subscription.nextBillingDate) > 7,
    aw: $props.renewalLocked ? 1 : ""
  }) : {}, {
    ax: common_vendor.p({
      type: "more-filled",
      size: "19",
      color: "var(--blue)"
    }),
    ay: common_vendor.o(($event) => _ctx.$emit("manage"), "8b"),
    az: common_vendor.p({
      type: "compose",
      size: "19",
      color: "var(--surface)"
    }),
    aA: common_vendor.o(($event) => _ctx.$emit("edit"), "da")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionDetailView.js.map
