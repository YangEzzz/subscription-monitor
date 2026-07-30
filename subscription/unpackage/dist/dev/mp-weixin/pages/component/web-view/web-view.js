"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      url: "https://hellouniapp.dcloud.net.cn/html/web-view.html"
    };
  },
  onLoad(options) {
    if (options && options.url) {
      this.url = options.url;
    }
  },
  methods: {
    getMessage(event) {
      common_vendor.index.showModal({
        content: JSON.stringify(event.detail),
        showCancel: false
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.url,
    b: common_vendor.o((...args) => $options.getMessage && $options.getMessage(...args), "f3")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/component/web-view/web-view.js.map
