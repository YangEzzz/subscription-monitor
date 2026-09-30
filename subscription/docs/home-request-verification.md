# 首页请求并发验证（2026-09-30）

- 原先通知 → 核心数据 → 统计三轮串行。现在通知与五个核心接口同时开始，核心完成立即结束页面 loading；通知和三周期统计后台完成，不再延迟详情导航或保存成功反馈。
- 统计币种依赖服务端 settings，拿到 settings 后才发出统计；列表翻页依赖 hasMore，保留必要依赖。未增加本地数据兜底。
- 通知加载期间使用 SettingsRow/首页横幅显示读取状态并禁用授权；通知失效、网络错误和账号变化沿用现有反馈。旧请求通过请求编号及账号校验丢弃。
- 前端 Node 26/26，真实 Nest HTTP 集成 1/1 通过。新增测试控制通知与统计请求不返回，确认六个初始请求都已发起、首页 dataReady=true、loading=false；还验证通知失败不阻断列表和清理账号后不回写旧通知。
- 本轮仅前端修改，不需要重建后端或变更数据库。实际网络延迟未测量优化后的真机结果；HBuilderX/微信开发者工具需重新编译验证。

- JS 语法及 Vue 页面模板编译通过，git diff --check 通过。浏览器隔离预览复用 SettingsRow 与实际 remoteComputed，确认读取通知时显示等待文案，返回后切换为长期提醒状态。没有实测完整小程序网络链路。
- premium strict 仍为 43 个既有 @tap 识别误报，canonical unresolved=0；原始结果保存在 subscription/.preview/home-request-audit.json。未修改样式、token 或 DESIGN.md；designmd 离线缓存仍不可用。
