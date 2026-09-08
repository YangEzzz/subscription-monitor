"use strict";
const common_vendor = require("../../common/vendor.js");
const BrandLogo = () => "./brand-logo.js";
const EmptyStateView = () => "./EmptyStateView.js";
const _sfc_main = {
  name: "SubscriptionListView",
  components: { BrandLogo, EmptyStateView },
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
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_brand_logo = common_vendor.resolveComponent("brand-logo");
  const _component_empty_state_view = common_vendor.resolveComponent("empty-state-view");
  (_easycom_uni_icons2 + _component_brand_logo + _component_empty_state_view)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.navigationBarHeight + "px",
    b: common_vendor.p({
      type: "search",
      size: "19",
      color: "#8c938e"
    }),
    c: $data.searchFocused,
    d: common_vendor.o([($event) => $data.searchDraft = $event.detail.value, (...args) => $options.handleSearchInput && $options.handleSearchInput(...args)], "b3"),
    e: $data.searchDraft,
    f: $data.searchDraft
  }, $data.searchDraft ? {
    g: common_vendor.p({
      type: "clear",
      size: "18",
      color: "#9ca19d"
    }),
    h: common_vendor.o((...args) => $options.clearSearch && $options.clearSearch(...args), "ca")
  } : {}, {
    i: common_vendor.f($props.categoryFilters, (filter, k0, i0) => {
      return {
        a: common_vendor.t(filter.name),
        b: common_vendor.t(filter.count),
        c: filter.name,
        d: $props.activeCategory === filter.name ? 1 : "",
        e: common_vendor.o(($event) => _ctx.$emit("category", filter.name), filter.name)
      };
    }),
    j: common_vendor.f($props.statusFilters, (status, k0, i0) => {
      return {
        a: common_vendor.t(status.label),
        b: status.value,
        c: $props.activeStatus === status.value ? 1 : "",
        d: common_vendor.o(($event) => _ctx.$emit("status", status.value), status.value)
      };
    }),
    k: common_vendor.t($props.sortLabel),
    l: common_vendor.t($props.activeStatusLabel),
    m: common_vendor.p({
      type: "right",
      size: "15",
      color: "#89938c"
    }),
    n: common_vendor.o(($event) => _ctx.$emit("choose-sort"), "f2"),
    o: $props.visibleSubscriptions.length
  }, $props.visibleSubscriptions.length ? {
    p: common_vendor.f($props.visibleSubscriptions.slice(0, $data.displayLimit), (item, k0, i0) => {
      return {
        a: "ca51a8d2-3-" + i0,
        b: common_vendor.p({
          item
        }),
        c: common_vendor.t(item.name),
        d: common_vendor.t($props.statusText(item)),
        e: common_vendor.n($props.getStatus(item)),
        f: common_vendor.t($props.cycleText(item)),
        g: common_vendor.t(item.amount === null ? "金额待补充" : $props.formatMoney(item.amount, item.currency)),
        h: common_vendor.t(item.payment),
        i: common_vendor.t($props.formatDate(item.nextBillingDate)),
        j: common_vendor.t($props.daysText(item)),
        k: "ca51a8d2-4-" + i0,
        l: item.id,
        m: common_vendor.o(($event) => _ctx.$emit("open-detail", item), item.id)
      };
    }),
    q: common_vendor.p({
      type: "right",
      size: "17",
      color: "#b0b5b1"
    })
  } : {}, {
    r: $props.visibleSubscriptions.length > $data.displayLimit
  }, $props.visibleSubscriptions.length > $data.displayLimit ? {
    s: common_vendor.t($data.displayLimit),
    t: common_vendor.t($props.visibleSubscriptions.length),
    v: common_vendor.o(($event) => $data.displayLimit += 20, "20")
  } : {}, {
    w: !$props.visibleSubscriptions.length && $props.liveSubscriptions.length
  }, !$props.visibleSubscriptions.length && $props.liveSubscriptions.length ? {
    x: common_vendor.o(($event) => _ctx.$emit("reset-filters"), "f4"),
    y: common_vendor.p({
      icon: "search",
      title: "没有匹配的订阅",
      description: "调整搜索词或筛选条件，也可以新增一条订阅",
      ["action-label"]: "重置筛选",
      ["action-class"]: "secondary-button"
    })
  } : !$props.liveSubscriptions.length ? {
    A: common_vendor.o(($event) => _ctx.$emit("open-form"), "2f"),
    B: common_vendor.p({
      icon: "plus",
      title: "还没有添加订阅",
      description: "添加第一条订阅后，这里会显示所有续费项目",
      ["action-label"]: "新增订阅",
      ["action-class"]: "primary-button empty-add"
    })
  } : {}, {
    z: !$props.liveSubscriptions.length,
    C: common_vendor.p({
      type: "plus",
      size: "27",
      color: "#ffffff"
    }),
    D: common_vendor.o(($event) => _ctx.$emit("open-form"), "08")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionListView.js.map
