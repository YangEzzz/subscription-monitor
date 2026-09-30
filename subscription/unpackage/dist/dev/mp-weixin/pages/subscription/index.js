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
  onLoad(options) {
    pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onLoad.call(this, options);
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
    p: common_vendor.o(_ctx.toggleAmount, "e8"),
    q: common_vendor.o(_ctx.enableNotification, "db"),
    r: common_vendor.o(($event) => _ctx.switchTab("all"), "62"),
    s: common_vendor.o(_ctx.openDetail, "01"),
    t: common_vendor.o(_ctx.openForm, "19"),
    v: common_vendor.o(_ctx.handleReminder, "b3"),
    w: common_vendor.p({
      settings: _ctx.settings,
      ["notification-ready"]: _ctx.notificationReady,
      ["notification-description"]: _ctx.notificationDescription,
      ["notification-busy"]: _ctx.notificationAuthorizing,
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
    y: common_vendor.o(($event) => _ctx.searchKeyword = $event, "c6"),
    z: common_vendor.o(($event) => _ctx.searchKeyword = "", "44"),
    A: common_vendor.o(($event) => _ctx.activeCategory = $event, "f5"),
    B: common_vendor.o(($event) => _ctx.activeStatus = $event, "de"),
    C: common_vendor.o(_ctx.chooseSort, "b6"),
    D: common_vendor.o(_ctx.openDetail, "79"),
    E: common_vendor.o(_ctx.resetFilters, "3e"),
    F: common_vendor.o(_ctx.openForm, "9a"),
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
    I: common_vendor.o(_ctx.changeMonth, "d5"),
    J: common_vendor.o(_ctx.goToday, "b3"),
    K: common_vendor.o(_ctx.selectDate, "ba"),
    L: common_vendor.o(_ctx.openDetail, "dd"),
    M: common_vendor.o(_ctx.openForm, "27"),
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
    P: common_vendor.o(_ctx.changeStatsCurrency, "44"),
    Q: common_vendor.o(($event) => _ctx.statsPeriod = $event, "be"),
    R: common_vendor.o(_ctx.openForm, "45"),
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
    U: common_vendor.o(_ctx.openMembership, "f9"),
    V: common_vendor.o(_ctx.handleNotificationSwitch, "e0"),
    W: common_vendor.o(_ctx.showNotificationHistory, "f5"),
    X: common_vendor.o(_ctx.openReminderSettings, "5b"),
    Y: common_vendor.o(($event) => _ctx.updateSetting("weeklySummary", $event), "90"),
    Z: common_vendor.o(_ctx.updateDefaultCurrency, "0f"),
    aa: common_vendor.o(_ctx.exportData, "19"),
    ab: common_vendor.o(_ctx.openTrash, "16"),
    ac: common_vendor.o(_ctx.showPrivacy, "d7"),
    ad: common_vendor.o(_ctx.resetDemoData, "7b"),
    ae: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["live-subscriptions"]: _ctx.liveSubscriptions,
      ["monthly-average-text"]: _ctx.monthlyAverageText,
      settings: _ctx.settings,
      ["is-member"]: _ctx.isMember,
      ["free-quota-text"]: _ctx.freeQuotaText,
      ["membership-quota-percent"]: _ctx.membershipQuotaPercent,
      currencies: _ctx.currencies,
      ["deleted-subscriptions"]: _ctx.deletedSubscriptions,
      ["notification-ready"]: _ctx.notificationReady,
      ["notification-description"]: _ctx.notificationDescription,
      ["notification-busy"]: _ctx.notificationAuthorizing
    })
  } : _ctx.activeView === "membership" ? {
    ag: common_vendor.o(($event) => _ctx.goBackView("profile"), "1a"),
    ah: common_vendor.o(_ctx.activateMembership, "0c"),
    ai: common_vendor.o(_ctx.restoreFreePlan, "a0"),
    aj: common_vendor.p({
      ["is-member"]: _ctx.isMember,
      ["free-quota-value"]: _ctx.freeQuotaValue
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    al: common_vendor.o(($event) => _ctx.goBackView("all"), "46"),
    am: common_vendor.o(_ctx.confirmRenewal, "b0"),
    an: common_vendor.o(_ctx.undoRenewal, "81"),
    ao: common_vendor.o(_ctx.snoozeSubscription, "8a"),
    ap: common_vendor.o(_ctx.cancelSubscription, "1f"),
    aq: common_vendor.o(_ctx.showMoreActions, "6a"),
    ar: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "e7"),
    as: common_vendor.p({
      subscription: _ctx.selectedSubscription,
      ["notification-enabled"]: _ctx.notificationReady,
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
    av: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "3d"),
    aw: common_vendor.o(_ctx.applyTemplate, "21"),
    ax: common_vendor.o(($event) => _ctx.form.category = $event, "f8"),
    ay: common_vendor.o(($event) => _ctx.form.currency = $event, "ea"),
    az: common_vendor.o(_ctx.changeCycle, "13"),
    aA: common_vendor.o(($event) => _ctx.form.payment = $event, "ff"),
    aB: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "45"),
    aC: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "4f"),
    aD: common_vendor.o(_ctx.setTrial, "7c"),
    aE: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "b4"),
    aF: common_vendor.o(_ctx.toggleReminder, "61"),
    aG: common_vendor.o(_ctx.saveSubscription, "d6"),
    aH: common_vendor.p({
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
    aJ: common_vendor.o(($event) => _ctx.goBackView("profile"), "bd"),
    aK: common_vendor.o(_ctx.toggleDefaultReminder, "2a"),
    aL: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "44"),
    aM: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    x: _ctx.activeView === "all",
    H: _ctx.activeView === "calendar",
    O: _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError,
    T: _ctx.activeView === "profile",
    af: _ctx.activeView === "membership",
    ak: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    at: _ctx.activeView === "form",
    aI: _ctx.activeView === "reminder-settings"
  }) : {}, {
    aN: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    aO: _ctx.scrollTop,
    aP: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    aQ: common_vendor.o(_ctx.closeSortSheet, "43"),
    aR: common_vendor.o(_ctx.selectSort, "ee"),
    aS: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    aT: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    aU: common_vendor.o(_ctx.switchTab, "96"),
    aV: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {}, {
    aW: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "28")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a355b6de"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
