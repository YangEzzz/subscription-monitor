import { ConfigService } from '@nestjs/config';
import { request } from 'node:http';
import { LocalAdminServer } from './admin.module';
import { MemorySubscriptionsRepository } from '../subscriptions/repositories/memory-subscriptions.repository';

function read(
  path: string,
  headers: Record<string, string | undefined> = {},
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: '127.0.0.1', port: 3002, path, headers },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode!, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

describe('Local admin server', () => {
  const repository = new MemorySubscriptionsRepository();
  const server = new LocalAdminServer(
    new ConfigService({ app: { persistenceDriver: 'memory' } }),
    repository,
  );
  const original = process.env.LOCAL_ADMIN_ENABLED;
  beforeAll(async () => {
    process.env.LOCAL_ADMIN_ENABLED = 'true';
    await repository.saveWechatIdentity({
      userId: 'wx-test',
      appId: 'test',
      openId: 'private-openid',
    });
    await server.onApplicationBootstrap();
  });
  afterAll(async () => {
    await server.onApplicationShutdown();
    if (original === undefined) delete process.env.LOCAL_ADMIN_ENABLED;
    else process.env.LOCAL_ADMIN_ENABLED = original;
  });
  it('serves HTML and real paged records without exposing OpenID', async () => {
    expect((await read('/')).body).toContain('临时管理后台');
    const result = await read('/data?section=users');
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body).items[0].id).toBe('wx-test');
    expect(result.body).not.toContain('private-openid');
    expect(JSON.parse((await read('/overview')).body).users).toBe(1);
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
});
