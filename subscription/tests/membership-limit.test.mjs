import test from "node:test";
import assert from "node:assert/strict";
import {
  createSubscriptionPageState,
  subscriptionMethods,
  subscriptionComputed,
} from "../pages/subscription/subscription-page-logic.js";
import { subscriptionApi } from "../api/subscriptions.js";
import { ApiError } from "../api/request.js";

function harness(used = 10) {
  globalThis.uni = {
    getStorageSync: () => ({
      accessToken: "test",
      expiresAt: "2099-01-01",
      user: { id: "test-user" },
    }),
    showModal: () =>
      assert.fail("quota should open a recommendation page directly"),
    showToast() {},
    showLoading() {},
    hideLoading() {},
  };
  const page = {
    ...createSubscriptionPageState(),
    dataReady: true,
    currentUserId: "test-user",
    activeView: "all",
    reads: 0,
  };
  for (const [key, value] of Object.entries(subscriptionMethods))
    page[key] = value.bind(page);
  for (const [key, value] of Object.entries(subscriptionComputed))
    Object.defineProperty(page, key, { get: value.bind(page) });
  page.applyMembership({
    status: "free",
    quota: { limit: 10, used, remaining: Math.max(0, 10 - used) },
  });
  page.loadMembershipOrders = async () => {
    page.reads++;
  };
  return page;
}
const activate = (page) =>
  page.applyMembership({
    status: "active",
    quota: { limit: null, used: 10, remaining: null },
  });

test("the tenth subscription opens the normal form; the eleventh opens quota recommendations without a modal or write", () => {
  const tenth = harness(9);
  tenth.openForm();
  assert.equal(tenth.activeView, "form");
  assert.equal(tenth.reads, 0);
  const eleventh = harness(10);
  eleventh.openForm("2026-12-01");
  assert.equal(eleventh.activeView, "membership");
  assert.equal(eleventh.membershipEntryReason, "quota");
  assert.deepEqual(eleventh.viewStack, ["all"]);
  assert.equal(eleventh.reads, 1);
  assert.deepEqual(eleventh.membershipIntent, {
    kind: "new",
    date: "2026-12-01",
    initialValues: null,
  });
  eleventh.goBackView("all");
  assert.equal(eleventh.activeView, "all");
});

test("only confirmed quota/entitlement allows resuming; the original date and copied fields are retained", () => {
  const page = harness();
  page.openForm("2026-12-01", null, {
    name: "复制的订阅",
    amount: "29",
    reminders: [7, 1],
  });
  page.resumeMembershipCreation();
  assert.equal(page.activeView, "membership");
  activate(page);
  page.resumeMembershipCreation();
  assert.equal(page.activeView, "form");
  assert.equal(page.form.nextBillingDate, "2026-12-01");
  assert.equal(page.form.name, "复制的订阅");
  assert.deepEqual(page.form.reminders, [7, 1]);
  assert.equal(page.membershipIntent, null);
});

test("quota reached at save preserves the draft on recommendation back and after upgrade", async () => {
  const page = harness();
  page.activeView = "form";
  page.form = {
    name: "未保存内容",
    amount: "88",
    note: "保留草稿",
    reminders: [1],
  };
  page.formBaseline = "{}";
  const draft = structuredClone(page.form);
  await page.saveSubscription();
  assert.equal(page.activeView, "membership");
  assert.equal(page.membershipIntent.kind, "draft");
  page.goBackView("all");
  assert.equal(page.activeView, "form");
  assert.deepEqual(page.form, draft);
  page.showMembershipLimit();
  activate(page);
  page.resumeMembershipCreation();
  assert.equal(page.activeView, "form");
  assert.deepEqual(page.form, draft);
  assert.equal(page.formBaseline, "{}");
});

test("server quota rejection after stale client precheck enters the same recommendation once and never retries the write", async () => {
  const original = subscriptionApi.create;
  let writes = 0;
  subscriptionApi.create = async () => {
    writes++;
    throw new ApiError("免费订阅额度已用完", {
      code: "SUBSCRIPTION_LIMIT_REACHED",
      status: 403,
    });
  };
  try {
    const page = harness(9);
    page.openForm();
    page.form.name = "第十一个订阅";
    page.form.amount = "11";
    const draft = structuredClone(page.form);
    await page.saveSubscription();
    assert.equal(writes, 1);
    assert.equal(page.activeView, "membership");
    assert.equal(page.membershipEntryReason, "quota");
    assert.equal(page.mutating, false);
    assert.equal(page.reads, 1);
    assert.deepEqual(page.form, draft);
  } finally {
    subscriptionApi.create = original;
  }
});

test("released quota can resume without payment; normal membership entry resets quota context", () => {
  const page = harness();
  page.openForm();
  page.applyMembership({
    status: "free",
    quota: { limit: 10, used: 9, remaining: 1 },
  });
  page.resumeMembershipCreation();
  assert.equal(page.activeView, "form");
  page.openMembership();
  assert.equal(page.membershipEntryReason, "general");
  assert.equal(page.membershipIntent, null);
});

test("editing at the limit remains available and copying uses the same quota entry", async () => {
  const page = harness();
  const item = { id: "original", name: "音乐会员", amount: 12, reminders: [1] };
  page.subscriptions = [item];
  page.selectedId = item.id;
  page.activeView = "detail";
  page.openForm(null, item);
  assert.equal(page.activeView, "form");
  assert.equal(page.editingId, "original");
  page.activeView = "detail";
  await page.handleSubscriptionAction("copy");
  assert.equal(page.activeView, "membership");
  assert.equal(page.membershipIntent.kind, "new");
  assert.match(page.membershipIntent.initialValues.name, /副本/);
});
