import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class MessageError extends Error {
  constructor(
    public readonly code: string,
    public readonly uncertain = false,
    public readonly retryable = false,
  ) {
    super('微信通知发送失败');
  }
}

@Injectable()
export class WechatMessagesService {
  private cachedToken = '';
  private expiresAt = 0;
  private tokenPromise: Promise<string> | null = null;
  constructor(private readonly config: ConfigService) {}

  private async token(): Promise<string> {
    if (this.cachedToken && this.expiresAt > Date.now())
      return this.cachedToken;
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = (async () => {
      try {
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
        const result = await response.json();
        if (
          !response.ok ||
          !result.access_token ||
          !Number.isFinite(result.expires_in)
        )
          throw new MessageError(
            String(result.errcode || 'TOKEN_UNAVAILABLE'),
            false,
            true,
          );
        this.cachedToken = result.access_token;
        this.expiresAt =
          Date.now() + Math.max(0, result.expires_in - 60) * 1000;
        return this.cachedToken;
      } catch (error) {
        if (error instanceof MessageError) throw error;
        throw new MessageError('TOKEN_UNAVAILABLE', false, true);
      }
    })().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }

  async send(
    openId: string,
    subscriptionId: string,
    billingDate: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    const units: Record<string, string> = {
      CNY: '元',
      USD: '美元',
      HKD: '港元',
      JPY: '日元',
    };
    if (!units[currency] || !Number.isFinite(amount) || amount < 0)
      throw new MessageError('INVALID_AMOUNT');
    const [year, month, day] = billingDate.split('-');
    const body = {
      touser: openId,
      template_id: this.config.get('app.wechatReminderTemplateId'),
      page: `pages/subscription/index?subscriptionId=${encodeURIComponent(subscriptionId)}&billingDate=${billingDate}`,
      miniprogram_state: this.config.get('app.wechatMessageState') || 'formal',
      lang: 'zh_CN',
      data: {
        [this.config.get('app.wechatSubscriptionType') === 'long_term'
          ? 'time22'
          : 'date12']: { value: `${year}年${month}月${day}日` },
        amount4: { value: `${amount.toFixed(2)}${units[currency]}` },
      },
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.token();
      let result: { errcode?: number };
      try {
        const response = await fetch(
          `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(token)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000),
          },
        );
        if (!response.ok) throw new MessageError('DELIVERY_UNKNOWN', true);
        result = await response.json();
        if (!Number.isInteger(result.errcode))
          throw new MessageError('DELIVERY_UNKNOWN', true);
      } catch (error) {
        if (error instanceof MessageError) throw error;
        throw new MessageError('DELIVERY_UNKNOWN', true);
      }
      if (result.errcode === 0) return;
      if ([40001, 40014, 42001].includes(result.errcode!)) {
        this.cachedToken = '';
        this.expiresAt = 0;
        if (attempt === 0) continue;
      }
      throw new MessageError(
        String(result.errcode),
        false,
        [-1, 45009, 40001, 40014, 42001].includes(result.errcode!),
      );
    }
  }
}
