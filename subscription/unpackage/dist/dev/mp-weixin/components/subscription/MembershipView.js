"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "MembershipView",
  emits: ["back", "activate", "restore"],
  props: {
    isMember: { type: Boolean, default: false },
    freeQuotaValue: { type: String, default: "0 / 5" }
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
      type: "left",
      size: "24",
      color: "#202622"
    }),
    b: common_vendor.o(($event) => _ctx.$emit("back"), "bf"),
    c: common_vendor.p({
      type: $props.isMember ? "checkbox-filled" : "vip-filled",
      size: "36",
      color: "#e6a526"
    }),
    d: common_vendor.t($props.isMember ? "✦ 会员已激活" : "✦ 升级会员"),
    e: common_vendor.t($props.isMember ? "无限订阅已解锁" : "解锁无限订阅"),
    f: common_vendor.t($props.isMember ? "感谢使用，所有会员权益均已开放" : "不再受 5 条免费额度限制，尽情记录"),
    g: common_vendor.p({
      type: "list",
      size: "22",
      color: "#c87f1a"
    }),
    h: common_vendor.p({
      type: "notification-filled",
      size: "22",
      color: "#c87f1a"
    }),
    i: common_vendor.p({
      type: "bars",
      size: "22",
      color: "#c87f1a"
    }),
    j: $props.isMember ? 1 : "",
    k: !$props.isMember
  }, !$props.isMember ? {
    l: common_vendor.p({
      type: "vip-filled",
      size: "24",
      color: "#fff"
    }),
    m: common_vendor.p({
      type: "right",
      size: "18",
      color: "rgba(255,255,255,.7)"
    }),
    n: common_vendor.o(($event) => _ctx.$emit("activate"), "50")
  } : {}, {
    o: common_vendor.p({
      type: "list",
      size: "20",
      color: "#b8720f"
    }),
    p: common_vendor.p({
      type: "notification-filled",
      size: "20",
      color: "#16834d"
    }),
    q: common_vendor.p({
      type: "bars",
      size: "20",
      color: "#16834d"
    }),
    r: common_vendor.p({
      type: "locked",
      size: "20",
      color: "#16834d"
    }),
    s: common_vendor.p({
      type: $props.isMember ? "vip-filled" : "person",
      size: "22",
      color: $props.isMember ? "#b8720f" : "#16834d"
    }),
    t: $props.isMember ? 1 : "",
    v: common_vendor.t($props.isMember ? "会员版" : "免费版"),
    w: common_vendor.t($props.isMember ? "全部权益已开放" : "基础功能可用"),
    x: $props.isMember ? 1 : "",
    y: common_vendor.p({
      type: "compose",
      size: "22",
      color: "#16834d"
    }),
    z: common_vendor.t($props.isMember ? "无限" : $props.freeQuotaValue),
    A: common_vendor.t($props.isMember ? "不受数量限制" : "5 条免费上限"),
    B: $props.isMember
  }, $props.isMember ? {
    C: common_vendor.o(($event) => _ctx.$emit("restore"), "48")
  } : {}, {
    D: common_vendor.p({
      type: "locked",
      size: "18",
      color: "#16834d"
    }),
    E: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "#16834d"
    }),
    F: common_vendor.p({
      type: "refresh",
      size: "18",
      color: "#16834d"
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/MembershipView.js.map
