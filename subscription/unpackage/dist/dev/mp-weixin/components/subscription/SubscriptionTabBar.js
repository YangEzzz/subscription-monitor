"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SubscriptionTabBar",
  emits: ["switch"],
  props: {
    tabs: { type: Array, default: () => [] },
    activeView: { type: String, default: "home" }
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
  return {
    a: common_vendor.f($props.tabs, (tab, k0, i0) => {
      return {
        a: "711ff735-0-" + i0,
        b: common_vendor.p({
          type: $props.activeView === tab.key ? tab.activeIcon : tab.icon,
          size: "23",
          color: $props.activeView === tab.key ? "#16834d" : "#8e9690"
        }),
        c: common_vendor.t(tab.label),
        d: tab.key,
        e: $props.activeView === tab.key ? 1 : "",
        f: common_vendor.o(($event) => _ctx.$emit("switch", tab.key), tab.key)
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionTabBar.js.map
