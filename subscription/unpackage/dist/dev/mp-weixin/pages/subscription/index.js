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
    SubscriptionTabBar
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
  (_component_subscription_home_view + _component_subscription_list_view + _component_subscription_calendar_view + _component_subscription_stats_view + _component_subscription_profile_view + _component_membership_view + _component_subscription_detail_view + _component_subscription_form_view + _component_reminder_settings_view + _component_subscription_sort_sheet + _component_subscription_tab_bar)();
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
    h: common_vendor.t(_ctx.loadError),
    i: common_vendor.t(_ctx.dataReady ? "（当前显示上次读取的数据）" : ""),
    j: _ctx.loading || _ctx.mutating,
    k: common_vendor.o((...args) => _ctx.refreshData && _ctx.refreshData(...args), "68")
  } : {}, {
    l: _ctx.statsError && (_ctx.activeView === "stats" || _ctx.activeView === "home")
  }, _ctx.statsError && (_ctx.activeView === "stats" || _ctx.activeView === "home") ? {
    m: common_vendor.t(_ctx.statsError),
    n: common_vendor.o((...args) => _ctx.refreshStats && _ctx.refreshStats(...args), "84")
  } : {}, {
    o: _ctx.statsLoading && _ctx.activeView === "stats"
  }, _ctx.statsLoading && _ctx.activeView === "stats" ? {} : {}, {
    p: _ctx.dataReady
  }, _ctx.dataReady ? common_vendor.e({
    q: _ctx.activeView === "home"
  }, _ctx.activeView === "home" ? {
    r: common_vendor.o(_ctx.toggleAmount, "6b"),
    s: common_vendor.o(_ctx.enableNotification, "4d"),
    t: common_vendor.o(($event) => _ctx.switchTab("all"), "8d"),
    v: common_vendor.o(_ctx.openDetail, "68"),
    w: common_vendor.o(_ctx.openForm, "4b"),
    x: common_vendor.o(_ctx.handleReminder, "90"),
    y: common_vendor.p({
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
    A: common_vendor.o(($event) => _ctx.searchKeyword = $event, "bc"),
    B: common_vendor.o(($event) => _ctx.searchKeyword = "", "70"),
    C: common_vendor.o(($event) => _ctx.activeCategory = $event, "d3"),
    D: common_vendor.o(($event) => _ctx.activeStatus = $event, "92"),
    E: common_vendor.o(_ctx.chooseSort, "85"),
    F: common_vendor.o(_ctx.openDetail, "eb"),
    G: common_vendor.o(_ctx.resetFilters, "9a"),
    H: common_vendor.o(_ctx.openForm, "f7"),
    I: common_vendor.p({
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
    K: common_vendor.o(_ctx.changeMonth, "42"),
    L: common_vendor.o(_ctx.goToday, "40"),
    M: common_vendor.o(_ctx.selectDate, "f6"),
    N: common_vendor.o(_ctx.openDetail, "28"),
    O: common_vendor.o(_ctx.openForm, "50"),
    P: common_vendor.p({
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
    R: common_vendor.o(_ctx.changeStatsCurrency, "c4"),
    S: common_vendor.o(($event) => _ctx.statsPeriod = $event, "59"),
    T: common_vendor.p({
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
    V: common_vendor.o(_ctx.openMembership, "fd"),
    W: common_vendor.o(_ctx.handleNotificationSwitch, "2d"),
    X: common_vendor.o(_ctx.openReminderSettings, "cf"),
    Y: common_vendor.o(($event) => _ctx.updateSetting("weeklySummary", $event), "e6"),
    Z: common_vendor.o(_ctx.updateDefaultCurrency, "18"),
    aa: common_vendor.o(_ctx.exportData, "e9"),
    ab: common_vendor.o(_ctx.openTrash, "bd"),
    ac: common_vendor.o(_ctx.showPrivacy, "88"),
    ad: common_vendor.o(_ctx.resetDemoData, "bb"),
    ae: common_vendor.p({
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
    ag: common_vendor.o(($event) => _ctx.goBackView("profile"), "51"),
    ah: common_vendor.o(_ctx.activateMembership, "f0"),
    ai: common_vendor.o(_ctx.restoreFreePlan, "ab"),
    aj: common_vendor.p({
      ["is-member"]: _ctx.isMember,
      ["free-quota-value"]: _ctx.freeQuotaValue
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    al: common_vendor.o(($event) => _ctx.goBackView("all"), "36"),
    am: common_vendor.o(_ctx.confirmRenewal, "60"),
    an: common_vendor.o(_ctx.undoRenewal, "28"),
    ao: common_vendor.o(_ctx.snoozeSubscription, "43"),
    ap: common_vendor.o(_ctx.cancelSubscription, "e7"),
    aq: common_vendor.o(_ctx.showMoreActions, "ed"),
    ar: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "e6"),
    as: common_vendor.p({
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
    av: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "f8"),
    aw: common_vendor.o(_ctx.applyTemplate, "f2"),
    ax: common_vendor.o(($event) => _ctx.form.category = $event, "b0"),
    ay: common_vendor.o(($event) => _ctx.form.currency = $event, "4e"),
    az: common_vendor.o(_ctx.changeCycle, "c8"),
    aA: common_vendor.o(($event) => _ctx.form.payment = $event, "1c"),
    aB: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "aa"),
    aC: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "2b"),
    aD: common_vendor.o(_ctx.setTrial, "2b"),
    aE: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "b7"),
    aF: common_vendor.o(_ctx.toggleReminder, "75"),
    aG: common_vendor.o(_ctx.saveSubscription, "69"),
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
      ["today-key"]: _ctx.todayKey,
      ["form-reminder-preview"]: _ctx.formReminderPreview,
      ["format-date"]: _ctx.formatDate,
      ["cycle-text"]: _ctx.cycleText
    })
  } : _ctx.activeView === "reminder-settings" ? {
    aJ: common_vendor.o(($event) => _ctx.goBackView("profile"), "5e"),
    aK: common_vendor.o(_ctx.toggleDefaultReminder, "73"),
    aL: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "a2"),
    aM: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    z: _ctx.activeView === "all",
    J: _ctx.activeView === "calendar",
    Q: _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError,
    U: _ctx.activeView === "profile",
    af: _ctx.activeView === "membership",
    ak: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    at: _ctx.activeView === "form",
    aI: _ctx.activeView === "reminder-settings"
  }) : {}, {
    aN: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    aO: _ctx.scrollTop,
    aP: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    aQ: common_vendor.o(_ctx.closeSortSheet, "a5"),
    aR: common_vendor.o(_ctx.selectSort, "6c"),
    aS: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    aT: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    aU: common_vendor.o(_ctx.switchTab, "4c"),
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
