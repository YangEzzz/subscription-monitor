# 续订清单 Vue 管理后台

独立的 Vue 3 + TypeScript + Vite 项目，正式使用 [shadcn-vue](https://www.shadcn-vue.com/) 官方 CLI 生成的组件（reka-nova），布局参考 [shadcn-vue-admin](https://github.com/Whbbit1999/shadcn-vue-admin)。源码维护于 `src/`，构建生成标准 `dist/index.html`、`dist/assets/*.js` 和 `dist/assets/*.css`，由 Nginx 或其他静态服务器部署。

## shadcn-vue 组件

`components.json` 为官方初始化配置，CLI 固定为 `shadcn-vue@2.8.2`。官方 `add button badge dialog input table card sheet --yes` 生成的源码位于 `src/components/ui/{button,badge,dialog,input,table,card,sheet}/`；页面直接使用这些组件，旧手写 Button/Badge/Dialog 已删除。`StatusBadge.vue` 仅组合官方 Badge 映射业务状态，`AppDialog.vue` 组合官方 Dialog/Sheet 提供中文关闭按钮及程序打开后的焦点恢复。

官方 CLI 要求较新 Node.js，维护组件推荐 Node 24 LTS。新增组件执行 `pnpm ui:add <组件名>`。shadcn-vue 采用组件源码安装方式，并使用 `shadcn-vue/tailwind.css`、`tw-animate-css`、Reka UI 和 cn；依赖与组件源码均纳入仓库。主题由 `src/style.css` 将官方语义变量映射到项目品牌色，沿用中文系统字体、深浅色和圆角。

## 本地开发

```powershell
cd admin
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
```

打开 http://127.0.0.1:5174。开发代理把 `/api/` 转发到 `VITE_DEV_API_TARGET`，默认 http://127.0.0.1:3002。在后端 `backend/.env` 中设置 `LOCAL_ADMIN_ENABLED=true`，并在另一个终端运行 `pnpm --dir backend start:dev`。

## 构建和预览

```powershell
cd admin
pnpm build
pnpm preview
```

生产代码输出到 `admin/dist`。预览地址为 http://127.0.0.1:4174；preview 使用本机 API 代理便于联调，不是生产服务器。实际部署使用 Nginx，将 `/api/` 代理到后端只读管理端口。Vite 使用相对资源路径，支持独立域名根目录或 `/admin/` 等子目录。

`VITE_ADMIN_API_BASE` 为构建时的前端接口前缀，默认 `./api/`。Docker 容器运行时通过 `ADMIN_API_UPSTREAM` 指定后端位置，默认 `api:3002`。不要将服务端秘密填入 `VITE_` 变量，它们属于公开的前端配置。

## Docker 部署

仓库根 `compose.yaml` 已增加独立 `admin` 服务与 `admin` profile。先在 `deploy/.env.production` 设置 `LOCAL_ADMIN_ENABLED=true`，再运行：

```bash
docker compose --env-file deploy/.env.production up -d --build api admin
```

默认将后台绑定到服务器 `127.0.0.1:8080`，前端 Nginx 通过 Docker 内网访问 API 服务的 3002 端口。后台使用已有真实数据库数据，不生成演示记录，不提供写操作。完整部署、SSH 转发和公网 Nginx 配置见 [deploy/vue-admin.md](../deploy/vue-admin.md)。

## 页面

数据概览、订阅记录、用户列表、会员权益、会员订单、通知记录、记录详情、服务器分页、搜索、连接状态、深浅色主题与响应式导航。列表每页 20 条，接口错误提供重试，刷新失败保留并标记旧数据。概览不计删除订阅，列表包含删除记录；模拟支付不会实际扣款。

组件由官方 shadcn-vue CLI 生成并维护在 `src/components/ui`，共享查询逻辑由 `src/lib/useAdmin.ts` 拥有。前端和 Nest 后端分别安装依赖、分别构建、分别部署。后端不再提供旧的 HTML 页面。

## 验证

```powershell
cd admin
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/.browsers"
pnpm exec playwright install chromium
pnpm test:e2e
```

E2E 从标准 dist 加载外部 JS/CSS，并应用生产 Nginx 的 CSP。测试响应仅来自测试拦截器，不修改真实数据库。验证记录见 [docs/verification.md](docs/verification.md)。
