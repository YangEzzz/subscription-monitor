import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  verify,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import { MembershipOrder } from './domain/membership-order';

export type WechatPayConfig = {
  enabled: boolean;
  mchId?: string;
  serialNo?: string;
  privateKeyPath?: string;
  apiV3Key?: string;
  publicKeyId?: string;
  publicKeyPath?: string;
  notifyUrl?: string;
};
export type WechatTransaction = {
  appid: string;
  mchid: string;
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  success_time?: string;
  payer: { openid: string };
  amount: { total: number; currency: string };
};

/** Direct-merchant APIv3, with a pinned WeChat Pay public key. */
@Injectable()
export class WechatPayService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  get settings(): WechatPayConfig {
    return (
      this.config.get<WechatPayConfig>('app.wechatPay') || { enabled: false }
    );
  }

  onModuleInit() {
    if (!this.settings.enabled) return;
    const settings = this.settings;
    if (
      !this.config.get<string>('app.wechatAppId') ||
      !settings.mchId ||
      !settings.serialNo ||
      !settings.privateKeyPath ||
      !settings.publicKeyId ||
      !settings.publicKeyPath ||
      Buffer.byteLength(settings.apiV3Key || '') !== 32 ||
      !settings.notifyUrl
    )
      throw new Error(
        'WECHAT_PAY_ENABLED requires all merchant payment settings',
      );
    const url = new URL(settings.notifyUrl);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error(
        'WECHAT_PAY_NOTIFY_URL must be a public HTTPS callback URL',
      );
    if (
      createPrivateKey(readFileSync(settings.privateKeyPath))
        .asymmetricKeyType !== 'rsa' ||
      createPublicKey(readFileSync(settings.publicKeyPath))
        .asymmetricKeyType !== 'rsa'
    )
      throw new Error('WeChat Pay keys must be RSA keys');
  }

  assertEnabled() {
    if (!this.settings.enabled)
      throw new ServiceUnavailableException({
        code: 'WECHAT_PAY_DISABLED',
        message: '微信支付暂未开放',
      });
  }

  private rsaSign(message: string) {
    return sign(
      'RSA-SHA256',
      Buffer.from(message),
      readFileSync(this.settings.privateKeyPath!),
    ).toString('base64');
  }

  verifyMessage(headers: Headers, body: string) {
    const timestamp = headers.get('wechatpay-timestamp') || '';
    const nonce = headers.get('wechatpay-nonce') || '';
    const signature = headers.get('wechatpay-signature') || '';
    if (
      !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 ||
      !nonce ||
      nonce.length > 128 ||
      headers.get('wechatpay-serial') !== this.settings.publicKeyId ||
      !signature ||
      signature.startsWith('WECHATPAY/SIGNTEST/')
    )
      throw new BadRequestException('微信支付签名无效');
    let valid = false;
    try {
      valid = verify(
        'RSA-SHA256',
        Buffer.from(`${timestamp}\n${nonce}\n${body}\n`),
        readFileSync(this.settings.publicKeyPath!),
        Buffer.from(signature, 'base64'),
      );
    } catch {
      /* Invalid signatures and keys fail closed. */
    }
    if (!valid) throw new BadRequestException('微信支付签名无效');
  }

  private async request(method: 'GET' | 'POST', path: string, data?: unknown) {
    this.assertEnabled();
    const body = data === undefined ? '' : JSON.stringify(data);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = randomBytes(16).toString('hex');
    const signature = this.rsaSign(
      `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`,
    );
    try {
      const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Wechatpay-Serial': this.settings.publicKeyId!,
          Authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${this.settings.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${this.settings.serialNo}",signature="${signature}"`,
        },
        ...(body ? { body } : {}),
        signal: AbortSignal.timeout(10000),
      });
      const text = await response.text();
      this.verifyMessage(response.headers, text);
      const result = text ? JSON.parse(text) : {};
      if (response.status === 404 && result.code === 'ORDER_NOT_EXIST')
        return null;
      if (!response.ok) throw new Error('Payment request failed');
      return result;
    } catch {
      // Never log authorization, key material, payer identity, or raw gateway bodies.
      throw new BadGatewayException({
        code: 'WECHAT_PAY_UNAVAILABLE',
        message: '微信支付结果暂未确认，请刷新订单后重试',
      });
    }
  }

  async prepay(order: MembershipOrder, openId: string) {
    const expiresAt = new Date(
      Date.parse(order.createdAt) + 2 * 60 * 60 * 1000,
    );
    const response = await this.request('POST', '/v3/pay/transactions/jsapi', {
      appid: this.config.get<string>('app.wechatAppId'),
      mchid: this.settings.mchId,
      description: `续订清单 · ${order.productName}`,
      out_trade_no: order.id,
      notify_url: this.settings.notifyUrl,
      time_expire: expiresAt.toISOString(),
      amount: { total: order.amount, currency: order.currency },
      payer: { openid: openId },
    });
    if (!response?.prepay_id || typeof response.prepay_id !== 'string')
      throw new BadGatewayException('未获取到微信支付参数，请刷新订单后重试');
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = randomBytes(16).toString('hex');
    const paymentPackage = `prepay_id=${response.prepay_id}`;
    return {
      timeStamp,
      nonceStr,
      package: paymentPackage,
      signType: 'RSA',
      paySign: this.rsaSign(
        `${this.config.get<string>('app.wechatAppId')}\n${timeStamp}\n${nonceStr}\n${paymentPackage}\n`,
      ),
    };
  }

  async query(id: string): Promise<WechatTransaction | null> {
    const result = await this.request(
      'GET',
      `/v3/pay/transactions/out-trade-no/${encodeURIComponent(id)}?mchid=${encodeURIComponent(this.settings.mchId!)}`,
    );
    if (
      result &&
      (result.out_trade_no !== id ||
        result.appid !== this.config.get<string>('app.wechatAppId') ||
        result.mchid !== this.settings.mchId)
    )
      throw new BadGatewayException('微信支付订单信息不匹配');
    return result;
  }

  async close(id: string) {
    await this.request(
      'POST',
      `/v3/pay/transactions/out-trade-no/${encodeURIComponent(id)}/close`,
      { mchid: this.settings.mchId },
    );
  }

  notification(headers: Headers, rawBody: Buffer): WechatTransaction {
    this.assertEnabled();
    this.verifyMessage(headers, rawBody.toString('utf8'));
    try {
      const event = JSON.parse(rawBody.toString('utf8'));
      const resource = event.resource;
      if (
        event.event_type !== 'TRANSACTION.SUCCESS' ||
        resource?.algorithm !== 'AEAD_AES_256_GCM' ||
        resource.original_type !== 'transaction'
      )
        throw new Error();
      const encrypted = Buffer.from(resource.ciphertext, 'base64');
      if (encrypted.length <= 16) throw new Error();
      const decipher = createDecipheriv(
        'aes-256-gcm',
        Buffer.from(this.settings.apiV3Key!),
        Buffer.from(resource.nonce),
      );
      decipher.setAuthTag(encrypted.subarray(-16));
      decipher.setAAD(Buffer.from(resource.associated_data || ''));
      return JSON.parse(
        Buffer.concat([
          decipher.update(encrypted.subarray(0, -16)),
          decipher.final(),
        ]).toString('utf8'),
      );
    } catch {
      throw new BadRequestException('微信支付通知格式无效');
    }
  }
}
