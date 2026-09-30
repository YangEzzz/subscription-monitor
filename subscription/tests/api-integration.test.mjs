import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { API_CONFIG } from '../api/config.js'
import { subscriptionApi as api } from '../api/subscriptions.js'
import { createSubscriptionPageState, subscriptionComputed, subscriptionMethods } from '../pages/subscription/subscription-page-logic.js'
import { ensureSession, clearSession } from '../api/auth.js'
import { notificationApi } from '../api/notifications.js'

process.env.NODE_ENV = 'test'
process.env.PERSISTENCE_DRIVER = 'memory'
process.env.WECHAT_APP_ID = 'wx-integration-app'
process.env.WECHAT_APP_SECRET = 'integration-provider-secret'
process.env.AUTH_TOKEN_SECRET = 'integration-session-secret-with-more-than-32-bytes'
process.env.WECHAT_REMINDER_TEMPLATE_ID = 'integration-template'
process.env.WECHAT_SUBSCRIPTION_TYPE = 'once'

const require = createRequire(new URL('../../backend/package.json', import.meta.url))
require('reflect-metadata')
const { NestFactory } = require('@nestjs/core')
const { ValidationPipe, VersioningType } = require('@nestjs/common')
const { AppModule } = require('./dist/app.module.js')
const validationOptions = require('./dist/utils/validation-options.js').default

test('page and uni.request adapter complete the workflow against real Nest HTTP endpoints', async () => {
	const realFetch = globalThis.fetch
	globalThis.fetch = async (url, options) => {
		const address = new URL(String(url))
		if (address.origin === 'https://api.weixin.qq.com') {
			return new Response(JSON.stringify({ openid: address.searchParams.get('js_code'), session_key: 'never-return-this' }), { status: 200 })
		}
		return realFetch(url, options)
	}
	const app = await NestFactory.create(AppModule, { logger: false })
	app.setGlobalPrefix('api')
	app.enableVersioning({ type: VersioningType.URI })
	app.useGlobalPipes(new ValidationPipe(validationOptions))
	await app.listen(0, '127.0.0.1')
	API_CONFIG.baseUrl = `${await app.getUrl()}/api/v1`
	let accountCode = 'frontend-integration-user'
	const storage = new Map()
	globalThis.uni = {
		getStorageSync: key => storage.get(key),
		setStorageSync: (key, value) => storage.set(key, value),
		removeStorageSync: key => storage.delete(key),
		login(options) { options.success({ code: accountCode }) },
		request(options) {
			fetch(options.url, { method: options.method, headers: options.header, body: options.data ? JSON.stringify(options.data) : undefined })
				.then(async response => options.success({ statusCode: response.status, data: await response.json() }))
				.catch(error => options.fail({ errMsg: error.message }))
		},
		showToast() {},
		showModal(options) { options.success({ confirm: true }) }
	}
	try {
		// Public health remains available; all user resources reject forged demo headers.
		assert.equal((await fetch(`${API_CONFIG.baseUrl}/health`)).status, 200)
		for (const path of ['/subscriptions', '/settings', '/membership', '/reminders', '/dashboard/stats', '/catalog']) {
			assert.equal((await fetch(`${API_CONFIG.baseUrl}${path}`, { headers: { 'x-demo-user-id': 'demo-user' } })).status, 401)
		}
		assert.equal((await fetch(`${API_CONFIG.baseUrl}/auth/wechat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 422)
		const session = await ensureSession()
		const removedSettings = await fetch(API_CONFIG.baseUrl + '/settings', {
			method: 'PATCH', headers: { Authorization: 'Bearer ' + session.accessToken, 'Content-Type': 'application/json' },
			body: JSON.stringify({ weeklySummary: true, notificationAuthorization: ['accept'] })
		})
		assert.equal(removedSettings.status, 200)
		const settingsWithoutDemoFields = await removedSettings.json()
		assert.equal(settingsWithoutDemoFields.weeklySummary, undefined)
		assert.equal(settingsWithoutDemoFields.notificationAuthorization, undefined)
		assert.equal(settingsWithoutDemoFields.notificationEnabled, false)
		for (const path of ['/membership/activate', '/membership/restore']) {
			assert.equal((await fetch(API_CONFIG.baseUrl + path, { method: 'POST', headers: { Authorization: 'Bearer ' + session.accessToken } })).status, 404)
		}
		assert.equal((await notificationApi.status()).identityLinked, true)
		const receipt = { requestId: 'abc12345-1234-4567-8abc-123456789012', templateId: 'integration-template', result: 'accept' }
		assert.equal((await notificationApi.authorize(receipt)).credits, 1)
		assert.equal((await notificationApi.authorize(receipt)).credits, 1)
		const invalidResponse = await fetch(`${API_CONFIG.baseUrl}/subscriptions`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.accessToken}`, 'x-request-id': 'integration-validation-1' },
			body: '{}'
		})
		const invalidBody = await invalidResponse.json()
		assert.equal(invalidResponse.status, 422)
		assert.equal(invalidBody.code, 'VALIDATION_ERROR')
		assert.equal(invalidBody.requestId, 'integration-validation-1')
		assert.ok(invalidBody.errors.name)

		const page = createSubscriptionPageState()
		for (const [key, value] of Object.entries(subscriptionMethods)) page[key] = value.bind(page)
		for (const [key, value] of Object.entries(subscriptionComputed)) Object.defineProperty(page, key, { get: value.bind(page) })
		assert.equal(await page.refreshData(), true)
		assert.equal(page.subscriptions.length, 0)
		assert.equal(page.serviceTemplates.length, 2)
		assert.equal(page.authStatus, 'authenticated')
		page.openForm('2028-01-31')
		Object.assign(page.form, { name: '联调订阅', amount: '20', category: '音乐' })
		await page.saveSubscription()
		assert.equal(page.activeView, 'detail')
		assert.equal(page.subscriptions.length, 1)
		assert.equal(page.selectedSubscription.isDemo, undefined)
		await page.refreshStats()
		assert.equal(page.statsTotal, 20)
		const id = page.selectedId
		page.openForm(null, page.selectedSubscription)
		page.form.amount = '25'
		await page.saveSubscription()
		await page.refreshStats()
		assert.equal(page.statsTotal, 25)
		await page.confirmRenewal()
		assert.equal(page.selectedSubscription.nextBillingDate, '2028-02-29')
		assert.equal(page.selectedSubscription.anchorDay, 31)
		assert.equal((await api.renew(id, '2028-01-31')).renewalHistory.length, 1)
		await page.undoRenewal()
		assert.equal(page.selectedSubscription.nextBillingDate, '2028-01-31')
		await page.snoozeSubscription()
		assert.equal(page.selectedSubscription.status, 'pending')
		await page.handleSubscriptionAction('pause')
		await page.refreshStats()
		assert.equal(page.statsTotal, 0)
		await page.handleSubscriptionAction('resume')
		await page.refreshStats()
		assert.equal(page.statsTotal, 25)
		await page.updateSetting('reminderTime', '10:30')
		assert.equal((await api.settings()).reminderTime, '10:30')

		assert.equal(page.isMember, false)
		await page.handleSubscriptionAction('copy')
		assert.equal(page.editingId, null)
		await page.saveSubscription()
		assert.equal(page.subscriptions.length, 2)
		await page.deleteSubscription()
		assert.equal(page.deletedSubscriptions.length, 1)
		await page.mutate(() => api.restore(page.deletedSubscriptions[0].id), '已恢复')
		assert.equal(page.deletedSubscriptions.length, 0)
		await page.openDetail({ id })
		await page.cancelSubscription()
		assert.equal(page.selectedSubscription.status, 'cancelled')
		page.openForm('2028-03-01')
		Object.assign(page.form, { name: '一次性付款', cycle: '一次性', amount: '' })
		await page.saveSubscription()
		await page.confirmRenewal()
		assert.equal(page.selectedSubscription.status, 'archived')
		assert.equal(page.selectedSubscription.amount, null)
		await page.undoRenewal()
		assert.equal(page.selectedSubscription.status, 'active')
		const savedId = page.selectedId
		clearSession()
		accountCode = 'different-integration-user'
		await assert.rejects(api.detail(savedId), error => error.status === 404 && error.code === 'NOT_FOUND' && Boolean(error.requestId))
		assert.equal((await api.listAll()).length, 0)
		assert.equal((await api.settings()).reminderTime, '09:00')
		assert.equal((await api.membership()).status, 'free')
		const otherSession = await ensureSession()
		page.form = { name: 'previous account draft' }
		page.formBaseline = 'previous account draft'
		page.editingId = savedId
		await page.refreshData()
		assert.equal(page.currentUserId, otherSession.user.id)
		assert.equal(page.subscriptions.length, 0)
		assert.deepEqual(page.form, {})
		assert.equal(page.formBaseline, '')
		assert.equal(page.editingId, null)
		assert.equal((await notificationApi.status()).credits, 0)
		assert.equal((await notificationApi.status()).recentDeliveries.length, 0)
		const forged = await fetch(`${API_CONFIG.baseUrl}/subscriptions`, { headers: { Authorization: `Bearer ${otherSession.accessToken}`, 'x-demo-user-id': session.user.id } })
		assert.equal((await forged.json()).meta.total, 0)
	} finally { await app.close(); globalThis.fetch = realFetch }
})
