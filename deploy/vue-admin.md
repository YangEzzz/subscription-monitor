# Vue 管理后台部署

前端源码为仓库根 `admin/`，API 源码为 `backend/`。前端通过同源 `/api/` 访问独立管理端口，生产 Nginx 在 Docker 内网转发。前端不需要配置数据库账号或微信 AppSecret。

## 与现有后端一同部署

在服务器 `deploy/.env.production` 中启用：

```dotenv
LOCAL_ADMIN_ENABLED=true
```

随后在仓库根执行：

```bash
docker compose --env-file deploy/.env.production config --quiet
docker compose --env-file deploy/.env.production up -d --build api admin
docker compose --env-file deploy/.env.production ps
curl -I http://127.0.0.1:8080/
curl http://127.0.0.1:8080/api/overview
```

新后台是独立 `subscription-monitor-admin` 镜像，由 Node 构建、Nginx 托管 dist。`admin` 服务属于 admin profile，明确启动该服务即可；普通 `docker compose up` 不自动开启它。数据库迁移流程沿用原有 API 部署；这次后台没有新增迁移。

默认端口只绑定服务器本机 `127.0.0.1:8080`，沿用现有只读管理数据范围。前端 Nginx 将 `/api/` 转发到 Docker 内网 `api:3002`；后端只读接口继续校验本机 Host，不接受公网直接访问。

## 从电脑访问服务器后台

可以建立 SSH 转发后，直接访问标准 Vue 页面：

```bash
ssh -L 8080:127.0.0.1:8080 your-user@your-server
```

在电脑浏览器打开 http://127.0.0.1:8080。这是服务器部署的 Vue 应用，不需要下载或双击 HTML。

## 可选：同域名 /admin/ 公网入口

当前业务接口未增加管理员登录系统。公网入口可通过宿主 Nginx 认证保护；以下配置仅影响后台入口，不修改小程序 API。先创建管理员认证文件：

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/subscription-admin.htpasswd admin
```

输入的管理员密码由 htpasswd 处理，不填入前端环境变量。把域名现有 HTTPS server 中旧的 `location /admin/` 替换为：

```nginx
location = /admin { return 302 /admin/; }
location /admin/ {
    auth_basic "Subscription Admin";
    auth_basic_user_file /etc/nginx/subscription-admin.htpasswd;
    proxy_pass http://127.0.0.1:8080/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```

保持原有证书和 `/` 的 API 转发配置。检查后重载：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

浏览器访问 `https://你的域名/admin/`，输入 Nginx 管理账号后加载 Vue 应用。外部 JS/CSS 请求会使用 `/admin/assets/`，数据使用 `/admin/api/`，都由后台入口保护。默认相对资源/接口路径无需重新构建。

## 单独部署静态文件

```bash
cd admin
pnpm install --frozen-lockfile
pnpm build
```

将整个 `dist/` 上传到静态服务器，按 `admin/nginx/default.conf.template` 配置 SPA 回退、静态资源缓存与 `/api/` 代理。这里的代理目标必须是能访问独立管理端口的服务器地址；模板中的 `${ADMIN_API_UPSTREAM}` 在普通 Nginx 部署时替换为实际地址，例如 `127.0.0.1:3002`。Docker 官方 Nginx 启动脚本会自动替换此环境变量。

不能只上传 index.html：它会引用 `assets` 里的 Vue 代码和 CSS。部署时不要让 `/api/` 请求回退到 index.html；API 错误必须保留 HTTP 状态。

## 更新与排错

```bash
git pull --ff-only
docker compose --env-file deploy/.env.production up -d --build api admin
docker compose --env-file deploy/.env.production logs --tail=100 admin api
```

页面打不开时检查 admin 服务与资源路径；页面能打开但数据读取失败时，检查 `LOCAL_ADMIN_ENABLED=true`、API 3002 端口和 `ADMIN_API_UPSTREAM`。不需要调整小程序 `/api/v1` 地址。后台支持账号分类、会员赠送及订单退款，不发送通知。会员赠送的数据库迁移、操作入口和环境限制见 [后台赠送会员](后台赠送会员.md)。

退款操作与当前只读开发限制见[后台退款方案](后台退款方案.md)。后台来源与管理员会话鉴权保持生效，生产已新增订单退款 POST 接口。
