import test from "node:test";
import assert from "node:assert/strict";
import { subscriptionApi } from "../api/subscriptions.js";
import {
  createSubscriptionPageState,
  subscriptionMethods,
  subscriptionComputed,
} from "../pages/subscription/subscription-page-logic.js";

function harness() {
  globalThis.uni = {
    getStorageSync: () => ({
      accessToken: "test",
      expiresAt: "2099-01-01",
      user: { id: "user-a" },
    }),
  };
  const page = {
    ...createSubscriptionPageState(),
    activeView: "all",
    dataReady: true,
    currentUserId: "user-a",
  };
  for (const [key, method] of Object.entries(subscriptionMethods))
    page[key] = method.bind(page);
  for (const [key, compute] of Object.entries(subscriptionComputed))
    Object.defineProperty(page, key, { get: compute.bind(page) });
  return page;
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};

test("detail navigation and skeleton state are immediate, even during a background refresh", async () => {
  const original = subscriptionApi.detail,
    request = deferred();
  subscriptionApi.detail = () => request.promise;
  try {
    const page = harness();
    page.loading = true;
    const pending = page.openDetail({ id: "a" });
    assert.equal(page.activeView, "detail");
    assert.equal(page.detailLoading, true);
    assert.equal(page.selectedId, "a");
    assert.deepEqual(page.viewStack, ["all"]);
    request.resolve({ id: "a", name: "loaded" });
    await pending;
    assert.equal(page.detailLoading, false);
    assert.equal(page.selectedSubscription.name, "loaded");
    assert.equal(page.loading, true); // Detail reads never own the global refresh flag.
  } finally {
    subscriptionApi.detail = original;
  }
});

test("returning during loading prevents a late response from reopening or populating detail", async () => {
  const original = subscriptionApi.detail,
    request = deferred();
  subscriptionApi.detail = () => request.promise;
  try {
    const page = harness(),
      pending = page.openDetail({ id: "a" });
    page.goBackView("all");
    assert.equal(page.activeView, "all");
    assert.equal(page.detailLoading, false);
    request.resolve({ id: "a" });
    await pending;
    assert.equal(page.activeView, "all");
    assert.equal(page.subscriptions.length, 0);
  } finally {
    subscriptionApi.detail = original;
  }
});

test("newest detail request wins and stale failures cannot clear its skeleton", async () => {
  const original = subscriptionApi.detail,
    a = deferred(),
    b = deferred();
  subscriptionApi.detail = (id) => (id === "a" ? a.promise : b.promise);
  try {
    const page = harness(),
      first = page.openDetail({ id: "a" }),
      second = page.openDetail({ id: "b" });
    a.reject(new Error("stale failure"));
    await first;
    assert.equal(page.detailError, "");
    assert.equal(page.detailLoading, true);
    b.resolve({ id: "b" });
    await second;
    assert.equal(page.selectedSubscription.id, "b");
    assert.equal(page.subscriptions.length, 1);
    assert.deepEqual(page.viewStack, ["all"]);
  } finally {
    subscriptionApi.detail = original;
  }
});

test("failed detail stays on page and retry succeeds without adding a return-stack entry", async () => {
  const original = subscriptionApi.detail;
  subscriptionApi.detail = async () => {
    throw new Error("offline");
  };
  try {
    const page = harness();
    await page.openDetail({ id: "a" });
    assert.equal(page.activeView, "detail");
    assert.equal(page.detailError, "offline");
    assert.equal(page.detailLoading, false);
    subscriptionApi.detail = async () => ({ id: "a", name: "retry loaded" });
    await page.openDetail({ id: page.selectedId });
    assert.equal(page.detailError, "");
    assert.equal(page.selectedSubscription.name, "retry loaded");
    assert.deepEqual(page.viewStack, ["all"]);
  } finally {
    subscriptionApi.detail = original;
  }
});

test("account clearing invalidates an outstanding detail request", async () => {
  const original = subscriptionApi.detail,
    request = deferred();
  subscriptionApi.detail = () => request.promise;
  try {
    const page = harness(),
      pending = page.openDetail({ id: "a" });
    page.clearAccountData();
    request.resolve({ id: "a", name: "old private data" });
    await pending;
    assert.equal(page.subscriptions.length, 0);
    assert.equal(page.selectedId, null);
    assert.equal(page.detailLoading, false);
    assert.equal(page.activeView, "home");
  } finally {
    subscriptionApi.detail = original;
  }
});

test("expired session failures show an error instead of cached detail", async () => {
  const original = subscriptionApi.detail,
    request = deferred();
  subscriptionApi.detail = () => request.promise;
  try {
    const page = harness(),
      pending = page.openDetail({ id: "a" });
    globalThis.uni.getStorageSync = () => null;
    request.reject(new Error("登录状态已失效"));
    await pending;
    assert.equal(page.detailError, "登录状态已失效");
    assert.equal(page.detailLoading, false);
  } finally {
    subscriptionApi.detail = original;
  }
});

test("leaving details aborts the native request rather than only ignoring its response", async () => {
  const original = subscriptionApi.detail,
    pendingRequest = deferred();
  let aborted = 0;
  subscriptionApi.detail = (_id, options) => {
    options.onTask({
      abort() {
        aborted++;
        pendingRequest.reject(new Error("aborted"));
      },
    });
    return pendingRequest.promise;
  };
  try {
    const page = harness(),
      pending = page.openDetail({ id: "a" });
    page.goBackView("all");
    await pending;
    assert.equal(aborted, 1);
    assert.equal(page.detailRequestCancel, null);
    assert.equal(page.detailError, "");
    assert.equal(page.activeView, "all");
  } finally {
    subscriptionApi.detail = original;
  }
});
