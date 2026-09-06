"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "StatSummaryCard",
  emits: ["currency-change", "period-change"],
  props: {
    currencies: { type: Array, default: () => [] },
    statsCurrency: { type: String, default: "CNY" },
    statsLabel: { type: String, default: "" },
    statPeriods: { type: Array, default: () => [] },
    statsPeriod: { type: String, default: "month" },
    statsTotal: { type: Number, default: 0 },
    statsSubscriptionCount: { type: Number, default: 0 },
    formatMoney: { type: Function, required: true }
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
    a: common_vendor.t($props.statsLabel),
    b: common_vendor.t($props.statsCurrency),
    c: common_vendor.p({
      type: "down",
      size: "12",
      color: "#177e4b"
    }),
    d: $props.currencies,
    e: $props.currencies.indexOf($props.statsCurrency),
    f: common_vendor.o(($event) => _ctx.$emit("currency-change", $props.currencies[$event.detail.value]), "42"),
    g: common_vendor.f($props.statPeriods, (period, k0, i0) => {
      return {
        a: common_vendor.t(period.label),
        b: period.value,
        c: $props.statsPeriod === period.value ? 1 : "",
        d: common_vendor.o(($event) => _ctx.$emit("period-change", period.value), period.value)
      };
    }),
    h: common_vendor.t($props.formatMoney($props.statsTotal, $props.statsCurrency)),
    i: common_vendor.t($props.statsSubscriptionCount),
    j: common_vendor.t($props.statsCurrency)
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/StatSummaryCard.js.map
