<template>
  <view class="tab-bar">
    <button
      role="button"
      tabindex="0"
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: activeView === tab.key }"
      :aria-current="activeView === tab.key ? 'page' : undefined"
      :aria-label="tab.label"
      @tap="$emit('switch', tab.key)"
    >
      <uni-icons
        :type="activeView === tab.key ? tab.activeIcon : tab.icon"
        size="23"
        :color="activeView === tab.key ? '#315acb' : '#68758c'"
      /><text>{{ tab.label }}</text>
    </button>
  </view>
</template>

<script>
export default {
  name: "SubscriptionTabBar",
  emits: ["switch"],
  props: {
    tabs: { type: Array, default: () => [] },
    activeView: { type: String, default: "home" },
  },
};
</script>
