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
    "toggle-reminder",
    "save"
  ],
  props: {
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
    a: common_vendor.o(($event) => _ctx.$emit("back"), "25"),
    b: common_vendor.p({
      title: $props.editingId ? "编辑订阅" : "新增订阅",
      secondary: true,
      pinned: true,
      scrolled: $props.scrollOffset > 8
    }),
    c: common_vendor.p({
      type: "compose",
      size: "24",
      color: "var(--blue)"
    }),
    d: common_vendor.t($props.editingId ? "更新这项订阅" : "记录一项持续支出"),
    e: common_vendor.t($props.form.name ? Array.from($props.form.name)[0].toUpperCase() : "?"),
    f: common_vendor.s($options.logoPaint($props.form.color)),
    g: common_vendor.t($props.form.name || "服务名称"),
    h: !$props.form.name ? 1 : "",
    i: common_vendor.t($props.form.category),
    j: common_vendor.t($props.formatDate($props.form.nextBillingDate, false)),
    k: common_vendor.t($props.formatMoney($props.form.amount, $props.form.currency)),
    l: $props.form.amount === "" || $props.form.amount == null ? 1 : "",
    m: common_vendor.t($props.daysText($props.form)),
    n: common_vendor.n($options.dueTone($props.form.nextBillingDate)),
    o: !$props.editingId
  }, !$props.editingId ? {
    p: common_vendor.f($props.serviceTemplates, (item, k0, i0) => {
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
    q: Boolean($props.formError && !$props.form.name.trim()),
    r: $props.form.name,
    s: common_vendor.o(common_vendor.m(($event) => $props.form.name = $event.detail.value, {
      trim: true
    }), "e4"),
    t: $props.form.plan,
    v: common_vendor.o(common_vendor.m(($event) => $props.form.plan = $event.detail.value, {
      trim: true
    }), "5f"),
    w: common_vendor.t($props.form.category),
    x: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    y: $props.categories,
    z: common_vendor.o(($event) => _ctx.$emit("category-change", $props.categories[$event.detail.value]), "e1"),
    A: common_vendor.f($props.logoColors, (color, k0, i0) => {
      return common_vendor.e({
        a: $props.form.color === color
      }, $props.form.color === color ? {
        b: "303dfc86-3-" + i0,
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
    B: common_vendor.t($props.form.currency),
    C: common_vendor.p({
      type: "bottom",
      size: "11",
      color: "var(--blue)"
    }),
    D: $props.currencies,
    E: $props.currencies.indexOf($props.form.currency),
    F: common_vendor.o(($event) => _ctx.$emit("currency-change", $props.currencies[$event.detail.value]), "0e"),
    G: $props.form.amount,
    H: common_vendor.o(($event) => $props.form.amount = $event.detail.value, "57"),
    I: common_vendor.t($props.cycleText($props.form)),
    J: $props.form.cycle === "自定义天数" ? 1 : "",
    K: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    L: $props.cycles,
    M: common_vendor.o(($event) => _ctx.$emit("change-cycle", $props.cycles[$event.detail.value]), "cd"),
    N: $props.form.cycle === "自定义天数"
  }, $props.form.cycle === "自定义天数" ? {
    O: $props.form.cycleValue,
    P: common_vendor.o(($event) => $props.form.cycleValue = $event.detail.value, "51")
  } : {}, {
    Q: common_vendor.t($props.form.payment),
    R: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    S: $props.payments,
    T: common_vendor.o(($event) => _ctx.$emit("payment-change", $props.payments[$event.detail.value]), "78"),
    U: common_vendor.t($props.form.autoRenew ? "扣费" : "到期"),
    V: common_vendor.t($props.daysText($props.form)),
    W: common_vendor.n($options.dueTone($props.form.nextBillingDate)),
    X: common_vendor.t($props.formatDate($props.form.nextBillingDate)),
    Y: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    Z: $props.todayKey,
    aa: $props.form.nextBillingDate,
    ab: common_vendor.o(($event) => _ctx.$emit("billing-date-change", $event.detail.value), "5a"),
    ac: common_vendor.t($props.form.autoRenew ? "按预计扣费提醒" : "仅作为普通到期待办"),
    ad: $props.form.autoRenew,
    ae: common_vendor.o(($event) => _ctx.$emit("auto-renew-change", $event.detail.value), "33"),
    af: $props.form.autoRenew ? 1 : "",
    ag: common_vendor.t($props.form.trial ? "试用期内显示试用中" : "非试用订阅"),
    ah: $props.form.trial,
    ai: common_vendor.o(($event) => _ctx.$emit("set-trial", $event.detail.value), "b8"),
    aj: $props.form.trial ? 1 : "",
    ak: $props.form.trial
  }, $props.form.trial ? {
    al: common_vendor.t($props.form.trialEndDate ? $props.formatDate($props.form.trialEndDate) : "请选择"),
    am: Boolean($props.form.trialEndDate) ? 1 : "",
    an: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    ao: $props.todayKey,
    ap: $props.form.trialEndDate,
    aq: common_vendor.o(($event) => _ctx.$emit("trial-date-change", $event.detail.value), "8b")
  } : {}, {
    ar: common_vendor.f($props.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: $props.form.reminders.includes(option.value)
      }, $props.form.reminders.includes(option.value) ? {
        b: "303dfc86-9-" + i0,
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
    as: common_vendor.p({
      type: "notification",
      size: "16",
      color: "var(--blue)"
    }),
    at: common_vendor.t($props.formReminderPreview),
    av: $props.form.note,
    aw: common_vendor.o(common_vendor.m(($event) => $props.form.note = $event.detail.value, {
      trim: true
    }), "07"),
    ax: $props.form.cancelGuide,
    ay: common_vendor.o(common_vendor.m(($event) => $props.form.cancelGuide = $event.detail.value, {
      trim: true
    }), "f7"),
    az: $props.formError
  }, $props.formError ? {
    aA: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "var(--red)"
    }),
    aB: common_vendor.t($props.formError)
  } : {}, {
    aC: common_vendor.p({
      type: "checkmarkempty",
      size: "20",
      color: "var(--surface)"
    }),
    aD: common_vendor.t($props.busy ? "正在保存" : $props.editingId ? "保存修改" : "保存订阅"),
    aE: $props.busy,
    aF: $props.busy ? "true" : "false",
    aG: common_vendor.o(($event) => _ctx.$emit("save"), "48")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionFormView.js.map
