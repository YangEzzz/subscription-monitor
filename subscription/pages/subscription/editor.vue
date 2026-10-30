<template>
  <view
    class="app-shell redesign-shell subpage-shell editor-shell"
    :class="{ 'reduce-motion': reducedMotion }"
    :style="{ '--rd-status-bar-height': statusBarHeight + 'px' }"
    @keydown="handleKeyboardAction"
  >
    <view class="safe-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="flow-page editor-header">
      <page-header
        :title="
          activeView === 'form'
            ? editingId
              ? '编辑订阅'
              : '新增订阅'
            : '订阅详情'
        "
        secondary
        pinned
        :scrolled="uiScrollTop > 8"
        @back="
          goBackView(
            activeView === 'form' ? (editingId ? 'detail' : 'home') : 'all',
          )
        "
      />
    </view>
    <scroll-view
      class="page-scroll"
      scroll-y
      :show-scrollbar="true"
      :scroll-top="scrollTop"
      @scroll="uiScrollTop = $event.detail.scrollTop"
    >
      <async-state-view
        v-if="loadError"
        compact
        :title="loadErrorTitle"
        :description="loadErrorDescription"
        action-label="重新加载"
        :busy="loading || mutating"
        @action="refreshData"
      />
      <template v-if="editorContentReady && dataReady">
        <subscription-form-view
          v-if="activeView === 'form'"
          :show-header="false"
          :editing-id="editingId"
          :scroll-offset="uiScrollTop"
          :form="form"
          :service-templates="serviceTemplates"
          :categories="categories"
          :currencies="currencies"
          :cycles="cycles"
          :payments="payments"
          :logo-colors="logoColors"
          :reminder-options="reminderOptions"
          :form-error="formError"
          :busy="mutating"
          :today-key="todayKey"
          :form-reminder-preview="formReminderPreview"
          :format-date="formatDate"
          :cycle-text="cycleText"
          :format-money="formatMoney"
          :days-text="daysText"
          @back="goBackView(editingId ? 'detail' : 'home')"
          @apply-template="applyTemplate"
          @category-change="form.category = $event"
          @currency-change="form.currency = $event"
          @change-cycle="changeCycle"
          @payment-change="form.payment = $event"
          @billing-date-change="form.nextBillingDate = $event"
          @auto-renew-change="form.autoRenew = $event"
          @set-trial="setTrial"
          @trial-date-change="form.trialEndDate = $event"
          @toggle-reminder="toggleReminder"
        />
        <subscription-detail-load-state
          :show-header="false"
          v-if="
            activeView === 'detail' &&
            (detailLoading || detailError || !selectedSubscription)
          "
          :error="detailError"
          :scroll-offset="uiScrollTop"
          @back="goBackView('all')"
          @retry="openDetail({ id: selectedId })"
        />
        <subscription-detail-view
          :show-header="false"
          v-else-if="activeView === 'detail' && selectedSubscription"
          :subscription="selectedSubscription"
          :scroll-offset="uiScrollTop"
          :notification-enabled="notificationReady"
          :renewal-history="selectedRenewalHistory"
          :renewal-locked="renewalLocked"
          :selected-next-reminder-text="selectedNextReminderText"
          :format-date="formatDate"
          :format-money="formatMoney"
          :days-text="daysText"
          :cycle-text="cycleText"
          :get-status="getStatus"
          :status-text="statusText"
          :days-until="daysUntil"
          :process-title="processTitle"
          @back="goBackView('all')"
          @confirm-renewal="confirmRenewal"
          @undo-renewal="undoRenewal"
          @snooze="snoozeSubscription"
          @cancel="cancelSubscription"
          @manage="showMoreActions"
          @edit="openForm(null, selectedSubscription)"
        />
        <view class="bottom-space"></view>
      </template>
    </scroll-view>
    <subscription-save-bar
      v-if="editorContentReady && dataReady && activeView === 'form'"
      :editing-id="editingId"
      :busy="mutating"
      @save="saveSubscription()"
    />
  </view>
</template>

<script>
import { reactive } from "vue";
import PageHeader from "@/components/subscription/PageHeader.vue";
import SubscriptionFormView from "@/components/subscription/SubscriptionFormView.vue";
import SubscriptionDetailView from "@/components/subscription/SubscriptionDetailView.vue";
import SubscriptionDetailLoadState from "@/components/subscription/SubscriptionDetailLoadState.vue";
import SubscriptionSaveBar from "@/components/subscription/SubscriptionSaveBar.vue";
import AsyncStateView from "@/components/subscription/AsyncStateView.vue";
import { nativeNavigation } from "./native-navigation.js";
import {
  createSubscriptionPageState,
  subscriptionComputed,
  subscriptionMethods,
  subscriptionLifecycle,
} from "./subscription-page-logic.js";

export default {
  components: {
    PageHeader,
    SubscriptionFormView,
    SubscriptionDetailView,
    SubscriptionDetailLoadState,
    SubscriptionSaveBar,
    AsyncStateView,
  },
  data() {
    const state = nativeNavigation.state(
      () => ({
        ...createSubscriptionPageState(),
        reducedMotion: false,
        refreshing: false,
        uiScrollTop: 0,
      }),
      reactive,
    );
    // This belongs to this native page, rather than the shared account state.
    state.editorContentReady = false;
    return state;
  },
  watch: {
    activeView() {
      this.uiScrollTop = 0;
      nativeNavigation.syncLeaveAlert(this);
    },
    form: {
      deep: true,
      handler() {
        nativeNavigation.syncLeaveAlert(this);
      },
    },
    formBaseline() {
      nativeNavigation.syncLeaveAlert(this);
    },
  },
  computed: subscriptionComputed,
  methods: subscriptionMethods,
  onLoad(options) {
    if (!nativeNavigation.enter(this, options)) {
      uni.redirectTo({ url: "/pages/subscription/index" });
      return;
    }
    // #ifdef MP-WEIXIN
    uni.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] });
    // #endif
  },
  onShow() {
    nativeNavigation.show(this);
    if (this.dataReady) void this.refreshMembershipPolicy();
  },
  onReady() {
    // Let the lightweight header render before mounting the full form.
    this.editorContentReady = true;
    nativeNavigation.ready(this);
  },
  onHide() {
    nativeNavigation.hide(this);
  },
  onUnload() {
    nativeNavigation.leave(this);
  },
  onBackPress() {
    return subscriptionLifecycle.onBackPress.call(this);
  },
  // #ifdef MP-WEIXIN
  onShareAppMessage() {
    return subscriptionLifecycle.onShareAppMessage();
  },
  onShareTimeline() {
    return subscriptionLifecycle.onShareTimeline();
  },
  // #endif
};
</script>
