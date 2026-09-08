<template>
  <view class="page profile-page">
    <view
      class="primary-titlebar"
      :style="{ height: navigationBarHeight + 'px' }"
      ><text class="page-title">我的</text></view
    >
    <view class="profile-head"
      ><view class="profile-user-row"
        ><view class="avatar">续</view
        ><view class="profile-copy"
          ><text class="profile-name">续订清单用户</text
          ><text class="profile-sub"
            >服务端数据 · {{ liveSubscriptions.length }} 项订阅</text
          ></view
        ><text class="local-badge">演示模式</text></view
      ><view class="profile-metrics"
        ><view
          ><text>月均支出</text><text>{{ monthlyAverageText }}</text></view
        ><view><text>提醒状态</text><text>仅站内</text></view></view
      ></view
    >
    <view
      class="membership-entry"
      :class="{ active: isMember }"
      role="button"
      aria-label="查看会员权益"
      hover-class="membership-entry-pressed"
      @tap="$emit('open-membership')"
    >
      <view class="membership-entry-head">
        <view class="membership-icon"
          ><uni-icons
            :type="isMember ? 'checkbox-filled' : 'vip-filled'"
            size="22"
            color="#ffffff"
        /></view>
        <view class="membership-copy"
          ><text class="membership-kicker">{{
            isMember ? "会员权益" : "升级会员"
          }}</text
          ><text class="membership-title">{{
            isMember ? "会员已开启" : "开通会员"
          }}</text
          ><text class="membership-desc">{{
            isMember
              ? "无限新增订阅 · 模拟会员"
              : "解锁无限订阅，重要支出更从容"
          }}</text></view
        >
        <uni-icons
          class="membership-arrow"
          type="right"
          size="18"
          :color="isMember ? '#3c7c5a' : '#9b6a28'"
        />
      </view>
      <view v-if="!isMember" class="membership-quota"
        ><view class="membership-quota-line"
          ><text>免费额度</text><text>{{ freeQuotaText }}</text></view
        ><view class="membership-progress"
          ><view
            class="membership-progress-fill"
            :style="{ width: membershipQuotaPercent + '%' }"
          ></view></view
        ><view class="membership-benefits"
          ><view class="membership-benefit"
            ><uni-icons type="checkmarkempty" size="13" color="#8b641f" />
            <text>无限订阅</text></view
          ><view class="membership-benefit"
            ><uni-icons type="checkmarkempty" size="13" color="#8b641f" />
            <text>高级统计</text></view
          ><view class="membership-benefit"
            ><uni-icons type="checkmarkempty" size="13" color="#8b641f" />
            <text>续费提醒</text></view
          ></view
        ></view
      >
    </view>

    <view class="settings-section">
      <text class="settings-title">提醒设置</text>
      <view class="settings-card">
        <settings-row
          icon="notification"
          icon-class="green-bg"
          icon-color="#177e4b"
          title="续费通知"
          description="仅站内待办，尚未接入微信发送"
          action
          @tap="$emit('notification-change', true)"
        />
        <settings-row
          icon="calendar"
          icon-class="orange-bg"
          icon-color="#bb6b18"
          title="默认提醒规则"
          :description="`提前 ${settings.defaultReminders.join('、')} 天 · ${settings.reminderTime}`"
          action
          @tap="$emit('open-reminder-settings')"
        />
        <settings-row
          icon="email"
          icon-class="blue-bg"
          icon-color="#3c7fc1"
          title="每周订阅摘要"
          description="仅保存偏好，摘要发送尚未接入"
          switchable
          :checked="settings.weeklySummary"
          @change="$emit('weekly-summary-change', $event)"
        />
      </view>
    </view>

    <view class="settings-section">
      <text class="settings-title">数据与偏好</text>
      <view class="settings-card">
        <picker
          :range="currencies"
          @change="changeDefaultCurrency"
          ><settings-row
            icon="wallet"
            icon-class="violet-bg"
            icon-color="#6458c9"
            title="默认币种"
            :description="settings.defaultCurrency"
            action
        /></picker>
        <settings-row
          icon="download"
          icon-class="green-bg"
          icon-color="#177e4b"
          title="导出订阅数据"
          description="生成 CSV 或复制表格数据"
          action
          @tap="$emit('export')"
        />
        <settings-row
          icon="trash"
          icon-class="orange-bg"
          icon-color="#bb6b18"
          title="回收站"
          :description="
            deletedSubscriptions.length
              ? `${deletedSubscriptions.length} 条可恢复订阅`
              : '暂无已删除订阅'
          "
          action
          @tap="$emit('trash')"
        />
        <settings-row
          icon="locked"
          icon-class="blue-bg"
          icon-color="#3c7fc1"
          title="隐私与数据说明"
          description="了解当前演示的数据边界"
          action
          @tap="$emit('privacy')"
        />
        <settings-row
          icon="refresh"
          icon-class="red-bg"
          icon-color="#cc4b52"
          title="重新加载数据"
          description="从服务端刷新订阅与设置"
          action
          @tap="$emit('reset-demo')"
        />
      </view>
    </view>
    <text class="version-text">续订清单 · 接口联调版 v0.3</text>
  </view>
</template>

<script>
import SettingsRow from "./SettingsRow.vue";

export default {
  name: "SubscriptionProfileView",
  components: { SettingsRow },
  emits: [
    "open-membership",
    "notification-change",
    "open-reminder-settings",
    "weekly-summary-change",
    "default-currency-change",
    "export",
    "trash",
    "privacy",
    "reset-demo",
  ],
  props: {
    navigationBarHeight: { type: Number, default: 0 },
    liveSubscriptions: { type: Array, default: () => [] },
    monthlyAverageText: { type: String, default: "¥0.00" },
    settings: { type: Object, required: true },
    isMember: { type: Boolean, default: false },
    freeQuotaText: { type: String, default: "" },
    membershipQuotaPercent: { type: Number, default: 0 },
    currencies: { type: Array, default: () => [] },
    deletedSubscriptions: { type: Array, default: () => [] },
  },
  methods: {
    changeDefaultCurrency(event) {
      const currency = this.currencies[event.detail.value];
      // H5 picker 会在关闭动画结束时重新挂载节点，先让其完成清理。
      // #ifdef H5
      setTimeout(() => this.$emit("default-currency-change", currency), 300);
      // #endif
      // #ifndef H5
      this.$emit("default-currency-change", currency);
      // #endif
    },
  },
};
</script>
