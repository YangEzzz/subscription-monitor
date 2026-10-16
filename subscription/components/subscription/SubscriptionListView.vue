<template>
  <view class="page list-page">
    <view
      class="primary-titlebar"
      :style="{ height: navigationBarHeight + 'px' }"
      ><text class="page-title">全部订阅</text></view
    >
    <view class="collection-heading">
      <text class="page-lead">集中管理每一项持续支出</text>
    </view>
    <view class="collection-toolbar">
      <view class="search-box">
        <uni-icons type="search" size="21" color="#7b8ba6" />
        <input
          v-model="searchDraft"
          aria-label="搜索服务或套餐"
          :focus="searchFocused"
          @input="handleSearchInput"
          confirm-type="search"
          placeholder="搜索订阅"
          placeholder-class="placeholder"
        />
        <button
          v-if="searchDraft"
          role="button"
          tabindex="0"
          class="clear-search"
          aria-label="清空搜索"
          @tap="clearSearch"
        >
          <uni-icons type="clear" size="18" color="#9ca19d" />
        </button>
      </view>
      <button
        class="collection-add"
        role="button"
        tabindex="0"
        aria-label="新增订阅"
        @tap="$emit('open-form')"
      >
        <uni-icons type="plus" size="15" color="#315acb" />
        <text>新增订阅</text>
      </button>
    </view>
    <scroll-view
      class="filter-scroll"
      scroll-x
      :show-scrollbar="true"
      aria-label="按服务分类筛选，可左右滑动"
      ><view class="filter-row"
        ><button
          role="button"
          tabindex="0"
          v-for="filter in categoryFilters"
          :key="filter.name"
          class="filter-pill"
          :class="{ active: activeCategory === filter.name }"
          :aria-pressed="activeCategory === filter.name"
          @tap="$emit('category', filter.name)"
        >
          <text class="filter-label">{{ filter.name }}</text
          ><text class="filter-count">{{ filter.count }}</text>
        </button></view
      ></scroll-view
    >
    <scroll-view
      class="status-scroll"
      scroll-x
      :show-scrollbar="true"
      aria-label="按订阅状态筛选，可左右滑动"
      ><view class="status-row"
        ><button
          role="button"
          tabindex="0"
          v-for="status in statusFilters"
          :key="status.value"
          class="status-pill"
          :class="{ active: activeStatus === status.value }"
          :aria-pressed="activeStatus === status.value"
          @tap="$emit('status', status.value)"
        >
          {{ status.label }}
        </button></view
      ></scroll-view
    >
    <button
      role="button"
      tabindex="0"
      class="sort-summary"
      aria-label="选择排序方式"
      @tap="$emit('choose-sort')"
    >
      <view
        ><text>{{ sortLabel }}</text
        ><text class="sort-divider">·</text
        ><text>{{ activeStatusLabel }}</text></view
      ><view class="sort-result"
        ><text>{{ visibleSubscriptions.length }} 项</text
        ><uni-icons type="right" size="15" color="#68758c"
      /></view>
    </button>
    <view v-if="visibleSubscriptions.length" class="subscription-list"
      ><button
        role="button"
        tabindex="0"
        v-for="item in visibleSubscriptions.slice(0, displayLimit)"
        :key="item.id"
        class="list-item"
        :aria-label="`${item.name}，${statusText(item)}，${formatDate(item.nextBillingDate)}，${item.amount === null ? '金额待补充' : formatMoney(item.amount, item.currency)}`"
        @tap="$emit('open-detail', item)"
      >
        <brand-logo :item="item" /><view class="list-main"
          ><view class="name-line"
            ><text class="list-name">{{ item.name }}</text
            ><text class="status-badge" :class="getStatus(item)">{{
              statusText(item)
            }}</text></view
          ><text class="list-detail"
            >{{ cycleText(item) }} · {{ item.payment }}</text
          ><text class="list-date">{{
            formatDate(item.nextBillingDate)
          }}</text></view
        ><view class="list-finance" :class="{ missing: item.amount === null }"
          ><text
            class="list-price"
            :class="{ 'amount-missing': item.amount === null }"
            >{{
              item.amount === null
                ? "金额待补充"
                : formatMoney(item.amount, item.currency)
            }}</text
          ><text class="list-countdown">{{ daysText(item) }}</text></view
        ><uni-icons type="right" size="17" color="#68758c" /></button
    ></view>
    <button
      role="button"
      tabindex="0"
      v-if="visibleSubscriptions.length > displayLimit"
      class="text-button green load-more"
      @tap="displayLimit += 20"
    >
      加载更多（已显示 {{ displayLimit }} / {{ visibleSubscriptions.length }}）
    </button>
    <empty-state-view
      v-if="!visibleSubscriptions.length && liveSubscriptions.length"
      icon="search"
      title="没有匹配的订阅"
      description="调整搜索词或筛选条件，也可以新增一条订阅"
      action-label="重置筛选"
      action-class="secondary-button"
      @action="$emit('reset-filters')"
    />
    <empty-state-view
      v-else-if="!liveSubscriptions.length"
      icon="plus"
      title="还没有添加订阅"
      description="添加第一条订阅后，这里会显示所有续费项目"
      action-label="新增订阅"
      action-class="primary-button empty-add"
      @action="$emit('open-form')"
    />
  </view>
</template>

<script>
import { syncNativeFieldLabels } from "./platform-inputs.js";
import BrandLogo from "./brand-logo.vue";
import EmptyStateView from "./EmptyStateView.vue";

export default {
  name: "SubscriptionListView",
  mounted() {
    syncNativeFieldLabels(this.$el);
  },
  components: { BrandLogo, EmptyStateView },
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
