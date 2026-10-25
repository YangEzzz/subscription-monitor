<template>
  <view class="page about-page redesign-page">
    <page-header title="关于续订清单" secondary @back="$emit('back')" />
    <view class="settings-card card list">
      <settings-row
        icon="locked"
        icon-class="blue-bg"
        icon-color="var(--blue)"
        title="隐私与数据说明"
        description="了解账号登录与数据保存"
        action
        @activate="$emit('privacy')"
      />
    </view>
    <text class="version-text">续订清单 · 订阅续费管理</text>
  </view>
</template>

<script>
import PageHeader from "./PageHeader.vue";
import SettingsRow from "./SettingsRow.vue";

export default {
  name: "SubscriptionAboutView",
  components: { PageHeader, SettingsRow },
  emits: ["back", "privacy"],
};
</script>
