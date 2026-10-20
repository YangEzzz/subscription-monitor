<template>
  <view
    class="page form-page reminder-settings-page redesign-page redesign-ancillary"
  >
    <page-header title="默认提醒规则" secondary @back="$emit('back')" />
    <view class="settings-intro soft-summary"
      ><uni-icons
        type="notification-filled"
        size="24"
        color="var(--blue)"
      /><view
        ><text>新订阅将自动使用这些节点</text
        ><text>单条订阅仍可在编辑时单独调整</text></view
      ></view
    >
    <view class="reminder-check-list"
      ><button
        hover-class="is-pressed"
        role="button"
        tabindex="0"
        v-for="option in reminderOptions"
        :key="option.value"
        class="reminder-check-row"
        :aria-pressed="settings.defaultReminders.includes(option.value)"
        @tap="$emit('toggle-reminder', option.value)"
      >
        <view
          ><text>{{ option.label }}</text
          ><text>{{ option.desc }}</text></view
        ><view
          class="check-box"
          :class="{ checked: settings.defaultReminders.includes(option.value) }"
          ><uni-icons
            v-if="settings.defaultReminders.includes(option.value)"
            type="checkmarkempty"
            size="16"
            color="var(--surface)"
        /></view></button
      ><picker
        mode="time"
        :value="settings.reminderTime"
        @change="
          $emit('update-setting', {
            key: 'reminderTime',
            value: $event.detail.value,
          })
        "
        ><view class="reminder-check-row"
          ><view
            ><text>提醒时间</text
            ><text>按当前时区 {{ settings.timezone }}</text></view
          ><view class="form-value"
            ><text>{{ settings.reminderTime }}</text
            ><uni-icons
              type="right"
              size="16"
              color="var(--ink-4)" /></view></view></picker
    ></view>
    <button
      hover-class="is-pressed"
      role="button"
      tabindex="0"
      class="primary-button save-button"
      @tap="$emit('back')"
    >
      完成
    </button>
  </view>
</template>

<script>
import PageHeader from "./PageHeader.vue";
export default {
  components: { PageHeader },
  name: "ReminderSettingsView",
  emits: ["back", "toggle-reminder", "update-setting"],
  props: {
    reminderOptions: { type: Array, default: () => [] },
    settings: { type: Object, required: true },
  },
};
</script>
