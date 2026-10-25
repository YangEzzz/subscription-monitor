"use strict";
const components_subscription_platformInputs = require("./platform-inputs.js");
const components_subscription_subscriptionPresentation = require("./subscription-presentation.js");
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const _sfc_main = {
  components: { PageHeader },
  name: "SubscriptionFormView",
  data() {
    return { selectedTemplate: "" };
  },
  methods: { dueTone: components_subscription_subscriptionPresentation.dueTone, logoPaint: components_subscription_subscriptionPresentation.logoPaint },
  mounted() {
    components_subscription_platformInputs.syncNativeFieldLabels(this.$el);
  },
  updated() {
    components_subscription_platformInputs.syncNativeFieldLabels(this.$el);
  },
  watch: {
    formError(value) {
    }
  },
  emits: [
    "back",
    "apply-template",
    "category-change",
    "currency-change",
    "change-cycle",
    "payment-change",
    "billing-date-change",
    "auto-renew-change",
    "set-trial",
    "trial-date-change",
    "toggle-reminder"
  ],
  props: {
    showHeader: { type: Boolean, default: true },
    scrollOffset: { type: Number, default: 0 },
    formatMoney: { type: Function, required: true },
    daysText: { type: Function, required: true },
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
    busy: { type: Boolean, default: false },
    todayKey: { type: String, required: true },
    formReminderPreview: { type: String, default: "未设置提醒" },
    formatDate: { type: Function, required: true },
    cycleText: { type: Function, required: true }
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
    b: common_vendor.o(($event) => _ctx.$emit("back"), "fc"),
    c: common_vendor.p({
      title: $props.editingId ? "编辑订阅" : "新增订阅",
      secondary: true,
      pinned: true,
      scrolled: $props.scrollOffset > 8
    })
  } : {}, {
    d: common_vendor.p({
      type: "compose",
      size: "24",
      color: "var(--blue)"
    }),
    e: common_vendor.t($props.editingId ? "更新这项订阅" : "记录一项持续支出"),
    f: common_vendor.t($props.form.name ? Array.from($props.form.name)[0].toUpperCase() : "?"),
    g: common_vendor.s($options.logoPaint($props.form.color)),
    h: common_vendor.t($props.form.name || "服务名称"),
    i: !$props.form.name ? 1 : "",
    j: common_vendor.t($props.form.category),
    k: common_vendor.t($props.formatDate($props.form.nextBillingDate, false)),
    l: common_vendor.t($props.formatMoney($props.form.amount, $props.form.currency)),
    m: $props.form.amount === "" || $props.form.amount == null ? 1 : "",
    n: common_vendor.t($props.daysText($props.form)),
    o: common_vendor.n($options.dueTone($props.form.nextBillingDate)),
    p: !$props.editingId
  }, !$props.editingId ? {
    q: common_vendor.f($props.serviceTemplates, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.logo),
        b: common_vendor.s($options.logoPaint(item.color)),
        c: common_vendor.t(item.short),
        d: item.name,
        e: $data.selectedTemplate === item.name ? 1 : "",
        f: $data.selectedTemplate === item.name,
        g: common_vendor.o(($event) => {
          $data.selectedTemplate = item.name;
          _ctx.$emit("apply-template", item);
        }, item.name)
      };
    })
  } : {}, {
    r: Boolean($props.formError && !$props.form.name.trim()),
    s: $props.form.name,
    t: common_vendor.o(common_vendor.m(($event) => $props.form.name = $event.detail.value, {
      trim: true
    }), "46"),
    v: $props.form.plan,
    w: common_vendor.o(common_vendor.m(($event) => $props.form.plan = $event.detail.value, {
      trim: true
    }), "87"),
    x: common_vendor.t($props.form.category),
    y: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    z: $props.categories,
    A: common_vendor.o(($event) => _ctx.$emit("category-change", $props.categories[$event.detail.value]), "5c"),
    B: common_vendor.f($props.logoColors, (color, k0, i0) => {
      return common_vendor.e({
        a: $props.form.color === color
      }, $props.form.color === color ? {
        b: "ce39d180-3-" + i0,
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "18",
          color: "var(--surface)"
        })
      } : {}, {
        d: color,
        e: `选择品牌色 ${color}`,
        f: $props.form.color === color ? 1 : "",
        g: color,
        h: $props.form.color === color,
        i: common_vendor.o(($event) => $props.form.color = color, color)
      });
    }),
    C: common_vendor.t($props.form.currency),
    D: common_vendor.p({
      type: "bottom",
      size: "11",
      color: "var(--blue)"
    }),
    E: $props.currencies,
    F: $props.currencies.indexOf($props.form.currency),
    G: common_vendor.o(($event) => _ctx.$emit("currency-change", $props.currencies[$event.detail.value]), "1c"),
    H: $props.form.amount,
    I: common_vendor.o(($event) => $props.form.amount = $event.detail.value, "5d"),
    J: common_vendor.t($props.cycleText($props.form)),
    K: $props.form.cycle === "自定义天数" ? 1 : "",
    L: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    M: $props.cycles,
    N: common_vendor.o(($event) => _ctx.$emit("change-cycle", $props.cycles[$event.detail.value]), "52"),
    O: $props.form.cycle === "自定义天数"
  }, $props.form.cycle === "自定义天数" ? {
    P: $props.form.cycleValue,
    Q: common_vendor.o(($event) => $props.form.cycleValue = $event.detail.value, "87")
  } : {}, {
    R: common_vendor.t($props.form.payment),
    S: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    T: $props.payments,
    U: common_vendor.o(($event) => _ctx.$emit("payment-change", $props.payments[$event.detail.value]), "05"),
    V: common_vendor.t($props.form.autoRenew ? "扣费" : "到期"),
    W: common_vendor.t($props.daysText($props.form)),
    X: common_vendor.n($options.dueTone($props.form.nextBillingDate)),
    Y: common_vendor.t($props.formatDate($props.form.nextBillingDate)),
    Z: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    aa: $props.todayKey,
    ab: $props.form.nextBillingDate,
    ac: common_vendor.o(($event) => _ctx.$emit("billing-date-change", $event.detail.value), "80"),
    ad: common_vendor.t($props.form.autoRenew ? "按预计扣费提醒" : "仅作为普通到期待办"),
    ae: $props.form.autoRenew,
    af: common_vendor.o(($event) => _ctx.$emit("auto-renew-change", $event.detail.value), "a3"),
    ag: $props.form.autoRenew ? 1 : "",
    ah: common_vendor.t($props.form.trial ? "试用期内显示试用中" : "非试用订阅"),
    ai: $props.form.trial,
    aj: common_vendor.o(($event) => _ctx.$emit("set-trial", $event.detail.value), "88"),
    ak: $props.form.trial ? 1 : "",
    al: $props.form.trial
  }, $props.form.trial ? {
    am: common_vendor.t($props.form.trialEndDate ? $props.formatDate($props.form.trialEndDate) : "请选择"),
    an: Boolean($props.form.trialEndDate) ? 1 : "",
    ao: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    ap: $props.todayKey,
    aq: $props.form.trialEndDate,
    ar: common_vendor.o(($event) => _ctx.$emit("trial-date-change", $event.detail.value), "9c")
  } : {}, {
    as: common_vendor.f($props.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: $props.form.reminders.includes(option.value)
      }, $props.form.reminders.includes(option.value) ? {
        b: "ce39d180-9-" + i0,
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "12",
          color: "var(--blue)"
        })
      } : {}, {
        d: common_vendor.t(option.label),
        e: option.value,
        f: $props.form.reminders.includes(option.value) ? 1 : "",
        g: $props.form.reminders.includes(option.value),
        h: common_vendor.o(($event) => _ctx.$emit("toggle-reminder", option.value), option.value)
      });
    }),
    at: common_vendor.p({
      type: "notification",
      size: "16",
      color: "var(--blue)"
    }),
    av: common_vendor.t($props.formReminderPreview),
    aw: $props.form.note,
    ax: common_vendor.o(common_vendor.m(($event) => $props.form.note = $event.detail.value, {
      trim: true
    }), "c3"),
    ay: $props.form.cancelGuide,
    az: common_vendor.o(common_vendor.m(($event) => $props.form.cancelGuide = $event.detail.value, {
      trim: true
    }), "96"),
    aA: $props.formError
  }, $props.formError ? {
    aB: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "var(--red)"
    }),
    aC: common_vendor.t($props.formError)
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
