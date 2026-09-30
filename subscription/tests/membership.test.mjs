import test from "node:test";
import assert from "node:assert/strict";
import { membershipMethods } from "../pages/subscription/membership-remote.js";
import { createSubscriptionPageState } from "../pages/subscription/subscription-page-logic.js";

const user = "membership-test-user";
const membership = {
  status: "free",
  product: { available: true, amount: 2990 },
  quota: { limit: 5, remaining: 1, used: 4 },
};
function harness(handler) {
  globalThis.uni = {
    getStorageSync: () => ({
      accessToken: "test-token",
      expiresAt: "2099-01-01T00:00:00Z",
      user: { id: user },
    }),
    request: handler,
  };
  const page = {
    ...createSubscriptionPageState(),
    currentUserId: user,
    dataReady: true,
    isMember: false,
  };
  page.settings.membership = structuredClone(membership);
  page.applyMembership = (value) => {
    page.settings.membership = value;
    page.isMember = value.status === "active";
  };
  page.clearAccountData = () => {
    page.membershipRequestId++;
    page.membershipOrder = null;
    page.currentUserId = "";
  };
  for (const [key, method] of Object.entries(membershipMethods))
    page[key] = method.bind(page);
  return page;
}
const ok = (options, data) => options.success({ statusCode: 200, data });

test("purchase has no client price, blocks duplicate submits and waits for server entitlement", async () => {
  let creates = 0,
    resolveCreate;
  const page = harness((options) => {
    if (options.method === "POST") {
      creates++;
      assert.equal(options.data.productId, "lifetime");
      assert.equal(options.data.amount, undefined);
      resolveCreate = () =>
        ok(options, { id: "order", status: "pending", amount: 2990 });
    } else ok(options, membership);
  });
  const pending = page.beginMembershipPurchase();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await page.beginMembershipPurchase();
  assert.equal(creates, 1);
  resolveCreate();
  await pending;
  assert.equal(page.isMember, false);
  assert.equal(page.membershipOrder.status, "pending");
});

test("successful simulation uses backend membership response rather than optimistic client activation", async () => {
  const page = harness((options) =>
    options.method === "POST"
      ? ok(options, { id: "order", status: "paid" })
      : ok(options, {
          ...membership,
          status: "active",
          source: "simulation",
          quota: { limit: null, used: 4, remaining: null },
        }),
  );
  page.membershipOrder = { id: "order", status: "pending" };
  await page.simulateMembershipPayment("success");
  assert.equal(page.isMember, true);
  assert.match(page.membershipMessage, /未发生实际扣款/);
});

test("uncertain payment is not retried and query refresh recovers state", async () => {
  let writes = 0;
  const page = harness((options) => {
    if (options.method === "POST") {
      writes++;
      options.fail({ errMsg: "request:fail timeout" });
    } else if (options.url.endsWith("/orders"))
      ok(options, { items: [{ id: "order", status: "paid" }] });
    else ok(options, { ...membership, status: "active" });
  });
  page.membershipOrder = { id: "order", status: "pending" };
  await page.simulateMembershipPayment("success");
  assert.equal(writes, 1);
  assert.equal(page.isMember, false);
  assert.match(page.membershipError, /尚未确认/);
  await page.loadMembershipOrders();
  assert.equal(page.membershipOrder.status, "paid");
  assert.equal(page.isMember, true);
});

test("an account switch ignores a late purchase response", async () => {
  let response;
  const page = harness((options) => {
    response = () => ok(options, { id: "old-account-order", status: "paid" });
  });
  const pending = page.beginMembershipPurchase();
  await new Promise((resolve) => setTimeout(resolve, 0));
  page.clearAccountData();
  response();
  await pending;
  assert.equal(page.membershipOrder, null);
  assert.equal(page.isMember, false);
});
