# Subscription Monitor API

当前接口是本地 mock 版本，服务进程内使用变量保存数据，不连接数据库、不发起真实支付、不发送通知。重启服务后数据会恢复为种子数据。

## 基础约定

- Base URL：/api/v1
- Swagger：/docs
- OpenAPI JSON：/docs-json
- 默认用户：demo-user
- 可选请求头：x-demo-user-id，用于在内存中隔离不同演示用户
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

创建订阅。免费方案只允许 5 条非演示订阅，会员 mock 方案不限制数量。

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

按当前周期推进 nextBillingDate，并追加一条 renewalHistory。十分钟内重复调用会返回 409 RENEWAL_ALREADY_APPLIED。

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

返回当前 mock 会员状态、免费额度、权益。演示数据 isDemo=true 不占用免费额度。

### POST /membership/activate

本地模拟开通会员，不触发支付。

### POST /membership/restore

恢复免费方案。

### GET /settings

返回金额显隐、通知开关、默认提醒节点、提醒时间和时区。

### PATCH /settings

部分更新设置。reminderTime 使用 HH:mm，defaultReminders 的范围为 0–30 天。

## 表单元数据

### GET /catalog

返回前端表单需要的分类、周期、支付方式、货币、状态和常用服务模板。

## 健康检查

### GET /health

返回服务状态、当前运行模式和数据库连接状态。mock 阶段 database 固定为 not-connected。

## 后续接数据库的边界

前端只依赖上述 HTTP 契约；当前 SubscriptionsService 是唯一的内存存储边界。接入数据库时保留控制器和 DTO，只替换该服务的数组、Map 读写为 repository，并保留 displayStatus、软删除和续费撤销的业务规则。
