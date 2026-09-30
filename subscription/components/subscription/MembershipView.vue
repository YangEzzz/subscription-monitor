<template>
  <view class="page membership-page">
    <view class="detail-titlebar">
      <button class="icon-button plain" aria-label="返回" @tap="$emit('back')">
        <uni-icons type="left" size="24" color="#202622" />
      </button>
      <text class="page-title">账号额度</text><view class="icon-spacer"></view>
    </view>
    <view class="settings-section">
      <text class="settings-title">{{ isMember ? '会员版' : '免费版' }}</text>
      <view class="settings-card">
        <settings-row icon="list" title="订阅额度" :description="'已使用 ' + freeQuotaValue" />
        <settings-row icon="cloud-upload" title="账号数据" description="订阅和设置跟随你的微信账号保存" />
        <settings-row icon="notification" title="微信续费通知" description="授权后按提醒设置发送，可随时暂停" />
        <settings-row icon="bars" title="支出统计" description="按币种查看月均、年度和未来 30 天支出" />
      </view>
    </view>
    <text class="membership-footnote">{{ isMember ? '当前账号可不限数量新增订阅。' : '当前额度为 ' + subscriptionLimit + ' 条，删除记录后可释放额度。会员购买暂未开放。' }}</text>
  </view>
</template>
<script>
import SettingsRow from './SettingsRow.vue';
export default {
  name: 'MembershipView', components: { SettingsRow }, emits: ['back'],
  props: {
    isMember: { type: Boolean, default: false },
    freeQuotaValue: { type: String, default: '' },
    subscriptionLimit: { type: Number, default: null },
  },
};
</script>
