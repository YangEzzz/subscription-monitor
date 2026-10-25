# Subscription Monitor Backend

这是订阅管理项目的 NestJS API。默认运行时采用内存存储，也可以通过环境变量切换到 PostgreSQL；没有数据库时仍能开发和测试。

## 已收敛的运行范围

- 订阅增删改查、软删除/恢复
- 续费推进与十分钟撤销窗口
- 统计、分类占比、趋势和到期提醒
- 账号会员状态、免费额度和设置
- 表单元数据和健康检查
- Swagger 接口文档

已接入微信小程序登录、Bearer 令牌认证和微信订阅消息；会员支持可配置的模拟支付（不收款）和个人主体小程序虚拟支付（道具直购，默认关闭）。虚拟支付配置、回调和部署前逐项验收见 `../deploy/个人主体虚拟支付.md`，模拟支付见 `../deploy/模拟会员支付.md`。邮件和文件上传未开放。内存模式仅供开发和测试，初始为空，不会创建数据库客户端。

## 启动

~~~powershell
cd backend
Copy-Item .env.example .env
pnpm install
pnpm start:dev
~~~

默认端口为 3001，也可以通过 APP_PORT 修改。

## 管理后台

Vue 3 后台参考 [shadcn-vue-admin](https://github.com/Whbbit1999/shadcn-vue-admin) 开发，提供概览、用户、订阅、会员、订单、通知的只读查询，支持搜索、服务器分页、详情与深浅色主题。

设置 `LOCAL_ADMIN_ENABLED=true` 后，后端提供 http://127.0.0.1:3002/overview 和 /data 只读接口。管理界面是仓库根 `admin/` 下的独立 Vue 项目，分别安装、构建和部署；见 [admin/README.md](../admin/README.md) 与 [Vue 后台部署](../deploy/vue-admin.md)。后端不再提供旧 HTML 页面。

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


## 本地后端读取线上数据库

开发链路：本地 Vue（5174）→ 本地 Nest 管理接口（3002）→ SSH 隧道（15432）→ 服务器 PostgreSQL。后端修改由 watch 重新编译，无需部署 API。数据库新增表或字段仍需迁移；开发新表/写操作优先使用独立开发库或线上数据副本，不向线上库自动运行迁移。

1. 用已有 SSH 登录方式，查询服务器 postgres 容器当前的内网 IP。该 IP 不是公网地址；数据库无需开放公网端口。
2. 保持 SSH 隧道运行：`ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:15432:数据库容器IP:5432 SSH主机别名`。本机只监听 127.0.0.1。
3. 在 backend 目录运行 `pnpm start:local`，或者 `node scripts/start-local.cjs`。复用 `.env` 的账号密码和数据库名，只在启动进程内把数据库主机/端口改为 127.0.0.1:15432；不会覆盖原 `.env`。
4. 将 `admin/.env.local` 的 `VITE_DEV_API_TARGET` 设为 `http://127.0.0.1:3002`，删除 `VITE_DEV_API_ORIGIN`，重启 Vite。前端 `/api/` 转发到本地 Nest。

启动脚本默认启用数据库会话只读，关闭通知定时任务和支付任务，业务/管理端口均监听本机。只读模式可以查真实用户和已有数据，但不能测试注册、登录写日志等写操作；缺少 auth_events 表时日志接口仍报错，不伪造空日志。

可在不提交的 `backend/.env.local` 中覆盖 `DATABASE_URL`（如开发库凭据）、`LOCAL_DATABASE_HOST`、`LOCAL_DATABASE_PORT`；明确需要在独立开发库测试写入时设置 `LOCAL_DATABASE_READ_ONLY=false`。脚本不会创建隧道、不会复制数据库、不会执行迁移，也不会部署服务器。隧道未就绪时启动失败并给出提示，不输出连接密码。


### 直接连接服务器数据库（已选择的本地配置）

本机 `backend/.env.local` 已配置 `LOCAL_DATABASE_HOST=47.123.5.37`、`LOCAL_DATABASE_PORT=5432`、`LOCAL_DATABASE_READ_ONLY=true`，凭据继续取自不提交的 `.env`。

服务器可额外使用根目录 `compose.db-access.yaml` 发布 PostgreSQL 端口。云安全组先仅允许开发机公网 IP `/32` 访问 TCP 5432，再在项目根目录执行：

```bash
sudo docker compose --env-file deploy/.env.production -f compose.yaml -f compose.db-access.yaml up -d --no-deps postgres
```

这一步会重建数据库容器以增加端口映射，复用现有 postgres-data 数据卷；不执行迁移、不重建 API，数据库连接可能短暂中断。不要使用 `down -v`。以后服务器 Compose 更新应继续带上这两个 `-f` 参数，避免意外移除端口映射。

端口连通后本机执行 `node backend/scripts/start-local.cjs`，并将 Vite 管理代理切换为 `http://127.0.0.1:3002`。修改本地后端无需部署服务器。线上现有库缺少新表时仍需一次数据库迁移，或改用有迁移的开发库测试新功能。
