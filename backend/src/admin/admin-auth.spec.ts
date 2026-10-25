import { AdminAuth } from './admin-auth';
import { scryptSync } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

function request(password = 'correct-administrator-password') {
  const incoming = Readable.from([
    Buffer.from(JSON.stringify({ username: 'admin', password })),
  ]) as IncomingMessage;
  incoming.headers = { 'content-type': 'application/json' };
  Object.defineProperty(incoming, 'socket', {
    value: { remoteAddress: '127.0.0.1' },
  });
  return incoming;
}
function response() {
  const headers: Record<string, string> = {};
  let body = '';
  let code = 200;
  const output = {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    writeHead: (status: number) => {
      code = status;
      return output;
    },
    end: (value: string) => {
      body = value;
    },
  };
  return {
    output: output as unknown as ServerResponse,
    headers,
    body: () => JSON.parse(body),
    code: () => code,
  };
}
describe('admin session boundary', () => {
  const original = {
    hash: process.env.ADMIN_PASSWORD_HASH,
    user: process.env.ADMIN_USERNAME,
  };
  beforeEach(() => {
    const salt = 'a'.repeat(32);
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt}$${scryptSync('correct-administrator-password', salt, 64).toString('hex')}`;
  });
  afterEach(() => {
    if (original.hash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = original.hash;
    if (original.user === undefined) delete process.env.ADMIN_USERNAME;
    else process.env.ADMIN_USERNAME = original.user;
    jest.restoreAllMocks();
  });
  it('issues an HttpOnly cookie, expires it, and does not expose password material in the response', async () => {
    const auth = new AdminAuth(),
      res = response();
    await auth.login(request(), res.output);
    expect(res.headers['Set-Cookie']).toContain('HttpOnly');
    expect(res.headers['Set-Cookie']).toContain('SameSite=Strict');
    expect(JSON.stringify(res.body())).not.toMatch(
      /password|scrypt|correct-administrator/,
    );
    const req = request();
    req.headers.cookie = res.headers['Set-Cookie'].split(';')[0];
    expect(auth.current(req)).toBe('admin');
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 9 * 60 * 60 * 1000);
    expect(auth.current(req)).toBeNull();
  });
  it('revokes a session at logout and cannot accept a forged token', async () => {
    const auth = new AdminAuth(),
      res = response();
    await auth.login(request(), res.output);
    const req = request();
    req.headers.cookie = res.headers['Set-Cookie'].split(';')[0];
    auth.logout(req, response().output);
    expect(auth.current(req)).toBeNull();
    req.headers.cookie = 'subscription_admin_session=' + 'f'.repeat(64);
    expect(auth.current(req)).toBeNull();
  });
  it('fails closed without a configured password', async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    const auth = new AdminAuth(),
      res = response();
    await auth.login(request(), res.output);
    expect(res.code()).toBe(503);
  });
});
