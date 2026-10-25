"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "BrandLogo",
  props: {
    item: { type: Object, required: true }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($props.item.logo),
    b: $props.item.color || "var(--blue)"
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5fdb2501"]]);
wx.createComponent(Component);
