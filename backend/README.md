# Subscription Monitor Backend

这是订阅管理项目的 NestJS API。默认运行时采用内存存储，也可以通过环境变量切换到 PostgreSQL；没有数据库时仍能开发和测试。

## 已收敛的运行范围

- 订阅增删改查、软删除/恢复
- 续费推进与十分钟撤销窗口
- 统计、分类占比、趋势和到期提醒
- 会员 mock、免费额度和设置
- 表单元数据和健康检查
- Swagger 接口文档

用户认证、邮件、文件上传、社交登录和通知发送尚未接入。运行入口只加载订阅 API 和健康检查；内存模式不会创建数据库客户端。

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

## Mock 数据说明

数据只存在于当前 Node 进程。默认用户为 demo-user，可以通过 x-demo-user-id 请求头切换内存用户。服务重启后会恢复 9 条演示订阅和默认设置；演示订阅不计入免费方案的 5 条额度。

当前 API 通过 `SubscriptionsRepository` 接口访问数据。`PERSISTENCE_DRIVER=memory` 时使用 `MemorySubscriptionsRepository`；设置为 `prisma` 时使用 `PrismaSubscriptionsRepository`。

## Docker 生产部署

仓库根目录提供 `compose.yaml`，包含 PostgreSQL、自动迁移和 API 服务。生产环境变量、Nginx 与 HTTPS 配置步骤见 [deploy/README.md](../deploy/README.md)。
