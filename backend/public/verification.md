# 临时后台验证

## 2026-09-30：修正后端域名

- 用户提供的地址少一个 z；依据现有 subscription/api/config.js 修正默认地址及部署说明为 subscription.yangezzz.top。
- DNS 查询正确域名有 A 记录，错误的 subscription.yangezz.top 不存在。正确域名 HTTPS 可连通，带 Origin null 的 /admin/overview 当前返回 403，线上部署仍待核对。
- 修改后 Edge/Playwright 文件页面回归通过；默认线上请求由测试拦截，不读取生产数据。git diff --check 通过。

## 2026-09-30：移除访问密钥（当前版本）

- 按用户要求移除管理接口密钥校验、HTML 密钥输入及请求头、环境示例和 Nginx 密钥转发。双击 HTML 即自动读取默认线上接口。
- Edge/Playwright file:// 测试通过：自动发起概览/列表请求且不携带密钥、地址校验、代理路径、搜索/清除、分页、空态、断连恢复和 390px 布局。默认线上请求由测试工具拦截，未访问生产数据。
- 后台 Jest 6 项、修改文件 ESLint、Prettier 通过。文件来源 GET 无需密钥，其他网站来源、写请求和非 GET 预检仍拒绝。
- 服务器命令和 Nginx 无密钥配置已更新至 deploy/临时管理后台.md，尚未推送或部署。下方带密钥记录属于先前版本；全量构建和集成验证的既有环境限制仍未解决。

## 2026-09-30：本地 HTML 连接线上后端

- Edge/Playwright 实际通过 `file://` 打开页面：初始不发送请求、默认线上接口地址、字段验证、密钥显示/隐藏、CORS 预检、代理路径前缀、20 条分页、搜索无结果/清除、通知空态、密钥错误、更正、断连/恢复和 390px 窄屏通过。测试使用独立 HTTP 测试进程，不访问生产数据。可运行 `backend/scripts/check-admin-file.cjs`（需要 Playwright 和 Edge；可用 ADMIN_BROWSER_CHANNEL 指定其他浏览器）。
- 后台 Jest 6 项通过，覆盖原本本机访问、远程来源拦截、查询校验、分页及新增文件请求鉴权/跨域预检。数据库模块在此 HTTP 单测中隔离，实际使用内存仓库。
- 修改的 TypeScript ESLint、HTML/TS/验证脚本 Prettier 和 git diff --check 通过。
- 小程序单元测试 26 项通过；原有 HTTP 集成测试失败（未认证请求预期 401，当前本地 dist 返回 200）。本地后端类型检查/构建受缺少 @prisma/adapter-pg 和生成的 Prisma 客户端阻塞，因此既有 dist 不能用于验证最新全量后端。未将此项记为通过。
- premium strict audit：0 unresolved，46 actionless-button 报告，与现有记录相同识别限制；新增密钥显示按钮及现有刷新/清除已由浏览器实际点击验证。完整静态报告位于忽略目录 subscription/.preview/admin-file-audit.json。DESIGN.md 颜色和字体未改，官方 design lint 因当前环境缺少 npm/designmd 执行器未完成。
- 窄屏截图：subscription/.preview/admin-file-mobile.png。未更新线上服务器或 Nginx，也未验证线上真实数据库连接；服务器需按 deploy/临时管理后台.md 配置密钥并启用 HTTPS 管理转发。

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
