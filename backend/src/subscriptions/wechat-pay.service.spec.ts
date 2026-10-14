import { ConfigService } from '@nestjs/config';
import { createCipheriv, generateKeyPairSync, sign, verify } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { WechatPayService } from './wechat-pay.service';
import { MembershipOrder } from './domain/membership-order';

describe('WeChat Pay APIv3 cryptography and transport', () => {
  const merchant = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const platform = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let folder: string;
  let service: WechatPayService;
  let config: ConfigService;
  let fetchMock: jest.SpyInstance;
  const apiV3Key = '01234567890123456789012345678901';
  const order: MembershipOrder = {
    id: 'mo012345678901234567890123456789',
    userId: 'alice',
    requestId: 'request_123456789',
    productId: 'lifetime',
    productName: '永久会员',
    channel: 'wechat',
    amount: 2990,
    currency: 'CNY',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paidAt: null,
  };
  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), 'subscription-wechat-pay-'));
    writeFileSync(
      join(folder, 'merchant.pem'),
      merchant.privateKey.export({ type: 'pkcs8', format: 'pem' }),
    );
    writeFileSync(
      join(folder, 'platform.pem'),
      platform.publicKey.export({ type: 'spki', format: 'pem' }),
    );
  });
  afterAll(() => {
    if (!resolve(folder).startsWith(resolve(tmpdir()) + sep))
      throw new Error('Unexpected fixture path');
    rmSync(folder, { recursive: true });
  });
  beforeEach(() => {
    config = new ConfigService({
      app: {
        wechatAppId: 'wx-app',
        wechatPay: {
          enabled: true,
          mchId: '123',
          serialNo: 'merchant-serial',
          apiV3Key,
          privateKeyPath: join(folder, 'merchant.pem'),
          publicKeyId: 'PUB_KEY_ID_test',
          publicKeyPath: join(folder, 'platform.pem'),
          notifyUrl: 'https://example.com/api/v1/membership/wechat/notify',
        },
      },
    });
    service = new WechatPayService(config);
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => fetchMock.mockRestore());

  function signedHeaders(
    body: string,
    timestamp = String(Math.floor(Date.now() / 1000)),
  ) {
    const nonce = 'platform-nonce';
    return new Headers({
      'Wechatpay-Timestamp': timestamp,
      'Wechatpay-Nonce': nonce,
      'Wechatpay-Serial': 'PUB_KEY_ID_test',
      'Wechatpay-Signature': sign(
        'RSA-SHA256',
        Buffer.from(`${timestamp}\n${nonce}\n${body}\n`),
        platform.privateKey,
      ).toString('base64'),
    });
  }
  function notificationBody() {
    const transaction = {
      appid: 'wx-app',
      mchid: '123',
      out_trade_no: order.id,
      transaction_id: '4200001',
      trade_state: 'SUCCESS',
      payer: { openid: 'alice-openid' },
      amount: { total: 2990, currency: 'CNY' },
      success_time: new Date().toISOString(),
    };
    const nonce = '123456789012';
    const aad = 'transaction';
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(apiV3Key),
      Buffer.from(nonce),
    );
    cipher.setAAD(Buffer.from(aad));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(transaction)),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64');
    return JSON.stringify({
      event_type: 'TRANSACTION.SUCCESS',
      resource: {
        algorithm: 'AEAD_AES_256_GCM',
        original_type: 'transaction',
        nonce,
        associated_data: aad,
        ciphertext,
      },
    });
  }

  it('validates enabled configuration and key files; disabled mode requires no secrets', () => {
    expect(() => service.onModuleInit()).not.toThrow();
    config.set('app.wechatPay.apiV3Key', 'short');
    expect(() => service.onModuleInit()).toThrow('requires all');
    config.set('app.wechatPay.enabled', false);
    expect(() => service.onModuleInit()).not.toThrow();
    expect(() => service.assertEnabled()).toThrow('暂未开放');
  });

  it('signs exact API request bytes and RSA mini-program cashier parameters', async () => {
    fetchMock.mockImplementation((url, options) => {
      expect(url).toBe(
        'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi',
      );
      const input = JSON.parse(options.body);
      expect(input).toMatchObject({
        appid: 'wx-app',
        mchid: '123',
        out_trade_no: order.id,
        amount: { total: 2990, currency: 'CNY' },
        payer: { openid: 'alice-openid' },
      });
      const auth = options.headers.Authorization;
      const field = (name: string) =>
        new RegExp(`${name}="([^"]+)"`).exec(auth)![1];
      const requestMessage = `POST\n/v3/pay/transactions/jsapi\n${field('timestamp')}\n${field('nonce_str')}\n${options.body}\n`;
      expect(
        verify(
          'RSA-SHA256',
          Buffer.from(requestMessage),
          merchant.publicKey,
          Buffer.from(field('signature'), 'base64'),
        ),
      ).toBe(true);
      const body = JSON.stringify({ prepay_id: 'wx-prepay' });
      return Promise.resolve(
        new Response(body, { status: 200, headers: signedHeaders(body) }),
      );
    });
    const payment = await service.prepay(order, 'alice-openid');
    expect(payment).toMatchObject({
      package: 'prepay_id=wx-prepay',
      signType: 'RSA',
    });
    expect(
      verify(
        'RSA-SHA256',
        Buffer.from(
          `wx-app\n${payment.timeStamp}\n${payment.nonceStr}\n${payment.package}\n`,
        ),
        merchant.publicKey,
        Buffer.from(payment.paySign, 'base64'),
      ),
    ).toBe(true);
    expect(JSON.stringify(payment)).not.toContain('PRIVATE KEY');
  });

  it('verifies and decrypts real-format AES-GCM notification bytes', () => {
    const body = notificationBody();
    expect(
      service.notification(signedHeaders(body), Buffer.from(body)),
    ).toMatchObject({
      out_trade_no: order.id,
      trade_state: 'SUCCESS',
      amount: { total: 2990 },
    });
  });

  it.each(['tamper', 'serial', 'stale', 'probe'])(
    'rejects %s notification authentication',
    (scenario) => {
      const body = notificationBody();
      const headers = signedHeaders(body);
      let bytes = Buffer.from(body);
      if (scenario === 'tamper') bytes = Buffer.from(body + ' ');
      if (scenario === 'serial') headers.set('Wechatpay-Serial', 'untrusted');
      if (scenario === 'stale') headers.set('Wechatpay-Timestamp', '1');
      if (scenario === 'probe')
        headers.set('Wechatpay-Signature', 'WECHATPAY/SIGNTEST/invalid');
      expect(() => service.notification(headers, bytes)).toThrow('签名无效');
    },
  );

  it('rejects bad authenticated ciphertext without granting', () => {
    const event = JSON.parse(notificationBody());
    event.resource.ciphertext = Buffer.alloc(64).toString('base64');
    const body = JSON.stringify(event);
    expect(() =>
      service.notification(signedHeaders(body), Buffer.from(body)),
    ).toThrow('通知格式无效');
  });

  it('rejects unsigned API success responses and never supplies cashier parameters', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ prepay_id: 'forged' }), { status: 200 }),
    );
    await expect(service.prepay(order, 'alice-openid')).rejects.toThrow(
      '结果暂未确认',
    );
  });

  it('queries the original trade number and verifies gateway ownership', async () => {
    fetchMock.mockImplementation((url) => {
      expect(url).toBe(
        `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${order.id}?mchid=123`,
      );
      const body = JSON.stringify({
        appid: 'wx-app',
        mchid: '123',
        out_trade_no: order.id,
        trade_state: 'NOTPAY',
      });
      return Promise.resolve(
        new Response(body, { status: 200, headers: signedHeaders(body) }),
      );
    });
    expect((await service.query(order.id))?.trade_state).toBe('NOTPAY');
    const body = JSON.stringify({
      appid: 'other',
      mchid: '123',
      out_trade_no: order.id,
    });
    fetchMock.mockResolvedValue(
      new Response(body, { status: 200, headers: signedHeaders(body) }),
    );
    await expect(service.query(order.id)).rejects.toThrow('不匹配');
  });
});
