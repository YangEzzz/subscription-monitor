"use strict";
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const SettingsRow = () => "./SettingsRow.js";
const _sfc_main = {
  name: "SubscriptionAboutView",
  components: { PageHeader, SettingsRow },
  emits: ["back", "privacy"]
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _component_settings_row = common_vendor.resolveComponent("settings-row");
  (_component_page_header + _component_settings_row)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o(($event) => _ctx.$emit("back"), "a0"),
    b: common_vendor.p({
      title: "关于续订清单",
      secondary: true
    }),
    c: common_vendor.o(($event) => _ctx.$emit("privacy"), "80"),
    d: common_vendor.p({
      icon: "locked",
      ["icon-class"]: "blue-bg",
      ["icon-color"]: "var(--blue)",
      title: "隐私与数据说明",
      description: "了解账号登录与数据保存",
      action: true
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
