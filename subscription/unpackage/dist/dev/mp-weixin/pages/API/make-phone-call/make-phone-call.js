"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      title: "makePhoneCall",
      disabled: true
    };
  },
  methods: {
    bindInput: function(e) {
      this.inputValue = e.detail.value;
      if (this.inputValue.length > 0) {
        this.disabled = false;
      } else {
        this.disabled = true;
      }
    },
    makePhoneCall: function() {
      common_vendor.index.makePhoneCall({
        phoneNumber: this.inputValue,
        success: () => {
          common_vendor.index.__f__("log", "at pages/API/make-phone-call/make-phone-call.vue:34", "成功拨打电话");
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
    b: common_vendor.o((...args) => $options.bindInput && $options.bindInput(...args), "1c"),
    c: common_vendor.o((...args) => $options.makePhoneCall && $options.makePhoneCall(...args), "42"),
    d: $data.disabled
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/API/make-phone-call/make-phone-call.js.map
