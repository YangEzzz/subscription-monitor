<template>
  <view class="spending-history">
    <view class="history-toolbar rd-inset">
      <button
        class="history-month-arrow btn-ghost pressable"
        aria-label="上一个月"
        hover-class="is-pressed"
        @tap="selectMonth(shiftMonth(month, -1))"
      >
        ‹
      </button>
      <picker
        mode="date"
        fields="month"
        :value="month"
        :end="todayMonth"
        @change="selectMonth($event.detail.value)"
      >
        <view
          class="history-month pressable"
          role="button"
          :aria-label="'选择支出月份，当前' + month"
          >{{ monthLabel }} <text class="history-picker-caret">▾</text></view
        >
      </picker>
      <button
        class="history-month-arrow btn-ghost pressable"
        aria-label="下一个月"
        :disabled="month >= todayMonth"
        hover-class="is-pressed"
        @tap="selectMonth(shiftMonth(month, 1))"
      >
        ›
      </button>
      <button
        v-if="month !== todayMonth"
        class="history-today btn-ghost pressable"
        hover-class="is-pressed"
        @tap="selectMonth(todayMonth)"
      >
        本月
      </button>
    </view>
    <view class="history-currency-row rd-inset">
      <text class="history-note">按账期归属月份 · 原币种统计</text>
      <picker
        :range="currencyOptions"
        :value="currencyOptions.indexOf(currency)"
        @change="$emit('currency-change', currencyOptions[$event.detail.value])"
      >
        <view
          class="rd-currency pressable"
          role="button"
          aria-label="选择历史支出币种"
          >{{ currency }} ▾</view
        >
      </picker>
    </view>
    <async-state-view
      v-if="error"
      compact
      title="支出记录暂时不可用"
      :description="error"
      :busy="loading"
      action-label="重试"
      @action="load(Boolean(result))"
    />
    <view v-if="loading && !result" role="status" aria-label="正在读取支出记录"
      ><ui-skeleton variant="hero" /><ui-skeleton variant="list"
    /></view>
    <template v-if="result">
      <view class="card hero rd-stats-hero history-summary">
        <text class="rd-eyebrow"
          >{{ monthLabel }}已记录支出 · {{ currency }}</text
        >
        <display-amount
          v-if="result.count > result.unknownCount"
          :value="formatMoney(result.total, currency)"
        />
        <text v-else class="history-unrecorded">{{
          result.count ? "金额待补充" : "暂无支出记录"
        }}</text>
        <text class="rd-stats-compare"
          >{{ result.count }} 笔已确认续费<text v-if="result.unknownCount">
            · {{ result.unknownCount }} 笔金额未填写，未计入总额</text
          ></text
        >
        <view
          v-if="result.totalsByCurrency.length"
          class="history-currency-totals"
        >
          <button
            v-for="group in result.totalsByCurrency"
            :key="group.currency"
            class="history-currency-total pressable"
            :class="{ 'history-currency-active': group.currency === currency }"
            :aria-label="'查看' + group.currency + '支出'"
            :aria-pressed="group.currency === currency"
            hover-class="is-pressed"
            @tap="$emit('currency-change', group.currency)"
          >
            <text>{{ group.currency }} · {{ group.count }} 笔</text
            ><text class="num">{{
              group.count === group.unknownCount
                ? "金额待补充"
                : formatMoney(group.total, group.currency)
            }}</text>
          </button>
        </view>
      </view>
      <view v-if="result.categoryStats.length" class="card rd-chart-card">
        <view class="rd-chart-head"
          ><text class="card-title">分类构成</text
          ><text class="pill gray">{{ currency }}</text></view
        >
        <view class="rd-category-body"
          ><donut-chart
            :segments="categories"
            :title="Number(month.slice(5)) + '月'"
          /><view class="rd-legend"
            ><view
              v-for="item in categories"
              :key="item.name"
              class="rd-legend-row"
              ><view class="rd-legend-top"
                ><view
                  class="rd-legend-dot"
                  :style="{ backgroundColor: item.color }"
                ></view
                ><text class="rd-legend-name">{{ item.name }}</text
                ><text class="rd-legend-percent num"
                  >{{ item.percent }}%</text
                ></view
              ><text class="rd-legend-value num">{{
                formatMoney(item.value, currency)
              }}</text></view
            ></view
          ></view
        >
      </view>
      <view class="card rd-chart-card">
        <view class="rd-chart-head"
          ><view
            ><text class="card-title">历史支出趋势</text
            ><text class="rd-chart-sub"
              >截至所选月份的近 6 个月 · {{ currency }}</text
            ></view
          ></view
        >
        <view class="rd-bars history-bars"
          ><button
            v-for="bar in trend"
            :key="bar.month"
            class="rd-bar-column history-bar pressable"
            :class="{ 'history-bar-selected': bar.month === month }"
            :aria-pressed="bar.month === month"
            :aria-label="
              bar.month +
              '，' +
              (bar.knownCount
                ? formatMoney(bar.value, currency)
                : bar.count
                  ? '金额待补充'
                  : '暂无支出记录')
            "
            hover-class="is-pressed"
            @tap="selectMonth(bar.month)"
          >
            <view class="rd-bar-track"
              ><view
                class="rd-bar-fill"
                :style="{ height: bar.plotHeight + '%' }"
                ><text class="rd-bar-value num">{{
                  bar.knownCount ? compactAmount(bar.value) : "—"
                }}</text></view
              ></view
            ><text class="rd-bar-month num"
              >{{ Number(bar.month.slice(5)) }}月</text
            >
          </button></view
        >
      </view>
      <view class="card rd-chart-card history-details">
        <view class="rd-chart-head"
          ><text class="card-title">续费明细</text
          ><text class="pill gray"
            >{{ currency }} · {{ result.count }} 笔</text
          ></view
        >
        <empty-state-view
          v-if="!result.count"
          embedded
          icon="wallet"
          title="暂无支出记录"
          description="本月此币种没有已确认的续费记录，可切换月份或币种查看"
        />
        <button
          v-for="entry in result.entries"
          :key="entry.subscriptionId + '-' + entry.id"
          class="history-entry pressable"
          :disabled="entry.deleted"
          :aria-label="
            entry.name +
            '，账期' +
            entry.billingDate +
            (entry.deleted ? '，订阅已移入回收站' : '，查看订阅详情')
          "
          hover-class="is-pressed"
          @tap="$emit('open-detail', { id: entry.subscriptionId })"
        >
          <view class="history-entry-copy"
            ><text class="history-entry-name">{{ entry.name }}</text
            ><text class="history-note"
              >账期 {{ entry.billingDate
              }}<text v-if="entry.deleted"> · 已移入回收站</text></text
            ></view
          ><text class="history-entry-amount num">{{
            entry.amount === null
              ? "金额待补充"
              : formatMoney(entry.amount, entry.currency)
          }}</text
          ><text v-if="!entry.deleted" class="history-entry-chevron">›</text>
        </button>
        <button
          v-if="result.meta.hasMore"
          class="rd-more pressable"
          :disabled="loading"
          hover-class="is-pressed"
          @tap="load(true)"
        >
          {{ loading ? "正在加载…" : "加载更多" }}
        </button>
      </view>
      <view class="card rd-insight"
        ><uni-icons type="info-filled" size="20" color="var(--blue)" /><view
          ><text class="rd-insight-title">依据已确认续费记录统计</text
          ><text class="rd-insight-copy"
            >按账期月份归属，补确认仍计入原账期。未确认的扣费不计入；不同币种分别统计，不做换汇。分类采用订阅当前分类。</text
          ><text class="rd-insight-copy"
            >暂停、取消和移入回收站不影响已记录支出；撤销续费会移除对应记录，彻底删除订阅也会删除其历史记录。</text
          ></view
        ></view
      >
    </template>
  </view>
</template>
<script>
import { CATEGORIES } from "../../api/subscriptions.js";
import { CATEGORY_COLORS } from "../../pages/subscription/subscription-data.js";
import {
  currentMonth,
  shiftMonth,
  loadSpendingHistory,
} from "./spending-history.js";
import AsyncStateView from "./AsyncStateView.vue";
import UiSkeleton from "./UiSkeleton.vue";
import DisplayAmount from "./DisplayAmount.vue";
import DonutChart from "./DonutChart.vue";
import EmptyStateView from "./EmptyStateView.vue";

export default {
  name: "SpendingHistoryView",
  components: {
    AsyncStateView,
    UiSkeleton,
    DisplayAmount,
    DonutChart,
    EmptyStateView,
  },
  emits: ["month-change", "currency-change", "open-detail"],
  props: {
    month: { type: String, required: true },
    currency: { type: String, default: "CNY" },
    currencies: { type: Array, default: () => [] },
    revision: { type: Array, default: () => [] },
    formatMoney: { type: Function, required: true },
    compactAmount: { type: Function, required: true },
  },
  data() {
    return {
      result: null,
      loading: false,
      error: "",
      requestId: 0,
      todayMonth: currentMonth(),
    };
  },
  computed: {
    monthLabel() {
      const [year, month] = this.month.split("-");
      return `${year}年${Number(month)}月`;
    },
    currencyOptions() {
      return [
        ...new Set([
          this.currency,
          ...this.currencies,
          ...(this.result?.currencies || []),
        ]),
      ];
    },
    categories() {
      return this.result.categoryStats.map((item) => {
        const name = CATEGORIES[item.category] || item.category;
        return {
          ...item,
          name,
          color: CATEGORY_COLORS[name] || CATEGORY_COLORS["其他"],
        };
      });
    },
    trend() {
      const max = Math.max(1, ...this.result.trend.map((item) => item.value));
      return this.result.trend.map((item) => ({
        ...item,
        plotHeight: (item.value / max) * 100,
      }));
    },
  },
  watch: {
    month() {
      this.load();
    },
    currency() {
      this.load();
    },
    revision: {
      deep: true,
      handler() {
        this.load();
      },
    },
  },
  mounted() {
    this.load();
  },
  beforeUnmount() {
    this.requestId++;
  },
  methods: {
    shiftMonth,
    load(append = false) {
      return loadSpendingHistory(this, append);
    },
    selectMonth(value) {
      if (
        /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value) &&
        value <= this.todayMonth &&
        value !== this.month
      )
        this.$emit("month-change", value);
    },
  },
};
</script>
