"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      title: "vibrateLong/vibrateShort"
    };
  },
  onLoad() {
  },
  methods: {
    longshock() {
      common_vendor.index.vibrateLong({
        success: function() {
          common_vendor.index.__f__("log", "at pages/API/vibrate/vibrate.vue:28", "success");
        }
      });
    },
    shortshock() {
      common_vendor.index.vibrateShort({
        success: function() {
          common_vendor.index.__f__("log", "at pages/API/vibrate/vibrate.vue:38", "success");
        }
      });
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
    b: common_vendor.o((...args) => $options.longshock && $options.longshock(...args), "ba"),
    c: common_vendor.o((...args) => $options.shortshock && $options.shortshock(...args), "67")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/API/vibrate/vibrate.js.map
