"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_subscription_subscriptionPageLogic = require("./subscription-page-logic.js");
const PageHeader = () => "../../components/subscription/PageHeader.js";
const UiSkeleton = () => "../../components/subscription/UiSkeleton.js";
const SubscriptionHomeView = () => "../../components/subscription/SubscriptionHomeView.js";
const SubscriptionListView = () => "../../components/subscription/SubscriptionListView.js";
const SubscriptionCalendarView = () => "../../components/subscription/SubscriptionCalendarView.js";
const SubscriptionStatsView = () => "../../components/subscription/SubscriptionStatsView.js";
const SubscriptionProfileView = () => "../../components/subscription/SubscriptionProfileView.js";
const MembershipView = () => "../../components/subscription/MembershipView.js";
const SubscriptionDetailView = () => "../../components/subscription/SubscriptionDetailView.js";
const SubscriptionDetailLoadState = () => "../../components/subscription/SubscriptionDetailLoadState.js";
const SubscriptionFormView = () => "../../components/subscription/SubscriptionFormView.js";
const ReminderSettingsView = () => "../../components/subscription/ReminderSettingsView.js";
const SubscriptionSortSheet = () => "../../components/subscription/SubscriptionSortSheet.js";
const SubscriptionTabBar = () => "../../components/subscription/SubscriptionTabBar.js";
const AsyncStateView = () => "../../components/subscription/AsyncStateView.js";
const _sfc_main = {
  provide() {
    const page = this;
    return {
      uiMotion: {
        get reduced() {
          return page.reducedMotion;
        }
      }
    };
  },
  components: {
    PageHeader,
    UiSkeleton,
    SubscriptionHomeView,
    SubscriptionListView,
    SubscriptionCalendarView,
    SubscriptionStatsView,
    SubscriptionProfileView,
    MembershipView,
    SubscriptionDetailView,
    SubscriptionDetailLoadState,
    SubscriptionFormView,
    ReminderSettingsView,
    SubscriptionSortSheet,
    SubscriptionTabBar,
    AsyncStateView
  },
  data() {
    return {
      ...pages_subscription_subscriptionPageLogic.createSubscriptionPageState(),
      reducedMotion: false,
      uiScrollTop: 0
    };
  },
  watch: {
    activeView() {
      this.uiScrollTop = 0;
    }
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
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _component_ui_skeleton = common_vendor.resolveComponent("ui-skeleton");
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  const _component_subscription_home_view = common_vendor.resolveComponent("subscription-home-view");
  const _component_subscription_list_view = common_vendor.resolveComponent("subscription-list-view");
  const _component_subscription_calendar_view = common_vendor.resolveComponent("subscription-calendar-view");
  const _component_subscription_stats_view = common_vendor.resolveComponent("subscription-stats-view");
  const _component_subscription_profile_view = common_vendor.resolveComponent("subscription-profile-view");
  const _component_membership_view = common_vendor.resolveComponent("membership-view");
  const _component_subscription_detail_load_state = common_vendor.resolveComponent("subscription-detail-load-state");
  const _component_subscription_detail_view = common_vendor.resolveComponent("subscription-detail-view");
  const _component_subscription_form_view = common_vendor.resolveComponent("subscription-form-view");
  const _component_reminder_settings_view = common_vendor.resolveComponent("reminder-settings-view");
  const _component_subscription_sort_sheet = common_vendor.resolveComponent("subscription-sort-sheet");
  const _component_subscription_tab_bar = common_vendor.resolveComponent("subscription-tab-bar");
  (_component_page_header + _component_ui_skeleton + _component_async_state_view + _component_subscription_home_view + _component_subscription_list_view + _component_subscription_calendar_view + _component_subscription_stats_view + _component_subscription_profile_view + _component_membership_view + _component_subscription_detail_load_state + _component_subscription_detail_view + _component_subscription_form_view + _component_reminder_settings_view + _component_subscription_sort_sheet + _component_subscription_tab_bar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: _ctx.activeView === "form" ? 1 : "",
    b: _ctx.statusBarHeight + "px",
    c: _ctx.loading || _ctx.mutating ? 1 : "",
    d: _ctx.mutating ? "正在保存" : _ctx.loading ? "正在同步" : "已同步",
    e: !_ctx.dataReady && !_ctx.loadError
  }, !_ctx.dataReady && !_ctx.loadError ? {
    f: common_vendor.p({
      title: "续订清单"
    }),
    g: common_vendor.p({
      variant: "hero"
    }),
    h: common_vendor.p({
      variant: "list"
    })
  } : {}, {
    i: _ctx.activeView === "stats" && _ctx.statsError
  }, _ctx.activeView === "stats" && _ctx.statsError ? {
    j: common_vendor.o(($event) => _ctx.goBackView("home"), "46"),
    k: common_vendor.p({
      title: "统计",
      secondary: true
    })
  } : {}, {
    l: !_ctx.dataReady && _ctx.loadError
  }, !_ctx.dataReady && _ctx.loadError ? {
    m: common_vendor.p({
      title: "续订清单"
    })
  } : {}, {
    n: _ctx.loadError
  }, _ctx.loadError ? {
    o: common_vendor.o(_ctx.refreshData, "3f"),
    p: common_vendor.p({
      compact: _ctx.dataReady,
      title: _ctx.loadErrorTitle,
      description: _ctx.loadErrorDescription,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    q: _ctx.statsError && (_ctx.activeView === "stats" || _ctx.activeView === "home")
  }, _ctx.statsError && (_ctx.activeView === "stats" || _ctx.activeView === "home") ? {
    r: common_vendor.o(_ctx.refreshStats, "3a"),
    s: common_vendor.p({
      compact: true,
      title: "统计暂时不可用",
      description: _ctx.statsErrorDescription,
      ["action-label"]: "重试统计",
      busy: _ctx.statsLoading
    })
  } : {}, {
    t: _ctx.notificationError && _ctx.dataReady
  }, _ctx.notificationError && _ctx.dataReady ? {
    v: common_vendor.o(_ctx.refreshData, "c3"),
    w: common_vendor.p({
      compact: true,
      title: "通知状态暂不可用",
      description: _ctx.notificationError,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    x: _ctx.statsLoading && _ctx.activeView === "stats"
  }, _ctx.statsLoading && _ctx.activeView === "stats" ? {
    y: common_vendor.o(($event) => _ctx.goBackView("home"), "89"),
    z: common_vendor.p({
      title: "统计",
      secondary: true
    }),
    A: common_vendor.p({
      variant: "hero"
    }),
    B: common_vendor.p({
      variant: "chart"
    })
  } : {}, {
    C: _ctx.dataReady
  }, _ctx.dataReady ? common_vendor.e({
    D: _ctx.activeView === "home"
  }, _ctx.activeView === "home" ? {
    E: common_vendor.o(_ctx.toggleAmount, "8a"),
    F: common_vendor.o(($event) => _ctx.navigateToView("stats"), "95"),
    G: common_vendor.o(_ctx.enableNotification, "1e"),
    H: common_vendor.o(($event) => _ctx.switchTab("all"), "72"),
    I: common_vendor.o(_ctx.openDetail, "55"),
    J: common_vendor.o(_ctx.openForm, "34"),
    K: common_vendor.o(_ctx.handleReminder, "d3"),
    L: common_vendor.p({
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
    N: common_vendor.o(($event) => _ctx.searchKeyword = $event, "a8"),
    O: common_vendor.o(($event) => _ctx.searchKeyword = "", "63"),
    P: common_vendor.o(($event) => _ctx.activeCategory = $event, "5d"),
    Q: common_vendor.o(($event) => _ctx.activeStatus = $event, "c9"),
    R: common_vendor.o(_ctx.chooseSort, "71"),
    S: common_vendor.o(_ctx.openDetail, "b2"),
    T: common_vendor.o(_ctx.resetFilters, "dd"),
    U: common_vendor.o(_ctx.openForm, "ec"),
    V: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["search-keyword"]: _ctx.searchKeyword,
      ["category-filters"]: _ctx.categoryFilters,
      ["active-category"]: _ctx.activeCategory,
      ["status-filters"]: _ctx.statusFilters,
      ["active-status"]: _ctx.activeStatus,
      ["sort-label"]: _ctx.sortLabel,
      ["active-status-label"]: _ctx.activeStatusLabel,
      ["visible-subscriptions"]: _ctx.visibleSubscriptions,
      ["decorate-item"]: _ctx.decorateItem,
      ["live-subscriptions"]: _ctx.liveSubscriptions,
      ["format-date"]: _ctx.formatDate,
      ["format-money"]: _ctx.formatMoney,
      ["cycle-text"]: _ctx.cycleText,
      ["days-text"]: _ctx.daysText,
      ["get-status"]: _ctx.getStatus,
      ["status-text"]: _ctx.statusText
    })
  } : _ctx.activeView === "calendar" ? {
    X: common_vendor.o(_ctx.changeMonth, "5d"),
    Y: common_vendor.o(_ctx.goToday, "5b"),
    Z: common_vendor.o(_ctx.selectDate, "ff"),
    aa: common_vendor.o(_ctx.openDetail, "ef"),
    ab: common_vendor.o(_ctx.openForm, "7d"),
    ac: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["calendar-title"]: _ctx.calendarTitle,
      ["renewal-subscriptions"]: _ctx.activeSubscriptions,
      ["decorate-item"]: _ctx.decorateItem,
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
    ae: common_vendor.o(($event) => _ctx.goBackView("home"), "bc"),
    af: common_vendor.o(_ctx.changeStatsCurrency, "80"),
    ag: common_vendor.o(($event) => _ctx.statsPeriod = $event, "10"),
    ah: common_vendor.o(_ctx.openForm, "e2"),
    ai: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      currencies: _ctx.currencies,
      ["stats-currency"]: _ctx.statsCurrency,
      ["stats-label"]: _ctx.statsLabel,
      ["stat-periods"]: _ctx.statPeriods,
      ["stats-period"]: _ctx.statsPeriod,
      ["stats-total"]: _ctx.statsTotal,
      ["stats-subscription-count"]: _ctx.statsSubscriptionCount,
      ["category-stats"]: _ctx.categoryStats,
      ["category-order"]: _ctx.categories,
      ["donut-background"]: _ctx.donutBackground,
      ["trend-data"]: _ctx.trendData,
      ["format-money"]: _ctx.formatMoney,
      ["compact-amount"]: _ctx.compactAmount
    })
  } : _ctx.activeView === "profile" ? {
    ak: common_vendor.o(($event) => $data.reducedMotion = $event, "0f"),
    al: common_vendor.o(_ctx.openMembership, "4e"),
    am: common_vendor.o(_ctx.handleNotificationSwitch, "d7"),
    an: common_vendor.o(_ctx.showNotificationHistory, "09"),
    ao: common_vendor.o(_ctx.openReminderSettings, "27"),
    ap: common_vendor.o(_ctx.updateDefaultCurrency, "3e"),
    aq: common_vendor.o(_ctx.exportData, "3b"),
    ar: common_vendor.o(_ctx.openTrash, "5b"),
    as: common_vendor.o(_ctx.showPrivacy, "9f"),
    at: common_vendor.o(_ctx.refreshData, "cd"),
    av: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["live-subscriptions"]: _ctx.liveSubscriptions,
      ["monthly-average-text"]: _ctx.monthlyAverageText,
      settings: _ctx.settings,
      ["is-member"]: _ctx.isMember,
      ["free-quota-text"]: _ctx.freeQuotaText,
      ["membership-quota-percent"]: _ctx.membershipQuotaPercent,
      ["membership-entry-enabled"]: _ctx.membershipEntryEnabled,
      ["reduced-motion"]: $data.reducedMotion,
      currencies: _ctx.currencies,
      ["deleted-subscriptions"]: _ctx.deletedSubscriptions,
      ["notification-ready"]: _ctx.notificationReady,
      ["notification-description"]: _ctx.notificationDescription,
      ["notification-busy"]: _ctx.notificationAuthorizing || _ctx.notificationLoading || _ctx.loading || _ctx.mutating
    })
  } : _ctx.activeView === "membership" && _ctx.membershipEntryEnabled ? {
    ax: common_vendor.o(_ctx.beginMembershipPurchase, "f3"),
    ay: common_vendor.o(_ctx.payMembershipOrder, "48"),
    az: common_vendor.o(_ctx.simulateMembershipPayment, "2c"),
    aA: common_vendor.o(_ctx.refundMembershipOrder, "68"),
    aB: common_vendor.o(_ctx.loadMembershipOrders, "89"),
    aC: common_vendor.o(_ctx.selectMembershipOrder, "59"),
    aD: common_vendor.o(($event) => _ctx.goBackView("profile"), "f4"),
    aE: common_vendor.p({
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
  } : _ctx.activeView === "detail" && (_ctx.detailLoading || _ctx.detailError || !_ctx.selectedSubscription) ? {
    aG: common_vendor.o(($event) => _ctx.goBackView("all"), "08"),
    aH: common_vendor.o(($event) => _ctx.openDetail({
      id: _ctx.selectedId
    }), "5e"),
    aI: common_vendor.p({
      error: _ctx.detailError,
      ["scroll-offset"]: $data.uiScrollTop
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    aK: common_vendor.o(($event) => _ctx.goBackView("all"), "93"),
    aL: common_vendor.o(_ctx.confirmRenewal, "3e"),
    aM: common_vendor.o(_ctx.undoRenewal, "44"),
    aN: common_vendor.o(_ctx.snoozeSubscription, "f0"),
    aO: common_vendor.o(_ctx.cancelSubscription, "d2"),
    aP: common_vendor.o(_ctx.showMoreActions, "71"),
    aQ: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "34"),
    aR: common_vendor.p({
      subscription: _ctx.selectedSubscription,
      ["scroll-offset"]: $data.uiScrollTop,
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
    aT: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "0b"),
    aU: common_vendor.o(_ctx.applyTemplate, "df"),
    aV: common_vendor.o(($event) => _ctx.form.category = $event, "40"),
    aW: common_vendor.o(($event) => _ctx.form.currency = $event, "9b"),
    aX: common_vendor.o(_ctx.changeCycle, "97"),
    aY: common_vendor.o(($event) => _ctx.form.payment = $event, "6e"),
    aZ: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "27"),
    ba: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "32"),
    bb: common_vendor.o(_ctx.setTrial, "46"),
    bc: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "1d"),
    bd: common_vendor.o(_ctx.toggleReminder, "32"),
    be: common_vendor.o(_ctx.saveSubscription, "fb"),
    bf: common_vendor.p({
      ["editing-id"]: _ctx.editingId,
      ["scroll-offset"]: $data.uiScrollTop,
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
      ["cycle-text"]: _ctx.cycleText,
      ["format-money"]: _ctx.formatMoney,
      ["days-text"]: _ctx.daysText
    })
  } : _ctx.activeView === "reminder-settings" ? {
    bh: common_vendor.o(($event) => _ctx.goBackView("profile"), "d0"),
    bi: common_vendor.o(_ctx.toggleDefaultReminder, "b5"),
    bj: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "44"),
    bk: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    M: _ctx.activeView === "all",
    W: _ctx.activeView === "calendar",
    ad: _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError,
    aj: _ctx.activeView === "profile",
    aw: _ctx.activeView === "membership" && _ctx.membershipEntryEnabled,
    aF: _ctx.activeView === "detail" && (_ctx.detailLoading || _ctx.detailError || !_ctx.selectedSubscription),
    aJ: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    aS: _ctx.activeView === "form",
    bg: _ctx.activeView === "reminder-settings"
  }) : {}, {
    bl: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    bm: _ctx.scrollTop,
    bn: common_vendor.o(($event) => $data.uiScrollTop = $event.detail.scrollTop, "8b"),
    bo: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    bp: common_vendor.o(_ctx.closeSortSheet, "e9"),
    bq: common_vendor.o(_ctx.selectSort, "28"),
    br: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    bs: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    bt: common_vendor.o(_ctx.switchTab, "13"),
    bv: common_vendor.o(($event) => _ctx.openForm(), "83"),
    bw: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {}, {
    bx: !_ctx.showTabBar ? 1 : "",
    by: $data.reducedMotion ? 1 : "",
    bz: _ctx.statusBarHeight + "px",
    bA: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "6d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a355b6de"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
