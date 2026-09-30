# 生产部署

适用于安装了 Docker Engine、Docker Compose 插件和 Nginx 的 Ubuntu 服务器。

## 首次部署

~~~bash
cd /opt
git clone https://github.com/YangEzzz/subscription-monitor.git
cd subscription-monitor

cp deploy/.env.production.example deploy/.env.production
openssl rand -hex 32
nano deploy/.env.production
chmod 600 deploy/.env.production
~~~

将生成的密码同时写入 `POSTGRES_PASSWORD` 和 `DATABASE_URL`，并把两个示例域名换成真实域名。密码使用上面生成的十六进制字符串时不需要再做 URL 编码。

微信登录还需要填写 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`，并用另一次 `openssl rand -hex 32` 的结果填写 `AUTH_TOKEN_SECRET`。生产环境缺少这些配置会拒绝启动；AppSecret 仅保存在服务器私有环境文件中。详见 [微信登录接入说明](../subscription/docs/微信登录接入说明.md)。

构建并启动：

~~~bash
sudo docker compose --env-file deploy/.env.production config --quiet
sudo docker compose --env-file deploy/.env.production up -d --build
sudo docker compose --env-file deploy/.env.production ps
~~~

`postgres` 健康后，`migrate` 服务会自动运行 `prisma migrate deploy`；迁移成功后 API 才会启动。PostgreSQL 没有发布宿主机端口，API 只绑定到 `127.0.0.1:3001`。

验证：

~~~bash
curl http://127.0.0.1:3001/api/v1/health
sudo docker compose --env-file deploy/.env.production logs --tail=100 api migrate postgres
~~~

## Nginx 和 HTTPS

先将 `deploy/nginx/subscription-monitor.conf.example` 中的 `api.example.com` 替换成真实域名，然后执行：

~~~bash
sudo cp deploy/nginx/subscription-monitor.conf.example /etc/nginx/sites-available/subscription-monitor
sudo ln -s /etc/nginx/sites-available/subscription-monitor /etc/nginx/sites-enabled/subscription-monitor
sudo nginx -t
sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
~~~

证书签发后验证：

~~~bash
curl https://api.example.com/api/v1/health
~~~

随后把 `https://api.example.com` 添加到微信小程序 request 合法域名，并把前端 `subscription/api/config.js` 的地址改为 `https://api.example.com/api/v1`。

## 更新版本

~~~bash
cd /opt/subscription-monitor
git pull --ff-only
sudo docker compose --env-file deploy/.env.production up -d --build
sudo docker compose --env-file deploy/.env.production ps
~~~

每次启动都会先检查并应用尚未执行的迁移。生产环境不要运行 `prisma migrate dev`。

## 数据库备份

~~~bash
mkdir -p backups
sudo docker compose --env-file deploy/.env.production exec -T postgres \
  pg_dump -U subscription_app -d subscription_monitor -Fc \
  > "backups/subscription-monitor-$(date +%F-%H%M%S).dump"
~~~

定期把备份复制到另一台机器或对象存储。Docker 数据卷不能代替备份。
