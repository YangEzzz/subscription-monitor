<template>
  <view class="flow-actionbar form-actionbar">
    <button
      hover-class="is-pressed"
      role="button"
      tabindex="0"
      class="primary-button btn-primary save-button"
      :disabled="busy"
      :aria-busy="busy ? 'true' : 'false'"
      @tap="$emit('save')"
    >
      <uni-icons type="checkmarkempty" size="20" color="var(--surface)" />{{
        busy ? "正在保存" : editingId ? "保存修改" : "保存订阅"
      }}
    </button>
  </view>
</template>

<script>
export default {
  name: "SubscriptionSaveBar",
  emits: ["save"],
  props: {
    busy: { type: Boolean, default: false },
    editingId: { type: [String, Number], default: null },
  },
};
</script>
