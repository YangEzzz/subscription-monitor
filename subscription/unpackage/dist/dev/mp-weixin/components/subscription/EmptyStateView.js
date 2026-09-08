"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "EmptyStateView",
  emits: ["action"],
  props: {
    icon: { type: String, default: "search" },
    title: { type: String, default: "暂无内容" },
    description: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    actionClass: { type: String, default: "primary-button empty-add" }
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
      type: $props.icon,
      size: "30",
      color: "#4a9a6c"
    }),
    b: common_vendor.t($props.title),
    c: common_vendor.t($props.description),
    d: $props.actionLabel
  }, $props.actionLabel ? {
    e: common_vendor.t($props.actionLabel),
    f: common_vendor.n($props.actionClass),
    g: common_vendor.o(($event) => _ctx.$emit("action"), "6b")
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/EmptyStateView.js.map
