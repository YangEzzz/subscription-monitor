"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SubscriptionSaveBar",
  emits: ["save"],
  props: {
    busy: { type: Boolean, default: false },
    editingId: { type: [String, Number], default: null }
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
    a: common_vendor.p({
      type: "checkmarkempty",
      size: "20",
      color: "var(--surface)"
    }),
    b: common_vendor.t($props.busy ? "正在保存" : $props.editingId ? "保存修改" : "保存订阅"),
    c: $props.busy,
    d: $props.busy ? "true" : "false",
    e: common_vendor.o(($event) => _ctx.$emit("save"), "e7")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionSaveBar.js.map
