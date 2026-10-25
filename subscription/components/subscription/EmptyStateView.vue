<template>
  <view class="empty-state" :class="{ 'empty-state-embedded': embedded }">
    <view class="empty-icon"
      ><uni-icons :type="icon" size="24" color="var(--ink-3)"
    /></view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-desc">{{ description }}</text>
    <button
      role="button"
      tabindex="0"
      v-if="actionLabel"
      class="empty-action btn-soft pressable"
      hover-class="is-pressed"
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
    embedded: { type: Boolean, default: false },
    icon: { type: String, default: "search" },
    title: { type: String, default: "暂无内容" },
    description: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    actionClass: { type: String, default: "" },
  },
};
</script>
