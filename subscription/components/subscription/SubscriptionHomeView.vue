<template>
  <view class="page home-page">
    <view
      class="primary-titlebar home-head"
      :style="{ height: navigationBarHeight + 'px' }"
    >
      <text class="page-title">续订清单</text>
    </view>
    <view class="home-overview">
      <view class="home-intro">
        <text class="home-kicker">续费概览</text>
        <button
          class="quick-add"
          role="button"
          tabindex="0"
          aria-label="新增订阅"
          @tap="$emit('open-form')"
        >
          <uni-icons type="plus" size="15" color="#315acb" /><text
            >新增订阅</text
          >
        </button>
      </view>
      <text class="home-lead">近期扣费与待处理事项</text>
      <view class="summary-body">
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
                color="#68758c"
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
        <view class="renewal-illustration" aria-hidden="true">
          <view class="illustration-orbit"></view>
          <view class="receipt-back"></view>
          <view class="receipt-paper"
            ><view class="receipt-line long"></view
            ><view class="receipt-line"></view
            ><view class="receipt-line short"></view
          ></view>
          <view class="receipt-clock"
            ><view class="clock-hand hour"></view
            ><view class="clock-hand minute"></view
          ></view>
        </view>
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
    </view>
    <view class="home-body">
      <view class="section-card renewal-agenda">
        <view class="section-head"
          ><view><text class="section-title">即将续费</text></view
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
        <view v-if="upcoming7.length" class="renewal-group">
          <subscription-row
            v-for="item in upcoming7"
            :key="item.id"
            :item="decorateItem(item)"
            @activate="$emit('open-detail', item)"
          />
        </view>
        <view v-if="upcoming30Later.length" class="group-title second"
          ><text>8–30 天内</text
          ><text class="count-dot orange">{{
            upcoming30Later.length
          }}</text></view
        >
        <view v-if="upcoming30Later.length" class="renewal-group">
          <subscription-row
            v-for="item in upcoming30Later.slice(0, 3)"
            :key="item.id"
            :item="decorateItem(item)"
            @activate="$emit('open-detail', item)"
          />
        </view>
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

      <view class="home-secondary">
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
            :disabled="reminder.action === 'notification' && notificationBusy"
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
      </view>
    </view>
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
    notificationReady: { type: Boolean, default: false },
    notificationDescription: { type: String, default: "" },
    notificationBusy: { type: Boolean, default: false },
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
