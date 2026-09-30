# 临时后台验证

2026-09-30，第一版只读后台。

- 后端 TypeScript 检查、Nest 构建、修改文件 ESLint 和 Prettier 完成。
- 后端 Jest：本地 HTTP 服务返回真实仓库数据、拒绝非本机 Host/跨站 Origin/转发请求、查询校验、隐藏 OpenID、分页覆盖。
- 小程序 API/auth/notifications 26 项测试及真实 Nest HTTP 集成 1 项通过。
- 浏览器使用临时内存测试仓库（25 个测试账号与订阅），验证列表、未知金额、20 条分页与末页、中文搜索无结果、清除、分类切换、通知空态、键盘打开/关闭原生 select、390px 窄屏及表格水平滚动。测试数据只在单独预览进程内，未写入数据库。
- 截图：`subscription/.preview/admin-preview.jpg`（忽略的本地验证产物）。
- 未连接生产 PostgreSQL；未执行 Docker 部署。通知记录非空及发送失败状态待真实数据验证。
- 停止预览服务器后的页面导航被浏览器工具策略拦截，未完成浏览器断连恢复验证。代码含 20 秒超时和可重试错误提示。
- premium strict audit：0 unresolved，45 actionless-button 报告。43 个来自现有 uni-app @tap，2 个来自 HTML addEventListener（刷新/清除）。这些绑定已通过浏览器点击验证；静态检查器只识别内联 onclick / @click，报告不视为整体通过。
- DESIGN.md 官方 lint 执行失败：离线缓存缺少 @google/design.md（ENOTCACHED）；既有颜色字体未改，HTML 镜像 `subscription/styles/_tokens.scss`，原生 HTML 的交互所有权记录在 UX-CONTRACT.md。
