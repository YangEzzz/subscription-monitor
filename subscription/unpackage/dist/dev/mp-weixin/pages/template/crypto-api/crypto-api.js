"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      str: [false, false, false]
    };
  },
  methods: {
    getRandomValues() {
      try {
        this.str[0] = typeof crypto === "object";
        this.str[1] = typeof crypto.getRandomValues === "function";
        var rnds8 = new Uint8Array(16);
        const res = crypto.getRandomValues(rnds8);
        this.str[2] = res.length === 16;
      } catch (e) {
        common_vendor.index.__f__("log", "at pages/template/crypto-api/crypto-api.vue:25", "crypto error:", e);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.str.join("-")),
    b: common_vendor.o((...args) => $options.getRandomValues && $options.getRandomValues(...args), "c0")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/template/crypto-api/crypto-api.js.map
