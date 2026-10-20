<template>
  <view
    class="setting-row setrow"
    :role="action ? 'button' : undefined"
    :tabindex="action && !disabled ? 0 : undefined"
    :aria-label="action ? `${title}，${value || description}` : undefined"
    :aria-disabled="disabled"
    :class="{ 'is-disabled': disabled }"
    :hover-class="action && !disabled ? 'row-pressed' : 'none'"
    @tap="!disabled && $emit('activate')"
  >
    <view class="setting-icon icon-tile" :class="iconClass"
      ><uni-icons :type="icon" size="18" :color="iconColor"
    /></view>
    <view class="setting-copy"
      ><text class="setting-title">{{ title }}</text
      ><text v-if="description" class="setting-description">{{
        description
      }}</text></view
    >
    <text v-if="value" class="setting-value num">{{ value }}</text>
    <switch
      v-if="switchable"
      :key="switchRevision"
      :checked="checked"
      :disabled="disabled"
      color="var(--blue)"
      @change="changeSwitch"
    />
    <uni-icons v-else-if="action" type="right" size="17" color="var(--ink-4)" />
  </view>
</template>

<script>
export default {
  name: "SettingsRow",
  // 小程序的原生 tap/change 会冒泡，业务事件使用独立名称避免重复触发。
  emits: ["activate", "checked-change"],
  data() {
    return { switchRevision: 0 };
  },
  methods: {
    changeSwitch(event) {
      this.$emit("checked-change", event.detail.value);
      // 异步保存期间以父级已确认值为准，失败时不留下原生开关的临时状态。
      this.$nextTick(() => {
        this.switchRevision++;
      });
    },
  },
  props: {
    disabled: { type: Boolean, default: false },
    icon: { type: String, required: true },
    iconClass: { type: String, default: "" },
    iconColor: { type: String, default: "var(--blue)" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    value: { type: String, default: "" },
    switchable: { type: Boolean, default: false },
    checked: { type: Boolean, default: false },
    action: { type: Boolean, default: false },
  },
};
</script>
