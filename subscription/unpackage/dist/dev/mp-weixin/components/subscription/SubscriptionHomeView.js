"use strict";
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const DisplayAmount = () => "./DisplayAmount.js";
const EmptyStateView = () => "./EmptyStateView.js";
const SettingsRow = () => "./SettingsRow.js";
const SubscriptionRow = () => "./subscription-row.js";
const _sfc_main = {
  name: "SubscriptionHomeView",
  components: {
    SubscriptionRow,
    PageHeader,
    DisplayAmount,
    EmptyStateView,
    SettingsRow
  },
  emits: [
    "toggle-amount",
    "open-stats",
    "enable-notification",
    "switch-all",
    "open-detail",
    "open-form",
    "handle-reminder"
  ],
  props: {
    notificationReady: { type: Boolean, default: false },
    notificationDescription: { type: String, default: "" },
    notificationBusy: { type: Boolean, default: false },
    settings: { type: Object, required: true },
    navigationBarHeight: { type: Number, default: 0 },
    next30TotalText: { type: String, default: "¥0.00" },
    monthlyAverageText: { type: String, default: "¥0.00" },
    next30Subscriptions: { type: Array, default: () => [] },
    activeSubscriptions: { type: Array, default: () => [] },
    upcoming7: { type: Array, default: () => [] },
    upcoming30Later: { type: Array, default: () => [] },
    actionableReminders: { type: Array, default: () => [] },
    trendData: { type: Array, default: () => [] },
    decorateItem: { type: Function, required: true }
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_display_amount = common_vendor.resolveComponent("display-amount");
  const _component_subscription_row = common_vendor.resolveComponent("subscription-row");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  const _component_settings_row = common_vendor.resolveComponent("settings-row");
  (_component_page_header + _easycom_uni_icons2 + _component_display_amount + _component_subscription_row + _component_empty_state_view + _component_settings_row)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      title: "续订清单",
      subtitle: "近期扣费与待处理事项",
      online: true
    }),
    b: common_vendor.o(($event) => _ctx.$emit("open-stats"), "8b"),
    c: common_vendor.p({
      type: $props.settings.amountVisible ? "eye" : "eye-slash",
      size: "18",
      color: "var(--ink-3)"
    }),
    d: $props.settings.amountVisible ? "隐藏金额" : "显示金额",
    e: common_vendor.o(($event) => _ctx.$emit("toggle-amount"), "46"),
    f: common_vendor.p({
      value: $props.settings.amountVisible ? $props.next30TotalText : "••••"
    }),
    g: common_vendor.t($props.next30Subscriptions.length),
    h: common_vendor.t($props.settings.amountVisible ? $props.monthlyAverageText : "•••"),
    i: common_vendor.f($props.next30Subscriptions, (item, index, i0) => {
      return {
        a: common_vendor.t(item.logo),
        b: item.id,
        c: index === 0 ? 1 : "",
        d: $props.decorateItem(item).days / 30 * 100 + "%",
        e: item.color || "var(--blue)",
        f: item.name + "，" + $props.decorateItem(item).shortDate
      };
    }),
    j: common_vendor.p({
      type: "loop",
      size: "20",
      color: "var(--blue)"
    }),
    k: common_vendor.t($props.activeSubscriptions.length),
    l: common_vendor.p({
      type: "notification",
      size: "20",
      color: "var(--orange)"
    }),
    m: common_vendor.t($props.upcoming7.length),
    n: common_vendor.t($props.activeSubscriptions.length),
    o: common_vendor.p({
      type: "right",
      size: "12",
      color: "var(--ink-3)"
    }),
    p: common_vendor.o(($event) => _ctx.$emit("switch-all"), "28"),
    q: $props.upcoming7.length
  }, $props.upcoming7.length ? {
    r: common_vendor.t($props.upcoming7.length)
  } : {}, {
    s: common_vendor.f($props.upcoming7, (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id),
        c: "e09cc250-6-" + i0,
        d: common_vendor.p({
          item: $props.decorateItem(item)
        })
      };
    }),
    t: $props.upcoming30Later.length
  }, $props.upcoming30Later.length ? {
    v: common_vendor.t($props.upcoming30Later.length)
  } : {}, {
    w: common_vendor.f($props.upcoming30Later.slice(0, 3), (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id),
        c: "e09cc250-7-" + i0,
        d: common_vendor.p({
          item: $props.decorateItem(item)
        })
      };
    }),
    x: !$props.next30Subscriptions.length
  }, !$props.next30Subscriptions.length ? {
    y: common_vendor.o(($event) => _ctx.$emit("open-form"), "da"),
    z: common_vendor.p({
      icon: "calendar",
      title: "未来 30 天暂无扣费",
      ["action-label"]: "新增订阅"
    })
  } : {}, {
    A: $props.next30Subscriptions.length > 4
  }, $props.next30Subscriptions.length > 4 ? {
    B: common_vendor.t($props.next30Subscriptions.length),
    C: common_vendor.o(($event) => _ctx.$emit("switch-all"), "f2")
  } : {}, {
    D: common_vendor.t($props.actionableReminders.length),
    E: common_vendor.f($props.actionableReminders, (reminder, k0, i0) => {
      return {
        a: reminder.key,
        b: common_vendor.o(($event) => _ctx.$emit("handle-reminder", reminder), reminder.key),
        c: "e09cc250-9-" + i0,
        d: common_vendor.p({
          icon: reminder.icon,
          ["icon-class"]: reminder.tone === "danger" ? "red-bg" : reminder.tone === "warning" ? "orange-bg" : reminder.tone === "success" ? "green-bg" : "blue-bg",
          ["icon-color"]: reminder.tone === "danger" ? "var(--red)" : reminder.tone === "warning" ? "var(--orange)" : reminder.tone === "success" ? "var(--green)" : "var(--blue)",
          title: reminder.title,
          description: reminder.desc,
          action: reminder.action !== "none",
          disabled: reminder.action === "notification" && $props.notificationBusy
        })
      };
    }),
    F: common_vendor.o(($event) => _ctx.$emit("open-form"), "f3")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionHomeView.js.map
