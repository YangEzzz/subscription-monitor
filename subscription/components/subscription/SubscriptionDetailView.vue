<template>
  <view class="page detail-page">
    <view class="detail-titlebar"
      ><button
        role="button"
        tabindex="0"
        class="icon-button plain"
        aria-label="返回"
        @tap.stop="$emit('back')"
      >
        <uni-icons type="left" size="24" color="#202622" /></button
      ><text class="page-title">订阅详情</text><view class="icon-spacer"></view
    ></view>
    <view class="detail-hero"
      ><brand-logo :item="subscription" /><view class="detail-hero-copy"
        ><text class="detail-name">{{ subscription.name }}</text
        ><text class="detail-plan">{{
          subscription.plan || subscription.category
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
      ><text class="detail-amount">{{
        subscription.amount === null
          ? "金额待补充"
          : formatMoney(subscription.amount, subscription.currency)
      }}</text
      ><text class="detail-countdown"
        >{{ formatDate(subscription.nextBillingDate) }} ·
        {{ daysText(subscription) }}</text
      ></view
    >
    <view class="detail-grid"
      ><view
        ><text>计费周期</text><text>{{ cycleText(subscription) }}</text></view
      ><view
        ><text>付款渠道</text><text>{{ subscription.payment }}</text></view
      ><view
        ><text>分类</text><text>{{ subscription.category }}</text></view
      ><view
        ><text>自动续费</text
        ><text>{{ subscription.autoRenew ? "已开启" : "未开启" }}</text></view
      ></view
    >
    <view
      v-if="
        subscription.trialEndDate && daysUntil(subscription.trialEndDate) >= 0
      "
      class="trial-banner"
      ><uni-icons type="info-filled" size="18" color="#a86210" /><view
        ><text>试用期截止日</text
        ><text
          >{{
            formatDate(subscription.trialEndDate)
          }}，请在此日前确认是否继续。</text
        ></view
      ></view
    >
    <view class="detail-block"
      ><view class="block-head"
        ><text>提醒计划</text
        ><text>{{
          notificationEnabled ? "通知可用" : "仅站内提醒"
        }}</text></view
      ><view class="reminder-tags"
        ><text v-for="day in subscription.reminders" :key="day">{{
          day === 0 ? "当天" : `提前 ${day} 天`
        }}</text></view
      ><text class="block-note"
        >最近提醒：{{ selectedNextReminderText }}</text
      ></view
    >
    <view v-if="renewalHistory.length" class="detail-block"
      ><view class="block-head"
        ><text>续费记录</text
        ><text>共 {{ subscription.renewalHistory.length }} 次</text></view
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
      class="detail-block"
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
      class="process-card"
      :class="{ completed: renewalLocked }"
      ><view v-if="renewalLocked" class="renewal-result"
        ><view class="result-icon"
          ><uni-icons type="checkbox-filled" size="24" color="#177e4b" /></view
        ><view class="result-copy"
          ><text class="section-title">本期续费已确认</text
          ><text class="process-note">{{
            subscription.cycle === "一次性"
              ? "本次付款已记录，订阅已归档。"
              : formatDate(subscription.lastRenewedBillingDate, false) +
                " 已记录，下次预计 " +
                formatDate(subscription.nextBillingDate, false) +
                " 扣费。"
          }}</text
          ><button
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
          ><uni-icons type="calendar" size="20" color="#8a9590" /><text
            >距{{ subscription.autoRenew ? "扣费" : "到期" }}还有
            {{ daysUntil(subscription.nextBillingDate) }} 天</text
          ></view
        ><button
          role="button"
          tabindex="0"
          class="process-button early"
          @tap="$emit('confirm-renewal')"
        >
          <uni-icons type="checkbox-filled" size="20" color="#8a9590" /><text
            >提前记录续费</text
          >
        </button></view
      ><view v-else
        ><text class="section-title">{{ processTitle(subscription) }}</text
        ><text class="process-desc"
          >请按实际处理结果更新本期记录，本工具不会代替你向服务商取消。</text
        ><view class="process-actions"
          ><button
            role="button"
            tabindex="0"
            class="process-button success"
            @tap="$emit('confirm-renewal')"
          >
            <uni-icons type="checkbox-filled" size="20" color="#177e4b" /><text
              >确认已续费</text
            ></button
          ><button
            role="button"
            tabindex="0"
            class="process-button later"
            @tap="$emit('snooze')"
          >
            <uni-icons type="redo" size="20" color="#9a601b" /><text
              >稍后处理</text
            ></button
          ><button
            role="button"
            tabindex="0"
            class="process-button cancel"
            @tap="$emit('cancel')"
          >
            <uni-icons type="closeempty" size="20" color="#bd4048" /><text
              >已取消</text
            >
          </button></view
        ></view
      ></view
    >
    <view class="detail-bottom"
      ><button
        role="button"
        tabindex="0"
        class="secondary-button manage-button"
        @tap="$emit('manage')"
      >
        <uni-icons
          type="more-filled"
          size="19"
          color="#177e4b"
        />管理订阅</button
      ><button
        role="button"
        tabindex="0"
        class="primary-button edit-button"
        @tap="$emit('edit')"
      >
        <uni-icons type="compose" size="19" color="#ffffff" />编辑订阅
      </button></view
    >
  </view>
</template>

<script>
import BrandLogo from "./brand-logo.vue";

export default {
  name: "SubscriptionDetailView",
  components: { BrandLogo },
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
