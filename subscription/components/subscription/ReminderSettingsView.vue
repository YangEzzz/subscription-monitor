<template>
  <view class="page form-page">
    <view class="detail-titlebar"
      ><button
        role="button"
        tabindex="0"
        class="icon-button plain"
        aria-label="返回"
        @tap.stop="$emit('back')"
      >
        <uni-icons type="left" size="24" color="#202622" /></button
      ><text class="page-title">默认提醒规则</text
      ><view class="icon-spacer"></view
    ></view>
    <view class="settings-intro"
      ><uni-icons type="notification-filled" size="24" color="#177e4b" /><view
        ><text>新订阅将自动使用这些节点</text
        ><text>单条订阅仍可在编辑时单独调整</text></view
      ></view
    >
    <view class="reminder-check-list"
      ><button
        role="button"
        tabindex="0"
        v-for="option in reminderOptions"
        :key="option.value"
        class="reminder-check-row"
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
            color="#ffffff"
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
              color="#a2a7a3" /></view></view></picker
    ></view>
    <button
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
export default {
  name: "ReminderSettingsView",
  emits: ["back", "toggle-reminder", "update-setting"],
  props: {
    reminderOptions: { type: Array, default: () => [] },
    settings: { type: Object, required: true },
  },
};
</script>
