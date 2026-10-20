"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "SubscriptionTabBar",
  emits: ["switch", "create"],
  props: {
    tabs: { type: Array, default: () => [] },
    activeView: { type: String, default: "home" }
  },
  data() {
    return {
      left: 0,
      ready: false,
      crossing: false,
      moving: false,
      adding: false,
      motionTimer: null,
      addTimer: null,
      resizeHandler: null
    };
  },
  computed: {
    navigationTabs() {
      return this.tabs.filter((tab) => tab.key !== "stats");
    }
  },
  watch: {
    activeView(next, previous) {
      this.crossing = this.position(next) < 2 !== this.position(previous) < 2;
      this.moving = false;
      this.$nextTick(() => {
        this.measure();
        this.moving = true;
        clearTimeout(this.motionTimer);
        this.motionTimer = setTimeout(() => {
          this.moving = false;
        }, 480);
      });
    }
  },
  mounted() {
    var _a, _b;
    this.$nextTick(() => this.measure());
    this.resizeHandler = () => this.measure();
    (_b = (_a = common_vendor.index).onWindowResize) == null ? void 0 : _b.call(_a, this.resizeHandler);
  },
  beforeUnmount() {
    var _a, _b;
    clearTimeout(this.motionTimer);
    clearTimeout(this.addTimer);
    if (this.resizeHandler)
      (_b = (_a = common_vendor.index).offWindowResize) == null ? void 0 : _b.call(_a, this.resizeHandler);
  },
  methods: {
    position(key) {
      return this.navigationTabs.findIndex((tab) => tab.key === key);
    },
    measure() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".renewal-dock").boundingClientRect();
      query.selectAll(".dock-tab").boundingClientRect();
      query.exec((result) => {
        var _a;
        const dock = result == null ? void 0 : result[0], tab = (_a = result == null ? void 0 : result[1]) == null ? void 0 : _a[this.position(this.activeView)];
        if (!dock || !tab)
          return;
        this.left = tab.left - dock.left + (tab.width - 58 * dock.width / 366) / 2;
        this.$nextTick(() => {
          this.ready = true;
        });
      });
    },
    create() {
      this.adding = true;
      clearTimeout(this.addTimer);
      this.addTimer = setTimeout(() => {
        this.adding = false;
      }, 520);
      this.$emit("create");
    }
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
    a: $data.crossing ? 1 : "",
    b: $data.moving ? 1 : "",
    c: !$data.ready ? 1 : "",
    d: "translateX(" + $data.left + "px)",
    e: common_vendor.f($options.navigationTabs, (tab, index, i0) => {
      return common_vendor.e({
        a: index === 2
      }, index === 2 ? {
        b: $data.adding ? 1 : "",
        c: common_vendor.o((...args) => $options.create && $options.create(...args), tab.key)
      } : {}, {
        d: "1ea05cf2-0-" + i0,
        e: common_vendor.p({
          type: tab.icon,
          size: "24",
          color: "var(--ink-3)"
        }),
        f: "1ea05cf2-1-" + i0,
        g: common_vendor.p({
          type: tab.activeIcon,
          size: "24",
          color: "var(--blue)"
        }),
        h: common_vendor.t(tab.label),
        i: $props.activeView === tab.key ? 1 : "",
        j: $props.activeView === tab.key,
        k: tab.label,
        l: common_vendor.o(($event) => _ctx.$emit("switch", tab.key), tab.key),
        m: tab.key
      });
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/SubscriptionTabBar.js.map
