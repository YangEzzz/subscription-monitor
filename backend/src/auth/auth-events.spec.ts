import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';

describe('authentication audit events', () => {
  const config = new ConfigService({
    app: {
      wechatAppId: 'app',
      wechatAppSecret: 'secret',
      authTokenSecret: 'a-signing-secret-with-at-least-thirty-two-bytes',
      trustedProxyCidrs: ['127.0.0.1/32'],
    },
  });
  let repo: MemorySubscriptionsRepository;
  let auth: AuthService;
  beforeEach(() => {
    repo = new MemorySubscriptionsRepository([]);
    auth = new AuthService(config, repo);
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify({ openid: 'private-openid' })),
      );
  });
  afterEach(() => jest.restoreAllMocks());
  const context = {
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'x-real-ip': '203.0.113.8' },
    requestId: 'request-1',
  };
  const read = (repository: MemorySubscriptionsRepository, search = '') =>
    repository.adminRead({ section: 'authEvents', page: 1, search });

  it('records exactly one registration for concurrent first logins and then login events', async () => {
    const sessions = await Promise.all([
      auth.login('one', context),
      auth.login('two', context),
    ]);
    const events = await read(repo);
    expect(events.total).toBe(2);
    expect(events.items.map((e) => e.action).sort()).toEqual([
      'login',
      'register',
    ]);
    expect(events.items[0]).toMatchObject({
      userId: sessions[0].user.id,
      appId: 'app',
      clientIp: '203.0.113.8',
      peerIp: '127.0.0.1',
      requestId: 'request-1',
    });
    expect(JSON.stringify(events)).not.toMatch(
      /private-openid|accessToken|signing-secret/,
    );
    expect((await read(repo, 'missing')).total).toBe(0);
    expect((await read(repo, sessions[0].user.id)).total).toBe(2);
  });
  it('does not relabel existing accounts as registrations', async () => {
    const session = await auth.login('one');
    const existing = new MemorySubscriptionsRepository([]);
    await existing.saveWechatIdentity({
      userId: session.user.id,
      appId: 'app',
      openId: 'private-openid',
    });
    await new AuthService(config, existing).login('two');
    expect((await read(existing)).items[0].action).toBe('login');
  });
  it('does not record failed WeChat logins', async () => {
    jest
      .mocked(globalThis.fetch)
      .mockResolvedValue(new Response(JSON.stringify({ errcode: 40029 })));
    await expect(auth.login('bad')).rejects.toThrow();
    expect((await read(repo)).total).toBe(0);
  });
  it('does not return a successful login if the audit transaction fails', async () => {
    jest
      .spyOn(repo, 'recordWechatLogin')
      .mockRejectedValue(new Error('database unavailable'));
    await expect(auth.login('one')).rejects.toThrow('database unavailable');
  });
});
