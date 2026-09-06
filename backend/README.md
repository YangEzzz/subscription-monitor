# Subscription Monitor Backend

这是订阅管理项目的 NestJS API。当前阶段专注于前端交互验收，因此后端采用可替换的内存 mock 存储，不连接数据库、不接入支付和通知服务。

## 已收敛的运行范围

- 订阅增删改查、软删除/恢复
- 续费推进与十分钟撤销窗口
- 统计、分类占比、趋势和到期提醒
- 会员 mock、免费额度和设置
- 表单元数据和健康检查
- Swagger 接口文档

TypeORM、用户认证、邮件、文件上传、社交登录、国际化、Docker 数据库链路及其模板测试已从后端中移除。运行入口只加载订阅 API 和健康检查。

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

接口契约见 docs/subscription-api.md。

## Mock 数据说明

数据只存在于当前 Node 进程。默认用户为 demo-user，可以通过 x-demo-user-id 请求头切换内存用户。服务重启后会恢复 9 条演示订阅和默认设置；演示订阅不计入免费方案的 5 条额度。

这套实现的目标是先把页面交互、错误态和接口契约跑通。接数据库时不改接口，只替换 src/subscriptions/subscriptions.service.ts 的存储实现。
