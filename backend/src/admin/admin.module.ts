import { readAdminJson } from './admin-request';
import { AdminMembershipsService } from './admin-memberships.service';
import {
  STATS_METRICS,
  StatsMetric,
  validStatsDates,
} from '../subscriptions/repositories/statistics-details';
import { AdminRefundsService } from './admin-refunds.service';
import {
  Inject,
  Injectable,
  Logger,
  Module,
  Optional,
  HttpException,
  BadRequestException,
  ForbiddenException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createServer, Server } from 'node:http';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from '../subscriptions/repositories/subscriptions.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AdminAuth } from './admin-auth';
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
    @Optional() private readonly refunds?: AdminRefundsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.LOCAL_ADMIN_ENABLED !== 'true') return;
    // Container deployments publish this separate port on host loopback only.
    const host = process.env.LOCAL_ADMIN_BIND_HOST || '127.0.0.1';
    if (!['127.0.0.1', '0.0.0.0'].includes(host))
      throw new Error('Invalid LOCAL_ADMIN_BIND_HOST');
    const auth = new AdminAuth();
    const memberships = new AdminMembershipsService(this.repository);
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
        if (
          !allowedHosts.includes(request.headers.host || '') ||
          (origin &&
            !allowedHosts.some((value) => origin === `http://${value}`)) ||
          request.headers['sec-fetch-site'] === 'cross-site' ||
          request.headers['x-forwarded-for'] ||
          request.headers.forwarded
        ) {
          response.writeHead(403).end('访问来源不被允许');
          return;
        }
        const url = new URL(request.url || '/', 'http://localhost:3002');
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (url.pathname === '/session' && request.method === 'GET') {
          const username = auth.current(request);
          response.end(
            JSON.stringify({
              configured: auth.configured,
              authenticated: !!username,
              username,
            }),
          );
          return;
        }
        if (url.pathname === '/login' && request.method === 'POST') {
          await auth.login(request, response);
          return;
        }
        if (url.pathname === '/logout' && request.method === 'POST') {
          auth.logout(request, response);
          return;
        }
        if (!auth.current(request)) {
          response
            .writeHead(401)
            .end(JSON.stringify({ message: '请先登录管理后台。' }));
          return;
        }
        const rawAudience = url.searchParams.get('excludeTest');
        if (rawAudience !== null && !['true', 'false'].includes(rawAudience))
          throw new BadRequestException('统计范围不正确');
        const excludeTest = rawAudience !== 'false';
        const membershipRoute = url.pathname.match(
          /^\/users\/([A-Za-z0-9_-]{1,128})\/membership(\/revoke)?$/,
        );
        if (membershipRoute) {
          const userId = membershipRoute[1];
          if (request.method === 'GET' && !membershipRoute[2]) {
            response.end(JSON.stringify(await memberships.inspect(userId)));
            return;
          }
          if (request.method === 'POST') {
            if (process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED === 'false')
              throw new ForbiddenException(
                '当前环境未开放会员管理，请在可写后台处理。',
              );
            response.end(
              JSON.stringify(
                await memberships[membershipRoute[2] ? 'revoke' : 'grant'](
                  userId,
                  await readAdminJson(request),
                  auth.current(request)!,
                ),
              ),
            );
            return;
          }
          response
            .writeHead(405, {
              Allow: membershipRoute[2] ? 'POST' : 'GET, POST',
            })
            .end();
          return;
        }
        const userFlagRoute = url.pathname.match(
          /^\/users\/([A-Za-z0-9_-]{1,128})\/test-flag$/,
        );
        if (userFlagRoute) {
          const userId = userFlagRoute[1],
            canEdit = process.env.ADMIN_USER_LABELS_ENABLED !== 'false';
          if (request.method === 'GET') {
            response.end(
              JSON.stringify({
                ...(await this.repository.findUserTestFlag(userId)),
                canEdit,
              }),
            );
            return;
          }
          if (request.method === 'POST') {
            if (!canEdit)
              throw new ForbiddenException(
                '本地只读环境不修改账号标记，请在可写后台处理。',
              );
            const input = await readAdminJson(request);
            if (
              typeof input.isTest !== 'boolean' ||
              typeof input.note !== 'string' ||
              input.note.trim().length < 2 ||
              input.note.trim().length > 200
            )
              throw new BadRequestException(
                '请选择账号类型并填写 2–200 字的标记原因。',
              );
            await this.repository.setUserTestFlag(
              userId,
              input.isTest,
              input.note.trim(),
              auth.current(request)!,
            );
            response.end(
              JSON.stringify(await this.repository.findUserTestFlag(userId)),
            );
            return;
          }
          response.writeHead(405, { Allow: 'GET, POST' }).end();
          return;
        }
        const refundRoute = url.pathname.match(
          /^\/refunds\/([A-Za-z0-9_-]{1,64})(\/check)?$/,
        );
        if (refundRoute) {
          if (!this.refunds) {
            response
              .writeHead(503)
              .end(JSON.stringify({ message: '退款服务暂不可用' }));
            return;
          }
          const orderId = refundRoute[1],
            check = !!refundRoute[2];
          if (request.method === 'GET' && !check) {
            response.end(JSON.stringify(await this.refunds.inspect(orderId)));
            return;
          }
          if (request.method === 'POST') {
            const body = await readAdminJson(request);
            const result = check
              ? await this.refunds.check(orderId)
              : await this.refunds.submit(
                  orderId,
                  body,
                  auth.current(request)!,
                );
            response.writeHead(200).end(JSON.stringify(result));
            return;
          }
          response
            .writeHead(405, { Allow: check ? 'POST' : 'GET, POST' })
            .end();
          return;
        }
        if (request.method !== 'GET') {
          response.writeHead(405, { Allow: 'GET' }).end();
          return;
        }
        if (url.pathname === '/stats/details') {
          const metric = url.searchParams.get('metric') || '',
            from = url.searchParams.get('from') || '',
            to = url.searchParams.get('to') || '',
            search = (url.searchParams.get('search') || '').trim(),
            page = url.searchParams.get('page') || '1';
          const includeUndated = url.searchParams.get('includeUndated');
          if (
            (includeUndated !== null &&
              !['true', 'false'].includes(includeUndated)) ||
            !STATS_METRICS.includes(metric as StatsMetric) ||
            !validStatsDates(from, to) ||
            search.length > 128 ||
            !/^[1-9]\d{0,5}$/.test(page)
          )
            throw new BadRequestException('统计明细查询条件不正确');
          response.end(
            JSON.stringify(
              await this.repository.statsDetails({
                metric: metric as StatsMetric,
                from,
                to,
                excludeTest,
                includeUndated: includeUndated === 'true',
                page: Number(page),
                search,
              }),
            ),
          );
          return;
        }
        if (url.pathname === '/stats') {
          const days = url.searchParams.get('days') || '30';
          if (!['7', '30', '90'].includes(days)) {
            response
              .writeHead(400)
              .end(JSON.stringify({ message: '统计范围仅支持7、30或90天。' }));
            return;
          }
          response.end(
            JSON.stringify(
              await this.repository.adminStats(Number(days), excludeTest),
            ),
          );
          return;
        }
        if (url.pathname === '/overview') {
          const counts = await this.repository.adminOverview(excludeTest);
          response.end(
            JSON.stringify({
              ...counts,
              today: (await this.repository.adminStats(7, excludeTest)).days[6],
            }),
          );
          return;
        }
        if (url.pathname === '/data') {
          const section = url.searchParams.get('section') || 'subscriptions';
          const userId = (url.searchParams.get('userId') || '').trim();
          const failedOnly = url.searchParams.get('failedOnly');
          const rawPage = url.searchParams.get('page') || '1';
          const search = (url.searchParams.get('search') || '').trim();
          if (
            ![
              'billingIssues',
              'authEvents',
              'users',
              'subscriptions',
              'notifications',
              'memberships',
              'membershipOrders',
            ].includes(section) ||
            !/^[1-9]\d{0,5}$/.test(rawPage) ||
            search.length > 128 ||
            userId.length > 128 ||
            (failedOnly !== null && !['true', 'false'].includes(failedOnly))
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
                ...(userId ? { userId } : {}),
                ...(failedOnly === 'true' ? { failedOnly: true } : {}),
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
        if (error instanceof HttpException) {
          response.writeHead(error.getStatus()).end(
            JSON.stringify({
              message:
                typeof error.getResponse() === 'string'
                  ? error.getResponse()
                  : (error.getResponse() as { message?: unknown }).message ||
                    '操作失败，请重新核对',
            }),
          );
          return;
        }
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

@Module({
  imports: [SubscriptionsModule],
  providers: [LocalAdminServer, AdminRefundsService],
})
export class AdminModule {}
