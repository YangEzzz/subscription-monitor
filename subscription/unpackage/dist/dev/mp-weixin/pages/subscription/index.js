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
    i: _ctx.activeView === "stats" && _ctx.statsError
  }, _ctx.activeView === "stats" && _ctx.statsError ? {
    j: common_vendor.o(($event) => _ctx.goBackView("home"), "3d"),
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
    o: common_vendor.o(_ctx.refreshData, "ca"),
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
    r: common_vendor.o(_ctx.refreshStats, "d3"),
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
    v: common_vendor.o(_ctx.refreshData, "8b"),
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
    y: common_vendor.o(($event) => _ctx.goBackView("home"), "05"),
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
    E: common_vendor.o(_ctx.toggleAmount, "c6"),
    F: common_vendor.o(($event) => _ctx.navigateToView("stats"), "0b"),
    G: common_vendor.o(($event) => _ctx.switchTab("all"), "c7"),
    H: common_vendor.o(_ctx.openDetail, "d8"),
    I: common_vendor.o(_ctx.handleReminder, "b4"),
    J: common_vendor.p({
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
    L: common_vendor.o(($event) => _ctx.searchKeyword = $event, "e5"),
    M: common_vendor.o(($event) => _ctx.searchKeyword = "", "29"),
    N: common_vendor.o(($event) => _ctx.activeCategory = $event, "95"),
    O: common_vendor.o(($event) => _ctx.activeStatus = $event, "35"),
    P: common_vendor.o(_ctx.chooseSort, "ca"),
    Q: common_vendor.o(_ctx.openDetail, "d2"),
    R: common_vendor.o(_ctx.resetFilters, "af"),
    S: common_vendor.o(_ctx.openForm, "cd"),
    T: common_vendor.p({
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
    V: common_vendor.o(_ctx.changeMonth, "2b"),
    W: common_vendor.o(_ctx.goToday, "52"),
    X: common_vendor.o(_ctx.selectDate, "1d"),
    Y: common_vendor.o(_ctx.openDetail, "32"),
    Z: common_vendor.o(_ctx.openForm, "2d"),
    aa: common_vendor.p({
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
    ac: common_vendor.o(($event) => _ctx.goBackView("home"), "da"),
    ad: common_vendor.o(_ctx.changeStatsCurrency, "12"),
    ae: common_vendor.o(($event) => _ctx.statsPeriod = $event, "41"),
    af: common_vendor.o(_ctx.openForm, "0a"),
    ag: common_vendor.p({
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
    ai: common_vendor.o(_ctx.openMembership, "1d"),
    aj: common_vendor.o(_ctx.handleNotificationSwitch, "2b"),
    ak: common_vendor.o(_ctx.showNotificationHistory, "84"),
    al: common_vendor.o(_ctx.openReminderSettings, "9b"),
    am: common_vendor.o(_ctx.updateDefaultCurrency, "d1"),
    an: common_vendor.o(_ctx.exportData, "ea"),
    ao: common_vendor.o(_ctx.openTrash, "19"),
    ap: common_vendor.o(($event) => _ctx.navigateToView("about"), "6b"),
    aq: common_vendor.p({
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
    as: common_vendor.o(($event) => _ctx.goBackView("profile"), "97"),
    at: common_vendor.o(_ctx.showPrivacy, "de")
  } : _ctx.activeView === "membership" && _ctx.membershipEntryEnabled ? {
    aw: common_vendor.o(_ctx.beginMembershipPurchase, "b9"),
    ax: common_vendor.o(_ctx.payMembershipOrder, "bb"),
    ay: common_vendor.o(_ctx.simulateMembershipPayment, "88"),
    az: common_vendor.o(_ctx.refundMembershipOrder, "ba"),
    aA: common_vendor.o(_ctx.loadMembershipOrders, "77"),
    aB: common_vendor.o(_ctx.selectMembershipOrder, "14"),
    aC: common_vendor.o(($event) => _ctx.goBackView("profile"), "7a"),
    aD: common_vendor.p({
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
    aF: common_vendor.o(($event) => _ctx.goBackView("all"), "78"),
    aG: common_vendor.o(($event) => _ctx.openDetail({
      id: _ctx.selectedId
    }), "1d"),
    aH: common_vendor.p({
      error: _ctx.detailError,
      ["scroll-offset"]: _ctx.uiScrollTop
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    aJ: common_vendor.o(($event) => _ctx.goBackView("all"), "0d"),
    aK: common_vendor.o(_ctx.confirmRenewal, "93"),
    aL: common_vendor.o(_ctx.undoRenewal, "15"),
    aM: common_vendor.o(_ctx.snoozeSubscription, "ef"),
    aN: common_vendor.o(_ctx.cancelSubscription, "86"),
    aO: common_vendor.o(_ctx.showMoreActions, "e6"),
    aP: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "51"),
    aQ: common_vendor.p({
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
    aS: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "e9"),
    aT: common_vendor.o(_ctx.applyTemplate, "3b"),
    aU: common_vendor.o(($event) => _ctx.form.category = $event, "62"),
    aV: common_vendor.o(($event) => _ctx.form.currency = $event, "81"),
    aW: common_vendor.o(_ctx.changeCycle, "94"),
    aX: common_vendor.o(($event) => _ctx.form.payment = $event, "2c"),
    aY: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "b1"),
    aZ: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "b1"),
    ba: common_vendor.o(_ctx.setTrial, "2a"),
    bb: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "01"),
    bc: common_vendor.o(_ctx.toggleReminder, "0f"),
    bd: common_vendor.p({
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
    bf: common_vendor.o(($event) => _ctx.goBackView("profile"), "4e"),
    bg: common_vendor.o(_ctx.toggleDefaultReminder, "e7"),
    bh: common_vendor.o(($event) => _ctx.updateSetting($event.key, $event.value), "50"),
    bi: common_vendor.p({
      ["reminder-options"]: _ctx.reminderOptions,
      settings: _ctx.settings
    })
  } : {}, {
    K: _ctx.activeView === "all",
    U: _ctx.activeView === "calendar",
    ab: _ctx.activeView === "stats" && !_ctx.statsLoading && !_ctx.statsError,
    ah: _ctx.activeView === "profile",
    ar: _ctx.activeView === "about",
    av: _ctx.activeView === "membership" && _ctx.membershipEntryEnabled,
    aE: _ctx.activeView === "detail" && (_ctx.detailLoading || _ctx.detailError || !_ctx.selectedSubscription),
    aI: _ctx.activeView === "detail" && _ctx.selectedSubscription,
    aR: _ctx.activeView === "form",
    be: _ctx.activeView === "reminder-settings"
  }) : {}, {
    bj: `calc(100vh - ${_ctx.statusBarHeight}px)`,
    bk: _ctx.scrollTop,
    bl: _ctx.dataReady && _ctx.showTabBar && !_ctx.mutating,
    bm: _ctx.refreshing,
    bn: common_vendor.o((...args) => _ctx.refreshFromGesture && _ctx.refreshFromGesture(...args), "8b"),
    bo: common_vendor.o(($event) => _ctx.uiScrollTop = $event.detail.scrollTop, "56"),
    bp: _ctx.dataReady && _ctx.activeView === "form"
  }, _ctx.dataReady && _ctx.activeView === "form" ? {
    bq: common_vendor.o(($event) => _ctx.saveSubscription(), "30"),
    br: common_vendor.p({
      ["editing-id"]: _ctx.editingId,
      busy: _ctx.mutating
    })
  } : {}, {
    bs: _ctx.sortSheetVisible
  }, _ctx.sortSheetVisible ? {
    bt: common_vendor.o(_ctx.closeSortSheet, "69"),
    bv: common_vendor.o(_ctx.selectSort, "4f"),
    bw: common_vendor.p({
      ["sort-options"]: _ctx.sortOptions,
      ["sort-mode"]: _ctx.sortMode
    })
  } : {}, {
    bx: _ctx.showTabBar && _ctx.dataReady
  }, _ctx.showTabBar && _ctx.dataReady ? {
    by: common_vendor.o(_ctx.switchTab, "25"),
    bz: common_vendor.o(($event) => _ctx.openForm(), "4c"),
    bA: common_vendor.p({
      tabs: _ctx.tabs,
      ["active-view"]: _ctx.activeView
    })
  } : {}, {
    bB: !_ctx.showTabBar ? 1 : "",
    bC: _ctx.reducedMotion ? 1 : "",
    bD: _ctx.statusBarHeight + "px",
    bE: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "6d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-384a1add"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
