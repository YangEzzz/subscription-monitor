import {
  Injectable,
  Inject,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from '../subscriptions/repositories/subscriptions.repository';

type SessionPayload = { sub: string; appid: string; exp: number };

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repository: SubscriptionsRepository,
  ) {}

  private signingSecret(): string {
    const secret = this.config.get<string>('app.authTokenSecret') || '';
    if (Buffer.byteLength(secret) < 32) {
      throw new ServiceUnavailableException({
        code: 'AUTH_NOT_CONFIGURED',
        message: '登录服务尚未配置',
      });
    }
    return secret;
  }

  async login(code: string) {
    const appid = this.config.get<string>('app.wechatAppId');
    const secret = this.config.get<string>('app.wechatAppSecret');
    const signingSecret = this.signingSecret();
    if (!appid || !secret) {
      throw new ServiceUnavailableException({
        code: 'AUTH_NOT_CONFIGURED',
        message: '登录服务尚未配置',
      });
    }
    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.search = new URLSearchParams({
      appid,
      secret,
      js_code: code,
      grant_type: 'authorization_code',
    }).toString();
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    let result: { errcode?: number; openid?: string };
    try {
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error('WeChat unavailable');
      result = await response.json();
    } catch {
      // Do not include the request URL, AppSecret, code, or session_key in errors/logs.
      throw new ServiceUnavailableException({
        code: 'WECHAT_UNAVAILABLE',
        message: '微信登录暂时不可用，请稍后重试',
      });
    } finally {
      clearTimeout(timer);
    }
    if (result.errcode === -1 || result.errcode === 45011) {
      throw new ServiceUnavailableException({
        code: 'WECHAT_UNAVAILABLE',
        message: '微信登录繁忙，请稍后重试',
      });
    }
    if (result.errcode === 40013 || result.errcode === 40125) {
      throw new ServiceUnavailableException({
        code: 'AUTH_NOT_CONFIGURED',
        message: '微信登录配置无效',
      });
    }
    if (result.errcode || typeof result.openid !== 'string' || !result.openid) {
      throw new UnauthorizedException({
        code: 'WECHAT_LOGIN_FAILED',
        message: '微信登录凭证无效，请重试',
      });
    }
    const id =
      'wx_' +
      createHash('sha256').update(`${appid}:${result.openid}`).digest('hex');
    const exp =
      Math.floor(Date.now() / 1000) +
      (this.config.get<number>('app.authTokenTtlSeconds') || 604800);
    await this.repository.saveWechatIdentity({
      userId: id,
      appId: appid,
      openId: result.openid,
    });
    const body = Buffer.from(JSON.stringify({ sub: id, appid, exp })).toString(
      'base64url',
    );
    const signature = createHmac('sha256', signingSecret)
      .update(`v1.${body}`)
      .digest('base64url');
    return {
      accessToken: `v1.${body}.${signature}`,
      expiresAt: new Date(exp * 1000).toISOString(),
      user: { id },
    };
  }

  verify(token: string): { id: string } {
    try {
      if (token.length > 2048) throw new Error('Invalid token');
      const [version, body, signature, extra] = token.split('.');
      if (version !== 'v1' || !body || !signature || extra !== undefined)
        throw new Error('Invalid token');
      const expected = createHmac('sha256', this.signingSecret())
        .update(`v1.${body}`)
        .digest();
      const actual = Buffer.from(signature, 'base64url');
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
      )
        throw new Error('Invalid signature');
      const payload: SessionPayload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8'),
      );
      if (
        !/^wx_[a-f0-9]{64}$/.test(payload.sub) ||
        payload.appid !== this.config.get<string>('app.wechatAppId') ||
        !Number.isSafeInteger(payload.exp) ||
        payload.exp <= Math.floor(Date.now() / 1000)
      )
        throw new Error('Expired token');
      return { id: payload.sub };
    } catch {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }
  }
}
