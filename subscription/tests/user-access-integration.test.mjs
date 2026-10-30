import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { scryptSync } from 'node:crypto';

test('HTTP login and authenticated reads update only the account access metadata', async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test', PERSISTENCE_DRIVER: 'memory',
    WECHAT_APP_ID: 'access-test-app', WECHAT_APP_SECRET: 'test-secret',
    AUTH_TOKEN_SECRET: 'test-auth-secret-at-least-thirty-two-bytes',
    LOCAL_ADMIN_ENABLED: 'true', LOCAL_ADMIN_BIND_HOST: '127.0.0.1',
    TRUSTED_PROXY_CIDRS: '127.0.0.1/32', NOTIFICATION_SCHEDULER_ENABLED: 'false',
    WECHAT_PAY_ENABLED: 'false', WECHAT_VIRTUAL_PAY_ENABLED: 'false',
    MEMBERSHIP_SIMULATION_ENABLED: 'false',
  });
  const oldAdminUser = process.env.ADMIN_USERNAME, oldAdminHash = process.env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_USERNAME = 'integration-admin';
  const salt = 'b'.repeat(32), password = 'integration-admin-password';
  process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt}$${scryptSync(password,salt,64).toString('hex')}`;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, options) => String(url).startsWith('https://api.weixin.qq.com/')
    ? Promise.resolve(new Response(JSON.stringify({ openid: 'private-openid' })))
    : originalFetch(url, options);
  let app;
  try {
    const require = createRequire(new URL('../../backend/package.json', import.meta.url));
    require('reflect-metadata');
    const { NestFactory } = require('@nestjs/core');
    const { VersioningType } = require('@nestjs/common');
    app = await NestFactory.create(require('./dist/app.module.js').AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    await app.listen(0, '127.0.0.1');
    const base = `${await app.getUrl()}/api/v1`;
    const adminLogin = await originalFetch('http://127.0.0.1:3002/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'integration-admin',password})});
    assert.equal(adminLogin.status,200);
    const cookie = adminLogin.headers.get('set-cookie').split(';')[0];
    const readUser = async () => {
      const response = await originalFetch('http://127.0.0.1:3002/data?section=users',{headers:{Cookie:cookie}});
      assert.equal(response.status, 200);
      const page = await response.json();
      assert.equal(page.total, 1);
      assert.ok(!JSON.stringify(page).includes('private-openid'));
      return page.items[0];
    };
    const login = await originalFetch(`${base}/auth/wechat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Real-IP': '203.0.113.7' },
      body: JSON.stringify({ code: 'test-code' }),
    });
    assert.equal(login.status, 200);
    const session = await login.json();
    assert.ok(!JSON.stringify(session).includes('203.0.113.7'));
    assert.equal((await readUser()).lastAccessIp, '203.0.113.7');
    const headers = { Authorization: `Bearer ${session.accessToken}`, 'X-Real-IP': '2001:db8::abc' };
    const membership = await originalFetch(`${base}/membership`, { headers });
    assert.equal(membership.status, 200);
    assert.ok(!JSON.stringify(await membership.json()).includes('lastAccessIp'));
    const recorded = await readUser();
    assert.equal(recorded.lastAccessIp, '2001:db8::abc');
    assert.ok(Number.isFinite(Date.parse(recorded.lastAccessAt)));
    const rejected = await originalFetch(`${base}/membership`, { headers: { Authorization: 'Bearer invalid', 'X-Real-IP': '192.0.2.99' } });
    assert.equal(rejected.status, 401);
    await originalFetch(`${base}/health`, { headers: { 'X-Real-IP': '192.0.2.99' } });
    await originalFetch(`${base}/membership`, { headers: { Authorization: headers.Authorization, 'X-Real-IP': 'invalid' } });
    assert.deepEqual(await readUser(), recorded);
  } finally {
    globalThis.fetch = originalFetch;
    if(oldAdminUser===undefined) delete process.env.ADMIN_USERNAME; else process.env.ADMIN_USERNAME=oldAdminUser;
    if(oldAdminHash===undefined) delete process.env.ADMIN_PASSWORD_HASH; else process.env.ADMIN_PASSWORD_HASH=oldAdminHash;
    if (app) await app.close();
  }
});
