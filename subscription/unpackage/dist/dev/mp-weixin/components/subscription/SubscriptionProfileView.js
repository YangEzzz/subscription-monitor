"use strict";
const common_vendor = require("../../common/vendor.js");
const SettingsRow = () => "./SettingsRow.js";
const _sfc_main = {
  name: "SubscriptionProfileView",
  components: { SettingsRow },
  emits: [
    "open-membership",
    "notification-change",
    "open-reminder-settings",
    "weekly-summary-change",
    "default-currency-change",
    "export",
    "trash",
    "privacy",
    "reset-demo"
  ],
  props: {
    navigationBarHeight: { type: Number, default: 0 },
    liveSubscriptions: { type: Array, default: () => [] },
    monthlyAverageText: { type: String, default: "¥0.00" },
    settings: { type: Object, required: true },
    isMember: { type: Boolean, default: false },
    freeQuotaText: { type: String, default: "" },
    membershipQuotaPercent: { type: Number, default: 0 },
    currencies: { type: Array, default: () => [] },
    deletedSubscriptions: { type: Array, default: () => [] }
  },
  methods: {
    changeDefaultCurrency(event) {
      const currency = this.currencies[event.detail.value];
      this.$emit("default-currency-change", currency);
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_settings_row = common_vendor.resolveComponent("settings-row");
  (_easycom_uni_icons2 + _component_settings_row)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.navigationBarHeight + "px",
    b: common_vendor.t($props.liveSubscriptions.length),
    c: common_vendor.t($props.monthlyAverageText),
    d: common_vendor.p({
      type: $props.isMember ? "checkbox-filled" : "vip-filled",
      size: "22",
      color: "#ffffff"
    }),
    e: common_vendor.t($props.isMember ? "会员权益" : "升级会员"),
    f: common_vendor.t($props.isMember ? "会员已开启" : "开通会员"),
    g: common_vendor.t($props.isMember ? "无限新增订阅 · 模拟会员" : "解锁无限订阅，重要支出更从容"),
    h: common_vendor.p({
      type: "right",
      size: "18",
      color: $props.isMember ? "#3c7c5a" : "#9b6a28"
    }),
    i: !$props.isMember
  }, !$props.isMember ? {
    j: common_vendor.t($props.freeQuotaText),
    k: $props.membershipQuotaPercent + "%",
    l: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    m: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    n: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    })
  } : {}, {
    o: $props.isMember ? 1 : "",
    p: common_vendor.o(($event) => _ctx.$emit("open-membership"), "6e"),
    q: common_vendor.o(($event) => _ctx.$emit("notification-change", true), "ed"),
    r: common_vendor.p({
      icon: "notification",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "续费通知",
      description: "仅站内待办，尚未接入微信发送",
      action: true
    }),
    s: common_vendor.o(($event) => _ctx.$emit("open-reminder-settings"), "e6"),
    t: common_vendor.p({
      icon: "calendar",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "默认提醒规则",
      description: `提前 ${$props.settings.defaultReminders.join("、")} 天 · ${$props.settings.reminderTime}`,
      action: true
    }),
    v: common_vendor.o(($event) => _ctx.$emit("weekly-summary-change", $event), "18"),
    w: common_vendor.p({
      icon: "email",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "每周订阅摘要",
      description: "仅保存偏好，摘要发送尚未接入",
      switchable: true,
      checked: $props.settings.weeklySummary
    }),
    x: common_vendor.p({
      icon: "wallet",
      ["icon-class"]: "violet-bg",
      ["icon-color"]: "#6458c9",
      title: "默认币种",
      description: $props.settings.defaultCurrency,
      action: true
    }),
    y: $props.currencies,
    z: common_vendor.o((...args) => $options.changeDefaultCurrency && $options.changeDefaultCurrency(...args), "e4"),
    A: common_vendor.o(($event) => _ctx.$emit("export"), "c4"),
    B: common_vendor.p({
      icon: "download",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "导出订阅数据",
      description: "生成 CSV 或复制表格数据",
      action: true
    }),
    C: common_vendor.o(($event) => _ctx.$emit("trash"), "7a"),
    D: common_vendor.p({
      icon: "trash",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "回收站",
      description: $props.deletedSubscriptions.length ? `${$props.deletedSubscriptions.length} 条可恢复订阅` : "暂无已删除订阅",
      action: true
    }),
    E: common_vendor.o(($event) => _ctx.$emit("privacy"), "50"),
    F: common_vendor.p({
      icon: "locked",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "隐私与数据说明",
      description: "了解当前演示的数据边界",
      action: true
    }),
    G: common_vendor.o(($event) => _ctx.$emit("reset-demo"), "9a"),
    H: common_vendor.p({
      icon: "refresh",
      ["icon-class"]: "red-bg",
      ["icon-color"]: "#cc4b52",
      title: "重新加载数据",
      description: "从服务端刷新订阅与设置",
      action: true
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionProfileView.js.map
