"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "PageHeader",
  emits: ["back"],
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    secondary: { type: Boolean, default: false },
    online: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    scrolled: { type: Boolean, default: false }
  },
  data() {
    return { top: 6, rowHeight: 44, capsuleSpace: 100 };
  },
  computed: {
    layout() {
      return {
        height: this.rowHeight + "px",
        paddingTop: this.top + "px",
        paddingRight: this.capsuleSpace + "px"
      };
    }
  },
  mounted() {
    var _a, _b;
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : common_vendor.index.getSystemInfoSync();
      const menu = (_b = (_a = common_vendor.index).getMenuButtonBoundingClientRect) == null ? void 0 : _b.call(_a);
      if ((menu == null ? void 0 : menu.width) && (menu == null ? void 0 : menu.height)) {
        this.top = Math.max(0, menu.top - (info.statusBarHeight || 0));
        this.rowHeight = this.top + menu.height;
        this.capsuleSpace = info.windowWidth - menu.left + 8;
      }
    } catch (_) {
    }
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
    a: $props.secondary
  }, $props.secondary ? {
    b: common_vendor.p({
      type: "left",
      size: "20",
      color: "var(--ink)"
    }),
    c: $props.disabled,
    d: common_vendor.o(($event) => _ctx.$emit("back"), "ca")
  } : {}, {
    e: common_vendor.t($props.title),
    f: common_vendor.n($props.secondary ? "navbar-title" : "page-head-title"),
    g: common_vendor.s($options.layout),
    h: $props.subtitle && !$props.secondary
  }, $props.subtitle && !$props.secondary ? common_vendor.e({
    i: $props.online
  }, $props.online ? {} : {}, {
    j: common_vendor.t($props.subtitle)
  }) : {}, {
    k: $props.secondary ? 1 : "",
    l: $props.pinned ? 1 : "",
    m: $props.pinned && $props.scrolled ? 1 : ""
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/PageHeader.js.map
