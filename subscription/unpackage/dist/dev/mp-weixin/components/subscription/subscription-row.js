"use strict";
const common_vendor = require("../../common/vendor.js");
const BrandLogo = () => "./brand-logo.js";
const _sfc_main = {
  name: "SubscriptionRow",
  components: { BrandLogo },
  emits: ["tap"],
  props: {
    item: { type: Object, required: true }
  }
};
if (!Array) {
  const _component_brand_logo = common_vendor.resolveComponent("brand-logo");
  _component_brand_logo();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      item: $props.item
    }),
    b: common_vendor.t($props.item.name),
    c: common_vendor.t($props.item.shortDate),
    d: common_vendor.t($props.item.amountText),
    e: common_vendor.t($props.item.days),
    f: common_vendor.n($props.item.days <= 7 ? "urgent" : "normal"),
    g: $props.item.displayStatus
  }, $props.item.displayStatus ? {
    h: common_vendor.t($props.item.displayStatus)
  } : {}, {
    i: common_vendor.o(($event) => _ctx.$emit("tap"), "60")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b2ba1050"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/subscription-row.js.map
