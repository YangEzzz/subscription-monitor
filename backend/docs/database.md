# 数据库接入准备

## 当前状态

项目已经完成不依赖数据库连接的 PostgreSQL 基础工作：

- `prisma/schema.prisma` 定义用户、订阅、提醒节点、续费记录、设置和会员状态。
- `prisma/migrations/20260909000000_init/migration.sql` 是可直接部署的初始迁移。
- Prisma Client 在构建前生成到 `src/generated/prisma`，该目录不提交到 Git。
- `SubscriptionsService` 只依赖 Repository 接口，默认注入内存实现。
- Prisma Repository 已实现订阅、设置和会员读写；创建、更新、软删除、续费和撤销可以在数据库事务中执行。
- `PERSISTENCE_DRIVER` 支持 `memory` 和 `prisma`；选择 `prisma` 时必须配置 `DATABASE_URL`，否则启动会立即失败并给出明确错误。
- 默认 API 仍使用内存数据，现有前端联调、单元测试和集成测试不受影响。
- 健康检查在未配置连接串时返回 `database: schema-ready`；配置后返回 `configured-not-connected`，避免误报数据库已连接。

`pnpm db:validate` 和 `pnpm db:generate` 都不访问数据库，可以立即使用。

## 数据模型

| 表 | 用途 |
| --- | --- |
| `app_users` | 用户根记录，当前 `x-demo-user-id` 将来映射到该主键 |
| `subscriptions` | 订阅主体、账单周期、金额、状态和软删除字段 |
| `subscription_reminders` | 每条订阅的多个提前提醒节点 |
| `renewal_events` | 续费历史和撤销所需的前后账单日期 |
| `user_settings` | 默认币种、提醒规则、摘要和时区偏好 |
| `memberships` | 免费版或会员版状态 |

金额使用 `DECIMAL(12,2)`，日期使用 PostgreSQL `DATE`，事件时间使用 `TIMESTAMPTZ(3)`。所有业务表按用户或订阅建立索引；外键采用级联删除，应用层仍对订阅执行软删除。

## 有 PostgreSQL 后

1. 创建空数据库和权限受限的应用账号。
2. 在 `backend/.env` 填写真实连接串：

   ~~~env
   DATABASE_URL=postgresql://user:password@host:5432/subscription_monitor?schema=public
   ~~~

3. 部署迁移：

   ~~~powershell
   pnpm db:deploy
   ~~~

4. 设置 `PERSISTENCE_DRIVER=prisma` 并启动后端。Prisma Client 会在首次查询时连接数据库，应用关闭时释放连接池。
5. 导入演示种子并运行 HTTP 集成测试，确认分页、额度、续费幂等和十分钟撤销窗口。

如果需要临时退回本地开发，只需设置：

~~~env
PERSISTENCE_DRIVER=memory
~~~

生产环境只使用 `db:deploy`。`db:migrate` 用于开发数据库创建新迁移，会使用 shadow database，不应直接在生产服务器运行。
