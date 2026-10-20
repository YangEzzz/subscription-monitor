import test from "node:test";
import assert from "node:assert/strict";
import { request } from "../api/request.js";

const session = {
  accessToken: "test-token",
  expiresAt: "2099-01-01",
  user: { id: "test-user" },
};

test("WeChat requests opt into HTTP/2 without changing data or credentials", async () => {
  let sent;
  globalThis.uni = {
    getStorageSync: () => session,
    request(options) {
      sent = options;
      options.success({ statusCode: 200, data: { ok: true } });
    },
  };
  assert.deepEqual(await request("/subscriptions/example"), { ok: true });
  assert.equal(sent.enableHttp2, true);
  assert.equal(sent.header.Authorization, "Bearer test-token");
});

test("cancellation during session resolution prevents sending a network request", async () => {
  let cancelled = false,
    sends = 0;
  globalThis.uni = {
    getStorageSync: () => session,
    request() {
      sends++;
    },
  };
  const pending = request("/subscriptions/example", {
    isCancelled: () => cancelled,
  });
  cancelled = true;
  await assert.rejects(pending, (error) => error.code === "REQUEST_CANCELLED");
  assert.equal(sends, 0);
});

test("native request task can be aborted without reporting a network failure", async () => {
  let abort,
    cancelled = false;
  globalThis.uni = {
    getStorageSync: () => session,
    request(options) {
      return {
        abort() {
          options.fail({ errMsg: "request:fail abort" });
        },
      };
    },
  };
  const pending = request("/subscriptions/example", {
    isCancelled: () => cancelled,
    onTask: (task) => (abort = () => task.abort()),
  });
  await Promise.resolve();
  assert.equal(typeof abort, "function");
  cancelled = true;
  abort();
  await assert.rejects(
    pending,
    (error) => error.code === "REQUEST_CANCELLED" && error.uncertain === false,
  );
});
