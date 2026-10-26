import test from "node:test";
import assert from "node:assert/strict";
import { subscriptionApi } from "../api/subscriptions.js";
import {
  loadSpendingHistory,
  shiftMonth,
} from "../components/subscription/spending-history.js";

let user = "alice";
globalThis.uni = {
  getStorageSync: () => ({
    accessToken: "test",
    expiresAt: "2099-01-01",
    user: { id: user },
  }),
};
const view = () => ({
  month: "2026-10",
  currency: "CNY",
  loading: false,
  result: null,
  error: "",
  requestId: 0,
});
const response = (month, page = 1, hasMore = false) => ({
  month,
  entries: [{ id: month + page }],
  meta: { page, hasMore },
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};

test("history month switching handles year boundaries", () => {
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2025-12", 1), "2026-01");
});

test("newest month wins and a stale failure never hides the latest result", async () => {
  const original = subscriptionApi.history,
    first = deferred(),
    second = deferred();
  subscriptionApi.history = (month) =>
    month === "2026-10" ? first.promise : second.promise;
  try {
    const state = view(),
      a = loadSpendingHistory(state);
    state.month = "2026-09";
    const b = loadSpendingHistory(state);
    second.resolve(response("2026-09"));
    await b;
    first.reject(new Error("old failure"));
    await a;
    assert.equal(state.result.month, "2026-09");
    assert.equal(state.error, "");
    assert.equal(state.loading, false);
  } finally {
    subscriptionApi.history = original;
  }
});

test("pagination failure keeps entries, retries the same page, and prevents duplicate requests", async () => {
  const original = subscriptionApi.history;
  try {
    const state = view();
    state.result = response("2026-10", 1, true);
    subscriptionApi.history = async () => {
      throw new Error("offline");
    };
    await loadSpendingHistory(state, true);
    assert.equal(state.result.entries.length, 1);
    assert.equal(state.result.meta.page, 1);
    assert.equal(state.error, "offline");
    const pending = deferred();
    let calls = 0;
    subscriptionApi.history = (month, currency, page) => {
      assert.equal(page, 2);
      calls++;
      return pending.promise;
    };
    const a = loadSpendingHistory(state, true),
      b = loadSpendingHistory(state, true);
    pending.resolve(response("2026-10", 2));
    await Promise.all([a, b]);
    assert.equal(calls, 1);
    assert.equal(state.result.entries.length, 2);
    assert.equal(state.error, "");
  } finally {
    subscriptionApi.history = original;
  }
});

test("late responses cannot populate an unmounted history view or a different account", async () => {
  const original = subscriptionApi.history;
  try {
    for (const change of [
      (state) => {
        state.requestId++;
      },
      () => {
        user = "bob";
      },
    ]) {
      user = "alice";
      const state = view(),
        pending = deferred();
      subscriptionApi.history = () => pending.promise;
      const load = loadSpendingHistory(state);
      change(state);
      pending.resolve(response("2026-10"));
      await load;
      assert.equal(state.result, null);
    }
  } finally {
    user = "alice";
    subscriptionApi.history = original;
  }
});
