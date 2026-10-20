<template>
  <view class="page list-page redesign-page">
    <page-header title="全部订阅" subtitle="集中管理每一项持续支出" />
    <view class="rd-toolbar"
      ><view class="search"
        ><uni-icons type="search" size="18" color="var(--ink-3)" /><input
          class="search-input"
          v-model="searchDraft"
          aria-label="搜索服务或套餐"
          :focus="searchFocused"
          @input="handleSearchInput"
          confirm-type="search"
          placeholder="搜索订阅"
          placeholder-class="rd-placeholder" /><button
          role="button"
          tabindex="0"
          v-if="searchDraft"
          class="search-clear pressable"
          aria-label="清空搜索"
          hover-class="is-pressed"
          @tap="clearSearch"
        >
          <uni-icons
            type="clear"
            size="18"
            color="var(--ink-4)"
          /></button></view
      ><button
        role="button"
        tabindex="0"
        class="btn-soft rd-add pressable"
        aria-label="新增订阅"
        hover-class="is-pressed"
        @tap="$emit('open-form')"
      >
        ＋ 新增订阅
      </button></view
    >
    <ui-selection
      :options="categoryOptions"
      :model-value="activeCategory"
      variant="chips"
      label="按服务分类筛选，可左右滑动"
      @select="$emit('category', $event)"
    />
    <view class="rd-status"
      ><ui-selection
        :options="statusFilters"
        :model-value="activeStatus"
        variant="tabs"
        label="按订阅状态筛选，可左右滑动"
        @select="$emit('status', $event)"
    /></view>
    <button
      role="button"
      tabindex="0"
      class="rd-sort pressable"
      aria-label="选择排序方式"
      hover-class="is-pressed"
      @tap="$emit('choose-sort')"
    >
      <view
        >{{ sortLabel
        }}<text class="rd-sort-status"> · {{ activeStatusLabel }}</text></view
      ><view class="num">{{ visibleSubscriptions.length }} 项 ›</view>
    </button>
    <view v-if="visibleSubscriptions.length" class="card list rd-subscriptions"
      ><subscription-row
        v-for="(item, index) in visibleSubscriptions.slice(0, displayLimit)"
        :key="item.id"
        class="rd-enter motion"
        :style="{ 'animation-delay': Math.min(index, 10) * 30 + 'ms' }"
        :item="{
          ...decorateItem(item),
          cycle: cycleText(item),
          amountText:
            item.amount === null
              ? '金额待补充'
              : formatMoney(item.amount, item.currency),
        }"
        show-date
        :date-label="formatDate(item.nextBillingDate)"
        @activate="$emit('open-detail', item)"
    /></view>
    <button
      role="button"
      tabindex="0"
      v-if="visibleSubscriptions.length > displayLimit"
      class="rd-more pressable"
      hover-class="is-pressed"
      @tap="displayLimit += 20"
    >
      加载更多（已显示
      <text class="num"
        >{{ displayLimit }} / {{ visibleSubscriptions.length }}</text
      >）
    </button>
    <view class="rd-inset"
      ><empty-state-view
        v-if="!visibleSubscriptions.length && liveSubscriptions.length"
        icon="search"
        title="没有匹配的订阅"
        description="调整搜索词或筛选条件，也可以新增一条订阅"
        action-label="重置筛选"
        @action="$emit('reset-filters')" /><empty-state-view
        v-else-if="!liveSubscriptions.length"
        icon="plus"
        title="还没有添加订阅"
        description="添加第一条订阅后，这里会显示所有续费项目"
        action-label="新增订阅"
        @action="$emit('open-form')"
    /></view>
  </view>
</template>

<script>
import { syncNativeFieldLabels } from "./platform-inputs.js";
import PageHeader from "./PageHeader.vue";
import UiSelection from "./UiSelection.vue";
import SubscriptionRow from "./subscription-row.vue";
import EmptyStateView from "./EmptyStateView.vue";

export default {
  name: "SubscriptionListView",
  mounted() {
    syncNativeFieldLabels(this.$el);
  },
  components: { PageHeader, UiSelection, SubscriptionRow, EmptyStateView },
  emits: [
    "search",
    "clear-search",
    "category",
    "status",
    "choose-sort",
    "open-detail",
    "reset-filters",
    "open-form",
  ],
  data() {
    return {
      searchDraft: this.searchKeyword,
      displayLimit: 20,
      searchFocused: false,
    };
  },
  watch: {
    activeCategory() {
      this.displayLimit = 20;
    },
    activeStatus() {
      this.displayLimit = 20;
    },
    searchKeyword(value) {
      this.displayLimit = 20;
      if (value !== this.searchDraft) this.searchDraft = value;
    },
  },
  computed: {
    categoryOptions() {
      return this.categoryFilters.map((item) => ({
        value: item.name,
        label: item.name,
        count: item.count,
      }));
    },
  },
  methods: {
    handleSearchInput(event) {
      const value = ((event.detail && event.detail.value) || "").trim();
      if (value !== this.searchDraft) this.searchDraft = value;
      this.$emit("search", value);
    },
    clearSearch() {
      this.searchDraft = "";
      this.searchFocused = false;
      this.$nextTick(() => {
        this.searchFocused = true;
      });
      this.$emit("clear-search");
    },
  },
  props: {
    decorateItem: { type: Function, required: true },
    navigationBarHeight: { type: Number, default: 0 },
    searchKeyword: { type: String, default: "" },
    categoryFilters: { type: Array, default: () => [] },
    activeCategory: { type: String, default: "全部" },
    statusFilters: { type: Array, default: () => [] },
    activeStatus: { type: String, default: "all" },
    sortLabel: { type: String, default: "按日期" },
    activeStatusLabel: { type: String, default: "全部状态" },
    visibleSubscriptions: { type: Array, default: () => [] },
    liveSubscriptions: { type: Array, default: () => [] },
    formatDate: { type: Function, required: true },
    formatMoney: { type: Function, required: true },
    cycleText: { type: Function, required: true },
    daysText: { type: Function, required: true },
    getStatus: { type: Function, required: true },
    statusText: { type: Function, required: true },
  },
};
</script>
