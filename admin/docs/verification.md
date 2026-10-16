# Vue 管理后台验证

日期：2026-10-14，北京时间。

## 项目与部署结构

用户要求独立、可部署的 Vue 项目。源码位于 `admin/`；前端和 `backend/` 分别安装、构建。标准 Vite 产物包含 index.html、独立 JS 与 CSS，旧 backend/public/admin.html 已删除，后端 HTML 路由已退役。新增 admin Dockerfile、Nginx 模板和根 compose admin 服务；默认宿主只绑定 127.0.0.1:8080，生产部署与可选公网认证入口见 deploy/vue-admin.md。

| DESIGN.md 规则                            | 实现证据                       | 结果           |
| ----------------------------------------- | ------------------------------ | -------------- |
| 品牌绿、12px/8px 圆角、系统中文与数字字体 | src/style.css 与共享组件       | 保留           |
| 桌面 shadcn-vue-admin 参考                | 侧栏、指标卡、表格、深浅色主题 | 桌面扩展已记录 |
| 无装饰增长数据、真实接口                  | /overview、/data 与 data.ts    | 保留           |
| 面板无阴影，日期/金额优先                 | 桌面与390px截图                | 保留           |

## 验证结果

- Vue 类型检查、标准生产构建、5 项数据测试通过。
- Chromium 9 项 E2E 通过：从 dist 加载外部 JS/CSS，在生产 Nginx 相同 CSP 下验证；覆盖概览、主题持久化、服务器分页、搜索/清除、用户跳转与 Back、详情字段/Escape/焦点、初次失败/刷新旧数据、中文合成输入、搜索请求竞争、390px导航/表格、连接状态、未知 URL/畸形响应，以及 /admin/ 子目录资源与 API 前缀。
- E2E 仅使用测试拦截器响应；测试数据不会打包到 Vue 页面，不访问生产数据库。
- 已检查桌面深色概览与390px浅色列表截图，表格横向滚动不造成页面溢出。截图输出于 git 忽略的 test-results。
- 完整 Nest 构建通过；初次测试遇到旧 Prisma 客户端，运行既有 prisma generate 后修复，未修改模型或迁移。
- 后端原有49项测试及修改文件 ESLint/Prettier检查通过，包含旧 HTML 路由返回404以及真实分页/只读访问规则。
- 原有移动应用35项单元测试通过；会员HTTP集成通过。另一原有集成测试 subscription/tests/api-integration.test.mjs:95 期望服务模板数量2，未改动接口返回5，该断言与本次后台无关，未修改。
- DESIGN.md lint 无错误，7项既有 frontmatter token 引用警告。

## 审计边界

后台 strict audit 使用 premium-audit.config.json，结果保存 docs/premium-audit.json。根 strict audit 的52项 actionless-button报告来自原有 uni-app @tap，当前审计器只识别 @click/onclick；原有移动事件测试通过。审计器只支持七种基础 capability，后台配置声明涉及的 Form/Scrollbar/Toast/CRUD；导航、Dialog、Async state 在根 UX-CONTRACT 中记录并由 E2E 验证。

## 执行边界

未访问或修改生产数据库，未发送微信消息，未部署线上。此电脑没有 docker 命令，因此未实际构建/运行 Docker 镜像或执行容器 Nginx；已验证标准 Vue dist 在 HTTP/CSP 下的运行、子目录部署和构建配置。默认使用现有无应用层管理员登录的只读 API，Docker服务仅本机发布；公网部署文档提供独立 Nginx认证入口。

## 2026-10-16 用户最近访问记录

用户列表与记录详情新增最近访问 IP/时间；复用 AdminTable、data.ts 与原有 Dialog，不增加颜色、控件或新交互。IPv4/IPv6 显示原值、时间按 Asia/Shanghai、旧字段缺失/空值为“—”。用户列表的现有分页、搜索与错误恢复沿用原行为。

验证：后端 build/lint、12套71项单元测试；后台 typecheck/build/format、5项单元和10项 Playwright 浏览器测试；小程序41项单元和4项HTTP集成全部通过。新增HTTP测试覆盖成功登录、后续认证请求更新、匿名/无效令牌/非法IP不污染记录、普通响应不暴露IP。浏览器在390px核对完整IPv6详情、北京时间、空值与Escape关闭；截图 `admin/test-results/user-access-mobile.png`（测试产物不提交）。

官方 designmd lint 为0错误、7项既有未引用token警告。后台独立 Premium strict audit 为0 findings；根审计仍报告移动端53项 `@tap` 按钮识别问题，无 admin 项、无 unresolved，本次未改这些移动端按钮，不将根审计记为通过。原有移动端事件测试通过。Prisma validate和更新脚本语法检查通过；数据库迁移与脚本未在生产执行，线上记录需要服务器更新后验收。

## 2026-10-16 正式接入 shadcn-vue

使用官方 `shadcn-vue@2.8.2` CLI 初始化 components.json，并通过 `add button badge dialog input table card sheet --yes` 安装45个源码文件（reka-nova）。依赖已固定到 pnpm 锁文件。系统 Node22.14 不满足CLI当前undici依赖，生成时使用本机已有Node24.19；维护CLI推荐Node24LTS。旧手写 ui/Button.vue、ui/Badge.vue、ui/AppDialog.vue 删除，页面直接使用官方 Button/Input/Table/Card，业务 StatusBadge 与 AppDialog 组合官方 Badge/Dialog/Sheet。

类型检查、生产构建、格式检查、5项单元测试和11项浏览器测试通过。新增浏览器验证确认页面实际挂载官方 data-slot（Card、Input、Table、Badge、Dialog、Sheet），并验证关闭按钮、Escape和导航抽屉。搜索输入根节点焦点恢复、中文合成、分页、主题、长IP及空态、错误恢复、窄屏无页面横向溢出均通过；横向滚动由官方 Table container 独占。

静态审计报告5处 actionless-button，均为官方 DialogClose/SheetClose 的 as-child Button（含官方未启用的默认关闭控件）。这些按钮由父级注入关闭行为，浏览器实际关闭、Escape与焦点恢复通过；保留官方组合方式，不加无意义回调来消除扫描结果，未将该静态审计记为通过。视觉主题仍按 DESIGN.md 映射，无远程字体或新数据写操作。
