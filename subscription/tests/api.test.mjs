import test from 'node:test'
import assert from 'node:assert/strict'
import { request } from '../api/request.js'
import { subscriptionApi, fromSubscription, toSubscription } from '../api/subscriptions.js'
import { createSubscriptionPageState, subscriptionComputed, subscriptionMethods } from '../pages/subscription/subscription-page-logic.js'

export function pageHarness() {
	const page = createSubscriptionPageState()
	for (const [key, value] of Object.entries(subscriptionMethods)) page[key] = value.bind(page)
	for (const [key, value] of Object.entries(subscriptionComputed)) Object.defineProperty(page, key, { get: value.bind(page) })
	return page
}

test('request encodes query values and does not retry failed writes', async () => {
	let calls = 0
	globalThis.uni = { request(options) {
		calls++
		assert.match(options.url, /search=a%26b/)
		assert.equal(options.method, 'POST')
		assert.equal(options.header['x-demo-user-id'], 'demo-user')
		options.success({ statusCode: 409, data: { code: 'BILLING_PERIOD_CHANGED' } })
	} }
	await assert.rejects(request('/subscriptions/id/renew', { method: 'POST', query: { search: 'a&b' } }), /本期扣费日已改变/)
	assert.equal(calls, 1)
})

test('network and DTO validation errors reject instead of returning mock success', async () => {
	globalThis.uni = { request: options => options.fail({ errMsg: 'request:fail timeout' }) }
	await assert.rejects(request('/settings'), /请求超时/)
	globalThis.uni.request = options => options.success({ statusCode: 422, data: { errors: { name: 'name should not be empty' } } })
	await assert.rejects(request('/subscriptions'), error => error.status === 422 && error.details.name.includes('empty'))
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
	globalThis.uni = { request(options) {
		const url = new URL(options.url)
		const page = Number(url.searchParams.get('page'))
		pages.push(page)
		assert.equal(url.searchParams.get('includeDeleted'), 'true')
		options.success({ statusCode: 200, data: { data: [{ id: `sub_${page}`, nextBillingDate: '2028-01-31' }], meta: { hasMore: page < 3 } } })
	} }
	assert.equal((await subscriptionApi.listAll()).length, 3)
	assert.deepEqual(pages, [1, 2, 3])
})

test('failed initial load exposes retry and never seeds local records', async () => {
	globalThis.uni = { request: options => options.fail({ errMsg: 'offline' }) }
	const page = pageHarness()
	assert.equal(await page.refreshData(), false)
	assert.equal(page.dataReady, false)
	assert.equal(page.subscriptions.length, 0)
	assert.equal(page.loading, false)
	assert.match(page.loadError, /无法连接/)
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
	assert.equal(await page.mutate(async () => { throw Object.assign(new Error('timeout'), { code: 'NETWORK_ERROR' }) }), false)
	assert.deepEqual(page.subscriptions, [{ id: 'existing' }])
	assert.match(page.loadError, /请求结果未确认/)
	let called = false
	await page.mutate(() => { called = true })
	assert.equal(called, false)
})

test('a late statistics response cannot overwrite the selected currency', async () => {
	const requests = []
	globalThis.uni = { request: options => requests.push(options) }
	const page = pageHarness()
	const first = page.refreshStats()
	page.statsCurrency = 'USD'
	const second = page.refreshStats()
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
