"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_subscription_nativeNavigation = require("./native-navigation.js");
const pages_subscription_subscriptionPageLogic = require("./subscription-page-logic.js");
const PageHeader = () => "../../components/subscription/PageHeader.js";
const SubscriptionFormView = () => "../../components/subscription/SubscriptionFormView.js";
const SubscriptionDetailView = () => "../../components/subscription/SubscriptionDetailView.js";
const SubscriptionDetailLoadState = () => "../../components/subscription/SubscriptionDetailLoadState.js";
const SubscriptionSaveBar = () => "../../components/subscription/SubscriptionSaveBar.js";
const AsyncStateView = () => "../../components/subscription/AsyncStateView.js";
const _sfc_main = {
  components: {
    PageHeader,
    SubscriptionFormView,
    SubscriptionDetailView,
    SubscriptionDetailLoadState,
    SubscriptionSaveBar,
    AsyncStateView
  },
  data() {
    const state = pages_subscription_nativeNavigation.nativeNavigation.state(
      () => ({
        ...pages_subscription_subscriptionPageLogic.createSubscriptionPageState(),
        reducedMotion: false,
        refreshing: false,
        uiScrollTop: 0
      }),
      common_vendor.reactive
    );
    state.editorContentReady = false;
    return state;
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
  methods: pages_subscription_subscriptionPageLogic.subscriptionMethods,
  onLoad(options) {
    if (!pages_subscription_nativeNavigation.nativeNavigation.enter(this, options)) {
      common_vendor.index.redirectTo({ url: "/pages/subscription/index" });
      return;
    }
    common_vendor.index.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] });
  },
  onShow() {
    pages_subscription_nativeNavigation.nativeNavigation.show(this);
  },
  onReady() {
    this.editorContentReady = true;
    pages_subscription_nativeNavigation.nativeNavigation.ready(this);
  },
  onHide() {
    pages_subscription_nativeNavigation.nativeNavigation.hide(this);
  },
  onUnload() {
    pages_subscription_nativeNavigation.nativeNavigation.leave(this);
  },
  onBackPress() {
    return pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onBackPress.call(this);
  },
  onShareAppMessage() {
    return pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onShareAppMessage();
  },
  onShareTimeline() {
    return pages_subscription_subscriptionPageLogic.subscriptionLifecycle.onShareTimeline();
  }
};
if (!Array) {
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  const _component_subscription_form_view = common_vendor.resolveComponent("subscription-form-view");
  const _component_subscription_detail_load_state = common_vendor.resolveComponent("subscription-detail-load-state");
  const _component_subscription_detail_view = common_vendor.resolveComponent("subscription-detail-view");
  const _component_subscription_save_bar = common_vendor.resolveComponent("subscription-save-bar");
  (_component_page_header + _component_async_state_view + _component_subscription_form_view + _component_subscription_detail_load_state + _component_subscription_detail_view + _component_subscription_save_bar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: _ctx.statusBarHeight + "px",
    b: common_vendor.o(($event) => _ctx.goBackView(_ctx.activeView === "form" ? _ctx.editingId ? "detail" : "home" : "all"), "7c"),
    c: common_vendor.p({
      title: _ctx.activeView === "form" ? _ctx.editingId ? "编辑订阅" : "新增订阅" : "订阅详情",
      secondary: true,
      pinned: true,
      scrolled: _ctx.uiScrollTop > 8
    }),
    d: _ctx.loadError
  }, _ctx.loadError ? {
    e: common_vendor.o(_ctx.refreshData, "a7"),
    f: common_vendor.p({
      compact: true,
      title: _ctx.loadErrorTitle,
      description: _ctx.loadErrorDescription,
      ["action-label"]: "重新加载",
      busy: _ctx.loading || _ctx.mutating
    })
  } : {}, {
    g: _ctx.editorContentReady && _ctx.dataReady
  }, _ctx.editorContentReady && _ctx.dataReady ? common_vendor.e({
    h: _ctx.activeView === "form"
  }, _ctx.activeView === "form" ? {
    i: common_vendor.o(($event) => _ctx.goBackView(_ctx.editingId ? "detail" : "home"), "eb"),
    j: common_vendor.o(_ctx.applyTemplate, "ef"),
    k: common_vendor.o(($event) => _ctx.form.category = $event, "57"),
    l: common_vendor.o(($event) => _ctx.form.currency = $event, "0a"),
    m: common_vendor.o(_ctx.changeCycle, "54"),
    n: common_vendor.o(($event) => _ctx.form.payment = $event, "2f"),
    o: common_vendor.o(($event) => _ctx.form.nextBillingDate = $event, "7d"),
    p: common_vendor.o(($event) => _ctx.form.autoRenew = $event, "6e"),
    q: common_vendor.o(_ctx.setTrial, "77"),
    r: common_vendor.o(($event) => _ctx.form.trialEndDate = $event, "ff"),
    s: common_vendor.o(_ctx.toggleReminder, "6d"),
    t: common_vendor.p({
      ["show-header"]: false,
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
  } : {}, {
    v: _ctx.activeView === "detail" && (_ctx.detailLoading || _ctx.detailError || !_ctx.selectedSubscription)
  }, _ctx.activeView === "detail" && (_ctx.detailLoading || _ctx.detailError || !_ctx.selectedSubscription) ? {
    w: common_vendor.o(($event) => _ctx.goBackView("all"), "50"),
    x: common_vendor.o(($event) => _ctx.openDetail({
      id: _ctx.selectedId
    }), "ce"),
    y: common_vendor.p({
      ["show-header"]: false,
      error: _ctx.detailError,
      ["scroll-offset"]: _ctx.uiScrollTop
    })
  } : _ctx.activeView === "detail" && _ctx.selectedSubscription ? {
    A: common_vendor.o(($event) => _ctx.goBackView("all"), "03"),
    B: common_vendor.o(_ctx.confirmRenewal, "4c"),
    C: common_vendor.o(_ctx.undoRenewal, "a6"),
    D: common_vendor.o(_ctx.snoozeSubscription, "58"),
    E: common_vendor.o(_ctx.cancelSubscription, "59"),
    F: common_vendor.o(_ctx.showMoreActions, "d7"),
    G: common_vendor.o(($event) => _ctx.openForm(null, _ctx.selectedSubscription), "63"),
    H: common_vendor.p({
      ["show-header"]: false,
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
  } : {}, {
    z: _ctx.activeView === "detail" && _ctx.selectedSubscription
  }) : {}, {
    I: _ctx.scrollTop,
    J: common_vendor.o(($event) => _ctx.uiScrollTop = $event.detail.scrollTop, "31"),
    K: _ctx.editorContentReady && _ctx.dataReady && _ctx.activeView === "form"
  }, _ctx.editorContentReady && _ctx.dataReady && _ctx.activeView === "form" ? {
    L: common_vendor.o(($event) => _ctx.saveSubscription(), "19"),
    M: common_vendor.p({
      ["editing-id"]: _ctx.editingId,
      busy: _ctx.mutating
    })
  } : {}, {
    N: _ctx.reducedMotion ? 1 : "",
    O: _ctx.statusBarHeight + "px",
    P: common_vendor.o((...args) => _ctx.handleKeyboardAction && _ctx.handleKeyboardAction(...args), "c2")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/editor.js.map
