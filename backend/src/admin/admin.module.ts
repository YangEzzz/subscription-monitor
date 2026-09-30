import {
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createServer, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from '../subscriptions/repositories/subscriptions.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AdminSection } from '../subscriptions/repositories/admin-read';

@Injectable()
export class LocalAdminServer
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private server?: Server;
  constructor(
    private readonly config: ConfigService,
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repository: SubscriptionsRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.LOCAL_ADMIN_ENABLED !== 'true') return;
    // Container deployments publish this separate port on host loopback only.
    const host = process.env.LOCAL_ADMIN_BIND_HOST || '127.0.0.1';
    if (!['127.0.0.1', '0.0.0.0'].includes(host))
      throw new Error('Invalid LOCAL_ADMIN_BIND_HOST');
    this.server = createServer((request, response) => {
      const handle = async () => {
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader(
          'Content-Security-Policy',
          "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        );
        const allowedHosts = ['localhost:3002', '127.0.0.1:3002'];
        const origin = request.headers.origin;
        const fileOrigin = origin === 'null';
        if (
          !fileOrigin &&
          (!allowedHosts.includes(request.headers.host || '') ||
            (origin &&
              !allowedHosts.some((value) => origin === `http://${value}`)) ||
            request.headers['sec-fetch-site'] === 'cross-site' ||
            request.headers['x-forwarded-for'] ||
            request.headers.forwarded)
        ) {
          response.writeHead(403).end('仅允许本地访问');
          return;
        }
        if (fileOrigin) {
          response.setHeader('Access-Control-Allow-Origin', 'null');
          response.setHeader('Vary', 'Origin');
          if (request.method === 'OPTIONS') {
            if (
              request.headers['access-control-request-method'] !== 'GET' ||
              request.headers['access-control-request-headers']
            ) {
              response.writeHead(403).end();
              return;
            }
            response.setHeader('Access-Control-Allow-Methods', 'GET');
            response.writeHead(204).end();
            return;
          }
        }
        if (request.method !== 'GET') {
          response.writeHead(405, { Allow: 'GET' }).end();
          return;
        }
        const url = new URL(request.url || '/', 'http://localhost:3002');
        if (url.pathname === '/' || url.pathname === '/admin.html') {
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(
            await readFile(join(__dirname, '../../public/admin.html')),
          );
          return;
        }
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (url.pathname === '/overview') {
          const counts = await this.repository.adminOverview();
          response.end(
            JSON.stringify({
              ...counts,
              persistence: this.config.get('app.persistenceDriver'),
              notificationsConfigured: Boolean(
                this.config.get('app.wechatReminderTemplateId') &&
                this.config.get('app.wechatAppSecret'),
              ),
              schedulerEnabled: this.config.get(
                'app.notificationSchedulerEnabled',
              ),
            }),
          );
          return;
        }
        if (url.pathname === '/data') {
          const section = url.searchParams.get('section') || 'subscriptions';
          const rawPage = url.searchParams.get('page') || '1';
          const search = (url.searchParams.get('search') || '').trim();
          if (
            !['users', 'subscriptions', 'notifications'].includes(section) ||
            !/^[1-9]\d{0,5}$/.test(rawPage) ||
            search.length > 128
          ) {
            response
              .writeHead(400)
              .end(JSON.stringify({ message: '查询条件不正确' }));
            return;
          }
          response.end(
            JSON.stringify(
              await this.repository.adminRead({
                section: section as AdminSection,
                page: Number(rawPage),
                search,
              }),
            ),
          );
          return;
        }
        response
          .writeHead(404)
          .end(JSON.stringify({ message: '没有找到此页面' }));
      };
      void handle().catch((error: unknown) => {
        new Logger('LocalAdmin').error(
          '本地后台查询失败',
          error instanceof Error ? error.stack : undefined,
        );
        if (!response.headersSent)
          response.writeHead(500, {
            'Content-Type': 'application/json; charset=utf-8',
          });
        response.end(
          JSON.stringify({ message: '查询失败，请检查后端日志并重试' }),
        );
      });
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(3002, host, () => resolve());
    });
    new Logger('LocalAdmin').log('临时后台已启动：http://127.0.0.1:3002');
  }
  async onApplicationShutdown(): Promise<void> {
    if (this.server)
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
  }
}

@Module({ imports: [SubscriptionsModule], providers: [LocalAdminServer] })
export class AdminModule {}
