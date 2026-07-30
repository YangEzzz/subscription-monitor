"use strict";
const store_counter = require("../../../store/counter.js");
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  setup() {
    const counter = store_counter.useCounterStore();
    function incrementCounter() {
      counter.count++;
    }
    function incrementPatchCounter() {
      counter.$patch({ count: counter.count + 1 });
    }
    return {
      counter,
      incrementCounter,
      incrementPatchCounter
    };
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
      title: "Pinia"
    }),
    b: common_vendor.t($setup.counter.count),
    c: common_vendor.t($setup.counter.doubleCount),
    d: common_vendor.o((...args) => $setup.incrementCounter && $setup.incrementCounter(...args), "7c"),
    e: common_vendor.o((...args) => $setup.incrementPatchCounter && $setup.incrementPatchCounter(...args), "a4"),
    f: common_vendor.o((...args) => $setup.counter.increment && $setup.counter.increment(...args), "d8"),
    g: common_vendor.o((...args) => $setup.counter.decrement && $setup.counter.decrement(...args), "79")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/template/pinia/pinia.js.map
