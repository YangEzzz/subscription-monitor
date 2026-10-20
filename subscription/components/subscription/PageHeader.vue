<template>
  <view
    class="page-head"
    :class="{
      navbar: secondary,
      'flow-navbar': pinned,
      'flow-navbar-scrolled': pinned && scrolled,
    }"
  >
    <view class="page-head-row" :style="layout">
      <button
        role="button"
        tabindex="0"
        v-if="secondary"
        class="navbar-back pressable"
        hover-class="is-pressed"
        aria-label="返回"
        :disabled="disabled"
        @tap="$emit('back')"
      >
        <view class="navbar-back-face"
          ><uni-icons type="left" size="20" color="var(--ink)"
        /></view>
      </button>
      <text :class="secondary ? 'navbar-title' : 'page-head-title'">{{
        title
      }}</text>
    </view>
    <view v-if="subtitle && !secondary" class="page-head-subtitle">
      <view v-if="online" class="dot green-dot"></view
      ><text>{{ subtitle }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: "PageHeader",
  emits: ["back"],
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    secondary: { type: Boolean, default: false },
    online: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    scrolled: { type: Boolean, default: false },
  },
  data() {
    return { top: 6, rowHeight: 44, capsuleSpace: 100 };
  },
  computed: {
    layout() {
      return {
        height: this.rowHeight + "px",
        paddingTop: this.top + "px",
        paddingRight: this.capsuleSpace + "px",
      };
    },
  },
  mounted() {
    try {
      const info =
        typeof uni.getWindowInfo === "function"
          ? uni.getWindowInfo()
          : uni.getSystemInfoSync();
      const menu = uni.getMenuButtonBoundingClientRect?.();
      if (menu?.width && menu?.height) {
        this.top = Math.max(0, menu.top - (info.statusBarHeight || 0));
        this.rowHeight = this.top + menu.height;
        this.capsuleSpace = info.windowWidth - menu.left + 8;
      }
    } catch (_) {
      /* H5 and platforms without a capsule use the fallback. */
    }
  },
};
</script>
