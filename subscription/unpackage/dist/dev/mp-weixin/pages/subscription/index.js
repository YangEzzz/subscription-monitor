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
  components: { SubscriptionHomeView, SubscriptionListView, SubscriptionCalendarView, SubscriptionStatsView, SubscriptionProfileView, MembershipView, SubscriptionDetailView, SubscriptionFormView, ReminderSettingsView, SubscriptionSortSheet, SubscriptionTabBar },
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
    c: _ctx.activeView === "home"
  }, _ctx.activeView === "home" ? {
    d: common_vendor.o(_ctx.toggleAmount, "30"),
    e: common_vendor.o(_ctx.enableNotification, "fe"),
    f: common_vendor.o(($event) => _ctx.switchTab("all"), "a7"),
    g: common_vendor.o(_ctx.openDetail, "a3"),
    h: common_vendor.o(_ctx.openForm, "78"),
    i: common_vendor.o(_ctx.handleReminder, "6e"),
    j: common_vendor.p({
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
    l: common_vendor.o(($event) => _ctx.searchKeyword = $event, "d5"),
    m: common_vendor.o(($event) => _ctx.searchKeyword = "", "c6"),
    n: common_vendor.o(($event) => _ctx.activeCategory = $event, "18"),
    o: common_vendor.o(($event) => _ctx.activeStatus = $event, "60"),
    p: common_vendor.o(_ctx.chooseSort, "50"),
    q: common_vendor.o(_ctx.openDetail, "e2"),
    r: common_vendor.o(_ctx.resetFilters, "c6"),
    s: common_vendor.o(_ctx.openForm, "70"),
    t: common_vendor.p({
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
    w: common_vendor.o(_ctx.changeMonth, "a4"),
    x: common_vendor.o(_ctx.goToday, "7f"),
    y: common_vendor.o(_ctx.selectDate, "e6"),
    z: common_vendor.o(_ctx.openDetail, "39"),
    A: common_vendor.o(_ctx.openForm, "bd"),
    B: common_vendor.p({
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
  } : _ctx.activeView === "stats" ? {
    D: common_vendor.o(($event) => _ctx.statsCurrency = $event, "9d"),
    E: common_vendor.o(($event) => _ctx.statsPeriod = $event, "31"),
    F: common_vendor.p({
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
    H: common_vendor.o(_ctx.openMembership, "45"),
    I: common_vendor.o(_ctx.handleNotificationSwitch, "72"),
    J: common_vendor.o(_ctx.openReminderSettings, "81"),
    K: common_vendor.o(($event) => _ctx.updateSetting("weeklySummary", $event), "b0"),
    L: common_vendor.o(_ctx.updateDefaultCurrency, "df"),
    M: common_vendor.o(_ctx.exportData, "ab"),
    N: common_vendor.o(_ctx.openTrash, "35"),
    O: common_vendor.o(_ctx.showPrivacy, "d1"),
    P: common_vendor.o(_ctx.resetDemoData, "ed"),
    Q: common_vendor.p({
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
    S: common_vendor.o(($event) => _ctx.goBackView("profile"), "f9"),
    T: common_vendor.o(_ctx.activateMembership, "07"),
    U: common_vendor.o(_ctx.restoreFreePlan, "e4"),
    V: common_vendor.p({
      ["is-member"]: _ctx.isMember,
      ["free-quota-value"]: _ctx.freeQuotaValue
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    X: common_vendor.o(($event) => _ctx.goBackView("all"), "2b"),
    Y: common_vendor.o(_ctx.confirmRenewal, "4d"),
    Z: common_vendor.o(_ctx.undoRenewal, "13"),
    aa: common_vendor.o(_ctx.snoozeSubscription, "a2"),
    ab: common_vendor.o(_ctx.cancelSubscription, "e3"),
    ac: common_vendor.o(_ctx.showMoreActions, "17"),
    ad: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "93"),
    ae: common_vendor.p({
      subscription: _ctx.selectedSubscription,
      ["notification-enabled"]: _ctx.settings.notificationEnabled,
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
    ag: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "f6"),
    ah: common_vendor.o(_ctx.applyTemplate, "0f"),
    ai: common_vendor.o(($event) => _ctx.form.category = $event, "80"),
    aj: common_vendor.o(($event) => _ctx.form.currency = $event, "0f"),
    ak: common_vendor.o(_ctx.changeCycle, "7c"),
    al: common_vendor.o(($event) => _ctx.form.payment = $event, "3a"),
    am: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "28"),
    an: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "1c"),
    ao: common_vendor.o(_ctx.setTrial, "77"),
    ap: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "46"),
    aq: common_vendor.o(_ctx.toggleReminder, "2b"),
    ar: common_vendor.o(_ctx.saveSubscription, "40"),
    as: common_vendor.p({
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
    av: common_vendor.o(($event) => _ctx.goBackView("profile"), "0f"),
    aw: common_vendor.o(_ctx.toggleDefaultReminder, "5e"),
    ax: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "58"),
    ay: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    k: _ctx.activeView === "all",
    v: _ctx.activeView === "calendar",
    C: _ctx.activeView === "stats",
    G: _ctx.activeView === "profile",
    R: _ctx.activeView === "membership",
    W: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    af: _ctx.activeView === "form",
    at: _ctx.activeView === "reminder-settings",
    az: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    aA: _ctx.scrollTop,
    aB: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    aC: common_vendor.o(_ctx.closeSortSheet, "cd"),
    aD: common_vendor.o(_ctx.selectSort, "ec"),
    aE: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    aF: _ctx.showTabBar
  }, _ctx.showTabBar ? {
    aG: common_vendor.o(_ctx.switchTab, "1b"),
    aH: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
