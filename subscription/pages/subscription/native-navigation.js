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
  "uiScrollTop",
];
const copy = (value) => JSON.parse(JSON.stringify(value));
const capture = (page) =>
  Object.fromEntries(
    frameKeys
      .filter((key) => page[key] !== undefined)
      .map((key) => [key, copy(page[key])]),
  );
const dirty = (frame) =>
  frame.activeView === "form" &&
  frame.formBaseline &&
  JSON.stringify(frame.form) !== frame.formBaseline;

// Each native page renders the same shell and reads the same account data.
// Only navigation/form frames are restored when WeChat reveals a previous page.
export function createNativeNavigation(runtime) {
  let sharedState,
    root,
    visible,
    moving = false,
    pendingView,
    pendingToken,
    preloaded = false,
    preloadUnsupported = false,
    sequence = 0;
  const frames = new Map(),
    pending = new Map(),
    drafts = new Map();
  const enabled = () => runtime.enabled();
  const draftKey = (page) =>
    `${page.currentUserId || ""}:${page.editingId || "new"}`;
  const showError = () => runtime.toast("页面切换失败，请重试");
  return {
    state(factory, reactive = (value) => value) {
      if (!enabled()) return factory();
      const initial = factory();
      const target = pending.get(pendingToken);
      sharedState ||= reactive(initial);
      const account = sharedState;
      const state = {};
      state.nativeFrameToken = pendingToken || "";
      for (const key of Object.keys(initial)) {
        if (frameKeys.includes(key))
          state[key] = copy(
            target && key in target ? target[key] : initial[key],
          );
        else
          Object.defineProperty(state, key, {
            enumerable: true,
            configurable: true,
            get: () => account[key],
            set: (value) => {
              account[key] = value;
            },
          });
      }
      return state;
    },
    enter(page, options = {}) {
      if (!enabled()) return false;
      const frame = pending.get(options.navigationToken);
      pending.delete(options.navigationToken);
      if (pendingToken === options.navigationToken) pendingToken = undefined;
      frames.set(page, { value: frame || capture(page), hold: false });
      if (frame) {
        if (page.nativeFrameToken !== options.navigationToken)
          Object.assign(page, copy(frame));
        visible = page;
      }
      pendingView = undefined;
      root ||= page;
      moving = false;
      return Boolean(frame);
    },
    show(page) {
      if (!enabled() || !frames.has(page)) return;
      if (visible !== page) Object.assign(page, copy(frames.get(page).value));
      visible = page;
      moving = false;
      frames.get(page).alertEnabled = undefined;
      this.syncLeaveAlert(page);
      if (frames.get(page).ready) this.ready(page);
    },
    ready(page) {
      const frame = frames.get(page);
      if (!enabled() || !frame) return;
      frame.ready = true;
      if (
        visible !== page ||
        moving ||
        preloaded ||
        preloadUnsupported ||
        !runtime.preload
      )
        return;
      preloaded = true;
      try {
        runtime.preload({
          fail: (error) => {
            preloaded = false;
            if (/not support|unsupported/i.test(error?.errMsg || ""))
              preloadUnsupported = true;
          },
        });
      } catch {
        preloaded = false;
        preloadUnsupported = true;
      }
    },
    hide(page) {
      const frame = frames.get(page);
      if (!frame) return;
      if (frame.hold) {
        frame.hold = false;
        return;
      }
      frame.value = capture(page);
      if (dirty(frame.value)) drafts.set(draftKey(page), copy(frame.value));
      else if (frame.value.activeView === "form") drafts.delete(draftKey(page));
    },
    leave(page) {
      if (visible === page && frames.get(page)?.value.activeView === "detail")
        page.cancelDetailLoad();
      frames.delete(page);
      if (page === root) {
        frames.clear();
        sharedState = root = visible = undefined;
        pending.clear();
        pendingView = undefined;
        pendingToken = undefined;
        drafts.clear();
        moving = false;
        preloaded = false;
      }
    },
    push(page, view) {
      if (!enabled() || !frames.has(page)) return false;
      if (moving) return true;
      if (runtime.pages().length >= 10) {
        runtime.toast("请先返回上一页再继续");
        return true;
      }
      const source = frames.get(page);
      source.value = capture(page);
      source.hold = true;
      if (page.activeView === "detail") page.cancelDetailLoad();
      page.viewStack.push(page.activeView);
      page.activeView = view;
      page.uiScrollTop = 0;
      page.scrollToTop();
      const token = String(++sequence);
      pending.set(token, capture(page));
      pendingToken = token;
      // Keep the covered page on its original view during native swipe animation.
      Object.assign(page, copy(source.value));
      pendingView = view;
      moving = true;
      preloaded = false;
      runtime.push({
        url: `/pages/subscription/${view === "form" ? "editor" : "index"}?navigationToken=${token}`,
        success: () => {},
        fail: () => {
          pending.delete(token);
          if (pendingToken === token) pendingToken = undefined;
          pendingView = undefined;
          moving = false;
          source.hold = false;
          Object.assign(page, copy(source.value));
          showError();
        },
      });
      return true;
    },
    back(page) {
      if (!enabled() || !frames.has(page) || runtime.pages().length < 2)
        return false;
      if (moving) return true;
      moving = true;
      runtime.alert(false);
      runtime.back({
        delta: 1,
        success: () => {},
        fail: () => {
          moving = false;
          frames.get(page).alertEnabled = undefined;
          this.syncLeaveAlert(page);
          showError();
        },
      });
      return true;
    },
    tab(page, tab) {
      if (!enabled() || !frames.has(page)) return false;
      if (moving) return true;
      if (page.activeView === "detail") page.cancelDetailLoad();
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
          },
        });
      }
      return true;
    },
    replace(page) {
      if (frames.has(page)) frames.get(page).value = capture(page);
    },
    isDetached(page) {
      return enabled() && !frames.has(page);
    },
    isViewActive(page, view) {
      if (!enabled()) return page.activeView === view;
      return (pendingView || visible?.activeView) === view;
    },
    restoreDraft(page) {
      if (!enabled()) return;
      const frame = drafts.get(draftKey(page));
      if (frame) {
        for (const key of ["form", "formBaseline", "originalBillingDate"]) {
          if (key in frame) page[key] = copy(frame[key]);
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
      if (!enabled() || visible !== page) return;
      const frame = frames.get(page);
      if (!frame) return;
      const wantsAlert = Boolean(dirty(page));
      if (frame.alertEnabled === wantsAlert) return;
      frame.alertEnabled = wantsAlert;
      runtime.alert(wantsAlert);
    },
  };
}

export const nativeNavigation = createNativeNavigation({
  enabled: () => {
    // #ifdef MP-WEIXIN
    return typeof wx !== "undefined" && typeof getCurrentPages === "function";
    // #endif
    // #ifndef MP-WEIXIN
    return false;
    // #endif
  },
  pages: () => getCurrentPages(),
  push: (options) => uni.navigateTo(options),
  preload: (options) => {
    if (typeof wx !== "undefined" && typeof wx.preloadWebview === "function")
      wx.preloadWebview(options);
    else options.fail({ errMsg: "unsupported" });
  },
  back: (options) => uni.navigateBack(options),
  toast: (title) => uni.showToast({ title, icon: "none" }),
  alert: (enabled) => {
    if (typeof wx === "undefined") return;
    if (enabled && typeof wx.enableAlertBeforeUnload === "function")
      wx.enableAlertBeforeUnload({ message: "有未保存的修改，确定离开？" });
    if (!enabled && typeof wx.disableAlertBeforeUnload === "function")
      wx.disableAlertBeforeUnload();
  },
});
