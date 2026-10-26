"use strict";
const components_subscription_platformInputs = require("./platform-inputs.js");
const common_vendor = require("../../common/vendor.js");
const PageHeader = () => "./PageHeader.js";
const UiSelection = () => "./UiSelection.js";
const SubscriptionRow = () => "./subscription-row.js";
const EmptyStateView = () => "./EmptyStateView.js";
const _sfc_main = {
  name: "SubscriptionListView",
  mounted() {
    components_subscription_platformInputs.syncNativeFieldLabels(this.$el);
  },
  components: { PageHeader, UiSelection, SubscriptionRow, EmptyStateView },
  emits: [
    "search",
    "clear-search",
    "category",
    "status",
    "choose-sort",
    "open-detail",
    "reset-filters",
    "open-form"
  ],
  data() {
    return {
      searchDraft: this.searchKeyword,
      displayLimit: 20,
      searchFocused: false
    };
  },
  watch: {
    activeCategory() {
      this.displayLimit = 20;
    },
    activeStatus() {
      this.displayLimit = 20;
    },
    searchKeyword(value) {
      this.displayLimit = 20;
      if (value !== this.searchDraft)
        this.searchDraft = value;
    }
  },
  computed: {
    categoryOptions() {
      return this.categoryFilters.map((item) => ({
        value: item.name,
        label: item.name,
        count: item.count
      }));
    }
  },
  methods: {
    handleSearchInput(event) {
      const value = (event.detail && event.detail.value || "").trim();
      if (value !== this.searchDraft)
        this.searchDraft = value;
      this.$emit("search", value);
    },
    clearSearch() {
      this.searchDraft = "";
      this.searchFocused = false;
      this.$nextTick(() => {
        this.searchFocused = true;
      });
      this.$emit("clear-search");
    }
  },
  props: {
    decorateItem: { type: Function, required: true },
    navigationBarHeight: { type: Number, default: 0 },
    searchKeyword: { type: String, default: "" },
    categoryFilters: { type: Array, default: () => [] },
    activeCategory: { type: String, default: "全部" },
    statusFilters: { type: Array, default: () => [] },
    activeStatus: { type: String, default: "all" },
    sortLabel: { type: String, default: "按日期" },
    activeStatusLabel: { type: String, default: "全部状态" },
    visibleSubscriptions: { type: Array, default: () => [] },
    liveSubscriptions: { type: Array, default: () => [] },
    formatDate: { type: Function, required: true },
    formatMoney: { type: Function, required: true },
    cycleText: { type: Function, required: true },
    daysText: { type: Function, required: true },
    getStatus: { type: Function, required: true },
    statusText: { type: Function, required: true }
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_ui_selection = common_vendor.resolveComponent("ui-selection");
  const _component_subscription_row = common_vendor.resolveComponent("subscription-row");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  (_component_page_header + _easycom_uni_icons2 + _component_ui_selection + _component_subscription_row + _component_empty_state_view)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      title: "全部订阅",
      subtitle: "集中管理每一项持续支出"
    }),
    b: common_vendor.p({
      type: "search",
      size: "18",
      color: "var(--ink-3)"
    }),
    c: $data.searchFocused,
    d: common_vendor.o([($event) => $data.searchDraft = $event.detail.value, (...args) => $options.handleSearchInput && $options.handleSearchInput(...args)], "b3"),
    e: $data.searchDraft,
    f: $data.searchDraft
  }, $data.searchDraft ? {
    g: common_vendor.p({
      type: "clear",
      size: "18",
      color: "var(--ink-4)"
    }),
    h: common_vendor.o((...args) => $options.clearSearch && $options.clearSearch(...args), "a6")
  } : {}, {
    i: common_vendor.o(($event) => _ctx.$emit("category", $event), "11"),
    j: common_vendor.p({
      options: $options.categoryOptions,
      ["model-value"]: $props.activeCategory,
      variant: "chips",
      label: "按服务分类筛选，可左右滑动"
    }),
    k: common_vendor.o(($event) => _ctx.$emit("status", $event), "ff"),
    l: common_vendor.p({
      options: $props.statusFilters,
      ["model-value"]: $props.activeStatus,
      variant: "tabs",
      label: "按订阅状态筛选，可左右滑动"
    }),
    m: common_vendor.t($props.sortLabel),
    n: common_vendor.t($props.activeStatusLabel),
    o: common_vendor.t($props.visibleSubscriptions.length),
    p: common_vendor.o(($event) => _ctx.$emit("choose-sort"), "40"),
    q: $props.visibleSubscriptions.length
  }, $props.visibleSubscriptions.length ? {
    r: common_vendor.f($props.visibleSubscriptions.slice(0, $data.displayLimit), (item, index, i0) => {
      return {
        a: item.id,
        b: Math.min(index, 10) * 30 + "ms",
        c: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id),
        d: "ca51a8d2-5-" + i0,
        e: common_vendor.p({
          item: {
            ...$props.decorateItem(item),
            cycle: $props.cycleText(item),
            amountText: item.amount === null ? "金额待补充" : $props.formatMoney(item.amount, item.currency)
          },
          ["show-date"]: true,
          ["date-label"]: $props.formatDate(item.nextBillingDate)
        })
      };
    })
  } : {}, {
    s: $props.visibleSubscriptions.length > $data.displayLimit
  }, $props.visibleSubscriptions.length > $data.displayLimit ? {
    t: common_vendor.t($data.displayLimit),
    v: common_vendor.t($props.visibleSubscriptions.length),
    w: common_vendor.o(($event) => $data.displayLimit += 20, "d1")
  } : {}, {
    x: !$props.visibleSubscriptions.length && $props.liveSubscriptions.length
  }, !$props.visibleSubscriptions.length && $props.liveSubscriptions.length ? {
    y: common_vendor.o(($event) => _ctx.$emit("reset-filters"), "96"),
    z: common_vendor.p({
      icon: "search",
      title: "没有匹配的订阅",
      description: "调整搜索词或筛选条件，也可以新增一条订阅",
      ["action-label"]: "重置筛选"
    })
  } : !$props.liveSubscriptions.length ? {
    B: common_vendor.o(($event) => _ctx.$emit("open-form"), "df"),
    C: common_vendor.p({
      icon: "plus",
      title: "还没有添加订阅",
      description: "添加第一条订阅后，这里会显示所有续费项目",
      ["action-label"]: "新增订阅"
    })
  } : {}, {
    A: !$props.liveSubscriptions.length
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionListView.js.map
