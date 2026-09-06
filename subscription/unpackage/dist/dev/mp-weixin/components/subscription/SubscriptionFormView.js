"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SubscriptionFormView",
  emits: ["back", "apply-template", "category-change", "currency-change", "change-cycle", "payment-change", "billing-date-change", "auto-renew-change", "set-trial", "trial-date-change", "toggle-reminder", "save"],
  props: {
    editingId: { type: [String, Number], default: null },
    form: { type: Object, required: true },
    serviceTemplates: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
    currencies: { type: Array, default: () => [] },
    cycles: { type: Array, default: () => [] },
    payments: { type: Array, default: () => [] },
    logoColors: { type: Array, default: () => [] },
    reminderOptions: { type: Array, default: () => [] },
    formError: { type: String, default: "" },
    todayKey: { type: String, required: true },
    formReminderPreview: { type: String, default: "未设置提醒" },
    formatDate: { type: Function, required: true },
    cycleText: { type: Function, required: true }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
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
    b: common_vendor.o(($event) => _ctx.$emit("back"), "33"),
    c: common_vendor.t($props.editingId ? "编辑订阅" : "新增订阅"),
    d: !$props.editingId
  }, !$props.editingId ? {
    e: common_vendor.f($props.serviceTemplates, (item, k0, i0) => {
      return {
        a: "ce39d180-1-" + i0,
        b: common_vendor.p({
          type: item.icon,
          size: "26",
          color: "#ffffff"
        }),
        c: item.color,
        d: common_vendor.t(item.short),
        e: item.name,
        f: common_vendor.o(($event) => _ctx.$emit("apply-template", item), item.name)
      };
    })
  } : {}, {
    f: $props.form.name,
    g: common_vendor.o(common_vendor.m(($event) => $props.form.name = $event.detail.value, {
      trim: true
    }), "45"),
    h: $props.form.plan,
    i: common_vendor.o(common_vendor.m(($event) => $props.form.plan = $event.detail.value, {
      trim: true
    }), "9e"),
    j: common_vendor.t($props.form.category),
    k: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    l: $props.categories,
    m: common_vendor.o(($event) => _ctx.$emit("category-change", $props.categories[$event.detail.value]), "33"),
    n: common_vendor.f($props.logoColors, (color, k0, i0) => {
      return {
        a: color,
        b: `选择品牌色 ${color}`,
        c: $props.form.color === color ? 1 : "",
        d: color,
        e: common_vendor.o(($event) => $props.form.color = color, color)
      };
    }),
    o: common_vendor.t($props.form.currency),
    p: $props.currencies,
    q: $props.currencies.indexOf($props.form.currency),
    r: common_vendor.o(($event) => _ctx.$emit("currency-change", $props.currencies[$event.detail.value]), "07"),
    s: $props.form.amount,
    t: common_vendor.o(($event) => $props.form.amount = $event.detail.value, "fd"),
    v: common_vendor.t($props.cycleText($props.form)),
    w: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    x: $props.cycles,
    y: common_vendor.o(($event) => _ctx.$emit("change-cycle", $props.cycles[$event.detail.value]), "4a"),
    z: $props.form.cycle === "自定义天数"
  }, $props.form.cycle === "自定义天数" ? {
    A: $props.form.cycleValue,
    B: common_vendor.o(($event) => $props.form.cycleValue = $event.detail.value, "b4")
  } : {}, {
    C: common_vendor.t($props.form.payment),
    D: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    E: $props.payments,
    F: common_vendor.o(($event) => _ctx.$emit("payment-change", $props.payments[$event.detail.value]), "58"),
    G: common_vendor.t($props.form.autoRenew ? "扣费" : "到期"),
    H: common_vendor.t($props.formatDate($props.form.nextBillingDate)),
    I: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    J: $props.todayKey,
    K: $props.form.nextBillingDate,
    L: common_vendor.o(($event) => _ctx.$emit("billing-date-change", $event.detail.value), "a9"),
    M: common_vendor.t($props.form.autoRenew ? "按预计扣费提醒" : "仅作为普通到期待办"),
    N: $props.form.autoRenew,
    O: common_vendor.o(($event) => _ctx.$emit("auto-renew-change", $event.detail.value), "89"),
    P: common_vendor.t($props.form.trial ? "试用期内显示试用中" : "非试用订阅"),
    Q: $props.form.trial,
    R: common_vendor.o(($event) => _ctx.$emit("set-trial", $event.detail.value), "1a"),
    S: $props.form.trial
  }, $props.form.trial ? {
    T: common_vendor.t($props.form.trialEndDate ? $props.formatDate($props.form.trialEndDate) : "请选择"),
    U: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    V: $props.todayKey,
    W: $props.form.trialEndDate,
    X: common_vendor.o(($event) => _ctx.$emit("trial-date-change", $event.detail.value), "32")
  } : {}, {
    Y: common_vendor.f($props.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: $props.form.reminders.includes(option.value)
      }, $props.form.reminders.includes(option.value) ? {
        b: "ce39d180-7-" + i0,
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "12",
          color: "#177e4b"
        })
      } : {}, {
        d: common_vendor.t(option.label),
        e: option.value,
        f: $props.form.reminders.includes(option.value) ? 1 : "",
        g: common_vendor.o(($event) => _ctx.$emit("toggle-reminder", option.value), option.value)
      });
    }),
    Z: common_vendor.p({
      type: "notification",
      size: "14",
      color: "#3c9a68"
    }),
    aa: common_vendor.t($props.formReminderPreview),
    ab: $props.form.note,
    ac: common_vendor.o(common_vendor.m(($event) => $props.form.note = $event.detail.value, {
      trim: true
    }), "7a"),
    ad: $props.form.cancelGuide,
    ae: common_vendor.o(common_vendor.m(($event) => $props.form.cancelGuide = $event.detail.value, {
      trim: true
    }), "76"),
    af: $props.formError
  }, $props.formError ? {
    ag: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "#c5444c"
    }),
    ah: common_vendor.t($props.formError)
  } : {}, {
    ai: common_vendor.p({
      type: "checkmarkempty",
      size: "20",
      color: "#ffffff"
    }),
    aj: common_vendor.t($props.editingId ? "保存修改" : "保存订阅"),
    ak: common_vendor.o(($event) => _ctx.$emit("save"), "31")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionFormView.js.map
