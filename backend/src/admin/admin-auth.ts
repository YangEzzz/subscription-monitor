import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

const COOKIE = 'subscription_admin_session';
const TTL = 8 * 60 * 60 * 1000;
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export class AdminAuth {
  private sessions = new Map<string, number>();
  private attempts = new Map<string, { count: number; until: number }>();
  readonly username = process.env.ADMIN_USERNAME || 'admin';
  private hash = process.env.ADMIN_PASSWORD_HASH || '';
  private secure =
    process.env.ADMIN_COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production';

  get configured() {
    return /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(this.hash);
  }

  current(request: IncomingMessage): string | null {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith(COOKIE + '='))
      ?.slice(COOKIE.length + 1);
    if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) return null;
    const key = digest(cookie);
    const expires = this.sessions.get(key);
    if (!expires || expires <= Date.now()) {
      this.sessions.delete(key);
      return null;
    }
    return this.username;
  }

  private setCookie(response: ServerResponse, token: string, maxAge: number) {
    response.setHeader(
      'Set-Cookie',
      `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${this.secure ? '; Secure' : ''}`,
    );
  }

  async login(request: IncomingMessage, response: ServerResponse) {
    if (!this.configured) {
      response.writeHead(503).end(
        JSON.stringify({
          message: '管理员账号尚未初始化，请先运行后台账号初始化命令。',
        }),
      );
      return;
    }
    const peer = request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    for (const [key, item] of this.attempts)
      if (item.until <= now) this.attempts.delete(key);
    const prior = this.attempts.get(peer);
    if (prior && prior.count >= 5) {
      response.setHeader(
        'Retry-After',
        String(Math.ceil((prior.until - now) / 1000)),
      );
      response
        .writeHead(429)
        .end(JSON.stringify({ message: '尝试次数过多，请15分钟后重试。' }));
      return;
    }
    if (!request.headers['content-type']?.startsWith('application/json')) {
      response
        .writeHead(415)
        .end(JSON.stringify({ message: '请使用JSON登录请求。' }));
      return;
    }
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > 4096) {
        response
          .writeHead(413)
          .end(JSON.stringify({ message: '登录请求过大。' }));
        return;
      }
      chunks.push(bytes);
    }
    let body: { username?: unknown; password?: unknown };
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      response
        .writeHead(400)
        .end(JSON.stringify({ message: '登录请求格式错误。' }));
      return;
    }
    if (
      !body ||
      typeof body.username !== 'string' ||
      typeof body.password !== 'string' ||
      body.password.length > 1024
    ) {
      response
        .writeHead(400)
        .end(JSON.stringify({ message: '请输入管理员账号和密码。' }));
      return;
    }
    // Count before awaiting password verification so concurrent attempts cannot bypass limits.
    if (this.attempts.size >= 1000 && !prior) {
      response
        .writeHead(429)
        .end(JSON.stringify({ message: '登录繁忙，请稍后重试。' }));
      return;
    }
    this.attempts.set(peer, {
      count: (prior?.count || 0) + 1,
      until: prior?.until || now + 15 * 60 * 1000,
    });
    const [, salt, expected] = this.hash.split('$');
    const actual = await new Promise<Buffer>((resolve, reject) =>
      scrypt(body.password as string, salt, 64, (error, key) =>
        error ? reject(error) : resolve(key),
      ),
    );
    const correct = timingSafeEqual(actual, Buffer.from(expected, 'hex'));
    const sameUser = timingSafeEqual(
      Buffer.from(digest(body.username)),
      Buffer.from(digest(this.username)),
    );
    if (!correct || !sameUser) {
      response
        .writeHead(401)
        .end(JSON.stringify({ message: '账号或密码不正确。' }));
      return;
    }
    this.attempts.delete(peer);
    for (const [key, expires] of this.sessions)
      if (expires <= now) this.sessions.delete(key);
    if (this.sessions.size >= 128)
      this.sessions.delete(this.sessions.keys().next().value!);
    const token = randomBytes(32).toString('hex');
    this.sessions.set(digest(token), now + TTL);
    this.setCookie(response, token, TTL / 1000);
    response.end(
      JSON.stringify({ authenticated: true, username: this.username }),
    );
  }

  logout(request: IncomingMessage, response: ServerResponse) {
    const token = request.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith(COOKIE + '='))
      ?.slice(COOKIE.length + 1);
    if (token) this.sessions.delete(digest(token));
    this.setCookie(response, '', 0);
    response.end(JSON.stringify({ authenticated: false }));
  }
}
