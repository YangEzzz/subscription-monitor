import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { MembershipOrder } from './domain/membership-order';
import { WechatIdentity } from '../notifications/notification.repository';
import { decryptWechatSession } from '../auth/wechat-session';

export type VirtualPayConfig = {
  enabled: boolean;
  offerId?: string;
  appKey?: string;
  productId?: string;
  notifyToken?: string;
  encodingAESKey?: string;
  iosEnabled: boolean;
};
export type VirtualTransaction = {
  orderId: string;
  wxOrderId: string;
  openId: string;
  amount: number;
  paidAt: string;
  productId?: string;
  quantity?: number;
  env: number;
};
export type VirtualQuery = {
  state: 'pending' | 'paid' | 'closed' | 'refunded';
  transaction: VirtualTransaction;
  delivered: boolean;
  refundFee: number;
};
export type VirtualEvent = Record<string, any>;
export const virtualPaySignature = (
  uri: string,
  body: string,
  appKey: string,
) => createHmac('sha256', appKey).update(`${uri}&${body}`).digest('hex');
export const virtualUserSignature = (body: string, sessionKey: string) =>
  createHmac('sha256', sessionKey).update(body).digest('hex');

// Only allowlisted diagnostics may cross the upstream boundary. Never retain
// URLs (which contain tokens), response bodies, errmsg or raw fetch errors.
class VirtualPayUpstreamError extends Error {
  constructor(
    readonly endpoint: string,
    readonly reason: 'http' | 'response' | 'wechat',
    readonly httpStatus: number,
    readonly errcode?: number,
  ) {
    super('Virtual payment upstream failure');
  }
}

@Injectable()
export class VirtualPayService implements OnModuleInit {
  private readonly logger = new Logger(VirtualPayService.name);
  private cachedToken = '';
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string> | null = null;
  constructor(private readonly config: ConfigService) {}
  get settings(): VirtualPayConfig {
    return (
      this.config.get<VirtualPayConfig>('app.virtualPay') || {
        enabled: false,
        iosEnabled: false,
      }
    );
  }
  onModuleInit() {
    if (process.env.WECHAT_PAY_ENABLED === 'true')
      throw new Error(
        'Ordinary WeChat Pay has been replaced: disable WECHAT_PAY_ENABLED and configure WECHAT_VIRTUAL_PAY_*',
      );
    if (!this.settings.enabled) return;
    const s = this.settings;
    if (
      !/^\d+$/.test(s.offerId || '') ||
      !s.appKey ||
      !/^[A-Za-z0-9_]{1,20}$/.test(s.productId || '') ||
      !s.notifyToken ||
      !/^[A-Za-z0-9+/]{43}$/.test(s.encodingAESKey || '') ||
      !this.config.get<string>('app.wechatAppId') ||
      !this.config.get<string>('app.wechatAppSecret') ||
      Buffer.byteLength(this.config.get<string>('app.authTokenSecret') || '') <
        32
    )
      throw new Error(
        'WECHAT_VIRTUAL_PAY_ENABLED requires AppID, AppSecret, AUTH_TOKEN_SECRET, OfferID, live AppKey, published product ID, Token and EncodingAESKey',
      );
  }
  assertEnabled() {
    if (!this.settings.enabled)
      throw new ServiceUnavailableException({
        code: 'VIRTUAL_PAY_DISABLED',
        message: '会员购买暂未开放',
      });
  }
  payment(order: MembershipOrder, identity: WechatIdentity) {
    this.assertEnabled();
    let sessionKey: string;
    try {
      if (
        !identity.sessionKeyEncrypted ||
        !identity.sessionUpdatedAt ||
        Date.now() - Date.parse(identity.sessionUpdatedAt) > 10 * 60 * 1000 ||
        !Number.isFinite(Date.parse(identity.sessionUpdatedAt))
      )
        throw new Error();
      sessionKey = decryptWechatSession(
        identity.sessionKeyEncrypted,
        this.config.get<string>('app.authTokenSecret') || '',
        `${identity.appId}:${identity.userId}`,
      );
    } catch {
      throw new ServiceUnavailableException({
        code: 'VIRTUAL_SESSION_EXPIRED',
        message: '微信支付登录状态已失效，请重新登录后重试',
      });
    }
    const signData = JSON.stringify({
      offerId: this.settings.offerId,
      buyQuantity: 1,
      env: 0,
      currencyType: 'CNY',
      productId: this.settings.productId,
      goodsPrice: order.amount,
      outTradeNo: order.id,
      attach: JSON.stringify({
        orderId: order.id,
        productId: this.settings.productId,
      }),
    });
    return {
      mode: 'short_series_goods',
      signData,
      paySig: virtualPaySignature(
        'requestVirtualPayment',
        signData,
        this.settings.appKey!,
      ),
      signature: virtualUserSignature(signData, sessionKey),
    };
  }
  private async token() {
    if (this.cachedToken && this.tokenExpiresAt > Date.now())
      return this.cachedToken;
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = (async () => {
      const response = await fetch(
        'https://api.weixin.qq.com/cgi-bin/stable_token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            grant_type: 'client_credential',
            appid: this.config.get('app.wechatAppId'),
            secret: this.config.get('app.wechatAppSecret'),
            force_refresh: false,
          }),
        },
      );
      const value = await response.json();
      if (
        !response.ok ||
        typeof value?.access_token !== 'string' ||
        !value.access_token ||
        !Number.isFinite(value.expires_in)
      )
        throw new VirtualPayUpstreamError(
          '/cgi-bin/stable_token',
          !response.ok
            ? 'http'
            : Number.isInteger(value?.errcode)
              ? 'wechat'
              : 'response',
          response.status,
          Number.isInteger(value?.errcode) ? value.errcode : undefined,
        );
      this.cachedToken = value.access_token;
      this.tokenExpiresAt =
        Date.now() + Math.max(0, value.expires_in - 60) * 1000;
      return this.cachedToken;
    })().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }
  private async request(
    path: string,
    data: Record<string, unknown>,
    signed: boolean,
  ) {
    this.assertEnabled();
    const body = JSON.stringify(data);
    let endpoint = '/cgi-bin/stable_token';
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        endpoint = '/cgi-bin/stable_token';
        const params = new URLSearchParams({
          access_token: await this.token(),
        });
        endpoint = path;
        if (signed)
          params.set(
            'pay_sig',
            virtualPaySignature(path, body, this.settings.appKey!),
          );
        const response = await fetch(
          `https://api.weixin.qq.com${path}?${params}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: AbortSignal.timeout(8000),
          },
        );
        const result = await response.json();
        if (!response.ok || !Number.isInteger(result?.errcode))
          throw new VirtualPayUpstreamError(
            path,
            !response.ok ? 'http' : 'response',
            response.status,
            Number.isInteger(result?.errcode) ? result.errcode : undefined,
          );
        if ([40001, 40014, 42001].includes(result.errcode) && attempt === 0) {
          this.cachedToken = '';
          this.tokenExpiresAt = 0;
          continue;
        }
        if (result.errcode !== 0)
          throw new VirtualPayUpstreamError(
            path,
            'wechat',
            response.status,
            result.errcode,
          );
        return result;
      }
    } catch (error) {
      // Fetch/DOM exceptions may come from a different JavaScript realm.
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? error.name
          : undefined;
      this.logger.warn(
        JSON.stringify({
          event: 'virtual_pay_upstream_failed',
          operation: path,
          orderId: data.order_id,
          endpoint:
            error instanceof VirtualPayUpstreamError
              ? error.endpoint
              : endpoint,
          reason:
            error instanceof VirtualPayUpstreamError
              ? error.reason
              : errorName === 'TimeoutError' || errorName === 'AbortError'
                ? 'timeout'
                : errorName === 'SyntaxError'
                  ? 'invalid_json'
                  : 'network',
          ...(error instanceof VirtualPayUpstreamError
            ? { httpStatus: error.httpStatus, errcode: error.errcode }
            : {}),
        }),
      );
    }
    throw new BadGatewayException({
      code: 'VIRTUAL_PAY_UNAVAILABLE',
      message: '支付结果暂未确认，请刷新订单与权益，勿重复支付',
    });
  }
  async query(
    order: MembershipOrder,
    openId: string,
  ): Promise<VirtualQuery | null> {
    const response = await this.request(
      '/xpay/query_order',
      { openid: openId, env: 0, order_id: order.id },
      true,
    );
    const value = response.order;
    if (!value || (!value.order_id && value.status === 0)) return null;
    if (
      value.order_id !== order.id ||
      value.env_type !== 1 ||
      !Number.isInteger(value.status)
    )
      throw new BadGatewayException('虚拟支付订单信息不匹配');
    const state = [2, 3, 4].includes(value.status)
      ? 'paid'
      : value.status === 8
        ? 'refunded'
        : value.status === 6
          ? 'closed'
          : 'pending';
    return {
      state,
      delivered: value.status === 4,
      refundFee: value.refund_fee,
      transaction: {
        orderId: value.order_id,
        wxOrderId: value.wx_order_id,
        openId,
        amount: value.order_fee,
        paidAt:
          Number.isFinite(Number(value.paid_time)) &&
          Number(value.paid_time) > 0
            ? new Date(Number(value.paid_time) * 1000).toISOString()
            : '',
        env: 0,
      },
    };
  }
  async confirmDelivery(id: string) {
    // The official notify_provide_goods endpoint takes access_token, not pay_sig.
    await this.request(
      '/xpay/notify_provide_goods',
      { order_id: id, env: 0 },
      false,
    );
  }
  parseMessage(text: string): { value: VirtualEvent; format: 'xml' | 'json' } {
    try {
      if (
        Buffer.byteLength(text) > 100 * 1024 ||
        /<!DOCTYPE|<!ENTITY/i.test(text)
      )
        throw new Error();
      const xml = text.trimStart().startsWith('<');
      if (xml && XMLValidator.validate(text) !== true) throw new Error();
      const value = xml
        ? new XMLParser({ parseTagValue: false, processEntities: false }).parse(
            text,
          ).xml
        : JSON.parse(text);
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error();
      return { value, format: xml ? 'xml' : 'json' };
    } catch {
      throw new BadRequestException('支付推送报文格式不正确');
    }
  }
  private sha1(values: string[]) {
    return createHash('sha1').update(values.sort().join('')).digest('hex');
  }
  private verify(query: Record<string, string>, encrypted?: string) {
    const { timestamp, nonce } = query;
    const signature = encrypted ? query.msg_signature : query.signature;
    if (
      !/^\d+$/.test(timestamp || '') ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 ||
      !nonce ||
      nonce.length > 128 ||
      !/^[a-f0-9]{40}$/.test(signature || '') ||
      !this.settings.notifyToken
    )
      throw new BadRequestException('支付推送签名无效');
    const expected = this.sha1([
      this.settings.notifyToken,
      timestamp,
      nonce,
      ...(encrypted ? [encrypted] : []),
    ]);
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
      throw new BadRequestException('支付推送签名无效');
  }
  private aesKey() {
    return Buffer.from(this.settings.encodingAESKey! + '=', 'base64');
  }
  private decrypt(encrypted: string) {
    try {
      const key = this.aesKey();
      const cipher = createDecipheriv('aes-256-cbc', key, key.subarray(0, 16));
      cipher.setAutoPadding(false);
      const bytes = Buffer.concat([
        cipher.update(Buffer.from(encrypted, 'base64')),
        cipher.final(),
      ]);
      const padding = bytes[bytes.length - 1];
      if (
        padding < 1 ||
        padding > 32 ||
        !bytes.subarray(-padding).every((value) => value === padding)
      )
        throw new Error();
      const plain = bytes.subarray(0, -padding);
      if (plain.length < 20) throw new Error();
      const length = plain.readUInt32BE(16);
      if (
        length > plain.length - 20 ||
        plain.subarray(20 + length).toString('utf8') !==
          this.config.get<string>('app.wechatAppId')
      )
        throw new Error();
      return plain.subarray(20, 20 + length).toString('utf8');
    } catch {
      throw new BadRequestException('支付推送解密失败');
    }
  }
  challenge(query: Record<string, string>) {
    this.assertEnabled();
    if (!query.echostr || query.echostr.length > 8192)
      throw new BadRequestException('支付推送验证参数不正确');
    if (query.msg_signature) {
      this.verify(query, query.echostr);
      return this.decrypt(query.echostr);
    }
    this.verify(query);
    return query.echostr;
  }
  notification(query: Record<string, string>, text: string) {
    this.assertEnabled();
    const envelope = this.parseMessage(text);
    if (typeof envelope.value.Encrypt !== 'string' || !envelope.value.Encrypt)
      throw new BadRequestException('支付推送须使用安全模式');
    this.verify(query, envelope.value.Encrypt);
    const message = this.parseMessage(this.decrypt(envelope.value.Encrypt));
    return { event: message.value, format: envelope.format };
  }
  reply(
    content: Record<string, unknown>,
    nonce: string,
    format: 'xml' | 'json',
  ) {
    const message =
      format === 'xml'
        ? new XMLBuilder().build({ xml: content })
        : JSON.stringify(content);
    const bytes = Buffer.from(message);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    const plain = Buffer.concat([
      randomBytes(16),
      length,
      bytes,
      Buffer.from(this.config.get<string>('app.wechatAppId')!),
    ]);
    const padding = 32 - (plain.length % 32);
    const key = this.aesKey();
    const cipher = createCipheriv('aes-256-cbc', key, key.subarray(0, 16));
    cipher.setAutoPadding(false);
    const Encrypt = Buffer.concat([
      cipher.update(Buffer.concat([plain, Buffer.alloc(padding, padding)])),
      cipher.final(),
    ]).toString('base64');
    const TimeStamp = Math.floor(Date.now() / 1000);
    const envelope = {
      Encrypt,
      MsgSignature: this.sha1([
        this.settings.notifyToken!,
        String(TimeStamp),
        nonce,
        Encrypt,
      ]),
      TimeStamp,
      Nonce: nonce,
    };
    return format === 'xml'
      ? new XMLBuilder().build({ xml: envelope })
      : envelope;
  }
}
