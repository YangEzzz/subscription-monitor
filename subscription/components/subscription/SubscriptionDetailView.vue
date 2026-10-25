<template>
  <view class="page detail-page redesign-page redesign-ancillary flow-page">
    <view v-if="showHeader" class="flow-header"
      ><page-header
        title="订阅详情"
        secondary
        pinned
        :scrolled="scrollOffset > 8"
        @back="$emit('back')"
    /></view>
    <view
      class="detail-summary card hero"
      :class="'detail-tone-' + getStatus(subscription)"
    >
      <view class="detail-hero"
        ><view
          class="detail-service-logo"
          :style="logoPaint(subscription.color)"
          >{{ subscription.logo }}</view
        ><view class="detail-hero-copy"
          ><text class="detail-name">{{ subscription.name }}</text
          ><text class="detail-plan">{{ subscription.category }}</text
          ><text v-if="subscription.plan" class="detail-plan">{{
            subscription.plan
          }}</text></view
        ><text class="status-badge large" :class="getStatus(subscription)">{{
          statusText(subscription)
        }}</text></view
      >
      <view class="detail-amount-card"
        ><text class="detail-amount-label">{{
          subscription.cycle === "一次性"
            ? "预计付款"
            : subscription.autoRenew
              ? "下次预计扣费"
              : "下次到期"
        }}</text
        ><view class="detail-charge-row"
          ><text
            class="detail-amount"
            :class="{ 'amount-missing': subscription.amount === null }"
            >{{
              subscription.amount === null
                ? "金额待补充"
                : formatMoney(subscription.amount, subscription.currency)
            }}</text
          ><view class="detail-when"
            ><text class="detail-date num">{{
              formatDate(subscription.nextBillingDate)
            }}</text
            ><text
              class="due num"
              :class="dueTone(subscription.nextBillingDate)"
              >{{ daysText(subscription) }}</text
            ></view
          ></view
        >
        <view v-if="progress" class="detail-cycle">
          <view
            class="cycle-track"
            role="progressbar"
            aria-label="本期进度"
            :aria-valuenow="Math.round(progress.percent)"
            aria-valuemin="0"
            aria-valuemax="100"
            ><view
              class="cycle-fill"
              :style="{ transform: 'scaleX(' + progress.percent / 100 + ')' }"
            ></view
            ><view
              class="cycle-marker"
              :style="{ left: progress.percent + '%' }"
            ></view
          ></view>
          <view class="cycle-labels"
            ><text
              >本期
              <text class="num">{{
                formatDate(progress.start, false)
              }}</text></text
            ><text
              ><text class="num">{{ formatDate(progress.end, false) }}</text>
              {{ subscription.autoRenew ? "扣费" : "到期" }}</text
            ></view
          >
        </view>
      </view>
    </view>
    <view class="detail-grid card list"
      ><view class="detail-fact"
        ><view class="icon-tile blue"
          ><uni-icons type="loop" size="18" color="var(--blue)" /></view
        ><view class="fact-copy"
          ><text class="fact-label">计费周期</text
          ><text
            class="fact-value"
            :class="{ num: subscription.cycle === '自定义天数' }"
            >{{ cycleText(subscription) }}</text
          ></view
        ></view
      ><view class="detail-fact"
        ><view class="icon-tile green"
          ><uni-icons type="wallet" size="18" color="var(--green)" /></view
        ><view class="fact-copy"
          ><text class="fact-label">付款渠道</text
          ><text class="fact-value">{{ subscription.payment }}</text></view
        ></view
      ><view class="detail-fact"
        ><view class="icon-tile violet"
          ><uni-icons type="paperclip" size="18" color="var(--violet)" /></view
        ><view class="fact-copy"
          ><text class="fact-label">分类</text
          ><text class="fact-value">{{ subscription.category }}</text></view
        ></view
      ><view class="detail-fact"
        ><view class="icon-tile orange"
          ><uni-icons type="reload" size="18" color="var(--orange)" /></view
        ><view class="fact-copy"
          ><text class="fact-label">自动续费</text
          ><view class="fact-value"
            ><view
              class="dot renewal-dot"
              :class="{ 'renewal-on': subscription.autoRenew }"
            ></view
            ><text>{{
              subscription.autoRenew ? "已开启" : "未开启"
            }}</text></view
          ></view
        ></view
      ></view
    >
    <view
      v-if="
        subscription.trialEndDate && daysUntil(subscription.trialEndDate) >= 0
      "
      class="trial-banner"
      ><uni-icons type="info-filled" size="18" color="var(--violet)" /><view
        ><text>试用期截止日</text
        ><text
          ><text class="num">{{ formatDate(subscription.trialEndDate) }}</text
          >，请在此日前确认是否继续。</text
        ></view
      ></view
    >
    <view class="detail-block card detail-reminders"
      ><view class="block-head"
        ><text>提醒计划</text
        ><view
          class="pill round notification-status"
          :class="notificationEnabled ? 'blue' : 'gray'"
          ><view class="dot notification-dot"></view
          ><text>{{
            notificationEnabled ? "通知可用" : "仅站内提醒"
          }}</text></view
        ></view
      ><scroll-view scroll-x :show-scrollbar="true" class="detail-steps-scroll"
        ><view class="detail-steps"
          ><template v-for="day in subscription.reminders" :key="day"
            ><text class="reminder-step num">{{
              day === 0 ? "当天" : `提前 ${day} 天`
            }}</text
            ><view class="reminder-connector"></view></template
          ><view class="reminder-goal"
            ><view class="icon-tile orange"
              ><uni-icons
                type="calendar"
                size="18"
                color="var(--orange)" /></view
            ><text>{{
              subscription.autoRenew ? "扣费日" : "到期日"
            }}</text></view
          ></view
        ></scroll-view
      >
      <view
        class="detail-reminder-notice"
        :class="{ 'notice-warning': reminderWarning }"
        ><view class="icon-tile" :class="reminderWarning ? 'orange' : 'blue'"
          ><uni-icons
            type="notification"
            size="16"
            :color="reminderWarning ? 'var(--orange)' : 'var(--blue)'" /></view
        ><text class="block-note"
          >最近提醒：<text class="reminder-message num">{{
            selectedNextReminderText
          }}</text></text
        ></view
      ></view
    >
    <view v-if="renewalHistory.length" class="detail-block card"
      ><view class="block-head"
        ><text>续费记录</text
        ><text
          >共
          <text class="num">{{ subscription.renewalHistory.length }}</text>
          次</text
        ></view
      ><view class="history-list"
        ><view
          v-for="record in renewalHistory"
          :key="record.confirmedAt"
          class="history-row"
          ><view
            ><text>{{ formatDate(record.billingDate) }}</text
            ><text>已确认续费</text></view
          ><text>{{
            formatMoney(record.amount, record.currency || subscription.currency)
          }}</text></view
        ></view
      ></view
    >
    <view
      v-if="subscription.note || subscription.cancelGuide"
      class="detail-block card"
      ><view v-if="subscription.note" class="text-info"
        ><text>备注</text><text>{{ subscription.note }}</text></view
      ><view v-if="subscription.cancelGuide" class="text-info"
        ><text>取消路径</text><text>{{ subscription.cancelGuide }}</text></view
      ></view
    >
    <view
      v-if="
        !['cancelled', 'archived', 'paused'].includes(subscription.status) ||
        (renewalLocked &&
          subscription.status === 'archived' &&
          subscription.cycle === '一次性')
      "
      class="process-card card"
      :class="{ completed: renewalLocked }"
      ><view v-if="renewalLocked" class="renewal-result"
        ><view class="result-icon"
          ><uni-icons
            type="checkbox-filled"
            size="24"
            color="var(--blue)" /></view
        ><view class="result-copy"
          ><text class="section-title">本期续费已确认</text
          ><text class="process-note num">{{
            subscription.cycle === "一次性"
              ? "本次付款已记录，订阅已归档。"
              : formatDate(subscription.lastRenewedBillingDate, false) +
                " 已记录，下次预计 " +
                formatDate(subscription.nextBillingDate, false) +
                " 扣费。"
          }}</text
          ><button
            hover-class="is-pressed"
            role="button"
            tabindex="0"
            class="undo-button"
            @tap="$emit('undo-renewal')"
          >
            撤销本次确认
          </button></view
        ></view
      ><view v-else-if="daysUntil(subscription.nextBillingDate) > 7"
        ><view class="process-countdown"
          ><uni-icons type="calendar" size="20" color="var(--ink-3)" /><text
            >距{{ subscription.autoRenew ? "扣费" : "到期" }}还有
            <text class="num">{{
              daysUntil(subscription.nextBillingDate)
            }}</text>
            天</text
          ></view
        ><button
          hover-class="is-pressed"
          role="button"
          tabindex="0"
          class="process-button early"
          @tap="$emit('confirm-renewal')"
        >
          <uni-icons
            type="checkbox-filled"
            size="18"
            color="var(--blue)"
          /><text>提前记录续费</text>
        </button></view
      ><view v-else
        ><text class="section-title"
          ><text
            v-for="(part, index) in processTitle(subscription).split(/(\d+)/)"
            :key="index"
            :class="{ 'num process-title-number': /^\d+$/.test(part) }"
            >{{ part }}</text
          ></text
        ><text class="process-desc"
          >请按实际处理结果更新本期记录，本工具不会代替你向服务商取消。</text
        ><view class="process-actions"
          ><button
            hover-class="is-pressed"
            role="button"
            tabindex="0"
            class="process-button success"
            @tap="$emit('confirm-renewal')"
          >
            <uni-icons
              type="checkbox-filled"
              size="20"
              color="var(--blue)"
            /><text>确认已续费</text></button
          ><button
            hover-class="is-pressed"
            role="button"
            tabindex="0"
            class="process-button later"
            @tap="$emit('snooze')"
          >
            <uni-icons type="redo" size="20" color="var(--orange)" /><text
              >稍后处理</text
            ></button
          ><button
            hover-class="is-pressed"
            role="button"
            tabindex="0"
            class="process-button cancel"
            @tap="$emit('cancel')"
          >
            <uni-icons type="closeempty" size="20" color="var(--red)" /><text
              >已取消</text
            >
          </button></view
        ></view
      ></view
    >
    <view class="detail-bottom flow-actionbar"
      ><button
        hover-class="is-pressed"
        role="button"
        tabindex="0"
        class="secondary-button manage-button"
        @tap="$emit('manage')"
      >
        <uni-icons
          type="more-filled"
          size="19"
          color="var(--blue)"
        />管理订阅</button
      ><button
        hover-class="is-pressed"
        role="button"
        tabindex="0"
        class="primary-button edit-button"
        @tap="$emit('edit')"
      >
        <uni-icons type="compose" size="19" color="var(--surface)" />编辑订阅
      </button></view
    >
  </view>
</template>

<script>
import PageHeader from "./PageHeader.vue";
import {
  dueTone,
  logoPaint,
  cycleProgress,
} from "./subscription-presentation.js";

export default {
  name: "SubscriptionDetailView",
  components: { PageHeader },
  methods: { dueTone, logoPaint },
  computed: {
    progress() {
      return cycleProgress(this.subscription);
    },
    reminderWarning() {
      return (
        !this.notificationEnabled ||
        this.subscription.amount === null ||
        ["paused", "cancelled", "archived"].includes(this.subscription.status)
      );
    },
  },
  emits: [
    "back",
    "confirm-renewal",
    "undo-renewal",
    "snooze",
    "cancel",
    "manage",
    "edit",
  ],
  props: {
    showHeader: { type: Boolean, default: true },
    scrollOffset: { type: Number, default: 0 },
    subscription: { type: Object, required: true },
    notificationEnabled: { type: Boolean, default: false },
    renewalHistory: { type: Array, default: () => [] },
    renewalLocked: { type: Boolean, default: false },
    selectedNextReminderText: { type: String, default: "" },
    formatDate: { type: Function, required: true },
    formatMoney: { type: Function, required: true },
    daysText: { type: Function, required: true },
    cycleText: { type: Function, required: true },
    getStatus: { type: Function, required: true },
    statusText: { type: Function, required: true },
    daysUntil: { type: Function, required: true },
    processTitle: { type: Function, required: true },
  },
};
</script>
