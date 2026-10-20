<template>
  <view class="rd-donut" role="img" :aria-label="label"
    ><canvas
      class="rd-donut-canvas"
      :id="canvasId"
      :canvas-id="canvasId"
    ></canvas
    ><view class="rd-donut-center"
      ><text class="rd-donut-title">{{ title }}</text
      ><text class="rd-donut-caption">分类占比</text></view
    ></view
  >
</template>
<script>
import { UI_COLORS } from "../../styles/ui-palette.js";
let nextCanvas = 0;
export default {
  name: "DonutChart",
  props: {
    segments: { type: Array, default: () => [] },
    title: { type: String, default: "" },
  },
  data() {
    return { canvasId: "renewal-donut-" + ++nextCanvas, resizeHandler: null };
  },
  computed: {
    label() {
      return this.segments
        .map((item) => item.name + " " + item.percent + "%")
        .join("，");
    },
  },
  watch: {
    segments: {
      deep: true,
      handler() {
        this.$nextTick(() => this.draw());
      },
    },
  },
  mounted() {
    this.$nextTick(() => this.draw());
    this.resizeHandler = () => this.$nextTick(() => this.draw());
    uni.onWindowResize?.(this.resizeHandler);
  },
  beforeUnmount() {
    if (this.resizeHandler) uni.offWindowResize?.(this.resizeHandler);
  },
  methods: {
    draw() {
      const query = uni.createSelectorQuery().in(this);
      query
        .select(".rd-donut-canvas")
        .boundingClientRect((rect) => {
          if (!rect?.width) return;
          const ctx = uni.createCanvasContext(this.canvasId, this);
          const size = rect.width,
            line = (size * 14) / 124,
            radius = (size - line) / 2;
          ctx.clearRect(0, 0, size, size);
          ctx.setLineWidth(line);
          ctx.setLineCap("round");
          const total = this.segments.reduce(
            (sum, item) => sum + Number(item.value),
            0,
          );
          let angle = -Math.PI / 2;
          if (!total) {
            ctx.beginPath();
            ctx.setStrokeStyle(UI_COLORS["surface-sunken"]);
            ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          this.segments.forEach((item) => {
            const sweep = total
              ? (Number(item.value) / total) * Math.PI * 2
              : 0;
            const gap =
              this.segments.filter((row) => row.value > 0).length > 1
                ? Math.min((line + 2.5) / radius, sweep * 0.7)
                : 0;
            if (sweep > 0) {
              ctx.beginPath();
              ctx.setStrokeStyle(item.color);
              ctx.arc(
                size / 2,
                size / 2,
                radius,
                angle + gap / 2,
                angle + sweep - gap / 2,
              );
              ctx.stroke();
            }
            angle += sweep;
          });
          ctx.draw();
        })
        .exec();
    },
  },
};
</script>
