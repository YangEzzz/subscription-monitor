"use strict";
const common_vendor = require("../../common/vendor.js");
const frameKeys = [
  "activeView",
  "viewStack",
  "selectedId",
  "editingId",
  "originalBillingDate",
  "form",
  "formBaseline",
  "formError",
  "scrollTop",
  "uiScrollTop"
];
const copy = (value) => JSON.parse(JSON.stringify(value));
const capture = (page) => Object.fromEntries(
  frameKeys.filter((key) => page[key] !== void 0).map((key) => [key, copy(page[key])])
);
const dirty = (frame) => frame.activeView === "form" && frame.formBaseline && JSON.stringify(frame.form) !== frame.formBaseline;
function createNativeNavigation(runtime) {
  let sharedState, root, visible, moving = false, pendingView, pendingToken, preloaded = false, preloadUnsupported = false, sequence = 0;
  const frames = /* @__PURE__ */ new Map(), pending = /* @__PURE__ */ new Map(), drafts = /* @__PURE__ */ new Map();
  const enabled = () => runtime.enabled();
  const draftKey = (page) => `${page.currentUserId || ""}:${page.editingId || "new"}`;
  const showError = () => runtime.toast("页面切换失败，请重试");
  return {
    state(factory, reactive = (value) => value) {
      if (!enabled())
        return factory();
      const initial = factory();
      const target = pending.get(pendingToken);
      sharedState || (sharedState = reactive(initial));
      const account = sharedState;
      const state = {};
      state.nativeFrameToken = pendingToken || "";
      for (const key of Object.keys(initial)) {
        if (frameKeys.includes(key))
          state[key] = copy(
            target && key in target ? target[key] : initial[key]
          );
        else
          Object.defineProperty(state, key, {
            enumerable: true,
            configurable: true,
            get: () => account[key],
            set: (value) => {
              account[key] = value;
            }
          });
      }
      return state;
    },
    enter(page, options = {}) {
      if (!enabled())
        return false;
      const frame = pending.get(options.navigationToken);
      pending.delete(options.navigationToken);
      if (pendingToken === options.navigationToken)
        pendingToken = void 0;
      frames.set(page, { value: frame || capture(page), hold: false });
      if (frame) {
        if (page.nativeFrameToken !== options.navigationToken)
          Object.assign(page, copy(frame));
        visible = page;
      }
      pendingView = void 0;
      root || (root = page);
      moving = false;
      return Boolean(frame);
    },
    show(page) {
      if (!enabled() || !frames.has(page))
        return;
      if (visible !== page)
        Object.assign(page, copy(frames.get(page).value));
      visible = page;
      moving = false;
      frames.get(page).alertEnabled = void 0;
      this.syncLeaveAlert(page);
      if (frames.get(page).ready)
        this.ready(page);
    },
    ready(page) {
      const frame = frames.get(page);
      if (!enabled() || !frame)
        return;
      frame.ready = true;
      if (visible !== page || moving || preloaded || preloadUnsupported || !runtime.preload)
        return;
      preloaded = true;
      try {
        runtime.preload({
          fail: (error) => {
            preloaded = false;
            if (/not support|unsupported/i.test((error == null ? void 0 : error.errMsg) || ""))
              preloadUnsupported = true;
          }
        });
      } catch {
        preloaded = false;
        preloadUnsupported = true;
      }
    },
    hide(page) {
      const frame = frames.get(page);
      if (!frame)
        return;
      if (frame.hold) {
        frame.hold = false;
        return;
      }
      frame.value = capture(page);
      if (dirty(frame.value))
        drafts.set(draftKey(page), copy(frame.value));
      else if (frame.value.activeView === "form")
        drafts.delete(draftKey(page));
    },
    leave(page) {
      var _a;
      if (visible === page && ((_a = frames.get(page)) == null ? void 0 : _a.value.activeView) === "detail")
        page.cancelDetailLoad();
      frames.delete(page);
      if (page === root) {
        frames.clear();
        sharedState = root = visible = void 0;
        pending.clear();
        pendingView = void 0;
        pendingToken = void 0;
        drafts.clear();
        moving = false;
        preloaded = false;
      }
    },
    push(page, view) {
      if (!enabled() || !frames.has(page))
        return false;
      if (moving)
        return true;
      if (runtime.pages().length >= 10) {
        runtime.toast("请先返回上一页再继续");
        return true;
      }
      const source = frames.get(page);
      source.value = capture(page);
      source.hold = true;
      if (page.activeView === "detail")
        page.cancelDetailLoad();
      page.viewStack.push(page.activeView);
      page.activeView = view;
      page.uiScrollTop = 0;
      page.scrollToTop();
      const token = String(++sequence);
      pending.set(token, capture(page));
      pendingToken = token;
      Object.assign(page, copy(source.value));
      pendingView = view;
      moving = true;
      preloaded = false;
      runtime.push({
        url: `/pages/subscription/${view === "form" ? "editor" : "index"}?navigationToken=${token}`,
        success: () => {
        },
        fail: () => {
          pending.delete(token);
          if (pendingToken === token)
            pendingToken = void 0;
          pendingView = void 0;
          moving = false;
          source.hold = false;
          Object.assign(page, copy(source.value));
          showError();
        }
      });
      return true;
    },
    back(page) {
      if (!enabled() || !frames.has(page) || runtime.pages().length < 2)
        return false;
      if (moving)
        return true;
      moving = true;
      runtime.alert(false);
      runtime.back({
        delta: 1,
        success: () => {
        },
        fail: () => {
          moving = false;
          frames.get(page).alertEnabled = void 0;
          this.syncLeaveAlert(page);
          showError();
        }
      });
      return true;
    },
    tab(page, tab) {
      if (!enabled() || !frames.has(page))
        return false;
      if (moving)
        return true;
      if (page.activeView === "detail")
        page.cancelDetailLoad();
      page.sortSheetVisible = false;
      page.viewStack = [];
      page.activeView = tab;
      page.scrollToTop();
      frames.get(root).value = capture(page);
      const delta = runtime.pages().length - 1;
      if (delta > 0) {
        moving = true;
        runtime.alert(false);
        runtime.back({
          delta,
          success: () => {
            moving = false;
          },
          fail: () => {
            moving = false;
            showError();
          }
        });
      }
      return true;
    },
    replace(page) {
      if (frames.has(page))
        frames.get(page).value = capture(page);
    },
    isDetached(page) {
      return enabled() && !frames.has(page);
    },
    isViewActive(page, view) {
      if (!enabled())
        return page.activeView === view;
      return (pendingView || (visible == null ? void 0 : visible.activeView)) === view;
    },
    restoreDraft(page) {
      if (!enabled())
        return;
      const frame = drafts.get(draftKey(page));
      if (frame) {
        for (const key of ["form", "formBaseline", "originalBillingDate"]) {
          if (key in frame)
            page[key] = copy(frame[key]);
        }
      }
    },
    clearDraft(page) {
      drafts.delete(draftKey(page));
    },
    clearDrafts() {
      drafts.clear();
    },
    syncLeaveAlert(page) {
      if (!enabled() || visible !== page)
        return;
      const frame = frames.get(page);
      if (!frame)
        return;
      const wantsAlert = Boolean(dirty(page));
      if (frame.alertEnabled === wantsAlert)
        return;
      frame.alertEnabled = wantsAlert;
      runtime.alert(wantsAlert);
    }
  };
}
const nativeNavigation = createNativeNavigation({
  enabled: () => {
    return typeof common_vendor.wx$1 !== "undefined" && typeof getCurrentPages === "function";
  },
  pages: () => getCurrentPages(),
  push: (options) => common_vendor.index.navigateTo(options),
  preload: (options) => {
    if (typeof common_vendor.wx$1 !== "undefined" && typeof common_vendor.wx$1.preloadWebview === "function")
      common_vendor.wx$1.preloadWebview(options);
    else
      options.fail({ errMsg: "unsupported" });
  },
  back: (options) => common_vendor.index.navigateBack(options),
  toast: (title) => common_vendor.index.showToast({ title, icon: "none" }),
  alert: (enabled) => {
    if (typeof common_vendor.wx$1 === "undefined")
      return;
    if (enabled && typeof common_vendor.wx$1.enableAlertBeforeUnload === "function")
      common_vendor.wx$1.enableAlertBeforeUnload({ message: "有未保存的修改，确定离开？" });
    if (!enabled && typeof common_vendor.wx$1.disableAlertBeforeUnload === "function")
      common_vendor.wx$1.disableAlertBeforeUnload();
  }
});
exports.nativeNavigation = nativeNavigation;
