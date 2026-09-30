"use strict";
const pages_subscription_subscriptionPageLogic = require("./subscription-page-logic.js");
const common_vendor = require("../../common/vendor.js");
const SubscriptionHomeView = () => "../../components/subscription/SubscriptionHomeView.js";
const SubscriptionListView = () => "../../components/subscription/SubscriptionListView.js";
const SubscriptionCalendarView = () => "../../components/subscription/SubscriptionCalendarView.js";
const SubscriptionStatsView = () => "../../components/subscription/SubscriptionStatsView.js";
const SubscriptionProfileView = () => "../../components/subscription/SubscriptionProfileView.js";
const MembershipView = () => "../../components/subscription/MembershipView.js";
const SubscriptionDetailView = () => "../../components/subscription/SubscriptionDetailView.js";
const SubscriptionFormView = () => "../../components/subscription/SubscriptionFormView.js";
const ReminderSettingsView = () => "../../components/subscription/ReminderSettingsView.js";
const SubscriptionSortSheet = () => "../../components/subscription/SubscriptionSortSheet.js";
const SubscriptionTabBar = () => "../../components/subscription/SubscriptionTabBar.js";
const AsyncStateView = () => "../../components/subscription/AsyncStateView.js";
const _sfc_main = {
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
    AsyncStateView
  },
  data() {
    return pages_subscription_subscriptionPageLogic.createSubscriptionPageState();
  },
  computed: pages_subscription_subscriptionPageLogic.subscriptionComputed,
  onLoad() {
    pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onLoad.call(this);
  },
  onBackPress() {
    return pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onBackPress.call(this);
  },
  methods: pages_subscription_subscriptionPageLogic.subscriptionMethods
};
if (!Array) {
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  const _component_subscription_home_view = common_vendor.resolveComponent("subscription-home-view");
  const _component_subscription_list_view = common_vendor.resolveComponent("subscription-list-view");
  const _component_subscription_calendar_view = common_vendor.resolveComponent("subscription-calendar-view");
  const _component_subscription_stats_view = common_vendor.resolveComponent("subscription-stats-view");
  const _component_subscription_profile_view = common_vendor.resolveComponent("subscription-profile-view");
  const _component_membership_view = common_vendor.resolveComponent("membership-view");
  const _component_subscription_detail_view = common_vendor.resolveComponent("subscription-detail-view");
  const _component_subscription_form_view = common_vendor.resolveComponent("subscription-form-view");
  const _component_reminder_settings_view = common_vendor.resolveComponent("reminder-settings-view");
  const _component_subscription_sort_sheet = common_vendor.resolveComponent("subscription-sort-sheet");
  const _component_subscription_tab_bar = common_vendor.resolveComponent("subscription-tab-bar");
  (_component_async_state_view + _component_subscription_home_view + _component_subscription_list_view + _component_subscription_calendar_view + _component_subscription_stats_view + _component_subscription_profile_view + _component_membership_view + _component_subscription_detail_view + _component_subscription_form_view + _component_reminder_settings_view + _component_subscription_sort_sheet + _component_subscription_tab_bar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: _ctx.activeView === "form" ? 1 : "",
    b: _ctx.statusBarHeight + "px",
    c: _ctx.loading || _ctx.mutating ? 1 : "",
    d: _ctx.mutating ? "正在保存" : _ctx.loading ? "正在同步" : "已同步",
    e: !_ctx.dataReady && !_ctx.loadError
  }, !_ctx.dataReady && !_ctx.loadError ? {
    f: common_vendor.f(3, (row, k0, i0) => {
      return {
        a: row
      };
    })
  } : {}, {
    g: _ctx.loadError
  }, _ctx.loadError ? {
    h: common_vendor.o(_ctx.refreshData, "4d"),
    i: common_vendor.p({
      compact: _ctx.dataReady,
      title: _ctx.loadErrorTitle,
      description: _ctx.loadErrorDescription,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    j: _ctx.statsError && (_ctx.activeView === "stats" || _ctx.activeView === "home")
  }, _ctx.statsError && (_ctx.activeView === "stats" || _ctx.activeView === "home") ? {
    k: common_vendor.o(_ctx.refreshStats, "81"),
    l: common_vendor.p({
      compact: true,
      title: "统计暂时不可用",
      description: _ctx.statsErrorDescription,
      ["action-label"]: "重试统计",
      busy: _ctx.statsLoading
    })
  } : {}, {
    m: _ctx.statsLoading && _ctx.activeView === "stats"
  }, _ctx.statsLoading && _ctx.activeView === "stats" ? {} : {}, {
    n: _ctx.dataReady
  }, _ctx.dataReady ? common_vendor.e({
    o: _ctx.activeView === "home"
  }, _ctx.activeView === "home" ? {
    p: common_vendor.o(_ctx.toggleAmount, "78"),
    q: common_vendor.o(_ctx.enableNotification, "a8"),
    r: common_vendor.o(($event) => _ctx.switchTab("all"), "7f"),
    s: common_vendor.o(_ctx.openDetail, "97"),
    t: common_vendor.o(_ctx.openForm, "6e"),
    v: common_vendor.o(_ctx.handleReminder, "b7"),
    w: common_vendor.p({
      settings: _ctx.settings,
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["next30-total-text"]: _ctx.next30TotalText,
      ["monthly-average-text"]: _ctx.monthlyAverageText,
      ["next30-subscriptions"]: _ctx.next30Subscriptions,
      ["active-subscriptions"]: _ctx.activeSubscriptions,
      upcoming7: _ctx.upcoming7,
      ["upcoming30-later"]: _ctx.upcoming30Later,
      ["actionable-reminders"]: _ctx.actionableReminders,
      ["trend-data"]: _ctx.trendData,
      ["decorate-item"]: _ctx.decorateItem
    })
  } : _ctx.activeView === "all" ? {
    y: common_vendor.o(($event) => _ctx.searchKeyword = $event, "ab"),
    z: common_vendor.o(($event) => _ctx.searchKeyword = "", "04"),
    A: common_vendor.o(($event) => _ctx.activeCategory = $event, "4d"),
    B: common_vendor.o(($event) => _ctx.activeStatus = $event, "4e"),
    C: common_vendor.o(_ctx.chooseSort, "88"),
    D: common_vendor.o(_ctx.openDetail, "b0"),
    E: common_vendor.o(_ctx.resetFilters, "a2"),
    F: common_vendor.o(_ctx.openForm, "cb"),
    G: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["search-keyword"]: _ctx.searchKeyword,
      ["category-filters"]: _ctx.categoryFilters,
      ["active-category"]: _ctx.activeCategory,
      ["status-filters"]: _ctx.statusFilters,
      ["active-status"]: _ctx.activeStatus,
      ["sort-label"]: _ctx.sortLabel,
      ["active-status-label"]: _ctx.activeStatusLabel,
      ["visible-subscriptions"]: _ctx.visibleSubscriptions,
      ["live-subscriptions"]: _ctx.liveSubscriptions,
      ["format-date"]: _ctx.formatDate,
      ["format-money"]: _ctx.formatMoney,
      ["cycle-text"]: _ctx.cycleText,
      ["days-text"]: _ctx.daysText,
      ["get-status"]: _ctx.getStatus,
      ["status-text"]: _ctx.statusText
    })
  } : _ctx.activeView === "calendar" ? {
    I: common_vendor.o(_ctx.changeMonth, "4a"),
    J: common_vendor.o(_ctx.goToday, "d7"),
    K: common_vendor.o(_ctx.selectDate, "91"),
    L: common_vendor.o(_ctx.openDetail, "40"),
    M: common_vendor.o(_ctx.openForm, "ad"),
    N: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["calendar-title"]: _ctx.calendarTitle,
      weekdays: _ctx.weekdays,
      ["calendar-days"]: _ctx.calendarDays,
      ["selected-date"]: _ctx.selectedDate,
      ["selected-date-subscriptions"]: _ctx.selectedDateSubscriptions,
      ["selected-date-title"]: _ctx.selectedDateTitle,
      ["selected-weekday"]: _ctx.selectedWeekday,
      ["selected-date-total-text"]: _ctx.selectedDateTotalText,
      ["today-key"]: _ctx.todayKey,
      ["format-money"]: _ctx.formatMoney,
      ["cycle-text"]: _ctx.cycleText
    })
  } : _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError ? {
    P: common_vendor.o(_ctx.changeStatsCurrency, "33"),
    Q: common_vendor.o(($event) => _ctx.statsPeriod = $event, "7d"),
    R: common_vendor.o(_ctx.openForm, "66"),
    S: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      currencies: _ctx.currencies,
      ["stats-currency"]: _ctx.statsCurrency,
      ["stats-label"]: _ctx.statsLabel,
      ["stat-periods"]: _ctx.statPeriods,
      ["stats-period"]: _ctx.statsPeriod,
      ["stats-total"]: _ctx.statsTotal,
      ["stats-subscription-count"]: _ctx.statsSubscriptionCount,
      ["category-stats"]: _ctx.categoryStats,
      ["donut-background"]: _ctx.donutBackground,
      ["trend-data"]: _ctx.trendData,
      ["format-money"]: _ctx.formatMoney,
      ["compact-amount"]: _ctx.compactAmount
    })
  } : _ctx.activeView === "profile" ? {
    U: common_vendor.o(_ctx.openMembership, "2d"),
    V: common_vendor.o(_ctx.handleNotificationSwitch, "cd"),
    W: common_vendor.o(_ctx.openReminderSettings, "7f"),
    X: common_vendor.o(($event) => _ctx.updateSetting("weeklySummary", $event), "3b"),
    Y: common_vendor.o(_ctx.updateDefaultCurrency, "60"),
    Z: common_vendor.o(_ctx.exportData, "0d"),
    aa: common_vendor.o(_ctx.openTrash, "c1"),
    ab: common_vendor.o(_ctx.showPrivacy, "35"),
    ac: common_vendor.o(_ctx.resetDemoData, "1d"),
    ad: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["live-subscriptions"]: _ctx.liveSubscriptions,
      ["monthly-average-text"]: _ctx.monthlyAverageText,
      settings: _ctx.settings,
      ["is-member"]: _ctx.isMember,
      ["free-quota-text"]: _ctx.freeQuotaText,
      ["membership-quota-percent"]: _ctx.membershipQuotaPercent,
      currencies: _ctx.currencies,
      ["deleted-subscriptions"]: _ctx.deletedSubscriptions
    })
  } : _ctx.activeView === "membership" ? {
    af: common_vendor.o(($event) => _ctx.goBackView("profile"), "6d"),
    ag: common_vendor.o(_ctx.activateMembership, "71"),
    ah: common_vendor.o(_ctx.restoreFreePlan, "0e"),
    ai: common_vendor.p({
      ["is-member"]: _ctx.isMember,
      ["free-quota-value"]: _ctx.freeQuotaValue
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    ak: common_vendor.o(($event) => _ctx.goBackView("all"), "84"),
    al: common_vendor.o(_ctx.confirmRenewal, "42"),
    am: common_vendor.o(_ctx.undoRenewal, "47"),
    an: common_vendor.o(_ctx.snoozeSubscription, "fc"),
    ao: common_vendor.o(_ctx.cancelSubscription, "ad"),
    ap: common_vendor.o(_ctx.showMoreActions, "12"),
    aq: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "21"),
    ar: common_vendor.p({
      subscription: _ctx.selectedSubscription,
      ["notification-enabled"]: false,
      ["renewal-history"]: _ctx.selectedRenewalHistory,
      ["renewal-locked"]: _ctx.renewalLocked,
      ["selected-next-reminder-text"]: _ctx.selectedNextReminderText,
      ["format-date"]: _ctx.formatDate,
      ["format-money"]: _ctx.formatMoney,
      ["days-text"]: _ctx.daysText,
      ["cycle-text"]: _ctx.cycleText,
      ["get-status"]: _ctx.getStatus,
      ["status-text"]: _ctx.statusText,
      ["days-until"]: _ctx.daysUntil,
      ["process-title"]: _ctx.processTitle
    })
  } : _ctx.activeView === "form" ? {
    at: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "81"),
    av: common_vendor.o(_ctx.applyTemplate, "e8"),
    aw: common_vendor.o(($event) => _ctx.form.category = $event, "f6"),
    ax: common_vendor.o(($event) => _ctx.form.currency = $event, "a1"),
    ay: common_vendor.o(_ctx.changeCycle, "80"),
    az: common_vendor.o(($event) => _ctx.form.payment = $event, "6f"),
    aA: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "81"),
    aB: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "dc"),
    aC: common_vendor.o(_ctx.setTrial, "f4"),
    aD: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "55"),
    aE: common_vendor.o(_ctx.toggleReminder, "c8"),
    aF: common_vendor.o(_ctx.saveSubscription, "b4"),
    aG: common_vendor.p({
      ["editing-id"]: _ctx.editingId,
      form: _ctx.form,
      ["service-templates"]: _ctx.serviceTemplates,
      categories: _ctx.categories,
      currencies: _ctx.currencies,
      cycles: _ctx.cycles,
      payments: _ctx.payments,
      ["logo-colors"]: _ctx.logoColors,
      ["reminder-options"]: _ctx.reminderOptions,
      ["form-error"]: _ctx.formError,
      busy: _ctx.mutating,
      ["today-key"]: _ctx.todayKey,
      ["form-reminder-preview"]: _ctx.formReminderPreview,
      ["format-date"]: _ctx.formatDate,
      ["cycle-text"]: _ctx.cycleText
    })
  } : _ctx.activeView === "reminder-settings" ? {
    aI: common_vendor.o(($event) => _ctx.goBackView("profile"), "da"),
    aJ: common_vendor.o(_ctx.toggleDefaultReminder, "eb"),
    aK: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "27"),
    aL: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    x: _ctx.activeView === "all",
    H: _ctx.activeView === "calendar",
    O: _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError,
    T: _ctx.activeView === "profile",
    ae: _ctx.activeView === "membership",
    aj: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    as: _ctx.activeView === "form",
    aH: _ctx.activeView === "reminder-settings"
  }) : {}, {
    aM: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    aN: _ctx.scrollTop,
    aO: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    aP: common_vendor.o(_ctx.closeSortSheet, "8f"),
    aQ: common_vendor.o(_ctx.selectSort, "ca"),
    aR: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    aS: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    aT: common_vendor.o(_ctx.switchTab, "86"),
    aU: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {}, {
    aV: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "28")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a355b6de"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
