<template>
  <view class="setting-row" @tap="$emit('tap')">
    <view class="setting-icon" :class="iconClass"
      ><uni-icons :type="icon" size="18" :color="iconColor"
    /></view>
    <view class="setting-copy"
      ><text>{{ title }}</text
      ><text>{{ description }}</text></view
    >
    <switch
      v-if="switchable"
      :key="switchRevision"
      :checked="checked"
      color="#16834d"
      @change="changeSwitch"
    />
    <uni-icons v-else-if="action" type="right" size="17" color="#aab0ac" />
  </view>
</template>

<script>
export default {
  name: "SettingsRow",
  emits: ["tap", "change"],
  data() {
    return { switchRevision: 0 };
  },
  methods: {
    changeSwitch(event) {
      this.$emit("change", event.detail.value);
      // 异步保存期间以父级已确认值为准，失败时不留下原生开关的临时状态。
      this.$nextTick(() => {
        this.switchRevision++;
      });
    },
  },
  props: {
    icon: { type: String, required: true },
    iconClass: { type: String, default: "" },
    iconColor: { type: String, default: "#177e4b" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    switchable: { type: Boolean, default: false },
    checked: { type: Boolean, default: false },
    action: { type: Boolean, default: false },
  },
};
</script>
