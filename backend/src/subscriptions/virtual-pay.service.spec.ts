import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import {
  encryptWechatSession,
  decryptWechatSession,
} from '../auth/wechat-session';
import {
  VirtualPayService,
  virtualPaySignature,
  virtualUserSignature,
} from './virtual-pay.service';

describe('virtual payment protocol', () => {
  const appId = 'wx-app';
  const secret = 'test-auth-secret-at-least-thirty-two-bytes';
  const aesKey = Buffer.alloc(32, 7);
  const settings = {
    enabled: true,
    iosEnabled: false,
    offerId: '1450679545',
    productId: 'lifetime_member',
    appKey: 'test-live-app-key',
    notifyToken: 'test-notify-token',
    encodingAESKey: aesKey.toString('base64').slice(0, 43),
  };
  let gateway: VirtualPayService;
  beforeEach(() => {
    gateway = new VirtualPayService(
      new ConfigService({
        app: {
          virtualPay: settings,
          wechatAppId: appId,
          wechatAppSecret: 'test-app-secret',
          authTokenSecret: secret,
        },
      }),
    );
  });
  afterEach(() => jest.restoreAllMocks());
  it('signs the exact refund body, verifies acceptance, and reads the original refund ID', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'token', expires_in: 7200 }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errcode: 0,
            refund_order_id: 'rf-test',
            pay_order_id: 'order',
            pay_wx_order_id: 'wx-tx',
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errcode: 0,
            order: {
              order_id: 'rf-test',
              env_type: 1,
              order_type: 1,
              status: 8,
              refund_fee: 990,
            },
          }),
        ),
      );
    await gateway.refund(
      { id: 'order', amount: 990, transactionId: 'wx-tx' } as any,
      'private',
      'rf-test',
      990,
      '3',
    );
    const [url, options] = fetchMock.mock.calls[1];
    const body = String(options!.body);
    expect(JSON.parse(body)).toMatchObject({
      openid: 'private',
      order_id: 'order',
      refund_order_id: 'rf-test',
      left_fee: 990,
      refund_fee: 990,
      req_from: '1',
      refund_reason: '3',
      env: 0,
    });
    expect(new URL(String(url)).searchParams.get('pay_sig')).toBe(
      virtualPaySignature('/xpay/refund_order', body, settings.appKey),
    );
    expect(await gateway.queryRefund('rf-test', 'private')).toEqual({
      status: 8,
      amount: 990,
    });
  });
  it.each([
    [5, 'refunding'],
    [8, 'refunded'],
    [7, 'refund_failed'],
  ] as const)(
    'distinguishes platform refund state %s as %s',
    async (status, state) => {
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: 'token', expires_in: 7200 }),
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              errcode: 0,
              order: {
                order_id: 'order',
                env_type: 1,
                status,
                order_fee: 990,
                refund_fee: 990,
              },
            }),
          ),
        );
      expect(
        (await gateway.query({ id: 'order' } as any, 'private'))?.state,
      ).toBe(state);
    },
  );
  it.each(['token', 'query'] as const)(
    'records safe diagnostics for %s failures without leaking upstream secrets',
    async (stage) => {
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const fetchMock = jest.spyOn(globalThis, 'fetch');
      if (stage === 'query')
        fetchMock.mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: 'private-token', expires_in: 7200 }),
          ),
        );
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errcode: 40164,
            errmsg:
              'private upstream data test-app-secret openid private-token',
          }),
        ),
      );
      await expect(
        gateway.query({ id: 'order' } as any, 'openid'),
      ).rejects.toMatchObject({
        response: { code: 'VIRTUAL_PAY_UNAVAILABLE' },
      });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(JSON.parse(warn.mock.calls[0][0])).toEqual({
        event: 'virtual_pay_upstream_failed',
        operation: '/xpay/query_order',
        orderId: 'order',
        endpoint:
          stage === 'token' ? '/cgi-bin/stable_token' : '/xpay/query_order',
        reason: 'wechat',
        httpStatus: 200,
        errcode: 40164,
      });
      expect(JSON.stringify(warn.mock.calls)).not.toMatch(
        /private|openid|test-app-secret/,
      );
    },
  );
  it.each([
    [
      'timeout',
      () =>
        Promise.reject(new DOMException('private token URL', 'TimeoutError')),
    ],
    ['network', () => Promise.reject(new TypeError('private token URL'))],
    [
      'invalid_json',
      () => Promise.resolve(new Response('private malformed response')),
    ],
  ] as const)(
    'classifies %s without logging raw errors',
    async (reason, response) => {
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      jest.spyOn(globalThis, 'fetch').mockImplementation(response);
      await expect(
        gateway.query({ id: 'order' } as any, 'openid'),
      ).rejects.toThrow();
      expect(JSON.parse(warn.mock.calls[0][0])).toMatchObject({
        reason,
        endpoint: '/cgi-bin/stable_token',
      });
      expect(JSON.stringify(warn.mock.calls)).not.toContain('private');
    },
  );
  function envelope(message: string, tail = appId) {
    const bytes = Buffer.from(message);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    const plain = Buffer.concat([
      randomBytes(16),
      length,
      bytes,
      Buffer.from(tail),
    ]);
    const padding = 32 - (plain.length % 32);
    const cipher = createCipheriv(
      'aes-256-cbc',
      aesKey,
      aesKey.subarray(0, 16),
    );
    cipher.setAutoPadding(false);
    const Encrypt = Buffer.concat([
      cipher.update(Buffer.concat([plain, Buffer.alloc(padding, padding)])),
      cipher.final(),
    ]).toString('base64');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = 'fixture-nonce';
    const msg_signature = createHash('sha1')
      .update([settings.notifyToken, timestamp, nonce, Encrypt].sort().join(''))
      .digest('hex');
    return {
      raw: JSON.stringify({ Encrypt }),
      query: { timestamp, nonce, msg_signature },
    };
  }
  it('matches both official deterministic signature examples exactly', () => {
    const body = '{"openid": "xxx", "user_ip": "127.0.0.1", "env": 0}';
    expect(virtualPaySignature('/xpay/query_user_balance', body, '12345')).toBe(
      'c37809f27c6d7fd1837ad2500a04512b66b34fd793a39a385fade56dca89a4b5',
    );
    expect(virtualUserSignature(body, '9hAb/NEYUlkaMBEsmFgzig==')).toBe(
      '089d9e8dc5d308977360c4b79ec600a93d736802802a807d634192328032f6c7',
    );
  });
  it('signs live lifetime_member at 990 with fresh encrypted session and never returns secrets', () => {
    gateway.onModuleInit();
    const identity = {
      userId: 'alice',
      appId,
      openId: 'openid',
      sessionKeyEncrypted: encryptWechatSession(
        'session-key',
        secret,
        `${appId}:alice`,
      ),
      sessionUpdatedAt: new Date().toISOString(),
    };
    const result = gateway.payment(
      { id: 'mv123', amount: 990 } as any,
      identity,
    );
    expect(JSON.parse(result.signData)).toMatchObject({
      offerId: settings.offerId,
      productId: 'lifetime_member',
      goodsPrice: 990,
      env: 0,
      buyQuantity: 1,
    });
    expect(result.paySig).toBe(
      virtualPaySignature(
        'requestVirtualPayment',
        result.signData,
        settings.appKey,
      ),
    );
    expect(result.signature).toBe(
      virtualUserSignature(result.signData, 'session-key'),
    );
    expect(JSON.stringify(result)).not.toContain('session-key');
    expect(() =>
      gateway.payment({ id: 'mv123', amount: 990 } as any, {
        ...identity,
        sessionUpdatedAt: '2020-01-01',
      }),
    ).toThrow('失效');
    expect(() =>
      decryptWechatSession(
        identity.sessionKeyEncrypted,
        secret,
        `${appId}:bob`,
      ),
    ).toThrow();
  });
  it('decrypts XML and JSON securely, rejects tampering, wrong AppID, plaintext and entities', () => {
    for (const raw of [
      '{"MsgType":"event","Event":"xpay_goods_deliver_notify"}',
      '<xml><MsgType>event</MsgType><Event>xpay_goods_deliver_notify</Event></xml>',
    ]) {
      const fixture = envelope(raw);
      expect(gateway.notification(fixture.query, fixture.raw).event.Event).toBe(
        'xpay_goods_deliver_notify',
      );
      expect(() =>
        gateway.notification(
          { ...fixture.query, nonce: 'tampered' },
          fixture.raw,
        ),
      ).toThrow('签名');
    }
    const wrong = envelope(
      '{"Event":"xpay_goods_deliver_notify"}',
      'wrong-app',
    );
    expect(() => gateway.notification(wrong.query, wrong.raw)).toThrow('解密');
    expect(() =>
      gateway.notification({} as any, '{"Event":"xpay_goods_deliver_notify"}'),
    ).toThrow('安全模式');
    expect(() =>
      gateway.parseMessage(
        '<!DOCTYPE xml [<!ENTITY x SYSTEM "file:///x">]><xml>&x;</xml>',
      ),
    ).toThrow('格式');
  });
  it('encrypts signed replies in both formats and validates GET challenges', () => {
    for (const format of ['json', 'xml'] as const) {
      const result = gateway.reply(
        { ErrCode: 0, ErrMsg: 'success' },
        'nonce',
        format,
      );
      const parsed =
        typeof result === 'string'
          ? gateway.parseMessage(result).value
          : result;
      const query = {
        timestamp: String(parsed.TimeStamp),
        nonce: parsed.Nonce,
        msg_signature: parsed.MsgSignature,
      };
      const raw = typeof result === 'string' ? result : JSON.stringify(result);
      expect(Number(gateway.notification(query, raw).event.ErrCode)).toBe(0);
    }
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = 'nonce';
    const signature = createHash('sha1')
      .update([settings.notifyToken, timestamp, nonce].sort().join(''))
      .digest('hex');
    expect(
      gateway.challenge({ timestamp, nonce, signature, echostr: 'challenge' }),
    ).toBe('challenge');
  });
  it('uses exact query body and signature, live env_type, signed delivery acknowledgment', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url, options) => {
        await Promise.resolve();
        const address = new URL(String(url));
        if (address.pathname.endsWith('stable_token'))
          return new Response(
            JSON.stringify({ access_token: 'token', expires_in: 7200 }),
          );
        if (address.pathname === '/xpay/query_order') {
          expect(JSON.parse(String(options?.body))).toEqual({
            openid: 'openid',
            env: 0,
            order_id: 'order',
          });
          expect(address.searchParams.get('pay_sig')).toBe(
            virtualPaySignature(
              address.pathname,
              String(options?.body),
              settings.appKey,
            ),
          );
          return new Response(
            JSON.stringify({
              errcode: 0,
              order: {
                order_id: 'order',
                wx_order_id: 'wx-order',
                order_fee: 990,
                status: 2,
                env_type: 1,
                paid_time: 1720000000,
              },
            }),
          );
        }
        expect(address.pathname).toBe('/xpay/notify_provide_goods');
        expect(address.searchParams.get('access_token')).toBe('token');
        expect(address.searchParams.get('pay_sig')).toBe(
          virtualPaySignature(
            '/xpay/notify_provide_goods',
            String(options?.body),
            settings.appKey,
          ),
        );
        expect(address.searchParams.has('signature')).toBe(false);
        expect(JSON.parse(String(options?.body))).toEqual({
          order_id: 'order',
          env: 0,
        });
        return new Response('{"errcode":0}');
      });
    expect((await gateway.query({ id: 'order' } as any, 'openid'))?.state).toBe(
      'paid',
    );
    await gateway.confirmDelivery('order');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
