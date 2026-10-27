import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
process.env.NODE_ENV = "test";
process.env.PERSISTENCE_DRIVER = "memory";
process.env.WECHAT_APP_ID = "wx-history-test";
process.env.WECHAT_APP_SECRET = "history-test-only";
process.env.AUTH_TOKEN_SECRET = "history-test-session-secret-at-least-32-bytes";
process.env.WECHAT_PAY_ENABLED = "false";
process.env.WECHAT_VIRTUAL_PAY_ENABLED = "false";
const require = createRequire(
  new URL("../../backend/package.json", import.meta.url),
);
require("reflect-metadata");
const { NestFactory } = require("@nestjs/core");
const { ValidationPipe, VersioningType } = require("@nestjs/common");
const { AppModule } = require("./dist/app.module.js");
const validation = require("./dist/utils/validation-options.js").default;

test("authenticated history HTTP endpoint validates queries, preserves snapshots and isolates accounts", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, options) =>
    String(url).startsWith("https://api.weixin.qq.com")
      ? Promise.resolve(
          new Response(
            JSON.stringify({
              openid: new URL(String(url)).searchParams.get("js_code"),
              session_key: "test-only",
            }),
          ),
        )
      : originalFetch(url, options);
  let app;
  try {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validation));
    await app.listen(0, "127.0.0.1");
    const base = (await app.getUrl()) + "/api/v1";
    const login = async (code) =>
      (
        await (
          await originalFetch(base + "/auth/wechat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          })
        ).json()
      ).accessToken;
    const alice = await login("history-alice"),
      bob = await login("history-bob");
    const call = async (path, method = "GET", data, token = alice) =>
      originalFetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
    const created = await (
      await call("/subscriptions", "POST", {
        name: "历史测试",
        amount: 15,
        currency: "CNY",
        cycle: "monthly",
        nextBillingDate: "2026-01-31",
        category: "music",
        payment: "card",
      })
    ).json();
    assert.ok(created.id);
    assert.equal(
      (
        await call("/subscriptions/" + created.id + "/renew", "POST", {
          billingDate: "2026-01-31",
        })
      ).status,
      201,
    );
    await call("/subscriptions/" + created.id, "PATCH", {
      amount: 99,
      status: "cancelled",
    });
    await call("/subscriptions/" + created.id, "DELETE");
    const history = await (
      await call("/dashboard/history?month=2026-01&currency=CNY")
    ).json();
    assert.equal(history.total, 15);
    assert.equal(history.count, 1);
    assert.equal(history.entries[0].deleted, true);
    assert.equal(
      (await call("/subscriptions/" + created.id + "/restore", "POST")).status,
      201,
    );
    const restored = await (
      await call("/dashboard/history?month=2026-01&currency=CNY")
    ).json();
    assert.deepEqual(restored, {
      ...history,
      entries: history.entries.map((entry) => ({ ...entry, deleted: false })),
    });
    assert.equal(
      (await call("/subscriptions/" + created.id, "DELETE")).status,
      200,
    );
    assert.deepEqual(
      await (
        await call("/dashboard/history?month=2026-01&currency=CNY")
      ).json(),
      history,
    );
    const other = await (
      await call("/dashboard/history?month=2026-01", "GET", undefined, bob)
    ).json();
    assert.equal(other.count, 0);
    assert.equal(
      (await call("/dashboard/history", "GET", undefined, "")).status,
      401,
    );
    for (const query of [
      "month=2026-13",
      "month=bad",
      "page=0",
      "currency=123",
      "month=2026-01&month=2026-02",
    ])
      assert.equal((await call("/dashboard/history?" + query)).status, 422);
  } finally {
    if (app) await app.close();
    globalThis.fetch = originalFetch;
  }
});
