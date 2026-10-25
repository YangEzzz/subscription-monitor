"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "DisplayAmount",
  props: { value: { type: String, required: true } },
  computed: {
    parts() {
      return this.value.match(/^([^\d]*)(\d+)(\.\d+)?$/);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $options.parts
  }, $options.parts ? {
    b: common_vendor.t($options.parts[1]),
    c: common_vendor.t($options.parts[2]),
    d: common_vendor.t($options.parts[3])
  } : {
    e: common_vendor.t($props.value)
  }, {
    f: $props.value,
    g: !$options.parts ? 1 : "",
    h: $props.value
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
