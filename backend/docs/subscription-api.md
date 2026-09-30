# Subscription Monitor API

业务数据按微信账号隔离并由后端保存。生产环境使用 PostgreSQL，开发和测试的空内存仓库不会生成示例数据。微信通知已接入授权、定时任务及发送记录，会员支付尚未开放。

## 基础约定

- Base URL：/api/v1
- Swagger：/docs
- OpenAPI JSON：/docs-json
- 所有业务接口必须使用已验证的微信账号，无默认共享用户
- 登录：POST /api/v1/auth/wechat，提交微信登录 code，返回 accessToken、expiresAt 和 user.id
- 业务接口请求头：Authorization: Bearer <accessToken>，服务端按验证后的微信身份隔离数据；x-demo-user-id 不再生效
- 成功响应直接返回 JSON；错误响应沿用 NestJS 的 HTTP 错误格式
- 日期统一使用 YYYY-MM-DD，时间统一使用 ISO 8601
- 金额使用数字，货币使用 ISO 4217 三字母代码

## 订阅资源

### GET /subscriptions

查询订阅列表。

查询参数：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| page | number | 1 | 页码，从 1 开始 |
| limit | number | 20 | 每页 1–100 条 |
| search | string | - | 匹配名称、套餐和备注 |
| category | string | - | video、music、cloud、ai、productivity、reading、other |
| status | string | all | active、trial、upcoming、pending、overdue、paused、cancelled、archived |
| sort | string | date | date、amount、created |
| includeDeleted | boolean | false | 是否包含软删除记录 |

响应：

~~~json
{
  "data": [
    {
      "id": "sub_1001",
      "name": "Netflix Premium",
      "plan": "Premium",
      "amount": 108,
      "currency": "CNY",
      "cycle": "monthly",
      "nextBillingDate": "2026-09-16",
      "category": "video",
      "status": "active",
      "displayStatus": "upcoming",
      "daysUntilBilling": 10,
      "monthlyEquivalent": 108,
      "isDemo": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 9, "hasMore": false }
}
~~~

displayStatus 是结合周期、提醒窗口和到期日计算的展示状态；status 是用户可持久化的生命周期状态。

### GET /subscriptions/:id

获取单条订阅详情，返回列表项全部字段和 renewalHistory。

### POST /subscriptions

创建订阅。免费账号限 5 条订阅，会员账号额度由数据库中的会员状态决定。

必填字段：name、category、cycle、nextBillingDate。

可选字段：plan、logo、color、amount、currency、cycleValue、payment、autoRenew、reminders、trialEndDate、note、cancelGuide。

支持的周期：weekly、monthly、quarterly、semiannual、yearly、custom_days、one_off。

### PATCH /subscriptions/:id

部分更新订阅。字段与创建接口相同，另外允许更新 status。被软删除的订阅需先恢复。

### DELETE /subscriptions/:id

软删除订阅，数据不会立即丢失。

### POST /subscriptions/:id/restore

恢复软删除订阅；恢复时同样检查免费额度。

### POST /subscriptions/:id/renew

可选请求体：`{ "billingDate": "2028-01-31" }`，表示用户正在确认的原账期。客户端应始终携带此字段；若该账期已有历史，返回已处理结果而不再次推进日期；若与当前账期不匹配且无对应历史，返回 409 BILLING_PERIOD_CHANGED。

按周期推进 nextBillingDate，并追加 renewalHistory。自然月周期保存原始 anchorDay，确保 1 月 31 日 → 2 月末 → 3 月 31 日；编辑扣费日时重设锚点。一次性项目保持扣费日并归档，也支持十分钟内撤销。

兼容未传账期的旧请求：十分钟内再次调用仍返回 409 RENEWAL_ALREADY_APPLIED。以上幂等记录目前只存在于演示进程内。

### POST /subscriptions/:id/undo-renewal

撤销最近一次续费，仅在续费十分钟内有效；超时返回 409 RENEWAL_UNDO_WINDOW_EXPIRED。

## 仪表盘与提醒

### GET /dashboard/stats

参数：

- period=month：按月均等价金额统计
- period=year：按年化金额统计
- period=next30：未来 30 天实际扣费金额统计
- currency=CNY：统计货币

响应包含 total、subscriptionCount、categoryStats、未来六个月的 trend。

### GET /reminders?days=30

返回未来指定天数内的到期项和已逾期项，支持 1–90 天。每项包含 urgency、daysUntilBilling、nextReminderInDays。

## 会员与设置

### GET /membership

返回当前账号的只读会员状态、额度和可用功能。旧模拟开通与恢复接口已移除，调用返回 404。

### GET /settings

返回金额显隐、通知开关、默认提醒节点、提醒时间和时区。

### PATCH /settings

部分更新设置。reminderTime 使用 HH:mm，defaultReminders 的范围为 0–30 天。

## 表单元数据

### GET /catalog

返回前端表单需要的分类、周期、支付方式、货币、状态和常用服务模板。

## 健康检查

### GET /health

返回服务状态、当前运行模式和数据库连接状态。内存开发模式不会连接数据库；生产模式检查 PostgreSQL 连接。

## 数据持久化边界

前端只依赖上述 HTTP 契约；SubscriptionsService 通过 SubscriptionsRepository 访问 PostgreSQL 或测试内存仓库，并保留 displayStatus、软删除和续费撤销的业务规则。

## 微信订阅消息

`GET /notifications` 返回通知配置、启用状态、授权类型 `subscriptionType`（once / long_term）、授权状态 `authorized` 和近期发送结果。一次性模式 `credits` 为估计剩余次数；长期模式为 null，发送后保留授权。`POST /notifications/authorization` 提交原生授权回执，参数为唯一 requestId、当前 templateId 和 accept/reject/ban。相同回执重复提交不会重复新增授权。长期模式 reject/ban 或微信返回 43101 会停用；模板变更后须重新授权。部署配置及字段映射见 deploy/微信通知部署.md。

设置接口不再接受旧的 weeklySummary 和 notificationAuthorization 字段；旧字段会被白名单过滤，也不再返回。通知授权仅通过专用回执接口处理。
