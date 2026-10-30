import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createCipheriv, createHash, createHmac } from "node:crypto";

test("virtual payment HTTP: fresh login, fixed product, encrypted XML/JSON, duplicates, refund and fallback", async () => {
  const appId = "virtual-http-app",
    notifyToken = "test-notify-token",
    key = Buffer.alloc(32, 7),
    appKey = "test-live-key";
  Object.assign(process.env, {
    NODE_ENV: "test",
    PERSISTENCE_DRIVER: "memory",
    WECHAT_APP_ID: appId,
    WECHAT_APP_SECRET: "test-secret",
    AUTH_TOKEN_SECRET: "test-auth-secret-at-least-thirty-two-bytes",
    LOCAL_ADMIN_ENABLED: "false",
    NOTIFICATION_SCHEDULER_ENABLED: "false",
    MEMBERSHIP_SIMULATION_ENABLED: "false",
    WECHAT_PAY_ENABLED: "false",
    WECHAT_VIRTUAL_PAY_ENABLED: "true",
    WECHAT_VIRTUAL_PAY_OFFER_ID: "1450679545",
    WECHAT_VIRTUAL_PAY_APP_KEY: appKey,
    WECHAT_VIRTUAL_PAY_PRODUCT_ID: "lifetime_member",
    WECHAT_VIRTUAL_PAY_NOTIFY_TOKEN: notifyToken,
    WECHAT_VIRTUAL_PAY_ENCODING_AES_KEY: key.toString("base64").slice(0, 43),
    WECHAT_VIRTUAL_PAY_IOS_ENABLED: "false",
  });
  const originalFetch = globalThis.fetch;
  let platformOrder = null,
    deliveryCalls = 0;
  globalThis.fetch = async (url, options) => {
    const address = new URL(String(url));
    if (address.hostname !== "api.weixin.qq.com")
      return originalFetch(url, options);
    if (address.pathname.endsWith("jscode2session"))
      return new Response(
        JSON.stringify({
          openid: address.searchParams.get("js_code"),
          session_key: "session-key",
        }),
      );
    if (address.pathname.endsWith("stable_token"))
      return new Response('{"access_token":"token","expires_in":7200}');
    if (address.pathname === "/xpay/query_order") {
      const body = JSON.parse(options.body);
      assert.equal(body.env, 0);
      assert.equal(
        address.searchParams.get("pay_sig"),
        createHmac("sha256", appKey)
          .update(address.pathname + "&" + options.body)
          .digest("hex"),
      );
      return new Response(JSON.stringify({ errcode: 0, order: platformOrder }));
    }
    assert.equal(address.pathname, "/xpay/notify_provide_goods");
    assert.equal(
      address.searchParams.get("pay_sig"),
      createHmac("sha256", appKey)
        .update(address.pathname + "&" + options.body)
        .digest("hex"),
    );
    deliveryCalls++;
    return new Response('{"errcode":0}');
  };
  let app;
  try {
    const require = createRequire(
      new URL("../../backend/package.json", import.meta.url),
    );
    require("reflect-metadata");
    const { NestFactory } = require("@nestjs/core");
    const { ValidationPipe, VersioningType } = require("@nestjs/common");
    app = await NestFactory.create(require("./dist/app.module.js").AppModule, {
      logger: false,
      rawBody: true,
    });
    app.useBodyParser("text", {
      type: ["application/xml", "text/xml"],
      limit: "100kb",
    });
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe(require("./dist/utils/validation-options.js").default),
    );
    await app.listen(0, "127.0.0.1");
  const { SUBSCRIPTIONS_REPOSITORY } = require('./dist/subscriptions/repositories/subscriptions.repository.js');
  const policyRepo = app.get(SUBSCRIPTIONS_REPOSITORY);
  await policyRepo.saveRuntimePolicy({...await policyRepo.getRuntimePolicy(), membershipEnabled:true});

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
    const alice = await login("alice"),
      bob = await login("bob");
    const order = await (
      await call("/membership/orders", alice, {
        productId: "lifetime",
        requestId: "request_123456789",
        amount: 1,
      })
    ).json();
    assert.equal(order.amount, 990);
    assert.equal(order.channel, "virtual");
    assert.equal(
      (await call(`/membership/orders/${order.id}/pay`, null, {})).status,
      401,
    );
    assert.equal(
      (await call(`/membership/orders/${order.id}/pay`, bob, {})).status,
      404,
    );
    const pay = await (
      await call(`/membership/orders/${order.id}/pay`, alice, {})
    ).json();
    const signed = JSON.parse(pay.payment.signData);
    assert.equal(signed.productId, "lifetime_member");
    assert.equal(signed.goodsPrice, 990);
    assert.equal(signed.env, 0);
    assert.equal(
      pay.payment.signature,
      createHmac("sha256", "session-key")
        .update(pay.payment.signData)
        .digest("hex"),
    );
    assert.equal(
      (await (await call("/membership", alice)).json()).status,
      "free",
    );
    const sendEvent = async (message, xml = false, tamper = false) => {
      const bytes = Buffer.from(message),
        length = Buffer.alloc(4);
      length.writeUInt32BE(bytes.length);
      const plain = Buffer.concat([
          Buffer.alloc(16, 3),
          length,
          bytes,
          Buffer.from(appId),
        ]),
        padding = 32 - (plain.length % 32);
      const cipher = createCipheriv("aes-256-cbc", key, key.subarray(0, 16));
      cipher.setAutoPadding(false);
      const Encrypt = Buffer.concat([
        cipher.update(Buffer.concat([plain, Buffer.alloc(padding, padding)])),
        cipher.final(),
      ]).toString("base64");
      const timestamp = String(Math.floor(Date.now() / 1000)),
        nonce = "fixture";
      const signature = createHash("sha1")
        .update([notifyToken, timestamp, nonce, Encrypt].sort().join(""))
        .digest("hex");
      return fetch(
        `${base}/membership/virtual/notify?timestamp=${timestamp}&nonce=${nonce}&msg_signature=${tamper ? "0".repeat(40) : signature}`,
        {
          method: "POST",
          headers: {
            "Content-Type": xml ? "application/xml" : "application/json",
          },
          body: xml
            ? `<xml><Encrypt>${Encrypt}</Encrypt></xml>`
            : JSON.stringify({ Encrypt }),
        },
      );
    };
    const delivery = `<xml><MsgType>event</MsgType><Event>xpay_goods_deliver_notify</Event><OpenId>alice</OpenId><OutTradeNo>${order.id}</OutTradeNo><Env>0</Env><GoodsInfo><ProductId>lifetime_member</ProductId><Quantity>1</Quantity><OrigPrice>990</OrigPrice></GoodsInfo><WeChatPayInfo><MchOrderNo>wx-order-1</MchOrderNo><PaidTime>${Math.floor(Date.now() / 1000)}</PaidTime></WeChatPayInfo></xml>`;
    assert.equal((await sendEvent(delivery, true, true)).status, 400);
    assert.equal((await sendEvent(delivery, true)).status, 200);
    assert.equal((await sendEvent(delivery, true)).status, 200);
    assert.equal(
      (await (await call("/membership", alice)).json()).status,
      "active",
    );
    const refund = JSON.stringify({
      MsgType: "event",
      Event: "xpay_refund_notify",
      OpenId: "alice",
      MchOrderId: order.id,
      WxOrderId: "wx-order-1",
      RetCode: 0,
      RefundFee: 990,
    });
    assert.equal((await sendEvent(refund)).status, 200);
    assert.equal((await sendEvent(delivery, true)).status, 200);
    assert.equal(
      (await (await call("/membership", alice)).json()).status,
      "free",
    );
    const second = await (
      await call("/membership/orders", alice, {
        productId: "lifetime",
        requestId: "another_request_123456789",
      })
    ).json();
    await call(`/membership/orders/${second.id}/pay`, alice, {});
    platformOrder = {
      order_id: second.id,
      wx_order_id: "wx-order-2",
      order_fee: 990,
      status: 2,
      env_type: 1,
      paid_time: Math.floor(Date.now() / 1000),
    };
    assert.equal(
      (await (await call(`/membership/orders/${second.id}`, alice)).json())
        .status,
      "paid",
    );
    assert.equal(deliveryCalls, 1);
    assert.equal(
      (await (await call("/membership", alice)).json()).status,
      "active",
    );
    assert.equal(
      (
        await call(`/membership/orders/${second.id}/simulate`, alice, {
          outcome: "success",
        })
      ).status,
      403,
    );
  } finally {
    await app?.close();
    globalThis.fetch = originalFetch;
  }
});
