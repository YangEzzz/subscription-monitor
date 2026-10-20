<template>
  <view
    class="brand-logo"
    :style="{ backgroundColor: item.color || 'var(--blue)' }"
  >
    <text class="brand-logo-text">{{ item.logo }}</text>
  </view>
</template>

<script>
export default {
  name: "BrandLogo",
  props: {
    item: { type: Object, required: true },
  },
};
</script>

<style scoped>
.brand-logo {
  flex: 0 0 auto;
  width: 84.6154rpx;
  height: 84.6154rpx;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--surface);
  background-image: var(--logo-overlay);
  box-shadow: var(--logo-shadow);
}
.brand-logo-text {
  font-size: 32.6923rpx;
  font-weight: 800;
}
</style>
