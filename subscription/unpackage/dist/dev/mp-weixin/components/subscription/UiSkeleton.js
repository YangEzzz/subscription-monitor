"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "UiSkeleton",
  props: {
    variant: { type: String, default: "list" },
    rows: { type: Number, default: 3 },
    label: { type: String, default: "正在加载" }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.variant === "hero"
  }, $props.variant === "hero" ? {} : $props.variant === "chart" ? {
    c: common_vendor.f(6, (index, k0, i0) => {
      return {
        a: index
      };
    })
  } : $props.variant === "calendar" ? {
    e: common_vendor.f(35, (index, k0, i0) => {
      return {
        a: index
      };
    })
  } : {
    f: common_vendor.f($props.rows, (index, k0, i0) => {
      return {
        a: index
      };
    })
  }, {
    b: $props.variant === "chart",
    d: $props.variant === "calendar",
    g: common_vendor.n("skeleton-" + $props.variant),
    h: $props.label
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
