<template>
  <view class="ui-selection" :class="'selection-' + variant">
    <scroll-view
      :scroll-x="variant !== 'segmented'"
      :show-scrollbar="true"
      :scroll-into-view="scrollTarget"
      :scroll-with-animation="!(reducedMotion || uiMotion.reduced)"
      class="selection-scroll"
    >
      <view
        class="selection-track"
        :class="'selection-track-' + variant"
        role="tablist"
        :aria-label="label"
      >
        <view
          v-if="variant !== 'chips' && ready"
          class="selection-indicator motion"
          :class="{ 'selection-no-transition': !animated }"
          :style="indicator"
        ></view>
        <button
          v-for="(option, index) in options"
          :id="idPrefix + '-' + index"
          :key="option.value"
          class="selection-option pressable"
          :class="{ 'selection-active': modelValue === option.value }"
          role="tab"
          :tabindex="modelValue === option.value ? 0 : -1"
          :aria-selected="modelValue === option.value"
          :disabled="disabled"
          hover-class="is-pressed"
          @tap="choose(option, index)"
          @keydown="handleKey($event, index)"
        >
          <text class="selection-label">{{ option.label }}</text>
          <text v-if="option.count !== undefined" class="selection-count num">{{
            option.count
          }}</text>
        </button>
      </view>
    </scroll-view>
    <view v-if="variant === 'tabs'" class="selection-fade"></view>
  </view>
</template>

<script>
let nextId = 0;
export default {
  name: "UiSelection",
  emits: ["select"],
  inject: { uiMotion: { default: () => ({ reduced: false }) } },
  props: {
    options: { type: Array, default: () => [] },
    modelValue: { type: [String, Number], default: "" },
    variant: { type: String, default: "tabs" },
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false },
  },
  data() {
    return {
      idPrefix: "selection-" + ++nextId,
      scrollTarget: "",
      left: 0,
      width: 0,
      ready: false,
      animated: false,
      resizeHandler: null,
    };
  },
  computed: {
    indicator() {
      return {
        width: this.width + "px",
        transform: `translateX(${this.left}px)`,
      };
    },
  },
  watch: {
    modelValue() {
      this.$nextTick(() => this.measure());
    },
    options: {
      deep: true,
      handler() {
        this.$nextTick(() => this.measure());
      },
    },
  },
  mounted() {
    this.$nextTick(() => this.measure());
    this.resizeHandler = () => this.$nextTick(() => this.measure());
    uni.onWindowResize?.(this.resizeHandler);
  },
  beforeUnmount() {
    if (this.resizeHandler) uni.offWindowResize?.(this.resizeHandler);
  },
  methods: {
    handleKey(event, index) {
      // #ifdef H5
      const key = event.key;
      if (
        !["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(
          key,
        ) ||
        this.disabled
      )
        return;
      event.preventDefault();
      let next = index;
      if (key === "ArrowLeft")
        next = (index + this.options.length - 1) % this.options.length;
      if (key === "ArrowRight") next = (index + 1) % this.options.length;
      if (key === "Home") next = 0;
      if (key === "End") next = this.options.length - 1;
      this.choose(this.options[next], next);
      this.$nextTick(() =>
        document.getElementById(this.idPrefix + "-" + next)?.focus(),
      );
      // #endif
    },
    choose(option, index) {
      if (this.disabled) return;
      this.scrollTarget = this.idPrefix + "-" + index;
      this.$emit("select", option.value);
    },
    measure() {
      if (this.variant === "chips") return;
      const query = uni.createSelectorQuery().in(this);
      query.select(".selection-track").boundingClientRect();
      query
        .selectAll(
          this.variant === "tabs" ? ".selection-label" : ".selection-option",
        )
        .boundingClientRect();
      query.exec((result) => {
        const index = this.options.findIndex(
          (option) => option.value === this.modelValue,
        );
        const track = result?.[0],
          item = result?.[1]?.[index];
        if (!track || !item) return;
        this.left = item.left - track.left;
        this.width = item.width;
        this.ready = true;
        this.$nextTick(() => {
          this.animated = true;
        });
      });
    },
  },
};
</script>
