import { scryptSync } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { request } from 'node:http';
import { LocalAdminServer } from './admin.module';
import { AdminRefundsService } from './admin-refunds.service';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';

// This suite exercises the standalone HTTP server with a memory repository;
// database initialization belongs to the subscriptions module integration tests.
jest.mock('../subscriptions/subscriptions.module', () => ({
  SubscriptionsModule: class {},
}));

let sessionCookie = '';
const adminPassword = 'test-administrator-password';
function read(
  path: string,
  headers: Record<string, string | undefined> = {},
  method = 'GET',
  body?: string,
): Promise<{
  status: number;
  body: string;
  headers: import('node:http').IncomingHttpHeaders;
}> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port: 3002,
        path,
        headers: Object.fromEntries(
          Object.entries({ Cookie: sessionCookie, ...headers }).filter(
            ([, value]) => value !== undefined,
          ),
        ),
        method,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (body += chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode!, body, headers: res.headers }),
        );
      },
    );
    req.on('error', reject);
    req.end(body);
  });
}

describe('Local admin server', () => {
  const repository = new MemorySubscriptionsRepository();
  const refunds = {
    inspect: jest.fn().mockResolvedValue({ eligible: true, amount: 990 }),
    submit: jest.fn().mockResolvedValue({ status: 'processing' }),
    check: jest.fn().mockResolvedValue({ status: 'processing' }),
  };
  const server = new LocalAdminServer(
    new ConfigService({ app: { persistenceDriver: 'memory' } }),
    repository,
    refunds as unknown as AdminRefundsService,
  );
  const original = process.env.LOCAL_ADMIN_ENABLED;
  const originalUser = process.env.ADMIN_USERNAME;
  const originalHash = process.env.ADMIN_PASSWORD_HASH;
  beforeAll(async () => {
    process.env.LOCAL_ADMIN_ENABLED = 'true';
    process.env.ADMIN_USERNAME = 'admin';
    const salt = 'a'.repeat(32);
    process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt}$${scryptSync(adminPassword, salt, 64).toString('hex')}`;
    await repository.saveWechatIdentity({
      userId: 'wx-test',
      appId: 'test',
      openId: 'private-openid',
    });
    await server.onApplicationBootstrap();
    const login = await read(
      '/login',
      { 'Content-Type': 'application/json' },
      'POST',
      JSON.stringify({ username: 'admin', password: adminPassword }),
    );
    expect(login.status).toBe(200);
    sessionCookie = login.headers['set-cookie']![0].split(';')[0];
  });
  it('protects refund writes, validates JSON and uses the authenticated operator', async () => {
    const path = '/refunds/mo-test';
    expect((await read(path, { Cookie: '' }, 'POST', '{}')).status).toBe(401);
    expect(
      (
        await read(
          path,
          {
            Origin: 'https://evil.example',
            'Content-Type': 'application/json',
          },
          'POST',
          '{}',
        )
      ).status,
    ).toBe(403);
    expect((await read(path, {}, 'POST', '{}')).status).toBe(400);
    expect(
      (
        await read(
          path,
          { 'Content-Type': 'application/json' },
          'POST',
          'bad-json',
        )
      ).status,
    ).toBe(400);
    expect(
      (await read(path, { 'Content-Type': 'application/json' }, 'POST', 'null'))
        .status,
    ).toBe(400);
    expect(
      (await read(path, { 'Content-Type': 'application/json' }, 'POST', '{}'))
        .status,
    ).toBe(200);
    expect(refunds.submit).toHaveBeenLastCalledWith('mo-test', {}, 'admin');
    expect(
      (
        await read(
          path + '/check',
          { 'Content-Type': 'application/json' },
          'POST',
          '{}',
        )
      ).status,
    ).toBe(200);
    expect((await read(path, {}, 'DELETE')).status).toBe(405);
  });
  it('protects membership grants and records the session operator', async () => {
    const path = '/users/wx-test/membership';
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ note: '活动赠送', operator: 'forged' });
    expect(
      (await read(path, { ...headers, Cookie: '' }, 'POST', body)).status,
    ).toBe(401);
    expect(
      (
        await read(
          path,
          { ...headers, Origin: 'https://evil.example' },
          'POST',
          body,
        )
      ).status,
    ).toBe(403);
    expect((await read(path, {}, 'POST', body)).status).toBe(400);
    expect((await read(path, headers, 'POST', '{}')).status).toBe(400);
    expect((await read('/users/unknown/membership')).status).toBe(404);
    expect((await read(path, {}, 'DELETE')).status).toBe(405);
    const result = await read(path, headers, 'POST', body);
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      membership: { source: 'admin', status: 'active' },
      grant: { operator: 'admin', note: '活动赠送' },
    });
    expect(JSON.parse((await read(path)).body).grant.id).toBe(
      JSON.parse(result.body).grant.id,
    );
    const cancelPath = `${path}/revoke`;
    const input = JSON.stringify({
      note: '取消测试资格',
      expectedMembership: JSON.parse(result.body).membership,
      operator: 'forged',
    });
    expect(
      (await read(cancelPath, { ...headers, Cookie: '' }, 'POST', input))
        .status,
    ).toBe(401);
    expect(
      (
        await read(
          cancelPath,
          { ...headers, Origin: 'https://evil.example' },
          'POST',
          input,
        )
      ).status,
    ).toBe(403);
    expect((await read(cancelPath)).status).toBe(405);
    expect((await read(cancelPath, headers, 'POST', '{}')).status).toBe(400);
    const cancelled = await read(cancelPath, headers, 'POST', input);
    expect(cancelled.status).toBe(200);
    expect(JSON.parse(cancelled.body)).toMatchObject({
      membership: { status: 'free', source: 'admin_revoked' },
      revocation: { operator: 'admin', action: 'revoke', note: '取消测试资格' },
    });
  });
  afterAll(async () => {
    await server.onApplicationShutdown();
    if (originalUser === undefined) delete process.env.ADMIN_USERNAME;
    else process.env.ADMIN_USERNAME = originalUser;
    if (originalHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = originalHash;
    sessionCookie = '';
    if (original === undefined) delete process.env.LOCAL_ADMIN_ENABLED;
    else process.env.LOCAL_ADMIN_ENABLED = original;
  });
  it('serves real paged API records without exposing OpenID or a legacy HTML page', async () => {
    expect((await read('/')).status).toBe(404);
    expect((await read('/admin.html')).status).toBe(404);
    const result = await read('/data?section=users');
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body).items[0].id).toBe('wx-test');
    expect(result.body).not.toContain('private-openid');
    expect(JSON.parse((await read('/overview')).body).users).toBe(1);
  });
  it('protects account classification and applies its audience to summary and drilldown', async () => {
    const route = '/users/wx-test/test-flag';
    expect((await read(route, { Cookie: '' }, 'POST', '{}')).status).toBe(401);
    expect(
      (
        await read(
          route,
          { 'Content-Type': 'application/json' },
          'POST',
          JSON.stringify({ isTest: 'true', note: '测试' }),
        )
      ).status,
    ).toBe(400);
    const original = process.env.ADMIN_USER_LABELS_ENABLED;
    try {
      process.env.ADMIN_USER_LABELS_ENABLED = 'false';
      expect(
        (
          await read(
            route,
            { 'Content-Type': 'application/json' },
            'POST',
            JSON.stringify({ isTest: true, note: '开发测试' }),
          )
        ).status,
      ).toBe(403);
      process.env.ADMIN_USER_LABELS_ENABLED = 'true';
      expect(
        (
          await read(
            route,
            { 'Content-Type': 'application/json' },
            'POST',
            JSON.stringify({
              isTest: true,
              note: '开发测试',
              operator: 'forged',
            }),
          )
        ).status,
      ).toBe(200);
      expect(JSON.parse((await read(route)).body)).toMatchObject({
        isTest: true,
        testUpdatedBy: 'admin',
      });
      expect(
        JSON.parse((await read('/stats?days=7')).body).summary.newUsers,
      ).toBe(0);
      expect(
        JSON.parse((await read('/stats?days=7&excludeTest=false')).body).summary
          .newUsers,
      ).toBe(1);
      const day = new Date(Date.now() + 28800000).toISOString().slice(0, 10),
        path = `/stats/details?metric=newUsers&from=${day}&to=${day}`;
      expect(JSON.parse((await read(path)).body).total).toBe(0);
      expect(
        JSON.parse((await read(path + '&excludeTest=false')).body).total,
      ).toBe(1);
      expect(
        (
          await read(
            '/stats/details?metric=unknown&from=2026-10-01&to=2026-10-25',
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await read(
            '/stats/details?metric=newUsers&from=2026-02-31&to=2026-03-05',
          )
        ).status,
      ).toBe(400);
      expect((await read('/stats?excludeTest=invalid')).status).toBe(400);
      await read(
        route,
        { 'Content-Type': 'application/json' },
        'POST',
        JSON.stringify({ isTest: false, note: '恢复普通' }),
      );
    } finally {
      if (original === undefined) delete process.env.ADMIN_USER_LABELS_ENABLED;
      else process.env.ADMIN_USER_LABELS_ENABLED = original;
    }
  });
  it('rejects remote host, cross-origin requests, and forwarded requests', async () => {
    for (const headers of [
      { Host: 'evil.example:3002' },
      { Origin: 'https://evil.example' },
      { 'Sec-Fetch-Site': 'cross-site' },
      { 'X-Forwarded-For': '1.2.3.4' },
    ])
      expect((await read('/data', headers)).status).toBe(403);
  });
  it('validates queries and searches only allowed fields', async () => {
    expect((await read('/data?section=users&page=-1')).status).toBe(400);
    expect((await read('/data?section=secrets')).status).toBe(400);
    expect(
      JSON.parse((await read('/data?section=users&search=missing')).body).total,
    ).toBe(0);
    expect(
      JSON.parse((await read('/data?section=users&search=private-openid')).body)
        .total,
    ).toBe(0);
  });
  it('requires a valid session even for read-only data and rejects opaque origins', async () => {
    expect((await read('/stats?days=30', { Cookie: '' })).status).toBe(401);
    expect((await read('/overview', { Cookie: '' })).status).toBe(401);
    expect(
      (
        await read('/data?section=users', {
          Cookie: 'subscription_admin_session=' + 'a'.repeat(64),
        })
      ).status,
    ).toBe(401);
    expect((await read('/overview', { Origin: 'null' })).status).toBe(403);
    expect((await read('/data', {}, 'POST')).status).toBe(405);
    const session = JSON.parse((await read('/session')).body);
    expect(session).toMatchObject({ authenticated: true, username: 'admin' });
  });
  it('validates analytics ranges and returns Shanghai daily series', async () => {
    expect((await read('/stats?days=999')).status).toBe(400);
    for (const range of [7, 30, 90]) {
      const result = await read('/stats?days=' + range);
      expect(result.status).toBe(200);
      const stats = JSON.parse(result.body);
      expect(stats.days).toHaveLength(range);
      expect(stats.timezone).toBe('Asia/Shanghai');
      expect(stats.activity.dau).toBeNull();
    }
  });
  it('returns bounded pages across accounts', async () => {
    for (let index = 0; index < 25; index++) {
      await repository.saveWechatIdentity({
        userId: `page-user-${index}`,
        appId: 'test',
        openId: `openid-${index}`,
      });
    }
    const first = JSON.parse((await read('/data?section=users')).body);
    const second = JSON.parse((await read('/data?section=users&page=2')).body);
    expect(first.total).toBe(26);
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(6);
    expect(
      new Set(
        [...first.items, ...second.items].map(
          (item: { id: string }) => item.id,
        ),
      ).size,
    ).toBe(26);
  });
  it('reads simulated membership and order records without private payment request keys', async () => {
    await repository.saveMembership({
      userId: 'wx-test',
      status: 'active',
      plan: 'member',
      startedAt: '2026-10-01T00:00:00Z',
      source: 'simulation',
    });
    await repository.saveMembershipOrder({
      id: 'admin-test-order',
      userId: 'wx-test',
      requestId: 'private-request-key',
      productId: 'lifetime',
      productName: '永久会员',
      amount: 990,
      currency: 'CNY',
      channel: 'simulation',
      status: 'paid',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      paidAt: '2026-10-01T00:00:00Z',
    });
    const members = await read('/data?section=memberships&search=wx-test', {});
    expect(JSON.parse(members.body).items[0].source).toBe('simulation');
    const orders = await read(
      '/data?section=membershipOrders&search=admin-test-order',
      {},
    );
    expect(JSON.parse(orders.body).items[0].amount).toBe(9.9);
    expect(orders.body).not.toContain('private-request-key');
  });
  it('logout revokes the cookie, incorrect passwords are generic and rate limited', async () => {
    const prior = sessionCookie;
    expect((await read('/logout', {}, 'POST')).status).toBe(200);
    expect((await read('/overview', { Cookie: prior })).status).toBe(401);
    const body = JSON.stringify({
      username: 'admin',
      password: 'wrong-password',
    });
    for (let i = 0; i < 5; i++) {
      const rejected = await read(
        '/login',
        { 'Content-Type': 'application/json' },
        'POST',
        body,
      );
      expect(rejected.status).toBe(401);
      expect(JSON.parse(rejected.body).message).toBe('账号或密码不正确。');
    }
    expect(
      (
        await read(
          '/login',
          { 'Content-Type': 'application/json' },
          'POST',
          body,
        )
      ).status,
    ).toBe(429);
  });
});
