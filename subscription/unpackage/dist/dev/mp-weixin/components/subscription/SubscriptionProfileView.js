"use strict";
const common_vendor = require("../../common/vendor.js");
const SettingsRow = () => "./SettingsRow.js";
const _sfc_main = {
  name: "SubscriptionProfileView",
  components: { SettingsRow },
  emits: [
    "open-membership",
    "notification-change",
    "notification-history",
    "open-reminder-settings",
    "weekly-summary-change",
    "default-currency-change",
    "export",
    "trash",
    "privacy",
    "reset-demo"
  ],
  props: {
    notificationReady: { type: Boolean, default: false },
    notificationDescription: { type: String, default: "" },
    notificationBusy: { type: Boolean, default: false },
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
    d: common_vendor.t($props.notificationReady ? "微信通知" : "待开启"),
    e: common_vendor.p({
      type: $props.isMember ? "checkbox-filled" : "vip-filled",
      size: "22",
      color: "#ffffff"
    }),
    f: common_vendor.t($props.isMember ? "会员权益" : "升级会员"),
    g: common_vendor.t($props.isMember ? "会员已开启" : "开通会员"),
    h: common_vendor.t($props.isMember ? "无限新增订阅 · 模拟会员" : "解锁无限订阅，重要支出更从容"),
    i: common_vendor.p({
      type: "right",
      size: "18",
      color: $props.isMember ? "#3c7c5a" : "#9b6a28"
    }),
    j: !$props.isMember
  }, !$props.isMember ? {
    k: common_vendor.t($props.freeQuotaText),
    l: $props.membershipQuotaPercent + "%",
    m: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    n: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    o: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    })
  } : {}, {
    p: $props.isMember ? 1 : "",
    q: common_vendor.o(($event) => _ctx.$emit("open-membership"), "59"),
    r: common_vendor.o(($event) => _ctx.$emit("notification-change", true), "ee"),
    s: common_vendor.p({
      icon: "notification",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "续费通知",
      description: $props.notificationDescription,
      disabled: $props.notificationBusy,
      action: true
    }),
    t: $props.settings.notificationEnabled
  }, $props.settings.notificationEnabled ? {
    v: common_vendor.o(($event) => _ctx.$emit("notification-change", false), "44"),
    w: common_vendor.p({
      icon: "notification",
      title: "暂停微信通知",
      description: "暂停发送，保留已有授权次数",
      action: true,
      disabled: $props.notificationBusy
    })
  } : {}, {
    x: common_vendor.o(($event) => _ctx.$emit("notification-history"), "ab"),
    y: common_vendor.p({
      icon: "list",
      title: "通知发送记录",
      description: "查看最近的发送结果",
      action: true
    }),
    z: common_vendor.o(($event) => _ctx.$emit("open-reminder-settings"), "74"),
    A: common_vendor.p({
      icon: "calendar",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "默认提醒规则",
      description: `提前 ${$props.settings.defaultReminders.join("、")} 天 · ${$props.settings.reminderTime}`,
      action: true
    }),
    B: common_vendor.o(($event) => _ctx.$emit("weekly-summary-change", $event), "3d"),
    C: common_vendor.p({
      icon: "email",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "每周订阅摘要",
      description: "仅保存偏好，摘要发送尚未接入",
      switchable: true,
      checked: $props.settings.weeklySummary
    }),
    D: common_vendor.p({
      icon: "wallet",
      ["icon-class"]: "violet-bg",
      ["icon-color"]: "#6458c9",
      title: "默认币种",
      description: $props.settings.defaultCurrency,
      action: true
    }),
    E: $props.currencies,
    F: common_vendor.o((...args) => $options.changeDefaultCurrency && $options.changeDefaultCurrency(...args), "67"),
    G: common_vendor.o(($event) => _ctx.$emit("export"), "22"),
    H: common_vendor.p({
      icon: "download",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "导出订阅数据",
      description: "生成 CSV 或复制表格数据",
      action: true
    }),
    I: common_vendor.o(($event) => _ctx.$emit("trash"), "14"),
    J: common_vendor.p({
      icon: "trash",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "回收站",
      description: $props.deletedSubscriptions.length ? `${$props.deletedSubscriptions.length} 条可恢复订阅` : "暂无已删除订阅",
      action: true
    }),
    K: common_vendor.o(($event) => _ctx.$emit("privacy"), "d8"),
    L: common_vendor.p({
      icon: "locked",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "隐私与数据说明",
      description: "了解账号登录与数据保存",
      action: true
    }),
    M: common_vendor.o(($event) => _ctx.$emit("reset-demo"), "a7"),
    N: common_vendor.p({
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
