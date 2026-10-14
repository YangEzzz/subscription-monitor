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
    "default-currency-change",
    "export",
    "trash",
    "privacy",
    "refresh"
  ],
  props: {
    membershipEntryEnabled: { type: Boolean, default: false },
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
    e: $props.membershipEntryEnabled
  }, $props.membershipEntryEnabled ? common_vendor.e({
    f: common_vendor.p({
      type: $props.isMember ? "checkbox-filled" : "vip-filled",
      size: "22",
      color: "#ffffff"
    }),
    g: common_vendor.t($props.isMember ? "会员权益" : "账号额度"),
    h: common_vendor.t($props.isMember ? "会员已开启" : "免费版"),
    i: common_vendor.t($props.isMember ? "无限新增订阅" : "查看订阅额度与可用功能"),
    j: common_vendor.p({
      type: "right",
      size: "18",
      color: $props.isMember ? "#3c7c5a" : "#9b6a28"
    }),
    k: !$props.isMember
  }, !$props.isMember ? {
    l: common_vendor.t($props.freeQuotaText),
    m: $props.membershipQuotaPercent + "%",
    n: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    o: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    p: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    })
  } : {}, {
    q: $props.isMember ? 1 : "",
    r: common_vendor.o(($event) => _ctx.$emit("open-membership"), "a6")
  }) : {}, {
    s: common_vendor.o(($event) => _ctx.$emit("notification-change", true), "09"),
    t: common_vendor.p({
      icon: "notification",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "续费通知",
      description: $props.notificationDescription,
      disabled: $props.notificationBusy,
      action: true
    }),
    v: $props.settings.notificationEnabled
  }, $props.settings.notificationEnabled ? {
    w: common_vendor.o(($event) => _ctx.$emit("notification-change", false), "80"),
    x: common_vendor.p({
      icon: "notification",
      title: "暂停微信通知",
      description: "暂停发送，保留已有授权",
      action: true,
      disabled: $props.notificationBusy
    })
  } : {}, {
    y: common_vendor.o(($event) => _ctx.$emit("notification-history"), "b6"),
    z: common_vendor.p({
      icon: "list",
      title: "通知发送记录",
      description: "查看最近的发送结果",
      action: true
    }),
    A: common_vendor.o(($event) => _ctx.$emit("open-reminder-settings"), "16"),
    B: common_vendor.p({
      icon: "calendar",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "默认提醒规则",
      description: `提前 ${$props.settings.defaultReminders.join("、")} 天 · ${$props.settings.reminderTime}`,
      action: true
    }),
    C: common_vendor.p({
      icon: "wallet",
      ["icon-class"]: "violet-bg",
      ["icon-color"]: "#6458c9",
      title: "默认币种",
      description: $props.settings.defaultCurrency,
      action: true
    }),
    D: $props.currencies,
    E: common_vendor.o((...args) => $options.changeDefaultCurrency && $options.changeDefaultCurrency(...args), "6b"),
    F: common_vendor.o(($event) => _ctx.$emit("export"), "b5"),
    G: common_vendor.p({
      icon: "download",
      ["icon-class"]: "green-bg",
      ["icon-color"]: "#177e4b",
      title: "导出订阅数据",
      description: "生成 CSV 或复制表格数据",
      action: true
    }),
    H: common_vendor.o(($event) => _ctx.$emit("trash"), "bd"),
    I: common_vendor.p({
      icon: "trash",
      ["icon-class"]: "orange-bg",
      ["icon-color"]: "#bb6b18",
      title: "回收站",
      description: $props.deletedSubscriptions.length ? `${$props.deletedSubscriptions.length} 条可恢复订阅` : "暂无已删除订阅",
      action: true
    }),
    J: common_vendor.o(($event) => _ctx.$emit("privacy"), "24"),
    K: common_vendor.p({
      icon: "locked",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "#3c7fc1",
      title: "隐私与数据说明",
      description: "了解账号登录与数据保存",
      action: true
    }),
    L: common_vendor.o(($event) => _ctx.$emit("refresh"), "51"),
    M: common_vendor.p({
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
