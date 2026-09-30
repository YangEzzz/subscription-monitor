import { request, ApiError } from './request.js'

const SESSION_KEY = 'renewal_wechat_session_v1'
let loginPromise = null

export function getSession() {
	const session = uni.getStorageSync?.(SESSION_KEY)
	if (!session || typeof session.accessToken !== 'string' || !session.user?.id ||
		!Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now() + 30000) return null
	return session
}

export function clearSession(accessToken) {
	const stored = uni.getStorageSync?.(SESSION_KEY)
	// An old in-flight response must not delete a newly established session.
	if (!accessToken || stored?.accessToken === accessToken) uni.removeStorageSync?.(SESSION_KEY)
}

export function ensureSession() {
	const session = getSession()
	if (session) return Promise.resolve(session)
	if (loginPromise) return loginPromise
	loginPromise = new Promise((resolve, reject) => {
		if (typeof uni.login !== 'function') return reject(new ApiError('请在微信小程序中登录', { code: 'WECHAT_LOGIN_FAILED' }))
		uni.login({
			provider: 'weixin', timeout: 10000,
			success(result) {
				if (!result.code) return reject(new ApiError('未获取到微信登录凭证，请重试', { code: 'WECHAT_LOGIN_FAILED' }))
				resolve(result.code)
			},
			fail() { reject(new ApiError('微信登录失败，请重新尝试', { code: 'WECHAT_LOGIN_FAILED' })) }
		})
	}).then(code => request('/auth/wechat', { method: 'POST', data: { code }, auth: false }))
		.then(result => {
			if (typeof result?.accessToken !== 'string' || !result.accessToken || !result.user?.id ||
				!Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= Date.now()) {
				throw new ApiError('登录返回异常，请重试', { code: 'WECHAT_LOGIN_FAILED' })
			}
			uni.setStorageSync(SESSION_KEY, result)
			return result
		}).finally(() => { loginPromise = null })
	return loginPromise
}
