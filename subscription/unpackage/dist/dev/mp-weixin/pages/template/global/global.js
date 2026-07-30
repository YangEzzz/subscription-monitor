"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      gd: {}
    };
  },
  computed: {
    ...common_vendor.mapState(["testvuex"])
  },
  methods: {
    ...common_vendor.mapMutations(["setTestTrue"]),
    ...common_vendor.mapMutations(["setTestFalse"]),
    setGD: function() {
      this.gd.test = "123";
    },
    setVUEX: function(isTrue) {
      if (isTrue) {
        this.setTestTrue(this.$store.state);
      } else {
        this.setTestFalse(this.$store.state);
      }
    }
  },
  onShow() {
    this.gd = getApp().globalData;
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.gd.test),
    b: common_vendor.o(($event) => $options.setGD(), "78"),
    c: common_vendor.t(_ctx.testvuex),
    d: common_vendor.o(($event) => $options.setVUEX(true), "06"),
    e: common_vendor.o(($event) => $options.setVUEX(false), "fb")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/template/global/global.js.map
