"use strict";
const common_vendor = require("../../common/vendor.js");
const DisplayAmount = () => "./DisplayAmount.js";
const UiSelection = () => "./UiSelection.js";
const _sfc_main = {
  name: "StatSummaryCard",
  components: { DisplayAmount, UiSelection },
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
  },
  methods: {
    changeCurrency(event) {
      const currency = this.currencies[event.detail.value];
      this.$emit("currency-change", currency);
    }
  }
};
if (!Array) {
  const _component_display_amount = common_vendor.resolveComponent("display-amount");
  const _component_ui_selection = common_vendor.resolveComponent("ui-selection");
  (_component_display_amount + _component_ui_selection)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($props.statsLabel),
    b: common_vendor.t($props.statsCurrency),
    c: $props.currencies,
    d: $props.currencies.indexOf($props.statsCurrency),
    e: common_vendor.o((...args) => $options.changeCurrency && $options.changeCurrency(...args), "75"),
    f: common_vendor.p({
      value: $props.formatMoney($props.statsTotal, $props.statsCurrency)
    }),
    g: common_vendor.t($props.statsSubscriptionCount),
    h: common_vendor.t($props.statsCurrency),
    i: common_vendor.o(($event) => _ctx.$emit("period-change", $event), "d1"),
    j: common_vendor.p({
      options: $props.statPeriods,
      ["model-value"]: $props.statsPeriod,
      variant: "segmented",
      label: "统计口径"
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
