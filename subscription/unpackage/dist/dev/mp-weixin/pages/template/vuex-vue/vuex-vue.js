"use strict";
const store_index = require("../../../store/index.js");
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {};
  },
  computed: {
    ...common_vendor.mapState(["age"]),
    username() {
      return this.$store.state.username;
    },
    sex() {
      return store_index.store.state.sex;
    },
    doubleAge() {
      return store_index.store.getters.doubleAge;
    }
  },
  methods: {
    addAge() {
      store_index.store.commit("increment");
    },
    addAgeTen() {
      store_index.store.commit("incrementTen", {
        amount: 10
      });
    },
    addAgeAction() {
      store_index.store.dispatch("incrementAsync", {
        amount: 20
      });
    },
    resetAge() {
      store_index.store.commit("resetAge");
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
      title: "vuex:vue页面"
    }),
    b: common_vendor.t($options.username),
    c: common_vendor.t($options.sex),
    d: common_vendor.t(_ctx.age),
    e: common_vendor.t($options.doubleAge),
    f: common_vendor.o((...args) => $options.addAge && $options.addAge(...args), "57"),
    g: common_vendor.o((...args) => $options.addAgeTen && $options.addAgeTen(...args), "54"),
    h: common_vendor.o((...args) => $options.addAgeAction && $options.addAgeAction(...args), "5c"),
    i: common_vendor.o((...args) => $options.resetAge && $options.resetAge(...args), "1e")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/template/vuex-vue/vuex-vue.js.map
