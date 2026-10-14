# Vue 管理后台验证

日期：2026-10-14，北京时间。

## 项目与部署结构

用户要求独立、可部署的 Vue 项目。源码位于 `admin/`；前端和 `backend/` 分别安装、构建。标准 Vite 产物包含 index.html、独立 JS 与 CSS，旧 backend/public/admin.html 已删除，后端 HTML 路由已退役。新增 admin Dockerfile、Nginx 模板和根 compose admin 服务；默认宿主只绑定 127.0.0.1:8080，生产部署与可选公网认证入口见 deploy/vue-admin.md。

| DESIGN.md 规则 | 实现证据 | 结果 |
| --- | --- | --- |
| 品牌绿、12px/8px 圆角、系统中文与数字字体 | src/style.css 与共享组件 | 保留 |
| 桌面 shadcn-vue-admin 参考 | 侧栏、指标卡、表格、深浅色主题 | 桌面扩展已记录 |
| 无装饰增长数据、真实接口 | /overview、/data 与 data.ts | 保留 |
| 面板无阴影，日期/金额优先 | 桌面与390px截图 | 保留 |

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
