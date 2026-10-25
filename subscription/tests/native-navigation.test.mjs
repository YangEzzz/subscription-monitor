import test from "node:test";
import assert from "node:assert/strict";
import {
  createNativeNavigation,
  nativeNavigation,
} from "../pages/subscription/native-navigation.js";
import {
  createSubscriptionPageState,
  subscriptionMethods,
  subscriptionComputed,
} from "../pages/subscription/subscription-page-logic.js";
import { subscriptionApi } from "../api/subscriptions.js";

function harness(extraRuntime = {}) {
  const stack = [],
    alerts = [],
    messages = [];
  let request;
  const bridge = createNativeNavigation({
    enabled: () => true,
    pages: () => stack,
    push: (options) => {
      request = options;
    },
    back: (options) => {
      pop(options.delta);
      options.success();
    },
    alert: (value) => alerts.push(value),
    toast: (value) => messages.push(value),
    ...extraRuntime,
  });
  const factory = () => ({
    activeView: "all",
    viewStack: [],
    selectedId: null,
    editingId: null,
    originalBillingDate: null,
    form: {},
    formBaseline: "",
    formError: "",
    subscriptions: [],
    currentUserId: "user-a",
    sortSheetVisible: false,
    searchKeyword: "保留搜索",
  });
  function page() {
    const data = bridge.state(factory),
      scope = {};
    for (const key of Object.keys(data))
      Object.defineProperty(scope, key, {
        get: () => data[key],
        set: (value) => {
          data[key] = value;
        },
      });
    scope.scrollToTop = () => {};
    scope.cancelDetailLoad = () => {};
    return scope;
  }
  const root = page();
  stack.push(root);
  assert.equal(bridge.enter(root), false);
  bridge.show(root);
  function completePush() {
    const source = stack.at(-1);
    bridge.hide(source);
    const target = page();
    const initialForm = target.form;
    stack.push(target);
    const navigationToken = new URL(
      request.url,
      "https://local",
    ).searchParams.get("navigationToken");
    assert.equal(bridge.enter(target, { navigationToken }), true);
    assert.equal(
      target.form,
      initialForm,
      "onLoad must not replace an already initialized form",
    );
    bridge.show(target);
    request.success();
    return target;
  }
  function pop(delta = 1) {
    bridge.hide(stack.at(-1));
    while (delta--) bridge.leave(stack.pop());
    bridge.show(stack.at(-1));
  }
  return {
    bridge,
    root,
    stack,
    alerts,
    messages,
    completePush,
    pop,
    request: () => request,
  };
}

test("internal pages create native history and system back restores the previous view", () => {
  const h = harness();
  h.root.selectedId = "subscription-a";
  assert.equal(h.bridge.push(h.root, "detail"), true);
  assert.match(h.request().url, /navigationToken=/);
  assert.equal(
    h.root.activeView,
    "all",
    "the covered native page keeps its own view",
  );
  assert.equal(h.bridge.isViewActive(h.root, "detail"), true);
  const detail = h.completePush();
  assert.equal(detail.activeView, "detail");
  assert.equal(detail.selectedId, "subscription-a");
  assert.deepEqual(detail.viewStack, ["all"]);
  // A pending API operation can finish on the original instance after navigation.
  h.root.subscriptions = [{ id: "subscription-a", amount: 12 }];
  assert.deepEqual(detail.subscriptions, h.root.subscriptions);
  h.pop();
  assert.equal(h.root.activeView, "all");
  assert.equal(h.bridge.isDetached(detail), true);
  assert.equal(h.bridge.isDetached(h.root), false);
  assert.equal(h.root.searchKeyword, "保留搜索");
  assert.equal(h.stack.length, 1);
  assert.equal(h.bridge.back(h.root), false);
});

test("a native form starts with its destination frame before onLoad, without rendering the homepage", () => {
  const h = harness();
  h.root.form = { name: "待新增", amount: "12" };
  h.root.formBaseline = JSON.stringify(h.root.form);
  h.bridge.push(h.root, "form");
  assert.equal(
    new URL(h.request().url, "https://local").pathname,
    "/pages/subscription/editor",
  );
  const firstRender = h.bridge.state(() => ({
    activeView: "home",
    viewStack: [],
    form: {},
    formBaseline: "",
    selectedId: null,
  }));
  assert.equal(firstRender.activeView, "form");
  assert.equal(firstRender.form.name, "待新增");
  assert.deepEqual(firstRender.viewStack, ["all"]);
  assert.equal(h.root.activeView, "all");
  assert.equal(h.completePush().form.amount, "12");
});

test("nested native back restores detail selection and retains data changes", () => {
  const h = harness();
  h.root.selectedId = "subscription-a";
  h.bridge.push(h.root, "detail");
  const detail = h.completePush();
  h.bridge.push(detail, "form");
  const form = h.completePush();
  form.selectedId = "subscription-b";
  assert.equal(detail.selectedId, "subscription-a");
  form.subscriptions = [{ id: "subscription-a", amount: 25 }];
  h.pop();
  assert.equal(detail.activeView, "detail");
  assert.equal(detail.selectedId, "subscription-a");
  assert.equal(detail.subscriptions[0].amount, 25);
  h.pop();
  assert.equal(h.root.activeView, "all");
});

test("system back retains an unsaved draft, while explicit discard removes it", () => {
  const h = harness();
  h.root.form = { name: "原始名称", amount: "10" };
  h.root.formBaseline = JSON.stringify(h.root.form);
  h.bridge.push(h.root, "form");
  const form = h.completePush();
  form.form = { name: "尚未保存", amount: "20" };
  h.bridge.syncLeaveAlert(form);
  assert.equal(h.alerts.at(-1), true);
  h.pop();
  h.bridge.restoreDraft(h.root);
  assert.equal(h.root.form.name, "尚未保存");
  assert.notEqual(JSON.stringify(h.root.form), h.root.formBaseline);
  h.bridge.clearDraft(h.root);
  h.root.form = { name: "新建" };
  h.bridge.restoreDraft(h.root);
  assert.equal(h.root.form.name, "新建");
});

test("background hide/show keeps current edits and draft recovery is account scoped", () => {
  const h = harness();
  h.root.form = { name: "草稿" };
  h.root.formBaseline = JSON.stringify({ name: "" });
  h.bridge.push(h.root, "form");
  const form = h.completePush();
  h.bridge.hide(form);
  form.form.name = "后台期间更新";
  h.bridge.show(form);
  assert.equal(form.form.name, "后台期间更新");
  h.pop();
  h.root.currentUserId = "user-b";
  h.root.form = { name: "新账号" };
  h.bridge.restoreDraft(h.root);
  assert.equal(h.root.form.name, "新账号");
});

test("switching tabs from a subpage collapses native history to the root", () => {
  const h = harness();
  h.bridge.push(h.root, "detail");
  const detail = h.completePush();
  h.bridge.push(detail, "form");
  const form = h.completePush();
  assert.equal(h.bridge.tab(form, "profile"), true);
  assert.equal(h.stack.length, 1);
  assert.equal(h.root.activeView, "profile");
  assert.deepEqual(h.root.viewStack, []);
});

test("failed native navigation rolls back and duplicate taps never push twice", () => {
  const h = harness();
  h.bridge.push(h.root, "detail");
  const request = h.request();
  h.bridge.push(h.root, "form");
  assert.equal(h.request(), request);
  request.fail();
  assert.equal(h.root.activeView, "all");
  assert.deepEqual(h.root.viewStack, []);
  assert.equal(h.messages.length, 1);
  h.bridge.push(h.root, "about");
  assert.equal(h.completePush().activeView, "about");
});

test("saving a new subscription can replace the current native view without another push", () => {
  const h = harness();
  h.bridge.push(h.root, "form");
  const form = h.completePush();
  form.activeView = "detail";
  form.selectedId = "new-subscription";
  h.bridge.replace(form);
  h.bridge.hide(form);
  h.bridge.show(form);
  assert.equal(form.activeView, "detail");
  assert.equal(h.stack.length, 2);
  h.bridge.back(form);
  assert.equal(h.root.activeView, "all");
});

test("unsupported platforms keep their independent existing page state", () => {
  const bridge = createNativeNavigation({ enabled: () => false });
  assert.notEqual(
    bridge.state(() => ({})),
    bridge.state(() => ({})),
  );
  assert.equal(bridge.enter({}), false);
  assert.equal(bridge.push({}, "about"), false);
  assert.equal(bridge.back({}), false);
  assert.equal(bridge.tab({}, "home"), false);
});

test("WebView warming runs after page readiness, once per available next view", () => {
  let warmed = 0;
  const h = harness({
    preload() {
      warmed++;
    },
  });
  assert.equal(warmed, 0);
  h.bridge.ready(h.root);
  h.bridge.ready(h.root);
  assert.equal(warmed, 1);
  h.bridge.push(h.root, "form");
  const form = h.completePush();
  h.bridge.ready(form);
  assert.equal(warmed, 2);
  h.pop();
  assert.equal(h.root.activeView, "all");
  assert.equal(warmed, 2);
});

test("unsupported WebView warming never blocks navigation or repeatedly calls the API", () => {
  let attempts = 0;
  const h = harness({
    preload(options) {
      attempts++;
      options.fail({ errMsg: "preloadWebview:fail not support" });
    },
  });
  h.bridge.ready(h.root);
  h.bridge.ready(h.root);
  h.bridge.push(h.root, "form");
  const form = h.completePush();
  h.bridge.ready(form);
  assert.equal(attempts, 1);
  assert.equal(form.activeView, "form");
  assert.deepEqual(h.messages, []);
});

test("a failed optional WebView warmer leaves the editor usable", () => {
  const h = harness({
    preload() {
      throw new Error("unavailable");
    },
  });
  h.bridge.ready(h.root);
  h.bridge.push(h.root, "form");
  assert.equal(h.completePush().activeView, "form");
});

test("real detail and edit methods use native pages while retaining live account data", async () => {
  const previous = {
    wx: globalThis.wx,
    uni: globalThis.uni,
    getCurrentPages: globalThis.getCurrentPages,
    detail: subscriptionApi.detail,
    update: subscriptionApi.update,
  };
  const stack = [];
  let pending, finishDetail, root;
  globalThis.wx = {};
  globalThis.getCurrentPages = () => stack;
  globalThis.uni = {
    getStorageSync: () => ({
      accessToken: "native-test-token",
      expiresAt: "2099-01-01",
      user: { id: "user-a" },
    }),
    showToast() {},
    navigateTo: (options) => {
      pending = options;
    },
    navigateBack(options) {
      pop(options.delta);
      options.success();
    },
  };
  function page() {
    const data = nativeNavigation.state(createSubscriptionPageState),
      scope = {};
    for (const key of Object.keys(data))
      Object.defineProperty(scope, key, {
        get: () => data[key],
        set: (value) => {
          data[key] = value;
        },
      });
    for (const [key, method] of Object.entries(subscriptionMethods))
      scope[key] = method.bind(scope);
    for (const [key, compute] of Object.entries(subscriptionComputed))
      Object.defineProperty(scope, key, { get: compute.bind(scope) });
    scope.refreshData = async () => true;
    return scope;
  }
  function push() {
    nativeNavigation.hide(stack.at(-1));
    const target = page();
    stack.push(target);
    nativeNavigation.enter(target, {
      navigationToken: new URL(pending.url, "https://local").searchParams.get(
        "navigationToken",
      ),
    });
    nativeNavigation.show(target);
    pending.success();
    return target;
  }
  function pop(delta) {
    nativeNavigation.hide(stack.at(-1));
    while (delta--) nativeNavigation.leave(stack.pop());
    nativeNavigation.show(stack.at(-1));
  }
  try {
    root = page();
    stack.push(root);
    nativeNavigation.enter(root);
    nativeNavigation.show(root);
    root.dataReady = true;
    root.currentUserId = "user-a";
    root.switchTab("all");
    const record = {
      ...root.createEmptyForm(),
      id: "native-record",
      name: "原生导航订阅",
      amount: 10,
    };
    subscriptionApi.detail = () =>
      new Promise((resolve) => {
        finishDetail = resolve;
      });
    const load = root.openDetail({ id: record.id });
    assert.equal(root.activeView, "all");
    const detail = push();
    finishDetail(record);
    await load;
    assert.equal(detail.selectedSubscription.amount, 10);
    assert.equal(detail.detailLoading, false);
    detail.openForm(null, detail.selectedSubscription);
    const form = push();
    assert.equal(detail.activeView, "detail");
    assert.equal(form.editingId, record.id);
    form.form.amount = "25";
    subscriptionApi.update = async (id, payload) => {
      assert.equal(id, record.id);
      assert.equal(payload.amount, 25);
      return { ...record, amount: 25 };
    };
    await form.saveSubscription();
    assert.equal(
      stack.length,
      2,
      "editing must not leave a second detail page",
    );
    assert.equal(detail.activeView, "detail");
    assert.equal(detail.selectedSubscription.amount, 25);
    pop(1);
    assert.equal(root.activeView, "all");
    root.openForm(null, { ...record, amount: 25 });
    const leavingForm = push();
    leavingForm.form.amount = "30";
    let finishUpdate;
    subscriptionApi.update = () =>
      new Promise((resolve) => {
        finishUpdate = resolve;
      });
    const saving = leavingForm.saveSubscription();
    await new Promise(setImmediate);
    pop(1);
    finishUpdate({ ...record, amount: 30 });
    await saving;
    assert.equal(
      root.activeView,
      "all",
      "late save must not reopen a page after system back",
    );
    nativeNavigation.restoreDraft(root);
    assert.equal(
      root.form.amount,
      "25",
      "a saved draft must not be restored again",
    );
  } finally {
    if (root) nativeNavigation.leave(root);
    subscriptionApi.detail = previous.detail;
    subscriptionApi.update = previous.update;
    for (const key of ["wx", "uni", "getCurrentPages"]) {
      if (previous[key] === undefined) delete globalThis[key];
      else globalThis[key] = previous[key];
    }
  }
});
