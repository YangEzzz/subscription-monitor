"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SubscriptionSortSheet",
  emits: ["close", "select"],
  mounted() {
  },
  beforeUnmount() {
  },
  methods: {
    onKeydown(event) {
    }
  },
  props: {
    sortOptions: { type: Array, default: () => [] },
    sortMode: { type: String, default: "date" }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      type: "closeempty",
      size: "21",
      color: "#5f6862"
    }),
    b: common_vendor.o(($event) => _ctx.$emit("close"), "39"),
    c: common_vendor.f($props.sortOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: "c186b446-1-" + i0,
        b: common_vendor.p({
          type: option.icon,
          size: "20",
          color: $props.sortMode === option.value ? "#177e4b" : "#6f7972"
        }),
        c: common_vendor.t(option.label),
        d: common_vendor.t(option.desc),
        e: $props.sortMode === option.value
      }, $props.sortMode === option.value ? {
        f: "c186b446-2-" + i0,
        g: common_vendor.p({
          type: "checkmarkempty",
          size: "15",
          color: "#ffffff"
        })
      } : {}, {
        h: $props.sortMode === option.value ? 1 : "",
        i: option.value,
        j: $props.sortMode === option.value ? 1 : "",
        k: common_vendor.o(($event) => _ctx.$emit("select", option.value), option.value)
      });
    }),
    d: common_vendor.o(() => {
    }, "d9"),
    e: common_vendor.o(($event) => _ctx.$emit("close"), "06"),
    f: common_vendor.o(() => {
    }, "e6")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionSortSheet.js.map
