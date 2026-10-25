"use strict";
const common_vendor = require("../../common/vendor.js");
const BrandLogo = () => "./brand-logo.js";
const _sfc_main = {
  name: "SubscriptionRow",
  components: { BrandLogo },
  emits: ["activate"],
  props: {
    item: { type: Object, required: true },
    showDate: { type: Boolean, default: false },
    dateLabel: { type: String, default: "" }
  },
  computed: {
    statusTone() {
      return {
        即将到期: "orange",
        试用中: "violet",
        待处理: "orange",
        逾期未确认: "red",
        正常: "green"
      }[this.item.displayStatus] || "gray";
    },
    dueTone() {
      return this.item.days < 0 ? "overdue" : this.item.days <= 7 ? "hot" : this.item.days <= 14 ? "mid" : "far";
    }
  }
};
if (!Array) {
  const _component_brand_logo = common_vendor.resolveComponent("brand-logo");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_brand_logo + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      item: $props.item
    }),
    b: common_vendor.t($props.item.name),
    c: common_vendor.t($props.item.displayStatus || "待续费"),
    d: common_vendor.n($options.statusTone),
    e: common_vendor.t($props.item.cycle),
    f: common_vendor.t($props.item.payment),
    g: common_vendor.t($props.showDate ? $props.dateLabel || $props.item.shortDate : $props.item.shortDate),
    h: !$props.showDate
  }, !$props.showDate ? {
    i: common_vendor.t($props.item.plan || $props.item.category)
  } : {}, {
    j: common_vendor.t($props.item.amountText),
    k: $props.item.amount === null ? 1 : "",
    l: common_vendor.t($props.item.days < 0 ? "已逾期 " + Math.abs($props.item.days) + " 天" : $props.item.days === 0 ? "今天续费" : $props.item.days + " 天后"),
    m: common_vendor.n($options.dueTone),
    n: common_vendor.p({
      type: "right",
      size: "14",
      color: "var(--ink-4)"
    }),
    o: $props.item.days >= 0 && $props.item.days <= 7 ? 1 : "",
    p: $props.item.days < 0 ? 1 : "",
    q: `${$props.item.name}，${$props.item.shortDate}，${$props.item.amount === null ? "金额待补充" : $props.item.amountText}，${$props.item.displayStatus || "待续费"}`,
    r: common_vendor.o(($event) => _ctx.$emit("activate"), "3f")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
