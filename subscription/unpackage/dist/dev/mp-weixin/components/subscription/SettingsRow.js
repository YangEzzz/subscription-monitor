"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SettingsRow",
  // 小程序的原生 tap/change 会冒泡，业务事件使用独立名称避免重复触发。
  emits: ["activate", "checked-change"],
  data() {
    return { switchRevision: 0 };
  },
  methods: {
    changeSwitch(event) {
      this.$emit("checked-change", event.detail.value);
      this.$nextTick(() => {
        this.switchRevision++;
      });
    }
  },
  props: {
    disabled: { type: Boolean, default: false },
    icon: { type: String, required: true },
    iconClass: { type: String, default: "" },
    iconColor: { type: String, default: "var(--blue)" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    value: { type: String, default: "" },
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
    d: $props.description
  }, $props.description ? {
    e: common_vendor.t($props.description)
  } : {}, {
    f: $props.value
  }, $props.value ? {
    g: common_vendor.t($props.value)
  } : {}, {
    h: $props.switchable
  }, $props.switchable ? {
    i: $data.switchRevision,
    j: $props.checked,
    k: $props.disabled,
    l: common_vendor.o((...args) => $options.changeSwitch && $options.changeSwitch(...args), "9c")
  } : $props.action ? {
    n: common_vendor.p({
      type: "right",
      size: "17",
      color: "var(--ink-4)"
    })
  } : {}, {
    m: $props.action,
    o: $props.action ? "button" : void 0,
    p: $props.action && !$props.disabled ? 0 : void 0,
    q: $props.action ? `${$props.title}，${$props.value || $props.description}` : void 0,
    r: $props.disabled,
    s: $props.disabled ? 1 : "",
    t: $props.action && !$props.disabled ? "row-pressed" : "none",
    v: common_vendor.o(($event) => !$props.disabled && _ctx.$emit("activate"), "c4")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
