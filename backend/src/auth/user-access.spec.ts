import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, Logger } from '@nestjs/common';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';

describe('user access recording', () => {
  const config = new ConfigService({
    app: {
      wechatAppId: 'wx-test',
      wechatAppSecret: 'private',
      authTokenSecret: 'test-secret-at-least-thirty-two-bytes-long',
      trustedProxyCidrs: ['127.0.0.1/32'],
    },
  });
  const request = (ip = '203.0.113.7') => ({
    headers: { 'x-real-ip': ip },
    socket: { remoteAddress: '127.0.0.1' },
  });
  afterEach(() => jest.restoreAllMocks());
  it('records activity even without a usable IP, and permits read-only development to disable collection', async () => {
    const repo = new MemorySubscriptionsRepository([]);
    await repo.saveWechatIdentity({
      userId: 'alice',
      appId: 'app',
      openId: 'private',
    });
    await new AuthService(config, repo).recordAccess('alice', {
      headers: {},
      socket: {},
    });
    expect((await repo.adminStats(7)).activity.dau).toBe(1);
    const record = jest.spyOn(repo, 'recordUserActivity');
    const disabled = new ConfigService({
      app: { analyticsCollectionEnabled: false },
    });
    await new AuthService(disabled, repo).recordAccess('alice', {
      headers: {},
      socket: {},
    });
    expect(record).not.toHaveBeenCalled();
  });
  it('records login and authenticated requests, ignores unauthorized/public reads, keeps IP out of sessions', async () => {
    const repo = new MemorySubscriptionsRepository([]);
    const auth = new AuthService(config, repo);
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ openid: 'private-openid' })),
      );
    const session = await auth.login('code', request());
    expect(JSON.stringify(session)).not.toContain('203.0.113.7');
    const read = () =>
      repo.adminRead({ section: 'users', page: 1, search: '' });
    expect((await read()).items[0]).toMatchObject({
      lastAccessIp: '203.0.113.7',
    });
    const reflector = new Reflector();
    const guard = new AuthGuard(reflector, auth);
    const incoming = {
      ...request('2001:db8::1'),
      headers: {
        ...request('2001:db8::1').headers,
        authorization: `Bearer ${session.accessToken}`,
      },
    };
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => incoming }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(true);
    expect((await read()).items[0]).toMatchObject({
      lastAccessIp: '2001:db8::1',
    });
    incoming.headers.authorization = 'Bearer invalid';
    await expect(guard.canActivate(context)).rejects.toThrow();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const record = jest.spyOn(auth, 'recordAccess');
    expect(await guard.canActivate(context)).toBe(true);
    expect(record).not.toHaveBeenCalled();
    expect(JSON.stringify(await read())).not.toContain('private-openid');
  });
  it('limits unchanged IP writes to once per minute, updates changed IPs and ignores older requests', async () => {
    const repo = new MemorySubscriptionsRepository([]);
    await repo.saveWechatIdentity({
      userId: 'alice',
      appId: 'app',
      openId: 'private',
    });
    const at = new Date('2026-10-16T01:00:00Z');
    const read = async () =>
      (await repo.adminRead({ section: 'users', page: 1, search: '' }))
        .items[0];
    await repo.recordUserAccess('alice', '203.0.113.1', at);
    await repo.recordUserAccess(
      'alice',
      '203.0.113.1',
      new Date(at.getTime() + 30000),
    );
    expect((await read()).lastAccessAt).toBe(at.toISOString());
    await repo.recordUserAccess(
      'alice',
      '203.0.113.2',
      new Date(at.getTime() + 31000),
    );
    await repo.recordUserAccess(
      'alice',
      '203.0.113.99',
      new Date(at.getTime() - 1),
    );
    expect((await read()).lastAccessIp).toBe('203.0.113.2');
    await repo.recordUserAccess(
      'alice',
      '203.0.113.2',
      new Date(at.getTime() + 91000),
    );
    expect((await read()).lastAccessAt).toBe(
      new Date(at.getTime() + 91000).toISOString(),
    );
    await repo.recordUserAccess('unknown', '203.0.113.2', at);
    expect((await repo.adminOverview()).users).toBe(1);
  });
  it('does not fail a valid request when access metadata storage fails', async () => {
    const repo = new MemorySubscriptionsRepository([]);
    jest
      .spyOn(repo, 'recordUserAccess')
      .mockRejectedValue(new Error('database unavailable'));
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    await expect(
      new AuthService(config, repo).recordAccess('alice', request()),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('User access metadata update failed');
  });
});
