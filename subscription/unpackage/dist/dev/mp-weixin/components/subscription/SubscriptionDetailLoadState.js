"use strict";
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const UiSkeleton = () => "./UiSkeleton.js";
const AsyncStateView = () => "./AsyncStateView.js";
const _sfc_main = {
  name: "SubscriptionDetailLoadState",
  components: { PageHeader, UiSkeleton, AsyncStateView },
  emits: ["back", "retry"],
  props: {
    error: { type: String, default: "" },
    scrollOffset: { type: Number, default: 0 }
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  const _component_ui_skeleton = common_vendor.resolveComponent("ui-skeleton");
  (_component_page_header + _component_async_state_view + _component_ui_skeleton)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => _ctx.$emit("back"), "6c"),
    b: common_vendor.p({
      title: "订阅详情",
      secondary: true,
      pinned: true,
      scrolled: $props.scrollOffset > 8
    }),
    c: $props.error
  }, $props.error ? {
    d: common_vendor.o(($event) => _ctx.$emit("retry"), "4d"),
    e: common_vendor.p({
      title: "订阅详情加载失败",
      description: $props.error,
      ["action-label"]: "重新加载"
    })
  } : {
    f: common_vendor.p({
      variant: "hero",
      label: "正在加载订阅详情"
    }),
    g: common_vendor.f(4, (index, k0, i0) => {
      return {
        a: index
      };
    }),
    h: common_vendor.p({
      rows: 1,
      label: "正在加载提醒计划"
    }),
    i: common_vendor.p({
      rows: 1,
      label: "正在加载本期处理信息"
    })
  }, {
    j: !$props.error
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionDetailLoadState.js.map
