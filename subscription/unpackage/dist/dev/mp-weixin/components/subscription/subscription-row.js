"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SubscriptionRow",
  emits: ["tap"],
  props: { item: { type: Object, required: true } }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t(Number($props.item.nextBillingDate.slice(5, 7))),
    b: common_vendor.t($props.item.nextBillingDate.slice(8, 10)),
    c: common_vendor.t($props.item.name),
    d: common_vendor.t($props.item.shortDate),
    e: common_vendor.t($props.item.displayStatus || "待续费"),
    f: common_vendor.t($props.item.amountText),
    g: common_vendor.t($props.item.days < 0 ? "已逾期 " + Math.abs($props.item.days) + " 天" : $props.item.days === 0 ? "今天续费" : $props.item.days + " 天后"),
    h: $props.item.days <= 7 ? 1 : "",
    i: common_vendor.o(($event) => _ctx.$emit("tap"), "69")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/subscription-row.js.map
