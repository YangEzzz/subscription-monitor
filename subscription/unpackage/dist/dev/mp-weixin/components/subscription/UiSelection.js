"use strict";
const common_vendor = require("../../common/vendor.js");
let nextId = 0;
const _sfc_main = {
  name: "UiSelection",
  emits: ["select"],
  inject: { uiMotion: { default: () => ({ reduced: false }) } },
  props: {
    options: { type: Array, default: () => [] },
    modelValue: { type: [String, Number], default: "" },
    variant: { type: String, default: "tabs" },
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false }
  },
  data() {
    return {
      idPrefix: "selection-" + ++nextId,
      scrollTarget: "",
      left: 0,
      width: 0,
      ready: false,
      animated: false,
      resizeHandler: null
    };
  },
  computed: {
    indicator() {
      return {
        width: this.width + "px",
        transform: `translateX(${this.left}px)`
      };
    }
  },
  watch: {
    modelValue() {
      this.$nextTick(() => this.measure());
    },
    options: {
      deep: true,
      handler() {
        this.$nextTick(() => this.measure());
      }
    }
  },
  mounted() {
    var _a, _b;
    this.$nextTick(() => this.measure());
    this.resizeHandler = () => this.$nextTick(() => this.measure());
    (_b = (_a = common_vendor.index).onWindowResize) == null ? void 0 : _b.call(_a, this.resizeHandler);
  },
  beforeUnmount() {
    var _a, _b;
    if (this.resizeHandler)
      (_b = (_a = common_vendor.index).offWindowResize) == null ? void 0 : _b.call(_a, this.resizeHandler);
  },
  methods: {
    handleKey(event, index) {
    },
    choose(option, index) {
      if (this.disabled)
        return;
      this.scrollTarget = this.idPrefix + "-" + index;
      this.$emit("select", option.value);
    },
    measure() {
      if (this.variant === "chips")
        return;
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".selection-track").boundingClientRect();
      query.selectAll(
        this.variant === "tabs" ? ".selection-label" : ".selection-option"
      ).boundingClientRect();
      query.exec((result) => {
        var _a;
        const index = this.options.findIndex(
          (option) => option.value === this.modelValue
        );
        const track = result == null ? void 0 : result[0], item = (_a = result == null ? void 0 : result[1]) == null ? void 0 : _a[index];
        if (!track || !item)
          return;
        this.left = item.left - track.left;
        this.width = item.width;
        this.ready = true;
        this.$nextTick(() => {
          this.animated = true;
        });
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.variant !== "chips" && $data.ready
  }, $props.variant !== "chips" && $data.ready ? {
    b: !$data.animated ? 1 : "",
    c: common_vendor.s($options.indicator)
  } : {}, {
    d: common_vendor.f($props.options, (option, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(option.label),
        b: option.count !== void 0
      }, option.count !== void 0 ? {
        c: common_vendor.t(option.count)
      } : {}, {
        d: $data.idPrefix + "-" + index,
        e: option.value,
        f: $props.modelValue === option.value ? 1 : "",
        g: $props.modelValue === option.value ? 0 : -1,
        h: $props.modelValue === option.value,
        i: common_vendor.o(($event) => $options.choose(option, index), option.value),
        j: common_vendor.o(($event) => $options.handleKey($event, index), option.value)
      });
    }),
    e: $props.disabled,
    f: common_vendor.n("selection-track-" + $props.variant),
    g: $props.label,
    h: $props.variant !== "segmented",
    i: $data.scrollTarget,
    j: !($props.reducedMotion || $options.uiMotion.reduced),
    k: $props.variant === "tabs"
  }, $props.variant === "tabs" ? {} : {}, {
    l: common_vendor.n("selection-" + $props.variant)
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
