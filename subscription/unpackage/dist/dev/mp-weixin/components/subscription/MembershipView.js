"use strict";
const common_vendor = require("../../common/vendor.js");
const SettingsRow = () => "./SettingsRow.js";
const _sfc_main = {
  name: "MembershipView",
  components: { SettingsRow },
  emits: ["back"],
  props: {
    isMember: { type: Boolean, default: false },
    freeQuotaValue: { type: String, default: "" },
    subscriptionLimit: { type: Number, default: null }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_settings_row = common_vendor.resolveComponent("settings-row");
  (_easycom_uni_icons2 + _component_settings_row)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    b: common_vendor.o(($event) => _ctx.$emit("back"), "fb"),
    c: common_vendor.t($props.isMember ? "会员版" : "免费版"),
    d: common_vendor.p({
      icon: "list",
      title: "订阅额度",
      description: "已使用 " + $props.freeQuotaValue
    }),
    e: common_vendor.p({
      icon: "cloud-upload",
      title: "账号数据",
      description: "订阅和设置跟随你的微信账号保存"
    }),
    f: common_vendor.p({
      icon: "notification",
      title: "微信续费通知",
      description: "需授权，每条通知使用一次授权"
    }),
    g: common_vendor.p({
      icon: "bars",
      title: "支出统计",
      description: "按币种查看月均、年度和未来 30 天支出"
    }),
    h: common_vendor.t($props.isMember ? "当前账号可不限数量新增订阅。" : "当前额度为 " + $props.subscriptionLimit + " 条，删除记录后可释放额度。会员购买暂未开放。")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/MembershipView.js.map
