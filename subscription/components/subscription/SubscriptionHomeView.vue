<template>
  <view class="page home-page redesign-page">
    <page-header title="续订清单" subtitle="近期扣费与续费安排" online />
    <view class="card hero rd-home-hero">
      <view class="rd-hero-top"
        ><text class="rd-eyebrow">未来 30 天预计扣费</text
        ><view class="rd-hero-actions"
          ><button
            role="button"
            tabindex="0"
            class="rd-stat-link pressable"
            hover-class="is-pressed"
            @tap="$emit('open-stats')"
          >
            <text class="rd-compact-face">统计 ›</text></button
          ><button
            role="button"
            tabindex="0"
            class="rd-eye pressable"
            hover-class="is-pressed"
            :aria-label="settings.amountVisible ? '隐藏金额' : '显示金额'"
            @tap="$emit('toggle-amount')"
          >
            <view class="rd-compact-face"
              ><uni-icons
                :type="settings.amountVisible ? 'eye' : 'eye-slash'"
                size="18"
                color="var(--ink-3)"
            /></view></button></view
      ></view>
      <display-amount
        :value="settings.amountVisible ? next30TotalText : '••••'"
      />
      <view class="rd-summary-meta"
        >共 <text class="num">{{ next30Subscriptions.length }}</text> 项 ·
        月均约
        <text class="num">{{
          settings.amountVisible ? monthlyAverageText : "•••"
        }}</text></view
      >
      <view class="rd-timeline" aria-label="未来30天续费时间轴">
        <view class="rd-timeline-track"
          ><view class="rd-timeline-hot"></view></view
        ><view class="rd-timeline-week"></view>
        <view
          v-for="(item, index) in next30Subscriptions"
          :key="item.id"
          class="rd-timeline-pin"
          :class="{ 'rd-pin-urgent': index === 0 }"
          :style="{
            left: (decorateItem(item).days / 30) * 100 + '%',
            backgroundColor: item.color || 'var(--blue)',
          }"
          :aria-label="item.name + '，' + decorateItem(item).shortDate"
          ><text>{{ item.logo }}</text></view
        >
        <view class="rd-timeline-labels num"
          ><text>今天</text><text class="rd-week-label">7 天</text
          ><text>30 天</text></view
        >
      </view>
      <view class="rd-kpis"
        ><view class="rd-kpi"
          ><view class="icon-tile blue"
            ><uni-icons type="loop" size="20" color="var(--blue)" /></view
          ><view
            ><text class="rd-kpi-label">正在订阅</text
            ><view class="rd-kpi-value num"
              >{{ activeSubscriptions.length
              }}<text class="rd-kpi-unit">项服务</text></view
            ></view
          ></view
        ><view class="rd-kpi"
          ><view class="icon-tile orange"
            ><uni-icons
              type="notification"
              size="20"
              color="var(--orange)" /></view
          ><view
            ><text class="rd-kpi-label">7 天内续费</text
            ><view class="rd-kpi-value rd-orange num"
              >{{ upcoming7.length
              }}<text class="rd-kpi-unit">项提醒</text></view
            ></view
          ></view
        ></view
      >
    </view>
    <view class="sec-head"
      ><text class="sec-title">即将续费</text
      ><button
        role="button"
        tabindex="0"
        class="link-pill pressable"
        hover-class="is-pressed"
        @tap="$emit('switch-all')"
      >
        <view class="link-pill-face"
          ><text class="link-pill-label">全部 {{ activeSubscriptions.length }}</text>
          <view class="link-pill-arrow"
            ><uni-icons type="right" size="12" color="var(--ink-3)" /></view
        ></view></button
    ></view>
    <view class="card list">
      <view v-if="upcoming7.length" class="rd-group rd-orange"
        >未来 7 天
        <text class="count-badge num">{{ upcoming7.length }}</text></view
      >
      <subscription-row
        v-for="item in upcoming7"
        :key="item.id"
        :item="decorateItem(item)"
        @activate="$emit('open-detail', item)"
      />
      <view v-if="upcoming30Later.length" class="rd-group"
        >8–30 天内
        <text class="count-badge num">{{ upcoming30Later.length }}</text></view
      >
      <subscription-row
        v-for="item in upcoming30Later.slice(0, 3)"
        :key="item.id"
        :item="decorateItem(item)"
        @activate="$emit('open-detail', item)"
      />
      <empty-state-view
        v-if="!next30Subscriptions.length"
        embedded
        icon="calendar"
        title="未来 30 天暂无扣费"
        description="点击底部“＋”添加订阅"
      />
      <button
        role="button"
        tabindex="0"
        v-if="next30Subscriptions.length > 4"
        class="rd-more pressable"
        hover-class="is-pressed"
        @tap="$emit('switch-all')"
      >
        查看全部 <text class="num">{{ next30Subscriptions.length }}</text> 项
      </button>
    </view>
    <view v-if="actionableReminders.length" class="home-tasks">
      <view class="sec-head"
        ><text class="sec-title">待处理事项</text
        ><text class="pill orange round num"
          >{{ actionableReminders.length }} 类</text
        ></view
      >
      <view class="card list"
        ><settings-row
          v-for="reminder in actionableReminders"
          :key="reminder.key"
          :icon="reminder.icon"
          :icon-class="
            reminder.tone === 'danger'
              ? 'red-bg'
              : reminder.tone === 'warning'
                ? 'orange-bg'
                : reminder.tone === 'success'
                  ? 'green-bg'
                  : 'blue-bg'
          "
          :icon-color="
            reminder.tone === 'danger'
              ? 'var(--red)'
              : reminder.tone === 'warning'
                ? 'var(--orange)'
                : reminder.tone === 'success'
                  ? 'var(--green)'
                  : 'var(--blue)'
          "
          :title="reminder.title"
          :description="reminder.desc"
          action
          @activate="$emit('handle-reminder', reminder)"
      /></view>
    </view>
  </view>
</template>

<script>
import PageHeader from "./PageHeader.vue";
import DisplayAmount from "./DisplayAmount.vue";
import EmptyStateView from "./EmptyStateView.vue";
import SettingsRow from "./SettingsRow.vue";
import SubscriptionRow from "./subscription-row.vue";

export default {
  name: "SubscriptionHomeView",
  components: {
    SubscriptionRow,
    PageHeader,
    DisplayAmount,
    EmptyStateView,
    SettingsRow,
  },
  emits: [
    "toggle-amount",
    "open-stats",
    "switch-all",
    "open-detail",
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
