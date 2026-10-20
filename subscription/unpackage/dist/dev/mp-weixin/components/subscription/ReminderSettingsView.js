"use strict";
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const _sfc_main = {
  components: { PageHeader },
  name: "ReminderSettingsView",
  emits: ["back", "toggle-reminder", "update-setting"],
  props: {
    reminderOptions: { type: Array, default: () => [] },
    settings: { type: Object, required: true }
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_page_header + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o(($event) => _ctx.$emit("back"), "02"),
    b: common_vendor.p({
      title: "默认提醒规则",
      secondary: true
    }),
    c: common_vendor.p({
      type: "notification-filled",
      size: "24",
      color: "var(--blue)"
    }),
    d: common_vendor.f($props.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(option.label),
        b: common_vendor.t(option.desc),
        c: $props.settings.defaultReminders.includes(option.value)
      }, $props.settings.defaultReminders.includes(option.value) ? {
        d: "63844e1e-2-" + i0,
        e: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "var(--surface)"
        })
      } : {}, {
        f: $props.settings.defaultReminders.includes(option.value) ? 1 : "",
        g: option.value,
        h: $props.settings.defaultReminders.includes(option.value),
        i: common_vendor.o(($event) => _ctx.$emit("toggle-reminder", option.value), option.value)
      });
    }),
    e: common_vendor.t($props.settings.timezone),
    f: common_vendor.t($props.settings.reminderTime),
    g: common_vendor.p({
      type: "right",
      size: "16",
      color: "var(--ink-4)"
    }),
    h: $props.settings.reminderTime,
    i: common_vendor.o(($event) => _ctx.$emit("update-setting", {
      key: "reminderTime",
      value: $event.detail.value
    }), "b8"),
    j: common_vendor.o(($event) => _ctx.$emit("back"), "99")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/ReminderSettingsView.js.map
