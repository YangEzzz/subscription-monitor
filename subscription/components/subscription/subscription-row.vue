<template>
  <button role="button" tabindex="0" class="renewal-row" @tap="$emit('tap')">
    <view class="date-stamp" aria-hidden="true"
      ><text class="date-stamp-month"
        >{{ Number(item.nextBillingDate.slice(5, 7)) }}月</text
      ><text class="date-stamp-day">{{
        item.nextBillingDate.slice(8, 10)
      }}</text></view
    >
    <view class="renewal-main"
      ><text class="renewal-name">{{ item.name }}</text
      ><text class="renewal-date"
        >{{ item.shortDate }} · {{ item.displayStatus || "待续费" }}</text
      ></view
    >
    <view class="renewal-side"
      ><text class="renewal-price">{{ item.amountText }}</text
      ><text class="days" :class="{ urgent: item.days <= 7 }">{{
        item.days < 0
          ? "已逾期 " + Math.abs(item.days) + " 天"
          : item.days === 0
            ? "今天续费"
            : item.days + " 天后"
      }}</text></view
    >
  </button>
</template>
<script>
export default {
  name: "SubscriptionRow",
  emits: ["tap"],
  props: { item: { type: Object, required: true } },
};
</script>
