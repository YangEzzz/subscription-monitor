"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SettingsRow",
  emits: ["tap", "change"],
  data() {
    return { switchRevision: 0 };
  },
  methods: {
    changeSwitch(event) {
      this.$emit("change", event.detail.value);
      this.$nextTick(() => {
        this.switchRevision++;
      });
    }
  },
  props: {
    disabled: { type: Boolean, default: false },
    icon: { type: String, required: true },
    iconClass: { type: String, default: "" },
    iconColor: { type: String, default: "#177e4b" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    switchable: { type: Boolean, default: false },
    checked: { type: Boolean, default: false },
    action: { type: Boolean, default: false }
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
      type: $props.icon,
      size: "18",
      color: $props.iconColor
    }),
    b: common_vendor.n($props.iconClass),
    c: common_vendor.t($props.title),
    d: common_vendor.t($props.description),
    e: $props.switchable
  }, $props.switchable ? {
    f: $data.switchRevision,
    g: $props.checked,
    h: $props.disabled,
    i: common_vendor.o((...args) => $options.changeSwitch && $options.changeSwitch(...args), "e9")
  } : $props.action ? {
    k: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    })
  } : {}, {
    j: $props.action,
    l: $props.disabled,
    m: common_vendor.o(($event) => !$props.disabled && _ctx.$emit("tap"), "82")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SettingsRow.js.map
