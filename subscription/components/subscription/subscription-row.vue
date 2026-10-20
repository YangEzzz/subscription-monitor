<template>
  <button
    role="button"
    tabindex="0"
    class="renewal-row srow"
    :class="{
      urgent: item.days >= 0 && item.days <= 7,
      overdue: item.days < 0,
    }"
    hover-class="row-pressed"
    :aria-label="`${item.name}，${item.shortDate}，${item.amount === null ? '金额待补充' : item.amountText}，${item.displayStatus || '待续费'}`"
    @tap="$emit('activate')"
  >
    <brand-logo class="renewal-brand" :item="item" />
    <view class="renewal-main"
      ><view class="srow-name-line"
        ><text class="renewal-name">{{ item.name }}</text>
        <text class="pill" :class="statusTone">{{
          item.displayStatus || "待续费"
        }}</text>
      </view>
      <text class="renewal-date">{{ item.cycle }} · {{ item.payment }}</text>
      <text class="srow-date num"
        >{{ showDate ? dateLabel || item.shortDate : item.shortDate
        }}<text v-if="!showDate">
          · {{ item.plan || item.category }}</text
        ></text
      >
    </view>
    <view class="renewal-side"
      ><text
        class="renewal-price amount"
        :class="{ todo: item.amount === null }"
        >{{ item.amountText }}</text
      ><text class="days due" :class="dueTone">{{
        item.days < 0
          ? "已逾期 " + Math.abs(item.days) + " 天"
          : item.days === 0
            ? "今天续费"
            : item.days + " 天后"
      }}</text></view
    >
    <uni-icons type="right" size="14" color="var(--ink-4)" />
  </button>
</template>
<script>
import BrandLogo from "./brand-logo.vue";
export default {
  name: "SubscriptionRow",
  components: { BrandLogo },
  emits: ["activate"],
  props: {
    item: { type: Object, required: true },
    showDate: { type: Boolean, default: false },
    dateLabel: { type: String, default: "" },
  },
  computed: {
    statusTone() {
      return (
        {
          即将到期: "orange",
          试用中: "violet",
          待处理: "orange",
          逾期未确认: "red",
          正常: "green",
        }[this.item.displayStatus] || "gray"
      );
    },
    dueTone() {
      return this.item.days < 0
        ? "overdue"
        : this.item.days <= 7
          ? "hot"
          : this.item.days <= 14
            ? "mid"
            : "far";
    },
  },
};
</script>
