"use strict";
const common_vendor = require("../../common/vendor.js");
const SubscriptionRow = () => "./subscription-row.js";
const _sfc_main = {
  name: "SubscriptionHomeView",
  components: { SubscriptionRow },
  emits: [
    "toggle-amount",
    "enable-notification",
    "switch-all",
    "open-detail",
    "open-form",
    "handle-reminder"
  ],
  props: {
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
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_subscription_row = common_vendor.resolveComponent("subscription-row");
  (_easycom_uni_icons2 + _component_subscription_row)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.navigationBarHeight + "px",
    b: common_vendor.p({
      type: $props.settings.amountVisible ? "eye" : "eye-slash",
      size: "20",
      color: "#ffffff"
    }),
    c: common_vendor.o(($event) => _ctx.$emit("toggle-amount"), "ec"),
    d: common_vendor.t($props.settings.amountVisible ? $props.next30TotalText : "••••"),
    e: common_vendor.t($props.next30Subscriptions.length),
    f: common_vendor.t($props.settings.amountVisible ? $props.monthlyAverageText : "•••"),
    g: common_vendor.t($props.activeSubscriptions.length),
    h: common_vendor.t($props.upcoming7.length),
    i: !$props.settings.notificationEnabled
  }, !$props.settings.notificationEnabled ? {
    j: common_vendor.p({
      type: "notification",
      size: "20",
      color: "#a86210"
    }),
    k: common_vendor.o(($event) => _ctx.$emit("enable-notification"), "85"),
    l: common_vendor.o(($event) => _ctx.$emit("enable-notification"), "09")
  } : {}, {
    m: common_vendor.t($props.activeSubscriptions.length),
    n: common_vendor.p({
      type: "right",
      size: "14",
      color: "#747b76"
    }),
    o: common_vendor.o(($event) => _ctx.$emit("switch-all"), "7e"),
    p: $props.upcoming7.length
  }, $props.upcoming7.length ? {
    q: common_vendor.t($props.upcoming7.length)
  } : {}, {
    r: common_vendor.f($props.upcoming7, (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id),
        c: "e09cc250-3-" + i0,
        d: common_vendor.p({
          item: $props.decorateItem(item)
        })
      };
    }),
    s: $props.upcoming30Later.length
  }, $props.upcoming30Later.length ? {
    t: common_vendor.t($props.upcoming30Later.length)
  } : {}, {
    v: common_vendor.f($props.upcoming30Later.slice(0, 3), (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id),
        c: "e09cc250-4-" + i0,
        d: common_vendor.p({
          item: $props.decorateItem(item)
        })
      };
    }),
    w: !$props.next30Subscriptions.length
  }, !$props.next30Subscriptions.length ? {
    x: common_vendor.o(($event) => _ctx.$emit("open-form"), "26")
  } : {}, {
    y: $props.next30Subscriptions.length > 4
  }, $props.next30Subscriptions.length > 4 ? {
    z: common_vendor.t($props.next30Subscriptions.length),
    A: common_vendor.o(($event) => _ctx.$emit("switch-all"), "91")
  } : {}, {
    B: common_vendor.t($props.actionableReminders.length),
    C: common_vendor.f($props.actionableReminders, (reminder, k0, i0) => {
      return common_vendor.e({
        a: "e09cc250-5-" + i0,
        b: common_vendor.p({
          type: reminder.icon,
          size: "18",
          color: "#ffffff"
        }),
        c: common_vendor.n(reminder.tone),
        d: common_vendor.t(reminder.title),
        e: common_vendor.t(reminder.desc),
        f: reminder.action !== "none"
      }, reminder.action !== "none" ? {
        g: "e09cc250-6-" + i0,
        h: common_vendor.p({
          type: "right",
          size: "16",
          color: "#a2a7a3"
        })
      } : {}, {
        i: reminder.key,
        j: common_vendor.o(($event) => _ctx.$emit("handle-reminder", reminder), reminder.key)
      });
    }),
    D: common_vendor.p({
      type: "plus",
      size: "20",
      color: "#ffffff"
    }),
    E: common_vendor.o(($event) => _ctx.$emit("open-form"), "9c")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionHomeView.js.map
