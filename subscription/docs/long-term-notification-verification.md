# 长期微信通知验证（2026-09-30）

- 模板改为 DtXtPe3WigMtfa07tmFI5fkXHVwY1hh5wex7wdLh3to，amount4 为预计支出金额，time22 为下一扣费日期；不新增具体扣款时刻。
- WECHAT_SUBSCRIPTION_TYPE=long_term 启用可重复使用的授权；旧环境未设置时保持一次性模式和原 date12 字段。状态接口新增 subscriptionType、authorized；长期模式 credits=null，页面不显示授权次数。
- 发送成功或未知结果保留长期授权；同一账期/提醒节点不重复发送。暂停保留授权；拒绝、关闭授权或微信返回 43101 停用。新模板必须重新授权。
- 无数据库结构变更。Prisma 保持账号事务锁及账期节点唯一约束，长期模式跳过消耗 grant；本轮未连接真实 PostgreSQL。
- 后端 Jest 34/34，前端 Node 24/24，真实 Nest HTTP 集成 1/1 通过；Nest build、tsc --noEmit、ESLint 通过。
- 浏览器隔离预览复用实际 SettingsRow 和 remoteComputed，验证开启、暂停、未授权、网络失败和等待文案，320px 无横向溢出（clientWidth=scrollWidth=310），键盘 Enter 可切换状态。预览状态控制按钮仅用于测试，不属于产品。
- HBuilderX 文件监视器更新相应微信开发产物；本轮未连接微信开发者工具或手机，未向真实微信账号投递。上线后必须验证 time22 校验、模板权限、接收和取消授权。
- premium strict 审计仍为 43 条 actionless-button（检查器不识别 uni-app @tap），canonical unresolved=0，原始结果见 long-term-notification-audit.json。未改变样式及 token。designmd 离线缓存仍不可用。
