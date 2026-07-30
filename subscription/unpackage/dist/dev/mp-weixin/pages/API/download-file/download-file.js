"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      title: "downloadFile",
      imageSrc: "",
      //自动化测试例专用
      jest_result: false
    };
  },
  onUnload() {
    this.imageSrc = "";
  },
  methods: {
    downloadImage: function() {
      common_vendor.index.showLoading({
        title: "下载中"
      });
      var self = this;
      common_vendor.index.downloadFile({
        url: "https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/uni-app.png",
        success: (res) => {
          this.jest_result = true;
          common_vendor.index.__f__("log", "at pages/API/download-file/download-file.vue:42", "downloadFile success, res is", res);
          self.imageSrc = res.tempFilePath;
          common_vendor.index.hideLoading();
        },
        fail: (err) => {
          common_vendor.index.__f__("log", "at pages/API/download-file/download-file.vue:47", "downloadFile fail, err is:", err);
          this.jest_result = false;
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
  return common_vendor.e({
    a: common_vendor.p({
      title: $data.title
    }),
    b: $data.imageSrc
  }, $data.imageSrc ? {
    c: $data.imageSrc
  } : {
    d: common_vendor.o((...args) => $options.downloadImage && $options.downloadImage(...args), "e5")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/API/download-file/download-file.js.map
