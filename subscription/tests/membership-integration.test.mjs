import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.NODE_ENV = "test";
process.env.PERSISTENCE_DRIVER = "memory";
process.env.WECHAT_APP_ID = "membership-integration-app";
process.env.WECHAT_APP_SECRET = "test-provider-secret";
process.env.AUTH_TOKEN_SECRET = "membership-test-secret-with-at-least-32-bytes";
process.env.MEMBERSHIP_SIMULATION_ENABLED = "true";
process.env.NOTIFICATION_SCHEDULER_ENABLED = "false";
process.env.LOCAL_ADMIN_ENABLED = "false";
const require = createRequire(
  new URL("../../backend/package.json", import.meta.url),
);
require("reflect-metadata");
const { NestFactory } = require("@nestjs/core");
const { ValidationPipe, VersioningType } = require("@nestjs/common");
const { ConfigService } = require("@nestjs/config");
const { AppModule } = require("./dist/app.module.js");
const validationOptions = require("./dist/utils/validation-options.js").default;

test("simulated orders enforce HTTP authentication, DTOs, entitlement and the server switch", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) =>
    String(url).startsWith("https://api.weixin.qq.com/")
      ? new Response(
          JSON.stringify({ openid: new URL(url).searchParams.get("js_code") }),
          { status: 200 },
        )
      : originalFetch(url, options);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  await app.listen(0, "127.0.0.1");
  const base = `${await app.getUrl()}/api/v1`;
  const call = (path, token, data) =>
    fetch(base + path, {
      method: data ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  try {
    assert.equal((await call("/membership/orders")).status, 401);
    const login = async (code) =>
      (await (await call("/auth/wechat", null, { code })).json()).accessToken;
    const alice = await login("alice");
    const bob = await login("bob");
    assert.equal(
      (
        await call("/membership/orders", alice, {
          productId: "forged-product",
          requestId: "valid_request_123456",
          amount: 1,
        })
      ).status,
      422,
    );
    const order = await (
      await call("/membership/orders", alice, {
        productId: "lifetime",
        requestId: "valid_request_123456",
        amount: 1,
      })
    ).json();
    assert.equal(order.amount, 2990);
    assert.equal(order.channel, "simulation");
    assert.equal(
      (await call(`/membership/orders/${order.id}`, bob)).status,
      404,
    );
    assert.equal(
      (
        await call(`/membership/orders/${order.id}/simulate`, bob, {
          outcome: "success",
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await call(`/membership/orders/${order.id}/simulate`, alice, {
          outcome: "forged",
        })
      ).status,
      422,
    );
    assert.equal(
      (
        await call(`/membership/orders/${order.id}/simulate`, alice, {
          outcome: "success",
        })
      ).status,
      201,
    );
    const paid = await (
      await call(`/membership/orders/${order.id}`, alice)
    ).json();
    assert.equal(paid.status, "paid");
    const membership = await (await call("/membership", alice)).json();
    assert.equal(membership.status, "active");
    assert.equal(membership.source, "simulation");
    assert.equal(membership.lifetime, true);
    assert.equal(membership.quota.limit, null);
    // Same WeChat identity logging in again reads the same durable repository state.
    const again = await login("alice");
    assert.equal(
      (await (await call("/membership", again)).json()).status,
      "active",
    );
    assert.equal(
      (
        await call("/membership/orders", alice, {
          productId: "lifetime",
          requestId: "another_request_123456",
        })
      ).status,
      409,
    );
    assert.equal(
      (await call(`/membership/orders/${order.id}/simulate-refund`, bob, {}))
        .status,
      404,
    );
    assert.equal(
      (await call(`/membership/orders/${order.id}/simulate-refund`, alice, {}))
        .status,
      201,
    );
    assert.equal(
      (await call(`/membership/orders/${order.id}/simulate-refund`, alice, {}))
        .status,
      201,
    );
    const refundedMembership = await (await call("/membership", alice)).json();
    assert.equal(refundedMembership.status, "free");
    assert.equal(refundedMembership.quota.limit, 5);
    app.get(ConfigService).set("app.membershipSimulationEnabled", false);
    assert.equal(
      (
        await call("/membership/orders", bob, {
          productId: "lifetime",
          requestId: "bob_request_123456",
        })
      ).status,
      403,
    );
    assert.equal(
      (await call(`/membership/orders/${order.id}`, alice)).status,
      200,
    );
  } finally {
    await app.close();
    globalThis.fetch = originalFetch;
  }
});
