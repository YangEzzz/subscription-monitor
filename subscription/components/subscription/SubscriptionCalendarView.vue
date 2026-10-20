<template>
  <view class="page calendar-page redesign-page">
    <page-header
      title="续费日历"
      subtitle="按日期安排续费，查看每天的扣费明细"
    />
    <view class="card rd-calendar-card">
      <view class="rd-month-nav"
        ><text class="rd-month-name num">{{ calendarTitle }}</text
        ><view class="rd-month-controls"
          ><button
            role="button"
            tabindex="0"
            class="rd-month-arrow pressable"
            aria-label="上个月"
            hover-class="is-pressed"
            @tap="$emit('change-month', -1)"
          >
            ‹</button
          ><button
            role="button"
            tabindex="0"
            class="rd-month-arrow pressable"
            aria-label="下个月"
            hover-class="is-pressed"
            @tap="$emit('change-month', 1)"
          >
            ›
          </button></view
        ><button
          role="button"
          tabindex="0"
          class="btn-soft rd-today pressable"
          hover-class="is-pressed"
          @tap="$emit('today')"
        >
          <text class="rd-compact-face">今天</text>
        </button></view
      >
      <view class="rd-calendar-grid rd-weekdays"
        ><text
          v-for="(day, index) in weekdays"
          :key="day"
          :class="{ 'rd-weekend': index === 0 || index === 6 }"
          >{{ day }}</text
        ></view
      >
      <view class="rd-calendar-grid"
        ><button
          role="button"
          tabindex="0"
          v-for="day in calendarDays"
          :key="day.key"
          class="rd-calendar-day pressable"
          :class="{
            'rd-other-month': !day.currentMonth,
            'rd-day-selected': day.key === selectedDate,
            'rd-day-today': day.key === todayKey,
          }"
          :aria-pressed="day.key === selectedDate"
          :aria-label="
            day.key +
            '，' +
            (day.count ? day.count + '项续费' : '无续费') +
            (day.amountText ? '，' + day.amountText : '')
          "
          hover-class="is-pressed"
          @tap="$emit('select-date', day.key)"
        >
          <text class="rd-calendar-number num">{{ day.day }}</text
          ><view v-if="day.count" class="rd-calendar-marks"
            ><view
              v-for="item in markersFor(day.key).slice(0, 3)"
              :key="item.id"
              class="rd-calendar-mark"
              :style="{ backgroundColor: item.color || 'var(--blue)' }"
            ></view
            ><text v-if="day.count > 3" class="rd-calendar-extra num"
              >+{{ day.count - 3 }}</text
            ></view
          ><text v-if="day.amountText" class="rd-calendar-price num">{{
            day.amountText
          }}</text>
        </button></view
      >
    </view>
    <view
      :key="selectedDate"
      class="card list rd-calendar-detail rd-enter motion"
    >
      <view class="rd-detail-head"
        ><view class="rd-detail-title"
          ><text class="num">{{ selectedDateTitle }}</text
          ><text class="pill gray">{{ selectedWeekday }}</text></view
        ><text class="rd-detail-total num"
          >{{ selectedDateSubscriptions.length }} 项 ·
          {{
            selectedDateSubscriptions.length &&
            selectedDateSubscriptions.every((item) => item.amount === null)
              ? "金额待补充"
              : selectedDateTotalText
          }}</text
        ></view
      >
      <subscription-row
        v-for="item in selectedDateSubscriptions"
        :key="item.id"
        :item="{
          ...decorateItem(item),
          cycle: cycleText(item),
          amountText:
            item.amount === null
              ? '金额待补充'
              : formatMoney(item.amount, item.currency),
        }"
        @activate="$emit('open-detail', item)"
      />
      <empty-state-view
        v-if="!selectedDateSubscriptions.length"
        icon="calendar"
        title="当天没有续费项目"
        action-label="添加到这一天"
        @action="$emit('open-form', selectedDate)"
      />
    </view>
  </view>
</template>

<script>
import PageHeader from "./PageHeader.vue";
import SubscriptionRow from "./subscription-row.vue";
import EmptyStateView from "./EmptyStateView.vue";

export default {
  name: "SubscriptionCalendarView",
  components: { PageHeader, SubscriptionRow, EmptyStateView },
  emits: ["change-month", "today", "select-date", "open-detail", "open-form"],
  methods: {
    markersFor(key) {
      return this.renewalSubscriptions.filter(
        (item) => item.nextBillingDate === key,
      );
    },
  },
  props: {
    renewalSubscriptions: { type: Array, default: () => [] },
    decorateItem: { type: Function, required: true },
    navigationBarHeight: { type: Number, default: 0 },
    calendarTitle: { type: String, default: "" },
    weekdays: { type: Array, default: () => [] },
    calendarDays: { type: Array, default: () => [] },
    selectedDate: { type: String, default: "" },
    selectedDateSubscriptions: { type: Array, default: () => [] },
    selectedDateTitle: { type: String, default: "" },
    selectedWeekday: { type: String, default: "" },
    selectedDateTotalText: { type: String, default: "¥0.00" },
    todayKey: { type: String, default: "" },
    formatMoney: { type: Function, required: true },
    cycleText: { type: Function, required: true },
  },
};
</script>
