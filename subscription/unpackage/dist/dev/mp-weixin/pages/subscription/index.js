"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_subscription_nativeNavigation = require("./native-navigation.js");
const pages_subscription_subscriptionPageLogic = require("./subscription-page-logic.js");
const PageHeader = () => "../../components/subscription/PageHeader.js";
const UiSkeleton = () => "../../components/subscription/UiSkeleton.js";
const SubscriptionHomeView = () => "../../components/subscription/SubscriptionHomeView.js";
const SubscriptionListView = () => "../../components/subscription/SubscriptionListView.js";
const SubscriptionCalendarView = () => "../../components/subscription/SubscriptionCalendarView.js";
const SubscriptionStatsView = () => "../../components/subscription/SubscriptionStatsView.js";
const SubscriptionProfileView = () => "../../components/subscription/SubscriptionProfileView.js";
const SubscriptionAboutView = () => "../../components/subscription/SubscriptionAboutView.js";
const MembershipView = () => "../../components/subscription/MembershipView.js";
const SubscriptionDetailView = () => "../../components/subscription/SubscriptionDetailView.js";
const SubscriptionDetailLoadState = () => "../../components/subscription/SubscriptionDetailLoadState.js";
const SubscriptionSaveBar = () => "../../components/subscription/SubscriptionSaveBar.js";
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
    SubscriptionAboutView,
    MembershipView,
    SubscriptionDetailView,
    SubscriptionDetailLoadState,
    SubscriptionFormView,
    SubscriptionSaveBar,
    ReminderSettingsView,
    SubscriptionSortSheet,
    SubscriptionTabBar,
    AsyncStateView
  },
  data() {
    return pages_subscription_nativeNavigation.nativeNavigation.state(
      () => ({
        ...pages_subscription_subscriptionPageLogic.createSubscriptionPageState(),
        reducedMotion: false,
        refreshing: false,
        uiScrollTop: 0
      }),
      common_vendor.reactive
    );
  },
  watch: {
    activeView() {
      this.uiScrollTop = 0;
      pages_subscription_nativeNavigation.nativeNavigation.syncLeaveAlert(this);
    },
    form: {
      deep: true,
      handler() {
        pages_subscription_nativeNavigation.nativeNavigation.syncLeaveAlert(this);
      }
    },
    formBaseline() {
      pages_subscription_nativeNavigation.nativeNavigation.syncLeaveAlert(this);
    }
  },
  computed: pages_subscription_subscriptionPageLogic.subscriptionComputed,
  mounted() {
  },
  beforeUnmount() {
  },
  onLoad(options) {
    common_vendor.index.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] });
    if (pages_subscription_nativeNavigation.nativeNavigation.enter(this, options))
      return;
    pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onLoad.call(this, options);
  },
  onShow() {
    pages_subscription_nativeNavigation.nativeNavigation.show(this);
  },
  onReady() {
    pages_subscription_nativeNavigation.nativeNavigation.ready(this);
  },
  onHide() {
    pages_subscription_nativeNavigation.nativeNavigation.hide(this);
  },
  onUnload() {
    pages_subscription_nativeNavigation.nativeNavigation.leave(this);
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
  const _component_subscription_about_view = common_vendor.resolveComponent("subscription-about-view");
  const _component_membership_view = common_vendor.resolveComponent("membership-view");
  const _component_subscription_detail_load_state = common_vendor.resolveComponent("subscription-detail-load-state");
  const _component_subscription_detail_view = common_vendor.resolveComponent("subscription-detail-view");
  const _component_subscription_form_view = common_vendor.resolveComponent("subscription-form-view");
  const _component_reminder_settings_view = common_vendor.resolveComponent("reminder-settings-view");
  const _component_subscription_save_bar = common_vendor.resolveComponent("subscription-save-bar");
  const _component_subscription_sort_sheet = common_vendor.resolveComponent("subscription-sort-sheet");
  const _component_subscription_tab_bar = common_vendor.resolveComponent("subscription-tab-bar");
  (_component_page_header + _component_ui_skeleton + _component_async_state_view + _component_subscription_home_view + _component_subscription_list_view + _component_subscription_calendar_view + _component_subscription_stats_view + _component_subscription_profile_view + _component_subscription_about_view + _component_membership_view + _component_subscription_detail_load_state + _component_subscription_detail_view + _component_subscription_form_view + _component_reminder_settings_view + _component_subscription_save_bar + _component_subscription_sort_sheet + _component_subscription_tab_bar)();
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
    i: !_ctx.dataReady && _ctx.loadError
  }, !_ctx.dataReady && _ctx.loadError ? {
    j: common_vendor.p({
      title: "续订清单"
    })
  } : {}, {
    k: _ctx.loadError
  }, _ctx.loadError ? {
    l: common_vendor.o(_ctx.refreshData, "44"),
    m: common_vendor.p({
      compact: _ctx.dataReady,
      title: _ctx.loadErrorTitle,
      description: _ctx.loadErrorDescription,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    n: _ctx.statsError && _ctx.activeView === "home"
  }, _ctx.statsError && _ctx.activeView === "home" ? {
    o: common_vendor.o(_ctx.refreshStats, "90"),
    p: common_vendor.p({
      compact: true,
      title: "统计暂时不可用",
      description: _ctx.statsErrorDescription,
      ["action-label"]: "重试统计",
      busy: _ctx.statsLoading
    })
  } : {}, {
    q: _ctx.notificationError && _ctx.dataReady
  }, _ctx.notificationError && _ctx.dataReady ? {
    r: common_vendor.o(_ctx.refreshData, "c3"),
    s: common_vendor.p({
      compact: true,
      title: "通知状态暂不可用",
      description: _ctx.notificationError,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    t: _ctx.dataReady
  }, _ctx.dataReady ? common_vendor.e({
    v: _ctx.activeView === "home"
  }, _ctx.activeView === "home" ? {
    w: common_vendor.o(_ctx.toggleAmount, "7b"),
    x: common_vendor.o(($event) => _ctx.navigateToView("stats"), "67"),
    y: common_vendor.o(($event) => _ctx.switchTab("all"), "c2"),
    z: common_vendor.o(_ctx.openDetail, "e9"),
    A: common_vendor.o(_ctx.handleReminder, "19"),
    B: common_vendor.p({
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
    D: common_vendor.o(($event) => _ctx.searchKeyword = $event, "bd"),
    E: common_vendor.o(($event) => _ctx.searchKeyword = "", "a9"),
    F: common_vendor.o(($event) => _ctx.activeCategory = $event, "f3"),
    G: common_vendor.o(($event) => _ctx.activeStatus = $event, "0e"),
    H: common_vendor.o(_ctx.chooseSort, "04"),
    I: common_vendor.o(_ctx.openDetail, "d9"),
    J: common_vendor.o(_ctx.resetFilters, "d8"),
    K: common_vendor.o(_ctx.openForm, "88"),
    L: common_vendor.p({
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
    N: common_vendor.o(_ctx.changeMonth, "42"),
    O: common_vendor.o(_ctx.goToday, "db"),
    P: common_vendor.o(_ctx.selectDate, "8f"),
    Q: common_vendor.o(_ctx.openDetail, "82"),
    R: common_vendor.o(_ctx.openForm, "08"),
    S: common_vendor.p({
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
  } : _ctx.activeView === "stats" ? {
    U: common_vendor.o(($event) => _ctx.goBackView("home"), "7a"),
    V: common_vendor.o(($event) => _ctx.statsMode = $event, "57"),
    W: common_vendor.o(($event) => _ctx.historyMonth = $event, "d9"),
    X: common_vendor.o(_ctx.openDetail, "69"),
    Y: common_vendor.o(_ctx.refreshStats, "ec"),
    Z: common_vendor.o(_ctx.changeStatsCurrency, "42"),
    aa: common_vendor.o(($event) => _ctx.statsPeriod = $event, "8f"),
    ab: common_vendor.o(_ctx.openForm, "c0"),
    ac: common_vendor.p({
      mode: _ctx.statsMode,
      ["history-month"]: _ctx.historyMonth,
      ["history-revision"]: _ctx.subscriptions,
      loading: _ctx.statsLoading,
      ["loading-error"]: _ctx.statsErrorDescription,
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      currencies: _ctx.currencies,
      ["stats-currency"]: _ctx.statsCurrency,
      ["exchange-rate-note"]: _ctx.exchangeRateNote,
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
    ae: common_vendor.o(_ctx.openMembership, "8c"),
    af: common_vendor.o(_ctx.handleNotificationSwitch, "4e"),
    ag: common_vendor.o(_ctx.showNotificationHistory, "0c"),
    ah: common_vendor.o(_ctx.openReminderSettings, "f5"),
    ai: common_vendor.o(_ctx.updateDefaultCurrency, "82"),
    aj: common_vendor.o(_ctx.exportData, "52"),
    ak: common_vendor.o(_ctx.openTrash, "0a"),
    al: common_vendor.o(($event) => _ctx.navigateToView("about"), "35"),
    am: common_vendor.p({
      ["navigation-bar-height"]: _ctx.navigationBarHeight,
      ["live-subscriptions"]: _ctx.liveSubscriptions,
      ["monthly-average-text"]: _ctx.monthlyAverageText,
      settings: _ctx.settings,
      ["is-member"]: _ctx.isMember,
      ["free-quota-text"]: _ctx.freeQuotaText,
      ["membership-quota-percent"]: _ctx.membershipQuotaPercent,
      ["membership-entry-enabled"]: _ctx.membershipEntryEnabled,
      currencies: _ctx.currencies,
      ["deleted-subscriptions"]: _ctx.deletedSubscriptions,
      ["export-busy"]: _ctx.exportBusy,
      ["notification-ready"]: _ctx.notificationReady,
      ["notification-description"]: _ctx.notificationDescription,
      ["notification-busy"]: _ctx.notificationAuthorizing || _ctx.notificationLoading || _ctx.loading || _ctx.mutating
    })
  } : _ctx.activeView === "about" ? {
    ao: common_vendor.o(($event) => _ctx.goBackView("profile"), "25"),
    ap: common_vendor.o(_ctx.showPrivacy, "12")
  } : _ctx.activeView === "membership" && _ctx.membershipEntryEnabled ? {
    ar: common_vendor.o(_ctx.beginMembershipPurchase, "4d"),
    as: common_vendor.o(_ctx.payMembershipOrder, "ee"),
    at: common_vendor.o(_ctx.simulateMembershipPayment, "1a"),
    av: common_vendor.o(_ctx.refundMembershipOrder, "35"),
    aw: common_vendor.o(_ctx.loadMembershipOrders, "76"),
    ax: common_vendor.o(_ctx.selectMembershipOrder, "68"),
    ay: common_vendor.o(($event) => _ctx.goBackView("profile"), "31"),
    az: common_vendor.p({
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
    aB: common_vendor.o(($event) => _ctx.goBackView("all"), "8c"),
    aC: common_vendor.o(($event) => _ctx.openDetail({
      id: _ctx.selectedId
    }), "91"),
    aD: common_vendor.p({
      error: _ctx.detailError,
      ["scroll-offset"]: _ctx.uiScrollTop
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    aF: common_vendor.o(($event) => _ctx.goBackView("all"), "1a"),
    aG: common_vendor.o(_ctx.confirmRenewal, "33"),
    aH: common_vendor.o(_ctx.undoRenewal, "a1"),
    aI: common_vendor.o(_ctx.snoozeSubscription, "14"),
    aJ: common_vendor.o(_ctx.cancelSubscription, "8b"),
    aK: common_vendor.o(_ctx.showMoreActions, "dc"),
    aL: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "94"),
    aM: common_vendor.p({
      subscription: _ctx.selectedSubscription,
      ["scroll-offset"]: _ctx.uiScrollTop,
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
    aO: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "2a"),
    aP: common_vendor.o(_ctx.applyTemplate, "18"),
    aQ: common_vendor.o(($event) => _ctx.form.category = $event, "f2"),
    aR: common_vendor.o(($event) => _ctx.form.currency = $event, "3c"),
    aS: common_vendor.o(_ctx.changeCycle, "85"),
    aT: common_vendor.o(($event) => _ctx.form.payment = $event, "53"),
    aU: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "2b"),
    aV: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "4f"),
    aW: common_vendor.o(_ctx.setTrial, "b6"),
    aX: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "73"),
    aY: common_vendor.o(_ctx.toggleReminder, "71"),
    aZ: common_vendor.p({
      ["editing-id"]: _ctx.editingId,
      ["scroll-offset"]: _ctx.uiScrollTop,
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
    bb: common_vendor.o(($event) => _ctx.goBackView("profile"), "73"),
    bc: common_vendor.o(_ctx.toggleDefaultReminder, "e2"),
    bd: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "4e"),
    be: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    C: _ctx.activeView === "all",
    M: _ctx.activeView === "calendar",
    T: _ctx.activeView === "stats",
    ad: _ctx.activeView === "profile",
    an: _ctx.activeView === "about",
    aq: _ctx.activeView === "membership" && _ctx.membershipEntryEnabled,
    aA: _ctx.activeView === "detail" && (_ctx.detailLoading || _ctx.detailError || !_ctx.selectedSubscription),
    aE: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    aN: _ctx.activeView === "form",
    ba: _ctx.activeView === "reminder-settings"
  }) : {}, {
    bf: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    bg: _ctx.scrollTop,
    bh: _ctx.dataReady && _ctx.showTabBar && !_ctx.mutating,
    bi: _ctx.refreshing,
    bj: common_vendor.o((...args) => _ctx.refreshFromGesture && _ctx.refreshFromGesture(...args), "8b"),
    bk: common_vendor.o(($event) => _ctx.uiScrollTop = $event.detail.scrollTop, "56"),
    bl: _ctx.dataReady && _ctx.activeView === "form"
  }, _ctx.dataReady && _ctx.activeView === "form" ? {
    bm: common_vendor.o(($event) => _ctx.saveSubscription(), "87"),
    bn: common_vendor.p({
      ["editing-id"]: _ctx.editingId,
      busy: _ctx.mutating
    })
  } : {}, {
    bo: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    bp: common_vendor.o(_ctx.closeSortSheet, "b5"),
    bq: common_vendor.o(_ctx.selectSort, "b3"),
    br: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    bs: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    bt: common_vendor.o(_ctx.switchTab, "a2"),
    bv: common_vendor.o(($event) => _ctx.openForm(), "c9"),
    bw: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {}, {
    bx: !_ctx.showTabBar ? 1 : "",
    by: _ctx.reducedMotion ? 1 : "",
    bz: _ctx.statusBarHeight + "px",
    bA: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "6d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a355b6de"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
