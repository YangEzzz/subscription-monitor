"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      title: "slider 滑块"
    };
  },
  methods: {
    sliderChange(e) {
      common_vendor.index.__f__("log", "at pages/component/slider/slider.vue:36", "value 发生变化：" + e.detail.value);
    }
  }
};
if (!Array) {
  const _easycom_page_head2 = common_vendor.resolveComponent("page-head");
  _easycom_page_head2();
}
const _easycom_page_head = () => "../../../components/page-head/page-head.js";
if (!Math) {
  _easycom_page_head();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      title: $data.title
    }),
    b: common_vendor.o((...args) => $options.sliderChange && $options.sliderChange(...args), "77"),
    c: common_vendor.o((...args) => $options.sliderChange && $options.sliderChange(...args), "d4"),
    d: common_vendor.o((...args) => $options.sliderChange && $options.sliderChange(...args), "6e"),
    e: common_vendor.o((...args) => $options.sliderChange && $options.sliderChange(...args), "a4")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/component/slider/slider.js.map
