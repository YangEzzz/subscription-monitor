<template>
  <view
    class="async-state"
    :class="[{ compact }, `tone-${tone}`]"
    :role="tone === 'error' ? 'alert' : 'status'"
  >
    <view class="state-mark" aria-hidden="true">
      <text class="state-mark-line"></text>
      <uni-icons
        :type="tone === 'error' ? 'info-filled' : 'spinner-cycle'"
        size="20"
        :color="tone === 'error' ? 'var(--red)' : 'var(--blue)'"
      />
    </view>
    <view class="state-copy">
      <text class="state-title">{{ title }}</text>
      <text class="state-description">{{ description }}</text>
    </view>
    <button
      v-if="actionLabel"
      class="state-action btn-ghost pressable"
      hover-class="is-pressed"
      :disabled="busy"
      :aria-busy="busy ? 'true' : 'false'"
      @tap="$emit('action')"
    >
      {{ busy ? busyLabel : actionLabel }}
    </button>
  </view>
</template>

<script>
export default {
  name: "AsyncStateView",
  emits: ["action"],
  props: {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    busyLabel: { type: String, default: "正在重试" },
    tone: { type: String, default: "error" },
    compact: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
};
</script>

<style lang="scss" scoped>
.async-state {
  box-sizing: border-box;
  margin: 23.0769rpx 30.7692rpx;
  padding: 30.7692rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 23.0769rpx;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-glass);
}
.async-state.compact {
  padding: 23.0769rpx;
}
.state-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 69.2308rpx;
  height: 69.2308rpx;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
}
.state-mark-line {
  display: none;
}
.state-copy {
  min-width: 0;
}
.state-title,
.state-description {
  display: block;
}
.state-title {
  color: var(--ink);
  font-size: 28.8462rpx;
  line-height: 1.4;
  font-weight: 600;
}
.state-description {
  margin-top: 11.5385rpx;
  color: var(--ink-3);
  font-size: 23.0769rpx;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.state-action {
  min-height: 44px;
  margin: 0;
  padding: 0 30.7692rpx;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--white-glass);
  color: var(--ink-2);
  font-size: 26.9231rpx;
}
.state-action::after {
  border: 0;
}
</style>
