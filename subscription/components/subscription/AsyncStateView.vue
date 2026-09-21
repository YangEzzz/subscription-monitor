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
        :color="tone === 'error' ? '#b43d47' : '#146747'"
      />
    </view>
    <view class="state-copy">
      <text class="state-title">{{ title }}</text>
      <text class="state-description">{{ description }}</text>
    </view>
    <button
      v-if="actionLabel"
      class="state-action"
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

<style scoped>
@import "@/styles/tokens";

.async-state {
  box-sizing: border-box;
  margin: 32rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 22rpx;
  border: 1rpx solid #ead8d9;
  border-radius: 20rpx;
  background: #fffafa;
}
.async-state.compact {
  margin-top: 18rpx;
  margin-bottom: 8rpx;
  padding: 22rpx 24rpx;
}
.state-mark {
  position: relative;
  width: 58rpx;
  height: 64rpx;
  flex: 0 0 58rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx;
  background: #f8e9ea;
  overflow: hidden;
}
.state-mark-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6rpx;
  background: $danger;
}
.state-copy {
  flex: 1;
  min-width: 0;
}
.state-title,
.state-description {
  display: block;
}
.state-title {
  color: #542b2f;
  font-size: 26rpx;
  line-height: 1.35;
  font-weight: 700;
}
.state-description {
  margin-top: 6rpx;
  color: #80666a;
  font-size: 22rpx;
  line-height: 1.5;
  word-break: break-all;
}
.state-action {
  min-width: 148rpx;
  min-height: 72rpx;
  margin: 0;
  padding: 0 22rpx;
  border: 1rpx solid #cfaeb1;
  border-radius: 14rpx;
  color: #8f3039;
  background: $surface;
  font-size: 23rpx;
  line-height: 72rpx;
  font-weight: 650;
}
.state-action::after {
  border: 0;
}
.state-action[disabled] {
  opacity: 0.55;
}
</style>
