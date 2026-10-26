"use strict";
const common_vendor = require("../../common/vendor.js");
const styles_uiPalette = require("../../styles/ui-palette.js");
let nextCanvas = 0;
const _sfc_main = {
  name: "DonutChart",
  props: {
    segments: { type: Array, default: () => [] },
    title: { type: String, default: "" }
  },
  data() {
    return { canvasId: "renewal-donut-" + ++nextCanvas, resizeHandler: null };
  },
  computed: {
    label() {
      return this.segments.map((item) => item.name + " " + item.percent + "%").join("，");
    }
  },
  watch: {
    segments: {
      deep: true,
      handler() {
        this.$nextTick(() => this.draw());
      }
    }
  },
  mounted() {
    var _a, _b;
    this.$nextTick(() => this.draw());
    this.resizeHandler = () => this.$nextTick(() => this.draw());
    (_b = (_a = common_vendor.index).onWindowResize) == null ? void 0 : _b.call(_a, this.resizeHandler);
  },
  beforeUnmount() {
    var _a, _b;
    if (this.resizeHandler)
      (_b = (_a = common_vendor.index).offWindowResize) == null ? void 0 : _b.call(_a, this.resizeHandler);
  },
  methods: {
    draw() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".rd-donut-canvas").boundingClientRect((rect) => {
        if (!(rect == null ? void 0 : rect.width))
          return;
        const ctx = common_vendor.index.createCanvasContext(this.canvasId, this);
        const size = rect.width, line = size * 14 / 124, radius = (size - line) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.setLineWidth(line);
        ctx.setLineCap("round");
        const total = this.segments.reduce(
          (sum, item) => sum + Number(item.value),
          0
        );
        let angle = -Math.PI / 2;
        if (!total) {
          ctx.beginPath();
          ctx.setStrokeStyle(styles_uiPalette.UI_COLORS["surface-sunken"]);
          ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        this.segments.forEach((item) => {
          const sweep = total ? Number(item.value) / total * Math.PI * 2 : 0;
          const gap = this.segments.filter((row) => row.value > 0).length > 1 ? Math.min((line + 2.5) / radius, sweep * 0.7) : 0;
          if (sweep > 0) {
            ctx.beginPath();
            ctx.setStrokeStyle(item.color);
            ctx.arc(
              size / 2,
              size / 2,
              radius,
              angle + gap / 2,
              angle + sweep - gap / 2
            );
            ctx.stroke();
          }
          angle += sweep;
        });
        ctx.draw();
      }).exec();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.canvasId,
    b: $data.canvasId,
    c: common_vendor.t($props.title),
    d: $options.label
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/DonutChart.js.map
