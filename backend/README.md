# Subscription Monitor Backend

这是订阅管理项目的 NestJS API。默认运行时采用内存存储，也可以通过环境变量切换到 PostgreSQL；没有数据库时仍能开发和测试。

## 已收敛的运行范围

- 订阅增删改查、软删除/恢复
- 续费推进与十分钟撤销窗口
- 统计、分类占比、趋势和到期提醒
- 账号会员状态、免费额度和设置
- 表单元数据和健康检查
- Swagger 接口文档

已接入微信小程序登录、Bearer 令牌认证和微信订阅消息；会员支付、邮件和文件上传未开放。内存模式仅供开发和测试，初始为空，不会创建数据库客户端。

## 启动

~~~powershell
cd backend
Copy-Item .env.example .env
pnpm install
pnpm start:dev
~~~

默认端口为 3001，也可以通过 APP_PORT 修改。

- API：http://localhost:3001/api/v1
- Swagger：http://localhost:3001/docs
- 健康检查：http://localhost:3001/api/v1/health

## 校验

~~~powershell
pnpm build
pnpm lint
pnpm test
~~~

接口契约见 [docs/subscription-api.md](docs/subscription-api.md)，统一错误结构和错误码见 [docs/errors.md](docs/errors.md)。

## 数据库离线准备

没有 PostgreSQL 时可以执行：

~~~powershell
pnpm db:validate
pnpm db:generate
~~~

这两个命令只校验模型并生成客户端，不访问数据库。拿到 PostgreSQL 连接地址后，把 `DATABASE_URL` 写入 `.env`，执行 `pnpm db:deploy` 应用已经提交的迁移，再设置 `PERSISTENCE_DRIVER=prisma`。数据表设计和接入步骤见 [docs/database.md](docs/database.md)。

## 数据持久化

开发和测试可用空内存仓库，重启会丢失数据。生产环境强制 PERSISTENCE_DRIVER=prisma 并配置 DATABASE_URL。没有共享演示身份，也不自动生成示例记录；旧演示标记的记录不进入账户列表、统计、额度和发送任务。

## 微信登录

后端 `.env` 配置 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 和随机的 `AUTH_TOKEN_SECRET`（至少 32 字节）。默认会话有效期为 7 天，可用 `AUTH_TOKEN_TTL_SECONDS` 调整；更换签名密钥会使已有令牌失效。

小程序调用 `uni.login({ provider: 'weixin' })`，把一次性 code 发送给 `POST /api/v1/auth/wechat`。后端调用微信 code2Session，返回 `accessToken`、`expiresAt` 和 `user.id`。后续请求使用 `Authorization: Bearer <accessToken>`；只有登录和健康检查无需令牌。服务端身份由 AppID 与 OpenID 派生，微信会话密钥不会返回客户端。

配置和真机联调见 [微信登录接入说明](../subscription/docs/微信登录接入说明.md)。

当前 API 通过 `SubscriptionsRepository` 接口访问数据。`PERSISTENCE_DRIVER=memory` 时使用 `MemorySubscriptionsRepository`；设置为 `prisma` 时使用 `PrismaSubscriptionsRepository`。

## Docker 生产部署

仓库根目录提供 `compose.yaml`，包含 PostgreSQL、自动迁移和 API 服务。生产环境变量、Nginx 与 HTTPS 配置步骤见 [deploy/README.md](../deploy/README.md)。
