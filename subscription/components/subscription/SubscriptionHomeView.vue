<template>
  <view class="page home-page">
    <view
      class="primary-titlebar home-head"
      :style="{ height: navigationBarHeight + 'px' }"
    >
      <text class="page-title">续订清单</text>
    </view>
    <text class="home-lead">每一笔续费，都提前心中有数</text>

    <view class="summary-card">
      <view class="summary-top"
        ><text>未来 30 天预计扣费</text
        ><button
          role="button"
          tabindex="0"
          class="summary-eye"
          aria-label="显示或隐藏金额"
          @tap="$emit('toggle-amount')"
        >
          <uni-icons
            :type="settings.amountVisible ? 'eye' : 'eye-slash'"
            size="20"
            color="#ffffff"
          /></button
      ></view>
      <text class="summary-amount compact-total">{{
        settings.amountVisible ? next30TotalText : "••••"
      }}</text>
      <view class="summary-meta"
        ><text>共 {{ next30Subscriptions.length }} 项</text
        ><view class="divider"></view
        ><text
          >月均约
          {{ settings.amountVisible ? monthlyAverageText : "•••" }}</text
        ></view
      >
    </view>
    <view class="overview-metrics">
      <view class="overview-metric"
        ><text class="overview-metric-label">正在订阅</text
        ><view class="overview-metric-value"
          >{{ activeSubscriptions.length }}<text>项服务</text></view
        ></view
      >
      <view class="overview-metric"
        ><text class="overview-metric-label">7 天内续费</text
        ><view class="overview-metric-value"
          >{{ upcoming7.length }}<text>项提醒</text></view
        ></view
      >
    </view>

    <view
      v-if="!settings.notificationEnabled"
      class="notice-banner"
      @tap="$emit('enable-notification')"
    >
      <view class="notice-icon"
        ><uni-icons type="notification" size="20" color="#a86210"
      /></view>
      <view class="notice-copy"
        ><text class="notice-title">当前仅支持站内提醒</text
        ><text class="notice-desc">微信消息发送尚未接入</text></view
      >
      <button
        role="button"
        tabindex="0"
        class="notice-action"
        @tap.stop="$emit('enable-notification')"
      >
        了解
      </button>
    </view>

    <view class="section-card">
      <view class="section-head"
        ><text class="section-title">即将续费</text
        ><button
          role="button"
          tabindex="0"
          class="text-button"
          @tap="$emit('switch-all')"
        >
          全部 {{ activeSubscriptions.length }}
          <uni-icons type="right" size="14" color="#747b76" /></button
      ></view>
      <view v-if="upcoming7.length" class="group-title"
        ><text>未来 7 天</text
        ><text class="count-dot red">{{ upcoming7.length }}</text></view
      >
      <subscription-row
        v-for="item in upcoming7"
        :key="item.id"
        :item="decorateItem(item)"
        @tap="$emit('open-detail', item)"
      />
      <view v-if="upcoming30Later.length" class="group-title second"
        ><text>未来 30 天</text
        ><text class="count-dot orange">{{
          upcoming30Later.length
        }}</text></view
      >
      <subscription-row
        v-for="item in upcoming30Later.slice(0, 3)"
        :key="item.id"
        :item="decorateItem(item)"
        @tap="$emit('open-detail', item)"
      />
      <view v-if="!next30Subscriptions.length" class="empty-compact"
        ><text>未来 30 天暂无扣费</text
        ><button
          role="button"
          tabindex="0"
          class="text-button green"
          @tap="$emit('open-form')"
        >
          新增订阅
        </button></view
      >
      <button
        role="button"
        tabindex="0"
        v-if="next30Subscriptions.length > 4"
        class="view-more"
        @tap="$emit('switch-all')"
      >
        查看全部 {{ next30Subscriptions.length }} 项
      </button>
    </view>

    <view class="section-card reminder-card">
      <view class="section-head"
        ><text class="section-title">待处理事项</text
        ><text class="section-caption"
          >{{ actionableReminders.length }} 项</text
        ></view
      >
      <button
        role="button"
        tabindex="0"
        v-for="reminder in actionableReminders"
        :key="reminder.key"
        class="reminder-row"
        @tap="$emit('handle-reminder', reminder)"
      >
        <view class="reminder-icon" :class="reminder.tone"
          ><uni-icons :type="reminder.icon" size="18" color="#ffffff"
        /></view>
        <view class="reminder-copy"
          ><text class="reminder-title">{{ reminder.title }}</text
          ><text class="reminder-desc">{{ reminder.desc }}</text></view
        >
        <uni-icons
          v-if="reminder.action !== 'none'"
          type="right"
          size="16"
          color="#a2a7a3"
        />
      </button>
    </view>
    <button
      role="button"
      tabindex="0"
      class="primary-button home-add"
      @tap="$emit('open-form')"
    >
      <uni-icons type="plus" size="20" color="#ffffff" />新增订阅
    </button>
  </view>
</template>

<script>
import SubscriptionRow from "./subscription-row.vue";

export default {
  name: "SubscriptionHomeView",
  components: { SubscriptionRow },
  emits: [
    "toggle-amount",
    "enable-notification",
    "switch-all",
    "open-detail",
    "open-form",
    "handle-reminder",
  ],
  props: {
    settings: { type: Object, required: true },
    navigationBarHeight: { type: Number, default: 0 },
    next30TotalText: { type: String, default: "¥0.00" },
    monthlyAverageText: { type: String, default: "¥0.00" },
    next30Subscriptions: { type: Array, default: () => [] },
    activeSubscriptions: { type: Array, default: () => [] },
    upcoming7: { type: Array, default: () => [] },
    upcoming30Later: { type: Array, default: () => [] },
    actionableReminders: { type: Array, default: () => [] },
    trendData: { type: Array, default: () => [] },
    decorateItem: { type: Function, required: true },
  },
};
</script>
