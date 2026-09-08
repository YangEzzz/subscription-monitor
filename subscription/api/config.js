// 真机联调请改为电脑的局域网地址；部署时改为已配置的小程序 HTTPS 域名。
export const API_CONFIG = {
	baseUrl: 'http://localhost:3001/api/v1',
	timeout: 10000,
	// 仅用于当前内存 mock 的用户隔离，不代表登录凭证。
	demoUserId: 'demo-user'
}
