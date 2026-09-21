# API 错误协议

所有 API 错误使用同一份 JSON 结构，响应头同时返回 `x-request-id`：

~~~json
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "请求参数校验失败",
  "errors": ["name should not be empty"],
  "requestId": "f6ebad02-1e55-46b2-a3e3-dca55e43ea10",
  "timestamp": "2026-09-10T12:00:00.000Z",
  "path": "/api/v1/subscriptions"
}
~~~

`errors` 只在存在字段级详情时返回。客户端可以显示 `message`，并在需要排查时展示 `requestId`；不要依赖英文校验文本判断业务分支。

## 稳定错误码

| HTTP 状态 | code | 含义 |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | 请求格式或参数错误 |
| 401 | `UNAUTHORIZED` | 未登录或身份无效 |
| 403 | `FORBIDDEN` | 无权执行操作 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `CONFLICT` | 资源状态冲突 |
| 409 | `DUPLICATE_RESOURCE` | 唯一字段冲突 |
| 422 | `VALIDATION_ERROR` | DTO 校验失败 |
| 429 | `RATE_LIMITED` | 请求过于频繁 |
| 500 | `INTERNAL_ERROR` | 未预期的服务端错误 |

Prisma 的唯一约束错误 `P2002` 会转换为 `DUPLICATE_RESOURCE`，记录不存在错误 `P2025` 会转换为 `NOT_FOUND`。未预期异常不会把堆栈或数据库消息返回给客户端，服务端日志会记录同一个 `requestId`。

客户端可以传入安全的 `x-request-id` 以串联一次请求；未传时服务端自动生成。写操作发生超时或网络中断时，客户端将结果标记为“尚未确认”，要求用户重新加载，避免在未知结果上自动重复写入。
