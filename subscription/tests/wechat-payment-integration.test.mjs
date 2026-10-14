import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createCipheriv, generateKeyPairSync, sign } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

test("ordinary payment HTTP flow authenticates users and verifies raw encrypted notifications", async () => {
  const folder = mkdtempSync(join(tmpdir(), "subscription-pay-http-"));
  const merchant = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const platform = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const apiV3Key = "01234567890123456789012345678901";
  writeFileSync(
    join(folder, "merchant.pem"),
    merchant.privateKey.export({ type: "pkcs8", format: "pem" }),
  );
  writeFileSync(
    join(folder, "platform.pem"),
    platform.publicKey.export({ type: "spki", format: "pem" }),
  );
  Object.assign(process.env, {
    NODE_ENV: "test",
    PERSISTENCE_DRIVER: "memory",
    WECHAT_APP_ID: "payment-test-app",
    WECHAT_APP_SECRET: "test-secret",
    AUTH_TOKEN_SECRET: "payment-test-secret-at-least-32-bytes",
    LOCAL_ADMIN_ENABLED: "false",
    NOTIFICATION_SCHEDULER_ENABLED: "false",
    MEMBERSHIP_SIMULATION_ENABLED: "false",
    WECHAT_PAY_ENABLED: "true",
    WECHAT_PAY_MCH_ID: "123",
    WECHAT_PAY_SERIAL_NO: "test-merchant-serial",
    WECHAT_PAY_PRIVATE_KEY_PATH: join(folder, "merchant.pem"),
    WECHAT_PAY_API_V3_KEY: apiV3Key,
    WECHAT_PAY_PUBLIC_KEY_ID: "PUB_KEY_ID_test",
    WECHAT_PAY_PUBLIC_KEY_PATH: join(folder, "platform.pem"),
    WECHAT_PAY_NOTIFY_URL:
      "https://example.com/api/v1/membership/wechat/notify",
  });
  const headersFor = (body) => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = "test-platform-nonce";
    return {
      "Content-Type": "application/json",
      "Wechatpay-Timestamp": timestamp,
      "Wechatpay-Nonce": nonce,
      "Wechatpay-Serial": "PUB_KEY_ID_test",
      "Wechatpay-Signature": sign(
        "RSA-SHA256",
        Buffer.from(`${timestamp}\n${nonce}\n${body}\n`),
        platform.privateKey,
      ).toString("base64"),
    };
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith("https://api.weixin.qq.com/"))
      return new Response(
        JSON.stringify({ openid: new URL(url).searchParams.get("js_code") }),
        { status: 200 },
      );
    if (String(url).startsWith("https://api.mch.weixin.qq.com/")) {
      if (options.method === "GET") {
        const body = JSON.stringify({ code: "ORDER_NOT_EXIST" });
        return new Response(body, { status: 404, headers: headersFor(body) });
      }
      const payload = JSON.parse(options.body);
      assert.deepEqual(payload.amount, { total: 2990, currency: "CNY" });
      assert.equal(payload.payer.openid, "alice");
      const body = JSON.stringify({ prepay_id: "wx-test-prepay" });
      return new Response(body, { status: 200, headers: headersFor(body) });
    }
    return originalFetch(url, options);
  };
  let app;
  try {
    const require = createRequire(
      new URL("../../backend/package.json", import.meta.url),
    );
    require("reflect-metadata");
    const { NestFactory } = require("@nestjs/core");
    const { ValidationPipe, VersioningType } = require("@nestjs/common");
    const { AppModule } = require("./dist/app.module.js");
    app = await NestFactory.create(AppModule, { logger: false, rawBody: true });
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe(require("./dist/utils/validation-options.js").default),
    );
    await app.listen(0, "127.0.0.1");
    const base = `${await app.getUrl()}/api/v1`;
    const call = (path, token, data) =>
      fetch(base + path, {
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
    const login = async (code) =>
      (await (await call("/auth/wechat", null, { code })).json()).accessToken;
    const alice = await login("alice");
    const bob = await login("bob");
    const order = await (
      await call("/membership/orders", alice, {
        productId: "lifetime",
        requestId: "request_123456789",
        amount: 1,
      })
    ).json();
    assert.equal(order.channel, "wechat");
    assert.equal(order.amount, 2990);
    assert.equal(
      (await call(`/membership/orders/${order.id}/pay`, null, {})).status,
      401,
    );
    assert.equal(
      (await call(`/membership/orders/${order.id}/pay`, bob, {})).status,
      404,
    );
    const cashierResponse = await call(
      `/membership/orders/${order.id}/pay`,
      alice,
      {},
    );
    assert.equal(cashierResponse.status, 201);
    const cashier = await cashierResponse.json();
    assert.equal(cashier.payment.package, "prepay_id=wx-test-prepay");
    assert.equal(
      (await (await call("/membership", alice)).json()).status,
      "free",
    );

    const transaction = {
      appid: "payment-test-app",
      mchid: "123",
      out_trade_no: order.id,
      transaction_id: "420000000123",
      trade_state: "SUCCESS",
      success_time: new Date().toISOString(),
      payer: { openid: "alice" },
      amount: { total: 2990, currency: "CNY" },
    };
    const notify = async (tx, tamper = false) => {
      const nonce = "123456789012";
      const cipher = createCipheriv(
        "aes-256-gcm",
        Buffer.from(apiV3Key),
        Buffer.from(nonce),
      );
      cipher.setAAD(Buffer.from("transaction"));
      const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(tx)),
        cipher.final(),
        cipher.getAuthTag(),
      ]).toString("base64");
      const body = JSON.stringify(
        {
          event_type: "TRANSACTION.SUCCESS",
          resource: {
            original_type: "transaction",
            algorithm: "AEAD_AES_256_GCM",
            nonce,
            associated_data: "transaction",
            ciphertext,
          },
        },
        null,
        2,
      );
      return fetch(base + "/membership/wechat/notify", {
        method: "POST",
        headers: headersFor(body),
        body: tamper ? body + " " : body,
      });
    };
    assert.equal((await notify(transaction, true)).status, 400);
    assert.equal(
      (await notify({ ...transaction, amount: { total: 1, currency: "CNY" } }))
        .status,
      409,
    );
    assert.equal(
      (await (await call("/membership", alice)).json()).status,
      "free",
    );
    assert.equal((await notify(transaction)).status, 204);
    assert.equal((await notify(transaction)).status, 204);
    const membership = await (await call("/membership", alice)).json();
    assert.equal(membership.status, "active");
    assert.equal(membership.source, "wechat");
    const paid = await (
      await call(`/membership/orders/${order.id}`, alice)
    ).json();
    assert.equal(paid.transactionId, transaction.transaction_id);
    const retry = await (
      await call(`/membership/orders/${order.id}/pay`, alice, {})
    ).json();
    assert.equal(retry.payment, null);
    assert.equal(
      (await call(`/membership/orders/${order.id}/simulate-refund`, alice, {}))
        .status,
      403,
    );
  } finally {
    if (app) await app.close();
    globalThis.fetch = originalFetch;
    if (!resolve(folder).startsWith(resolve(tmpdir()) + sep))
      throw new Error("Unexpected fixture path");
    rmSync(folder, { recursive: true });
  }
});
