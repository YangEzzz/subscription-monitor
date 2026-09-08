<template>
  <view class="app-shell" @keydown="handleKeyboardAction">
    <view
      class="safe-top"
      :class="{ 'form-safe-top': activeView === 'form' }"
      :style="{ height: statusBarHeight + 'px' }"
    ></view>
    <view
      class="sync-indicator"
      :class="{ busy: loading || mutating }"
      role="status"
      :aria-label="mutating ? '正在保存' : loading ? '正在同步' : '已同步'"
    ></view>
    <scroll-view
      class="page-scroll"
      :style="{ height: `calc(100vh - ${statusBarHeight}px)` }"
      scroll-y
      :show-scrollbar="true"
      :scroll-top="scrollTop"
    >
      <view
        v-if="!dataReady && !loadError"
        class="initial-loading"
        role="status"
        ><view class="skeleton-title"></view><view class="skeleton-card"></view
        ><view v-for="row in 3" :key="row" class="skeleton-row"></view
        ><text class="loading-caption">正在整理你的续订清单…</text></view
      >
      <view v-if="loadError" class="api-error"
        ><text
          >{{ loadError
          }}{{ dataReady ? "（当前显示上次读取的数据）" : "" }}</text
        ><button :disabled="loading || mutating" @tap="refreshData">
          重新加载
        </button></view
      >
      <view
        v-if="statsError && (activeView === 'stats' || activeView === 'home')"
        class="api-error"
        ><text>统计加载失败：{{ statsError }}</text
        ><button @tap="refreshStats">重试统计</button></view
      >
      <view v-if="statsLoading && activeView === 'stats'" class="api-status"
        >正在加载统计…</view
      >
      <template v-if="dataReady">
        <!-- 首页 -->
        <subscription-home-view
          v-if="activeView === 'home'"
          :settings="settings"
          :navigation-bar-height="navigationBarHeight"
          :next30-total-text="next30TotalText"
          :monthly-average-text="monthlyAverageText"
          :next30-subscriptions="next30Subscriptions"
          :active-subscriptions="activeSubscriptions"
          :upcoming7="upcoming7"
          :upcoming30-later="upcoming30Later"
          :actionable-reminders="actionableReminders"
          :trend-data="trendData"
          :decorate-item="decorateItem"
          @toggle-amount="toggleAmount"
          @enable-notification="enableNotification"
          @switch-all="switchTab('all')"
          @open-detail="openDetail"
          @open-form="openForm"
          @handle-reminder="handleReminder"
        />

        <!-- 订阅列表 -->
        <subscription-list-view
          v-else-if="activeView === 'all'"
          :navigation-bar-height="navigationBarHeight"
          :search-keyword="searchKeyword"
          :category-filters="categoryFilters"
          :active-category="activeCategory"
          :status-filters="statusFilters"
          :active-status="activeStatus"
          :sort-label="sortLabel"
          :active-status-label="activeStatusLabel"
          :visible-subscriptions="visibleSubscriptions"
          :live-subscriptions="liveSubscriptions"
          :format-date="formatDate"
          :format-money="formatMoney"
          :cycle-text="cycleText"
          :days-text="daysText"
          :get-status="getStatus"
          :status-text="statusText"
          @search="searchKeyword = $event"
          @clear-search="searchKeyword = ''"
          @category="activeCategory = $event"
          @status="activeStatus = $event"
          @choose-sort="chooseSort"
          @open-detail="openDetail"
          @reset-filters="resetFilters"
          @open-form="openForm"
        />

        <!-- 日历 -->
        <subscription-calendar-view
          v-else-if="activeView === 'calendar'"
          :navigation-bar-height="navigationBarHeight"
          :calendar-title="calendarTitle"
          :weekdays="weekdays"
          :calendar-days="calendarDays"
          :selected-date="selectedDate"
          :selected-date-subscriptions="selectedDateSubscriptions"
          :selected-date-title="selectedDateTitle"
          :selected-weekday="selectedWeekday"
          :selected-date-total-text="selectedDateTotalText"
          :today-key="todayKey"
          :format-money="formatMoney"
          :cycle-text="cycleText"
          @change-month="changeMonth"
          @today="goToday"
          @select-date="selectDate"
          @open-detail="openDetail"
          @open-form="openForm"
        />

        <!-- 统计 -->
        <subscription-stats-view
          v-else-if="activeView === 'stats' && !statsLoading && !statsError"
          :navigation-bar-height="navigationBarHeight"
          :currencies="currencies"
          :stats-currency="statsCurrency"
          :stats-label="statsLabel"
          :stat-periods="statPeriods"
          :stats-period="statsPeriod"
          :stats-total="statsTotal"
          :stats-subscription-count="statsSubscriptionCount"
          :category-stats="categoryStats"
          :donut-background="donutBackground"
          :trend-data="trendData"
          :format-money="formatMoney"
          :compact-amount="compactAmount"
          @currency-change="changeStatsCurrency"
          @period-change="statsPeriod = $event"
        />

        <!-- 我的 -->
        <subscription-profile-view
          v-else-if="activeView === 'profile'"
          :navigation-bar-height="navigationBarHeight"
          :live-subscriptions="liveSubscriptions"
          :monthly-average-text="monthlyAverageText"
          :settings="settings"
          :is-member="isMember"
          :free-quota-text="freeQuotaText"
          :membership-quota-percent="membershipQuotaPercent"
          :currencies="currencies"
          :deleted-subscriptions="deletedSubscriptions"
          @open-membership="openMembership"
          @notification-change="handleNotificationSwitch"
          @open-reminder-settings="openReminderSettings"
          @weekly-summary-change="updateSetting('weeklySummary', $event)"
          @default-currency-change="updateDefaultCurrency"
          @export="exportData"
          @trash="openTrash"
          @privacy="showPrivacy"
          @reset-demo="resetDemoData"
        />

        <!-- 会员中心 -->
        <membership-view
          v-else-if="activeView === 'membership'"
          :is-member="isMember"
          :free-quota-value="freeQuotaValue"
          @back="goBackView('profile')"
          @activate="activateMembership"
          @restore="restoreFreePlan"
        />

        <!-- 详情 -->
        <subscription-detail-view
          v-else-if="activeView === 'detail' && selectedSubscription"
          :subscription="selectedSubscription"
          :notification-enabled="false"
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

        <!-- 新增 / 编辑 -->
        <subscription-form-view
          v-else-if="activeView === 'form'"
          :editing-id="editingId"
          :form="form"
          :service-templates="serviceTemplates"
          :categories="categories"
          :currencies="currencies"
          :cycles="cycles"
          :payments="payments"
          :logo-colors="logoColors"
          :reminder-options="reminderOptions"
          :form-error="formError"
          :today-key="todayKey"
          :form-reminder-preview="formReminderPreview"
          :format-date="formatDate"
          :cycle-text="cycleText"
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
          @save="saveSubscription"
        />

        <!-- 默认提醒设置 -->
        <reminder-settings-view
          v-else-if="activeView === 'reminder-settings'"
          :reminder-options="reminderOptions"
          :settings="settings"
          @back="goBackView('profile')"
          @toggle-reminder="toggleDefaultReminder"
          @update-setting="updateSetting($event.key, $event.value)"
        />

        <view class="bottom-space"></view>
      </template>
    </scroll-view>

    <subscription-sort-sheet
      v-if="sortSheetVisible"
      :sort-options="sortOptions"
      :sort-mode="sortMode"
      @close="closeSortSheet"
      @select="selectSort"
    />

    <subscription-tab-bar
      v-if="showTabBar && dataReady"
      :tabs="tabs"
      :active-view="activeView"
      @switch="switchTab"
    />
  </view>
</template>

<script>
import SubscriptionHomeView from "@/components/subscription/SubscriptionHomeView.vue";
import SubscriptionListView from "@/components/subscription/SubscriptionListView.vue";
import SubscriptionCalendarView from "@/components/subscription/SubscriptionCalendarView.vue";
import SubscriptionStatsView from "@/components/subscription/SubscriptionStatsView.vue";
import SubscriptionProfileView from "@/components/subscription/SubscriptionProfileView.vue";
import MembershipView from "@/components/subscription/MembershipView.vue";
import SubscriptionDetailView from "@/components/subscription/SubscriptionDetailView.vue";
import SubscriptionFormView from "@/components/subscription/SubscriptionFormView.vue";
import ReminderSettingsView from "@/components/subscription/ReminderSettingsView.vue";
import SubscriptionSortSheet from "@/components/subscription/SubscriptionSortSheet.vue";
import SubscriptionTabBar from "@/components/subscription/SubscriptionTabBar.vue";
import {
  createSubscriptionPageState,
  subscriptionComputed,
  subscriptionLifecycle,
  subscriptionMethods,
} from "./subscription-page-logic.js";

export default {
  components: {
    SubscriptionHomeView,
    SubscriptionListView,
    SubscriptionCalendarView,
    SubscriptionStatsView,
    SubscriptionProfileView,
    MembershipView,
    SubscriptionDetailView,
    SubscriptionFormView,
    ReminderSettingsView,
    SubscriptionSortSheet,
    SubscriptionTabBar,
  },
  data() {
    return createSubscriptionPageState();
  },
  computed: subscriptionComputed,
  onLoad() {
    subscriptionLifecycle.onLoad.call(this);
  },
  onBackPress() {
    return subscriptionLifecycle.onBackPress.call(this);
  },
  methods: subscriptionMethods,
};
</script>

<style scoped>
.api-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  color: #61746a;
  font-size: 12px;
}
.api-status button {
  margin: 0;
  font-size: 12px;
}
.api-error {
  margin: 12px 20px;
  padding: 16px;
  background: #fff0eb;
  color: #a13e2a;
  border-radius: 12px;
  font-size: 14px;
}
.api-error button {
  margin-top: 12px;
}
</style>
