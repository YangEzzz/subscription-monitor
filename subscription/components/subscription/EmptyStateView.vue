<template>
  <view class="empty-state">
    <view class="empty-icon"
      ><uni-icons :type="icon" size="30" color="#4a9a6c"
    /></view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-desc">{{ description }}</text>
    <button
      role="button"
      tabindex="0"
      v-if="actionLabel"
      class="empty-action"
      :class="actionClass"
      @tap="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </view>
</template>

<script>
export default {
  name: "EmptyStateView",
  emits: ["action"],
  props: {
    icon: { type: String, default: "search" },
    title: { type: String, default: "暂无内容" },
    description: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    actionClass: { type: String, default: "primary-button empty-add" },
  },
};
</script>
