"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_subscription_subscriptionPageLogic = require("./subscription-page-logic.js");
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
    common_vendor.index.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] });
    pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onLoad.call(this, options);
  },
  onShareAppMessage() {
    return pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onShareAppMessage();
  },
  onShareTimeline() {
    return pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onShareTimeline();
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
    h: common_vendor.o(_ctx.refreshData, "62"),
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
    k: common_vendor.o(_ctx.refreshStats, "d4"),
    l: common_vendor.p({
      compact: true,
      title: "统计暂时不可用",
      description: _ctx.statsErrorDescription,
      ["action-label"]: "重试统计",
      busy: _ctx.statsLoading
    })
  } : {}, {
    m: _ctx.notificationError && _ctx.dataReady
  }, _ctx.notificationError && _ctx.dataReady ? {
    n: common_vendor.o(_ctx.refreshData, "9d"),
    o: common_vendor.p({
      compact: true,
      title: "通知状态暂不可用",
      description: _ctx.notificationError,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    p: _ctx.statsLoading && _ctx.activeView === "stats"
  }, _ctx.statsLoading && _ctx.activeView === "stats" ? {} : {}, {
    q: _ctx.dataReady
  }, _ctx.dataReady ? common_vendor.e({
    r: _ctx.activeView === "home"
  }, _ctx.activeView === "home" ? {
    s: common_vendor.o(_ctx.toggleAmount, "28"),
    t: common_vendor.o(_ctx.enableNotification, "95"),
    v: common_vendor.o(($event) => _ctx.switchTab("all"), "77"),
    w: common_vendor.o(_ctx.openDetail, "e8"),
    x: common_vendor.o(_ctx.openForm, "89"),
    y: common_vendor.o(_ctx.handleReminder, "f2"),
    z: common_vendor.p({
      settings: _ctx.settings,
      ["notification-ready"]: _ctx.notificationReady,
      ["notification-description"]: _ctx.notificationDescription,
      ["notification-busy"]: _ctx.notificationAuthorizing || _ctx.notificationLoading || _ctx.loading || _ctx.mutating,
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
    B: common_vendor.o(($event) => _ctx.searchKeyword = $event, "7e"),
    C: common_vendor.o(($event) => _ctx.searchKeyword = "", "a9"),
    D: common_vendor.o(($event) => _ctx.activeCategory = $event, "fe"),
    E: common_vendor.o(($event) => _ctx.activeStatus = $event, "3e"),
    F: common_vendor.o(_ctx.chooseSort, "86"),
    G: common_vendor.o(_ctx.openDetail, "88"),
    H: common_vendor.o(_ctx.resetFilters, "21"),
    I: common_vendor.o(_ctx.openForm, "e1"),
    J: common_vendor.p({
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
    L: common_vendor.o(_ctx.changeMonth, "38"),
    M: common_vendor.o(_ctx.goToday, "92"),
    N: common_vendor.o(_ctx.selectDate, "f2"),
    O: common_vendor.o(_ctx.openDetail, "b8"),
    P: common_vendor.o(_ctx.openForm, "ad"),
    Q: common_vendor.p({
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
    S: common_vendor.o(_ctx.changeStatsCurrency, "99"),
    T: common_vendor.o(($event) => _ctx.statsPeriod = $event, "ba"),
    U: common_vendor.o(_ctx.openForm, "19"),
    V: common_vendor.p({
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
    X: common_vendor.o(_ctx.openMembership, "ab"),
    Y: common_vendor.o(_ctx.handleNotificationSwitch, "63"),
    Z: common_vendor.o(_ctx.showNotificationHistory, "e4"),
    aa: common_vendor.o(_ctx.openReminderSettings, "0c"),
    ab: common_vendor.o(_ctx.updateDefaultCurrency, "af"),
    ac: common_vendor.o(_ctx.exportData, "e8"),
    ad: common_vendor.o(_ctx.openTrash, "dc"),
    ae: common_vendor.o(_ctx.showPrivacy, "77"),
    af: common_vendor.o(_ctx.refreshData, "c5"),
    ag: common_vendor.p({
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
      ["notification-busy"]: _ctx.notificationAuthorizing || _ctx.notificationLoading || _ctx.loading || _ctx.mutating
    })
  } : _ctx.activeView === "membership" ? {
    ai: common_vendor.o(_ctx.beginMembershipPurchase, "98"),
    aj: common_vendor.o(_ctx.simulateMembershipPayment, "79"),
    ak: common_vendor.o(_ctx.refundMembershipOrder, "5c"),
    al: common_vendor.o(_ctx.loadMembershipOrders, "8d"),
    am: common_vendor.o(_ctx.selectMembershipOrder, "09"),
    an: common_vendor.o(($event) => _ctx.goBackView("profile"), "7e"),
    ao: common_vendor.p({
      ["is-member"]: _ctx.isMember,
      ["free-quota-value"]: _ctx.freeQuotaValue,
      ["subscription-limit"]: _ctx.subscriptionLimit,
      membership: _ctx.settings.membership,
      orders: _ctx.membershipOrders,
      order: _ctx.membershipOrder,
      busy: _ctx.membershipBusy,
      loading: _ctx.membershipLoading,
      error: _ctx.membershipError,
      message: _ctx.membershipMessage
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    aq: common_vendor.o(($event) => _ctx.goBackView("all"), "68"),
    ar: common_vendor.o(_ctx.confirmRenewal, "95"),
    as: common_vendor.o(_ctx.undoRenewal, "35"),
    at: common_vendor.o(_ctx.snoozeSubscription, "97"),
    av: common_vendor.o(_ctx.cancelSubscription, "ba"),
    aw: common_vendor.o(_ctx.showMoreActions, "29"),
    ax: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "79"),
    ay: common_vendor.p({
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
    aA: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "ea"),
    aB: common_vendor.o(_ctx.applyTemplate, "21"),
    aC: common_vendor.o(($event) => _ctx.form.category = $event, "d7"),
    aD: common_vendor.o(($event) => _ctx.form.currency = $event, "42"),
    aE: common_vendor.o(_ctx.changeCycle, "de"),
    aF: common_vendor.o(($event) => _ctx.form.payment = $event, "83"),
    aG: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "21"),
    aH: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "e8"),
    aI: common_vendor.o(_ctx.setTrial, "90"),
    aJ: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "f8"),
    aK: common_vendor.o(_ctx.toggleReminder, "17"),
    aL: common_vendor.o(_ctx.saveSubscription, "d0"),
    aM: common_vendor.p({
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
    aO: common_vendor.o(($event) => _ctx.goBackView("profile"), "fc"),
    aP: common_vendor.o(_ctx.toggleDefaultReminder, "b0"),
    aQ: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "8e"),
    aR: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    A: _ctx.activeView === "all",
    K: _ctx.activeView === "calendar",
    R: _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError,
    W: _ctx.activeView === "profile",
    ah: _ctx.activeView === "membership",
    ap: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    az: _ctx.activeView === "form",
    aN: _ctx.activeView === "reminder-settings"
  }) : {}, {
    aS: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    aT: _ctx.scrollTop,
    aU: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    aV: common_vendor.o(_ctx.closeSortSheet, "d1"),
    aW: common_vendor.o(_ctx.selectSort, "4f"),
    aX: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    aY: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    aZ: common_vendor.o(_ctx.switchTab, "05"),
    ba: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {}, {
    bb: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "36")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a355b6de"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
