import test from 'node:test'
import assert from 'node:assert/strict'
import { request } from '../api/request.js'
import { subscriptionApi, fromSubscription, toSubscription } from '../api/subscriptions.js'
import { createSubscriptionPageState, subscriptionComputed, subscriptionMethods } from '../pages/subscription/subscription-page-logic.js'

function mockUni(handlers) {
	return { getStorageSync: () => ({ accessToken: 'test-token', expiresAt: '2099-01-01T00:00:00Z', user: { id: 'test-user' } }), ...handlers }
}

export function pageHarness() {
	const page = createSubscriptionPageState()
	for (const [key, value] of Object.entries(subscriptionMethods)) page[key] = value.bind(page)
	for (const [key, value] of Object.entries(subscriptionComputed)) Object.defineProperty(page, key, { get: value.bind(page) })
	return page
}

test('request encodes query values and does not retry failed writes', async () => {
	let calls = 0
	globalThis.uni = mockUni({ request(options) {
		calls++
		assert.match(options.url, /search=a%26b/)
		assert.equal(options.method, 'POST')
		assert.equal(options.header.Authorization, 'Bearer test-token')
		assert.equal(options.header['x-demo-user-id'], undefined)
		options.success({ statusCode: 409, data: { code: 'BILLING_PERIOD_CHANGED' } })
	} })
	await assert.rejects(request('/subscriptions/id/renew', { method: 'POST', query: { search: 'a&b' } }), /本期扣费日已改变/)
	assert.equal(calls, 1)
})

test('network and DTO validation errors reject instead of returning mock success', async () => {
	globalThis.uni = mockUni({ request: options => options.fail({ errMsg: 'request:fail timeout' }) })
	await assert.rejects(request('/settings'), error => error.code === 'TIMEOUT' && error.retriable === true && /连接超时/.test(error.message))
	globalThis.uni.request = options => options.success({ statusCode: 422, data: { code: 'VALIDATION_ERROR', errors: { name: 'name should not be empty' }, requestId: 'request-validation-1' } })
	await assert.rejects(request('/subscriptions'), error => error.status === 422 && error.details.name.includes('empty') && error.requestId === 'request-validation-1')
})

test('failed writes are marked uncertain and are never retried automatically', async () => {
	let calls = 0
	globalThis.uni = mockUni({ request: options => { calls++; options.fail({ errMsg: 'request:fail timeout' }) } })
	await assert.rejects(request('/subscriptions', { method: 'POST', data: {} }), error => error.code === 'TIMEOUT' && error.uncertain === true && error.retriable === false)
	assert.equal(calls, 1)
})

test('subscription payload preserves unknown versus zero and excludes client-only fields', () => {
	const form = { name: ' 测试 ', cycle: '每月', category: '音乐', payment: '微信支付', currency: 'CNY', amount: '', reminders: [7, 1], nextBillingDate: '2028-01-31', autoRenew: true, status: 'active', isDemo: true, id: 'forged-id', renewalHistory: ['forged'] }
	const payload = toSubscription(form)
	assert.equal(payload.name, '测试')
	assert.equal(payload.amount, null)
	assert.equal(payload.cycle, 'monthly')
	assert.equal(payload.category, 'music')
	assert.equal(payload.payment, 'wechat')
	assert.equal(payload.isDemo, undefined)
	assert.equal(payload.id, undefined)
	assert.equal(payload.status, undefined)
	assert.equal(payload.renewalHistory, undefined)
	assert.equal(toSubscription({ ...form, amount: '0' }).amount, 0)
	assert.equal(toSubscription(form, true).status, 'active')
})

test('response maps ISO times and billing history for the existing detail view', () => {
	const record = fromSubscription({ id: 'sub_1', cycle: 'monthly', category: 'music', payment: 'wechat', nextBillingDate: '2028-02-29', anchorDay: 31, lastRenewedAt: '2028-01-31T12:00:00Z', renewalHistory: [{ previousNextBillingDate: '2028-01-31', renewedAt: '2028-01-31T12:00:00Z', nextBillingDate: '2028-02-29' }] })
	assert.equal(record.id, 'sub_1')
	assert.equal(record.cycle, '每月')
	assert.equal(record.anchorDay, 31)
	assert.equal(record.lastRenewedBillingDate, '2028-01-31')
	assert.equal(record.renewalHistory[0].confirmedAt, record.lastRenewedAt)
})

test('listAll follows every page including deleted records', async () => {
	const pages = []
	globalThis.uni = mockUni({ request(options) {
		const url = new URL(options.url)
		const page = Number(url.searchParams.get('page'))
		pages.push(page)
		assert.equal(url.searchParams.get('includeDeleted'), 'true')
		options.success({ statusCode: 200, data: { data: [{ id: `sub_${page}`, nextBillingDate: '2028-01-31' }], meta: { hasMore: page < 3 } } })
	} })
	assert.equal((await subscriptionApi.listAll()).length, 3)
	assert.deepEqual(pages, [1, 2, 3])
})

test('failed initial load exposes retry and never seeds local records', async () => {
	globalThis.uni = mockUni({ request: options => options.fail({ errMsg: 'offline' }) })
	const page = pageHarness()
	assert.equal(await page.refreshData(), false)
	assert.equal(page.dataReady, false)
	assert.equal(page.subscriptions.length, 0)
	assert.equal(page.loading, false)
	assert.match(page.loadError, /无法连接/)
})

test('quota and status follow the backend rather than local record counts and dates', () => {
	const page = pageHarness()
	page.applyMembership({ status: 'free', quota: { used: 5, limit: 5, remaining: 0 } })
	page.subscriptions = []
	assert.equal(page.canCreateSubscription, false)
	assert.equal(page.freeQuotaValue, '5 / 5')
	assert.equal(page.getStatus({ status: 'active', displayStatus: 'overdue', nextBillingDate: '2099-01-01' }), 'overdue')
	page.applyMembership({ status: 'active', quota: { used: 8, limit: null, remaining: null } })
	assert.equal(page.subscriptionLimit, null)
	assert.equal(page.canCreateSubscription, true)
})

test('clearing account state removes old drafts, notifications and filter state', () => {
	const page = pageHarness()
	page.subscriptions = [{ id: 'old' }]
	page.form = { name: 'private draft' }
	page.formBaseline = 'private draft'
	page.editingId = 'old'
	page.searchKeyword = 'private search'
	page.notifications = { credits: 10, recentDeliveries: [{ id: 'old-message' }] }
	page.clearAccountData()
	assert.deepEqual(page.subscriptions, [])
	assert.deepEqual(page.form, {})
	assert.equal(page.formBaseline, '')
	assert.equal(page.editingId, null)
	assert.equal(page.searchKeyword, '')
	assert.equal(page.notifications.credits, 0)
	assert.deepEqual(page.notifications.recentDeliveries, [])
	assert.equal(page.dataReady, false)
})

test('an account change cannot save the previous account’s form', async () => {
	globalThis.uni = mockUni({ showToast() {} })
	const page = pageHarness()
	page.currentUserId = 'previous-user'
	page.dataReady = true
	page.form = { name: 'previous account draft' }
	let writes = 0
	assert.equal(await page.mutate(() => { writes++; return Promise.resolve({ id: 'wrong-owner' }) }), false)
	assert.equal(writes, 0)
	assert.equal(page.dataReady, false)
	assert.deepEqual(page.form, {})
})

test('notification failure does not replace backend records with demo data or block loading', async () => {
	const keys = []
	globalThis.uni = mockUni({
		getStorageSync(key) { keys.push(key); return key === 'renewal_wechat_session_v1' ? { accessToken: 'test-token', expiresAt: '2099-01-01T00:00:00Z', user: { id: 'test-user' } } : null },
		request(options) {
			const url = new URL(options.url)
			if (url.pathname.endsWith('/notifications')) return options.fail({ errMsg: 'offline' })
			let data
			if (url.pathname.endsWith('/subscriptions')) data = { data: [{ id: 'real-record', nextBillingDate: '2099-01-01' }], meta: { hasMore: false } }
			else if (url.pathname.endsWith('/settings')) data = { defaultCurrency: 'CNY' }
			else if (url.pathname.endsWith('/membership')) data = { status: 'free', quota: { used: 1, limit: 5, remaining: 4 } }
			else if (url.pathname.endsWith('/catalog')) data = { categories: [], cycles: [], paymentMethods: [], currencies: ['CNY'], templates: [] }
			else if (url.pathname.endsWith('/reminders')) data = { data: [] }
			else data = { period: url.searchParams.get('period'), currency: 'CNY', total: 0 }
			options.success({ statusCode: 200, data })
		}
	})
	const page = pageHarness()
	assert.equal(await page.refreshData(), true)
	assert.equal(page.dataReady, true)
	assert.equal(page.subscriptions[0].id, 'real-record')
	assert.equal(page.loadError, '')
	assert.match(page.notificationError, /无法连接/)
	assert.equal(page.notificationReady, false)
	assert.equal(keys.some(key => key.includes('renewal_demo')), false)
})

test('mutation locks concurrent submits and preserves known success if refresh fails', async () => {
	globalThis.uni = { showToast() {} }
	const page = pageHarness()
	page.dataReady = true
	let finish, calls = 0
	page.refreshData = async () => { page.loadError = '读取失败'; return false }
	const first = page.mutate(() => { calls++; return new Promise(resolve => { finish = resolve }) }, '已保存')
	assert.equal(await page.mutate(() => { calls++ }, '已保存'), false)
	finish({ id: 'saved-id' })
	assert.equal(await first, true)
	assert.equal(calls, 1)
	assert.equal(page.subscriptions[0].id, 'saved-id')
	assert.equal(page.mutating, false)
})

test('failed write preserves existing state and blocks uncertain resubmission', async () => {
	globalThis.uni = { showToast() {} }
	const page = pageHarness()
	page.dataReady = true
	page.subscriptions = [{ id: 'existing' }]
	assert.equal(await page.mutate(async () => { throw Object.assign(new Error('timeout'), { code: 'TIMEOUT', uncertain: true }) }), false)
	assert.deepEqual(page.subscriptions, [{ id: 'existing' }])
	assert.match(page.loadError, /操作结果尚未确认/)
	let called = false
	await page.mutate(() => { called = true })
	assert.equal(called, false)
})

test('a late statistics response cannot overwrite the selected currency', async () => {
	const requests = []
	globalThis.uni = mockUni({ request: options => requests.push(options) })
	const page = pageHarness()
	const first = page.refreshStats()
	await Promise.resolve()
	page.statsCurrency = 'USD'
	const second = page.refreshStats()
	await Promise.resolve()
	for (const options of requests.slice(3)) {
		const url = new URL(options.url)
		options.success({ statusCode: 200, data: { period: url.searchParams.get('period'), currency: 'USD', total: 20 } })
	}
	await second
	for (const options of requests.slice(0, 3)) {
		const url = new URL(options.url)
		options.success({ statusCode: 200, data: { period: url.searchParams.get('period'), currency: 'CNY', total: 100 } })
	}
	await first
	assert.equal(page.serverStats.month.currency, 'USD')
	assert.equal(page.statsTotal, 20)
})

test('starts independent homepage requests together and renders without slow notification or statistics responses', async () => {
	const requests = []
	globalThis.uni = mockUni({
		getStorageSync: key => key === 'renewal_wechat_session_v1' ? { accessToken: 'test-token', expiresAt: '2099-01-01T00:00:00Z', user: { id: 'test-user' } } : null,
		request: options => requests.push(options)
	})
	const page = pageHarness()
	const refresh = page.refreshData()
	await new Promise(setImmediate)
	assert.equal(requests.length, 6)
	assert.deepEqual(requests.map(row => new URL(row.url).pathname.split('/').pop()).sort(), ['catalog', 'membership', 'notifications', 'reminders', 'settings', 'subscriptions'])
	const data = {
		subscriptions: { data: [{ id: 'real', nextBillingDate: '2099-01-01' }], meta: { hasMore: false } },
		settings: { defaultCurrency: 'USD', notificationEnabled: false },
		membership: { status: 'free', quota: { used: 1, limit: 5, remaining: 4 } },
		catalog: { categories: [], cycles: [], paymentMethods: [], currencies: ['USD'], templates: [] },
		reminders: { data: [] }
	}
	for (const options of requests.slice()) {
		const key = new URL(options.url).pathname.split('/').pop()
		if (key !== 'notifications') options.success({ statusCode: 200, data: data[key] })
	}
	assert.equal(await refresh, true)
	await new Promise(setImmediate)
	assert.equal(page.dataReady, true)
	assert.equal(page.loading, false)
	assert.equal(page.subscriptions[0].id, 'real')
	assert.equal(page.notificationLoading, true)
	assert.equal(page.statsLoading, true)
	assert.match(page.notificationDescription, /正在读取/)
	const stats = requests.filter(row => new URL(row.url).pathname.endsWith('/stats'))
	assert.equal(stats.length, 3)
	for (const options of stats) {
		const url = new URL(options.url)
		assert.equal(url.searchParams.get('currency'), 'USD')
		options.success({ statusCode: 200, data: { period: url.searchParams.get('period'), currency: 'USD', total: 20 } })
	}
	requests.find(row => row.url.endsWith('/notifications')).fail({ errMsg: 'offline' })
	await new Promise(setImmediate)
	assert.equal(page.notificationLoading, false)
	assert.match(page.notificationError, /无法连接/)
	assert.equal(page.dataReady, true)
	assert.equal(page.statsTotal, 20)
})

test('ignores an old notification response after account state is cleared', async () => {
	let pending
	globalThis.uni = mockUni({ request: options => { pending = options } })
	const page = pageHarness()
	page.currentUserId = 'test-user'
	const refresh = page.refreshNotifications()
	await new Promise(setImmediate)
	page.clearAccountData()
	pending.success({ statusCode: 200, data: { configured: true, identityLinked: true, enabled: true, recentDeliveries: [{ id: 'private-old-record' }] } })
	await refresh
	assert.deepEqual(page.notifications.recentDeliveries, [])
	assert.equal(page.settings.notificationEnabled, false)
	assert.equal(page.notificationLoading, false)
})
