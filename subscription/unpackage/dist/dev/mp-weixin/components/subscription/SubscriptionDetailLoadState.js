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
    showHeader: { type: Boolean, default: true },
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
    a: $props.showHeader
  }, $props.showHeader ? {
    b: common_vendor.o(($event) => _ctx.$emit("back"), "3e"),
    c: common_vendor.p({
      title: "订阅详情",
      secondary: true,
      pinned: true,
      scrolled: $props.scrollOffset > 8
    })
  } : {}, {
    d: $props.error
  }, $props.error ? {
    e: common_vendor.o(($event) => _ctx.$emit("retry"), "fe"),
    f: common_vendor.p({
      title: "订阅详情加载失败",
      description: $props.error,
      ["action-label"]: "重新加载"
    })
  } : {
    g: common_vendor.p({
      variant: "hero",
      label: "正在加载订阅详情"
    }),
    h: common_vendor.f(4, (index, k0, i0) => {
      return {
        a: index
      };
    }),
    i: common_vendor.p({
      rows: 1,
      label: "正在加载提醒计划"
    }),
    j: common_vendor.p({
      rows: 1,
      label: "正在加载本期处理信息"
    })
  }, {
    k: !$props.error
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
