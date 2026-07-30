"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  components: {},
  data() {
    return {
      options: [{
        icon: "chat",
        text: "客服"
      }, {
        icon: "shop",
        text: "店铺",
        info: 2,
        infoBackgroundColor: "#007aff",
        infoColor: "#f5f5f5"
      }, {
        icon: "cart",
        text: "购物车",
        info: 2
      }],
      buttonGroup: [
        {
          text: "加入购物车",
          backgroundColor: "linear-gradient(90deg, #FFCD1E, #FF8A18)",
          color: "#fff"
        },
        {
          text: "立即购买",
          backgroundColor: "linear-gradient(90deg, #FE6035, #EF1224)",
          color: "#fff"
        }
      ],
      customButtonGroup: [
        {
          text: "加入购物车",
          backgroundColor: "linear-gradient(90deg, #1E83FF, #0053B8)",
          color: "#fff"
        },
        {
          text: "立即购买",
          backgroundColor: "linear-gradient(90deg, #60F3FF, #088FEB)",
          color: "#fff"
        }
      ],
      customButtonGroup1: [{
        text: "立即购买",
        backgroundColor: "linear-gradient(90deg, #FE6035, #EF1224)",
        color: "#fff"
      }]
    };
  },
  onLoad() {
  },
  methods: {
    onClick(e) {
      common_vendor.index.showToast({
        title: `点击${e.content.text}`,
        icon: "none"
      });
    },
    buttonClick(e) {
      common_vendor.index.__f__("log", "at pages/extUI/goods-nav/goods-nav.nvue:80", e);
      this.options[2].info++;
    }
  }
};
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_goods_nav2 = common_vendor.resolveComponent("uni-goods-nav");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  (_easycom_uni_card2 + _easycom_uni_goods_nav2 + _easycom_uni_section2)();
}
const _easycom_uni_card = () => "../../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_goods_nav = () => "../../../uni_modules/uni-goods-nav/components/uni-goods-nav/uni-goods-nav.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_goods_nav + _easycom_uni_section)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      ["is-shadow"]: false,
      ["is-full"]: true
    }),
    b: common_vendor.o($options.onClick, "3b"),
    c: common_vendor.p({
      title: "基础用法",
      type: "line"
    }),
    d: common_vendor.o($options.onClick, "47"),
    e: common_vendor.o($options.buttonClick, "27"),
    f: common_vendor.p({
      fill: true,
      options: $data.options,
      ["button-group"]: $data.customButtonGroup
    }),
    g: common_vendor.o($options.onClick, "9f"),
    h: common_vendor.o($options.buttonClick, "09"),
    i: common_vendor.p({
      fill: true,
      options: $data.options,
      ["button-group"]: $data.customButtonGroup1
    }),
    j: common_vendor.p({
      title: "自定义用法",
      type: "line"
    }),
    k: common_vendor.o($options.onClick, "f8"),
    l: common_vendor.o($options.buttonClick, "b7"),
    m: common_vendor.p({
      options: $data.options,
      fill: true,
      ["button-group"]: $data.buttonGroup
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/extUI/goods-nav/goods-nav.js.map
