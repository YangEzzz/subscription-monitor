<template>
  <view
    class="page detail-loading-page redesign-page redesign-ancillary flow-page"
    :aria-busy="!error"
  >
    <view v-if="showHeader" class="flow-header"
      ><page-header
        title="订阅详情"
        secondary
        pinned
        :scrolled="scrollOffset > 8"
        @back="$emit('back')"
    /></view>
    <view v-if="error" class="card detail-load-error"
      ><async-state-view
        title="订阅详情加载失败"
        :description="error"
        action-label="重新加载"
        @action="$emit('retry')"
    /></view>
    <template v-else>
      <ui-skeleton
        class="detail-hero-skeleton"
        variant="hero"
        label="正在加载订阅详情"
      />
      <view class="card detail-facts-skeleton" aria-hidden="true"
        ><view v-for="index in 4" :key="index" class="detail-fact-skeleton"
          ><view class="skeleton-block skeleton-fact-icon"></view
          ><view class="skeleton-fact-copy"
            ><view class="skeleton-block skeleton-fact-label"></view
            ><view
              class="skeleton-block skeleton-fact-value"
            ></view></view></view
      ></view>
      <ui-skeleton :rows="1" label="正在加载提醒计划" />
      <ui-skeleton :rows="1" label="正在加载本期处理信息" />
      <view class="flow-actionbar detail-action-skeleton" aria-hidden="true"
        ><view class="skeleton-block"></view><view class="skeleton-block"></view
      ></view>
    </template>
  </view>
</template>
<script>
import PageHeader from "./PageHeader.vue";
import UiSkeleton from "./UiSkeleton.vue";
import AsyncStateView from "./AsyncStateView.vue";
export default {
  name: "SubscriptionDetailLoadState",
  components: { PageHeader, UiSkeleton, AsyncStateView },
  emits: ["back", "retry"],
  props: {
    showHeader: { type: Boolean, default: true },
    error: { type: String, default: "" },
    scrollOffset: { type: Number, default: 0 },
  },
};
</script>
