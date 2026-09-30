"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "AsyncStateView",
  emits: ["action"],
  props: {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    busyLabel: { type: String, default: "正在重试" },
    tone: { type: String, default: "error" },
    compact: { type: Boolean, default: false },
    busy: { type: Boolean, default: false }
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
      type: $props.tone === "error" ? "info-filled" : "spinner-cycle",
      size: "20",
      color: $props.tone === "error" ? "#b43d47" : "#146747"
    }),
    b: common_vendor.t($props.title),
    c: common_vendor.t($props.description),
    d: $props.actionLabel
  }, $props.actionLabel ? {
    e: common_vendor.t($props.busy ? $props.busyLabel : $props.actionLabel),
    f: $props.busy,
    g: $props.busy ? "true" : "false",
    h: common_vendor.o(($event) => _ctx.$emit("action"), "38")
  } : {}, {
    i: common_vendor.n({
      compact: $props.compact
    }),
    j: common_vendor.n(`tone-${$props.tone}`),
    k: $props.tone === "error" ? "alert" : "status"
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-551f99ae"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/AsyncStateView.js.map
