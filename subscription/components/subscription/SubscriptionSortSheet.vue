<template>
  <view
    class="sheet-mask"
    role="dialog"
    aria-modal="true"
    aria-label="订阅排序"
    @tap="$emit('close')"
    @touchmove.stop.prevent
  >
    <view class="sort-sheet" @tap.stop>
      <view class="sheet-handle"></view>
      <view class="sheet-head"
        ><view
          ><text class="sheet-title">订阅排序</text
          ><text class="sheet-subtitle">选择列表的排列方式</text></view
        ><button
          role="button"
          tabindex="0"
          class="sheet-close"
          aria-label="关闭排序"
          @tap="$emit('close')"
        >
          <uni-icons type="closeempty" size="21" color="#5f6862" /></button
      ></view>
      <view class="sort-options"
        ><button
          role="button"
          tabindex="0"
          v-for="option in sortOptions"
          :key="option.value"
          class="sort-option"
          :class="{ active: sortMode === option.value }"
          @tap="$emit('select', option.value)"
        >
          <view class="sort-option-icon"
            ><uni-icons
              :type="option.icon"
              size="20"
              :color="
                sortMode === option.value ? '#177e4b' : '#6f7972'
              " /></view
          ><view class="sort-option-copy"
            ><text>{{ option.label }}</text
            ><text>{{ option.desc }}</text></view
          ><view
            class="sort-check"
            :class="{ checked: sortMode === option.value }"
            ><uni-icons
              v-if="sortMode === option.value"
              type="checkmarkempty"
              size="15"
              color="#ffffff"
          /></view></button
      ></view>
    </view>
  </view>
</template>

<script>
export default {
  name: "SubscriptionSortSheet",
  emits: ["close", "select"],
  mounted() {
    // #ifdef H5
    this.returnFocus = document.activeElement;
    this.$el.addEventListener("keydown", this.onKeydown);
    this.$nextTick(() => this.$el.querySelector('[role="button"]')?.focus());
    // #endif
  },
  beforeUnmount() {
    // #ifdef H5
    this.returnFocus?.focus?.();
    this.$el.removeEventListener("keydown", this.onKeydown);
    // #endif
  },
  methods: {
    onKeydown(event) {
      // #ifdef H5
      if (event.key === "Escape") {
        event.stopPropagation();
        this.$emit("close");
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = Array.from(this.$el.querySelectorAll('[role="button"]'));
      const current = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[
        (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length
      ]?.focus();
      // #endif
    },
  },
  props: {
    sortOptions: { type: Array, default: () => [] },
    sortMode: { type: String, default: "date" },
  },
};
</script>
