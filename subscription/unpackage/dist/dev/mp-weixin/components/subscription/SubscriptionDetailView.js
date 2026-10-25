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
    showHeader: { type: Boolean, default: true },
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
    a: $props.showHeader
  }, $props.showHeader ? {
    b: common_vendor.o(($event) => _ctx.$emit("back"), "a2"),
    c: common_vendor.p({
      title: "订阅详情",
      secondary: true,
      pinned: true,
      scrolled: $props.scrollOffset > 8
    })
  } : {}, {
    d: common_vendor.t($props.subscription.logo),
    e: common_vendor.s($options.logoPaint($props.subscription.color)),
    f: common_vendor.t($props.subscription.name),
    g: common_vendor.t($props.subscription.category),
    h: $props.subscription.plan
  }, $props.subscription.plan ? {
    i: common_vendor.t($props.subscription.plan)
  } : {}, {
    j: common_vendor.t($props.statusText($props.subscription)),
    k: common_vendor.n($props.getStatus($props.subscription)),
    l: common_vendor.t($props.subscription.cycle === "一次性" ? "预计付款" : $props.subscription.autoRenew ? "下次预计扣费" : "下次到期"),
    m: common_vendor.t($props.subscription.amount === null ? "金额待补充" : $props.formatMoney($props.subscription.amount, $props.subscription.currency)),
    n: $props.subscription.amount === null ? 1 : "",
    o: common_vendor.t($props.formatDate($props.subscription.nextBillingDate)),
    p: common_vendor.t($props.daysText($props.subscription)),
    q: common_vendor.n($options.dueTone($props.subscription.nextBillingDate)),
    r: $options.progress
  }, $options.progress ? {
    s: "scaleX(" + $options.progress.percent / 100 + ")",
    t: $options.progress.percent + "%",
    v: Math.round($options.progress.percent),
    w: common_vendor.t($props.formatDate($options.progress.start, false)),
    x: common_vendor.t($props.formatDate($options.progress.end, false)),
    y: common_vendor.t($props.subscription.autoRenew ? "扣费" : "到期")
  } : {}, {
    z: common_vendor.n("detail-tone-" + $props.getStatus($props.subscription)),
    A: common_vendor.p({
      type: "loop",
      size: "18",
      color: "var(--blue)"
    }),
    B: common_vendor.t($props.cycleText($props.subscription)),
    C: $props.subscription.cycle === "自定义天数" ? 1 : "",
    D: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "var(--green)"
    }),
    E: common_vendor.t($props.subscription.payment),
    F: common_vendor.p({
      type: "paperclip",
      size: "18",
      color: "var(--violet)"
    }),
    G: common_vendor.t($props.subscription.category),
    H: common_vendor.p({
      type: "reload",
      size: "18",
      color: "var(--orange)"
    }),
    I: $props.subscription.autoRenew ? 1 : "",
    J: common_vendor.t($props.subscription.autoRenew ? "已开启" : "未开启"),
    K: $props.subscription.trialEndDate && $props.daysUntil($props.subscription.trialEndDate) >= 0
  }, $props.subscription.trialEndDate && $props.daysUntil($props.subscription.trialEndDate) >= 0 ? {
    L: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "var(--violet)"
    }),
    M: common_vendor.t($props.formatDate($props.subscription.trialEndDate))
  } : {}, {
    N: common_vendor.t($props.notificationEnabled ? "通知可用" : "仅站内提醒"),
    O: common_vendor.n($props.notificationEnabled ? "blue" : "gray"),
    P: common_vendor.f($props.subscription.reminders, (day, k0, i0) => {
      return {
        a: common_vendor.t(day === 0 ? "当天" : `提前 ${day} 天`),
        b: day
      };
    }),
    Q: common_vendor.p({
      type: "calendar",
      size: "18",
      color: "var(--orange)"
    }),
    R: common_vendor.t($props.subscription.autoRenew ? "扣费日" : "到期日"),
    S: common_vendor.p({
      type: "notification",
      size: "16",
      color: $options.reminderWarning ? "var(--orange)" : "var(--blue)"
    }),
    T: common_vendor.n($options.reminderWarning ? "orange" : "blue"),
    U: common_vendor.t($props.selectedNextReminderText),
    V: $options.reminderWarning ? 1 : "",
    W: $props.renewalHistory.length
  }, $props.renewalHistory.length ? {
    X: common_vendor.t($props.subscription.renewalHistory.length),
    Y: common_vendor.f($props.renewalHistory, (record, k0, i0) => {
      return {
        a: common_vendor.t($props.formatDate(record.billingDate)),
        b: common_vendor.t($props.formatMoney(record.amount, record.currency || $props.subscription.currency)),
        c: record.confirmedAt
      };
    })
  } : {}, {
    Z: $props.subscription.note || $props.subscription.cancelGuide
  }, $props.subscription.note || $props.subscription.cancelGuide ? common_vendor.e({
    aa: $props.subscription.note
  }, $props.subscription.note ? {
    ab: common_vendor.t($props.subscription.note)
  } : {}, {
    ac: $props.subscription.cancelGuide
  }, $props.subscription.cancelGuide ? {
    ad: common_vendor.t($props.subscription.cancelGuide)
  } : {}) : {}, {
    ae: !["cancelled", "archived", "paused"].includes($props.subscription.status) || $props.renewalLocked && $props.subscription.status === "archived" && $props.subscription.cycle === "一次性"
  }, !["cancelled", "archived", "paused"].includes($props.subscription.status) || $props.renewalLocked && $props.subscription.status === "archived" && $props.subscription.cycle === "一次性" ? common_vendor.e({
    af: $props.renewalLocked
  }, $props.renewalLocked ? {
    ag: common_vendor.p({
      type: "checkbox-filled",
      size: "24",
      color: "var(--blue)"
    }),
    ah: common_vendor.t($props.subscription.cycle === "一次性" ? "本次付款已记录，订阅已归档。" : $props.formatDate($props.subscription.lastRenewedBillingDate, false) + " 已记录，下次预计 " + $props.formatDate($props.subscription.nextBillingDate, false) + " 扣费。"),
    ai: common_vendor.o(($event) => _ctx.$emit("undo-renewal"), "6b")
  } : $props.daysUntil($props.subscription.nextBillingDate) > 7 ? {
    ak: common_vendor.p({
      type: "calendar",
      size: "20",
      color: "var(--ink-3)"
    }),
    al: common_vendor.t($props.subscription.autoRenew ? "扣费" : "到期"),
    am: common_vendor.t($props.daysUntil($props.subscription.nextBillingDate)),
    an: common_vendor.p({
      type: "checkbox-filled",
      size: "18",
      color: "var(--blue)"
    }),
    ao: common_vendor.o(($event) => _ctx.$emit("confirm-renewal"), "e1")
  } : {
    ap: common_vendor.f($props.processTitle($props.subscription).split(/(\d+)/), (part, index, i0) => {
      return {
        a: common_vendor.t(part),
        b: index,
        c: /^\d+$/.test(part) ? 1 : ""
      };
    }),
    aq: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "var(--blue)"
    }),
    ar: common_vendor.o(($event) => _ctx.$emit("confirm-renewal"), "5b"),
    as: common_vendor.p({
      type: "redo",
      size: "20",
      color: "var(--orange)"
    }),
    at: common_vendor.o(($event) => _ctx.$emit("snooze"), "07"),
    av: common_vendor.p({
      type: "closeempty",
      size: "20",
      color: "var(--red)"
    }),
    aw: common_vendor.o(($event) => _ctx.$emit("cancel"), "03")
  }, {
    aj: $props.daysUntil($props.subscription.nextBillingDate) > 7,
    ax: $props.renewalLocked ? 1 : ""
  }) : {}, {
    ay: common_vendor.p({
      type: "more-filled",
      size: "19",
      color: "var(--blue)"
    }),
    az: common_vendor.o(($event) => _ctx.$emit("manage"), "07"),
    aA: common_vendor.p({
      type: "compose",
      size: "19",
      color: "var(--surface)"
    }),
    aB: common_vendor.o(($event) => _ctx.$emit("edit"), "04")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
