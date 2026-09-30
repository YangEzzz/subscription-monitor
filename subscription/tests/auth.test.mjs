import test from 'node:test'
import assert from 'node:assert/strict'
import { ensureSession, clearSession } from '../api/auth.js'
import { request } from '../api/request.js'

function authHarness(handler) {
	const storage = new Map()
	let logins = 0
	globalThis.uni = {
		getStorageSync: key => storage.get(key),
		setStorageSync: (key, value) => storage.set(key, value),
		removeStorageSync: key => storage.delete(key),
		login(options) { logins++; options.success({ code: `code-${logins}` }) },
		request: handler
	}
	return { get logins() { return logins } }
}

function loginResponse(options) {
	assert.equal(options.header.Authorization, undefined)
	assert.equal(options.header['x-demo-user-id'], undefined)
	options.success({ statusCode: 200, data: {
		accessToken: `token-${options.data.code}`, expiresAt: '2099-01-01T00:00:00Z', user: { id: 'wechat-user' }
	} })
}

test('concurrent requests share one WeChat login and reuse the stored session', async () => {
	const harness = authHarness(options => {
		if (options.url.endsWith('/auth/wechat')) return loginResponse(options)
		assert.equal(options.header.Authorization, 'Bearer token-code-1')
		options.success({ statusCode: 200, data: { ok: true } })
	})
	await Promise.all([request('/settings'), request('/subscriptions'), request('/dashboard/stats')])
	await ensureSession()
	assert.equal(harness.logins, 1)
})

test('expired credentials renew once for reads and do not replay rejected writes', async () => {
	let reads = 0, writes = 0
	const harness = authHarness(options => {
		if (options.url.endsWith('/auth/wechat')) return loginResponse(options)
		if (options.method === 'POST') { writes++; return options.success({ statusCode: 401, data: { code: 'UNAUTHORIZED' } }) }
		reads++
		options.success({ statusCode: reads === 1 ? 401 : 200, data: { code: 'UNAUTHORIZED' } })
	})
	await request('/settings')
	assert.equal(harness.logins, 2)
	assert.equal(reads, 2)
	await assert.rejects(request('/subscriptions', { method: 'POST', data: {} }), error => error.status === 401)
	assert.equal(writes, 1)
	assert.equal(harness.logins, 2)
	await ensureSession()
	assert.equal(harness.logins, 3)
})

test('a repeated 401 stops after one renewal and old responses cannot clear a new token', async () => {
	const harness = authHarness(options => {
		if (options.url.endsWith('/auth/wechat')) return loginResponse(options)
		options.success({ statusCode: 401, data: { code: 'UNAUTHORIZED' } })
	})
	await assert.rejects(request('/settings'), error => error.status === 401)
	assert.equal(harness.logins, 2)
	const session = await ensureSession()
	clearSession('old-token')
	assert.equal((await ensureSession()).accessToken, session.accessToken)
	assert.equal(harness.logins, 3)
})

test('login rejection sends no business request and the next attempt can recover', async () => {
	let calls = 0
	const harness = authHarness(options => {
		calls++
		assert.ok(options.url.endsWith('/auth/wechat'))
		if (calls === 1) return options.success({ statusCode: 401, data: { code: 'WECHAT_LOGIN_FAILED' } })
		loginResponse(options)
	})
	await assert.rejects(request('/settings'), error => error.code === 'WECHAT_LOGIN_FAILED')
	assert.equal(calls, 1)
	await ensureSession()
	assert.equal(harness.logins, 2)
})

test('simultaneous expired reads share one renewal and do not log in repeatedly', async () => {
	const harness = authHarness(options => {
		if (options.url.endsWith('/auth/wechat')) return loginResponse(options)
		options.success({ statusCode: options.header.Authorization === 'Bearer token-code-1' ? 401 : 200, data: {} })
	})
	await ensureSession()
	await Promise.all([request('/settings'), request('/subscriptions'), request('/dashboard/stats')])
	assert.equal(harness.logins, 2)
})

test('a cached session past its expiry is replaced before sending a business request', async () => {
	const harness = authHarness(options => {
		if (options.url.endsWith('/auth/wechat')) return loginResponse(options)
		assert.equal(options.header.Authorization, 'Bearer token-code-1')
		options.success({ statusCode: 200, data: {} })
	})
	uni.setStorageSync('renewal_wechat_session_v1', { accessToken: 'expired', expiresAt: '2000-01-01T00:00:00Z', user: { id: 'old-user' } })
	await request('/settings')
	assert.equal(harness.logins, 1)
})
