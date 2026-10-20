<template>
  <view
    class="ui-skeleton card"
    :class="'skeleton-' + variant"
    role="status"
    :aria-label="label"
  >
    <view class="skeleton-block skeleton-heading"></view>
    <template v-if="variant === 'hero'">
      <view class="skeleton-block skeleton-amount"></view>
      <view class="skeleton-block skeleton-caption"></view>
      <view class="skeleton-block skeleton-track"></view>
    </template>
    <view v-else-if="variant === 'chart'" class="skeleton-chart">
      <view
        v-for="index in 6"
        :key="index"
        class="skeleton-block skeleton-bar"
      ></view>
    </view>
    <view v-else-if="variant === 'calendar'" class="skeleton-calendar">
      <view
        v-for="index in 35"
        :key="index"
        class="skeleton-block skeleton-day"
      ></view>
    </view>
    <view v-else v-for="index in rows" :key="index" class="skeleton-list-row">
      <view class="skeleton-block skeleton-logo"></view>
      <view class="skeleton-copy"
        ><view class="skeleton-block skeleton-name"></view
        ><view class="skeleton-block skeleton-caption"></view
      ></view>
      <view class="skeleton-block skeleton-price"></view>
    </view>
  </view>
</template>
<script>
export default {
  name: "UiSkeleton",
  props: {
    variant: { type: String, default: "list" },
    rows: { type: Number, default: 3 },
    label: { type: String, default: "正在加载" },
  },
};
</script>
