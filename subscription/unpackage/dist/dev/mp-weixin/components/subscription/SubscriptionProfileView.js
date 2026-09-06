"use strict";
const common_vendor = require("../../common/vendor.js");
const SettingsRow = () => "./SettingsRow.js";
const _sfc_main = {
  name: "SubscriptionProfileView",
  components: { SettingsRow },
  emits: ["open-membership", "notification-change", "open-reminder-settings", "weekly-summary-change", "default-currency-change", "export", "trash", "privacy", "reset-demo"],
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
    d: common_vendor.t($props.settings.notificationEnabled ? "已开启" : "仅站内"),
    e: common_vendor.p({
      type: $props.isMember ? "checkbox-filled" : "vip-filled",
      size: "22",
      color: "#ffffff"
    }),
    f: common_vendor.t($props.isMember ? "会员权益" : "升级会员"),
    g: common_vendor.t($props.isMember ? "会员已开启" : "开通会员"),
    h: common_vendor.t($props.isMember ? "无限新增订阅 · 本地模拟会员" : "解锁无限订阅，重要支出更从容"),
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
    q: common_vendor.o(($event) => _ctx.$emit("open-membership"), "cb"),
    r: common_vendor.o(($event) => _ctx.$emit("notification-change", $event), "b2"),
    s: common_vendor.p({
      icon: "notification",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "续费通知",
      description: $props.settings.notificationEnabled ? "授权状态已保存" : "未开启",
      switchable: true,
      checked: $props.settings.notificationEnabled
    }),
    t: common_vendor.o(($event) => _ctx.$emit("open-reminder-settings"), "0d"),
    v: common_vendor.p({
      icon: "calendar",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "默认提醒规则",
      description: `提前 ${$props.settings.defaultReminders.join("、")} 天 · ${$props.settings.reminderTime}`,
      action: true
    }),
    w: common_vendor.o(($event) => _ctx.$emit("weekly-summary-change", $event), "ef"),
    x: common_vendor.p({
      icon: "email",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "每周订阅摘要",
      description: "每周一汇总未来扣费",
      switchable: true,
      checked: $props.settings.weeklySummary
    }),
    y: common_vendor.p({
      icon: "wallet",
      ["icon-class"]: "violet-bg",
      ["icon-color"]: "#6458c9",
      title: "默认币种",
      description: $props.settings.defaultCurrency,
      action: true
    }),
    z: $props.currencies,
    A: common_vendor.o(($event) => _ctx.$emit("default-currency-change", $props.currencies[$event.detail.value]), "16"),
    B: common_vendor.o(($event) => _ctx.$emit("export"), "ef"),
    C: common_vendor.p({
      icon: "download",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "导出订阅数据",
      description: "生成 CSV 或复制表格数据",
      action: true
    }),
    D: common_vendor.o(($event) => _ctx.$emit("trash"), "50"),
    E: common_vendor.p({
      icon: "trash",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "回收站",
      description: $props.deletedSubscriptions.length ? `${$props.deletedSubscriptions.length} 条可恢复订阅` : "暂无已删除订阅",
      action: true
    }),
    F: common_vendor.o(($event) => _ctx.$emit("privacy"), "1f"),
    G: common_vendor.p({
      icon: "locked",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "隐私与数据说明",
      description: "了解本地演示的数据边界",
      action: true
    }),
    H: common_vendor.o(($event) => _ctx.$emit("reset-demo"), "1e"),
    I: common_vendor.p({
      icon: "refresh",
      ["icon-class"]: "red-bg",
      ["icon-color"]: "#cc4b52",
      title: "恢复演示数据",
      description: "覆盖当前本地订阅与设置",
      action: true
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionProfileView.js.map
