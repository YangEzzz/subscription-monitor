import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { createHmac } from 'node:crypto';

describe('WeChat authentication', () => {
  const secret = 'test-session-secret-with-more-than-32-bytes';
  const config = new ConfigService({
    app: {
      wechatAppId: 'wx-test-app',
      wechatAppSecret: 'server-only-secret',
      authTokenSecret: secret,
      authTokenTtlSeconds: 3600,
    },
  });
  let auth: AuthService;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    auth = new AuthService(config);
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            openid: 'openid-1',
            session_key: 'private-session-key',
          }),
      } as Response);
  });
  afterEach(() => jest.restoreAllMocks());

  it('exchanges the code on the server and issues a stable, secret-free identity', async () => {
    const first = await auth.login('code-1');
    const second = await auth.login('code-2');
    expect(first.user.id).toEqual(second.user.id);
    expect(auth.verify(first.accessToken)).toEqual(first.user);
    expect(JSON.stringify(first)).not.toMatch(
      /openid-1|session_key|private-session-key|server-only-secret/,
    );
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin).toBe('https://api.weixin.qq.com');
    expect(url.searchParams.get('js_code')).toBe('code-1');
    expect(url.searchParams.get('secret')).toBe('server-only-secret');
  });

  it('rejects altered, expired and wrong-application tokens', async () => {
    const session = await auth.login('code');
    expect(() => auth.verify(session.accessToken + 'x')).toThrow();
    for (const payload of [
      { sub: session.user.id, appid: 'wx-test-app', exp: 1 },
      {
        sub: session.user.id,
        appid: 'another-app',
        exp: Math.floor(Date.now() / 1000) + 1000,
      },
    ]) {
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = createHmac('sha256', secret)
        .update(`v1.${body}`)
        .digest('base64url');
      expect(() => auth.verify(`v1.${body}.${signature}`)).toThrow();
    }
  });

  it('isolates different WeChat accounts', async () => {
    const first = await auth.login('first');
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ openid: 'openid-2' }),
    } as Response);
    expect((await auth.login('second')).user.id).not.toEqual(first.user.id);
  });

  it('rejects invalid codes and hides provider/network secrets from errors', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ errcode: 40029 }),
    } as Response);
    await expect(auth.login('invalid')).rejects.toMatchObject({ status: 401 });
    fetchMock.mockRejectedValue(new Error('sensitive provider URL'));
    await expect(auth.login('network')).rejects.toMatchObject({ status: 503 });
  });

  it('never issues a session when credentials or the signing key are missing', async () => {
    await expect(
      new AuthService(new ConfigService({ app: {} })).login('code'),
    ).rejects.toMatchObject({ status: 503 });
  });
});
