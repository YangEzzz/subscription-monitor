import { API_CONFIG } from './config.js'

const messages = {
	SUBSCRIPTION_LIMIT_REACHED: '免费订阅额度已用完',
	RENEWAL_ALREADY_APPLIED: '本期续费已经确认，请刷新后查看',
	RENEWAL_UNDO_WINDOW_EXPIRED: '已超过十分钟撤销期限',
	BILLING_PERIOD_CHANGED: '本期扣费日已改变，请刷新后重试',
	VALIDATION_ERROR: '填写内容不符合要求，请检查后重试',
	UNAUTHORIZED: '登录状态已失效，请重新进入小程序',
	FORBIDDEN: '当前账号没有执行此操作的权限',
	NOT_FOUND: '记录不存在或已被删除',
	DUPLICATE_RESOURCE: '记录已存在，请刷新后重试',
	TOO_MANY_REQUESTS: '操作过于频繁，请稍后重试',
	INTERNAL_SERVER_ERROR: '服务暂时不可用，请稍后重试'
}

export class ApiError extends Error {
	constructor(message, options = {}) {
		super(message)
		this.name = 'ApiError'
		Object.assign(this, {
			status: options.status || 0,
			code: options.code || 'UNKNOWN_ERROR',
			details: options.details,
			requestId: options.requestId || '',
			retriable: Boolean(options.retriable),
			uncertain: Boolean(options.uncertain)
		})
	}
}

const responseRequestId = response => {
	const headers = response.header || response.headers || {}
	return response.data?.requestId || headers['x-request-id'] || headers['X-Request-Id'] || ''
}

export function request(path, { method = 'GET', data, query } = {}) {
	const search = Object.entries(query || {}).filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${API_CONFIG.baseUrl.replace(/\/$/, '')}${path}${search ? '?' + search : ''}`,
			method, data, timeout: API_CONFIG.timeout,
			header: { 'Content-Type': 'application/json', 'x-demo-user-id': API_CONFIG.demoUserId },
			success(response) {
				if (response.statusCode >= 200 && response.statusCode < 300) return resolve(response.data)
				const body = response.data || {}
				const detail = typeof body.message === 'string' ? body.message : Array.isArray(body.message) ? body.message.join('；') : ''
				reject(new ApiError(messages[body.code] || detail || `请求失败（${response.statusCode}）`, {
					status: response.statusCode,
					code: body.code || `HTTP_${response.statusCode}`,
					details: body.errors,
					requestId: responseRequestId(response),
					retriable: response.statusCode === 408 || response.statusCode === 429 || response.statusCode >= 500
				}))
			},
			fail(cause) {
				const timeout = (cause.errMsg || '').includes('timeout')
				const writing = method !== 'GET'
				reject(new ApiError(
					timeout ? '连接超时，请检查网络后重试' : '无法连接服务，请检查网络后重试',
					{
						code: timeout ? 'TIMEOUT' : 'NETWORK_ERROR',
						retriable: !writing,
						uncertain: writing
					}
				))
			}
		})
	})
}
