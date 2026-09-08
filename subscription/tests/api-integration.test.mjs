import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { API_CONFIG } from '../api/config.js'
import { subscriptionApi as api } from '../api/subscriptions.js'
import { createSubscriptionPageState, subscriptionComputed, subscriptionMethods } from '../pages/subscription/subscription-page-logic.js'

const require = createRequire(new URL('../../backend/package.json', import.meta.url))
require('reflect-metadata')
const { NestFactory } = require('@nestjs/core')
const { ValidationPipe, VersioningType } = require('@nestjs/common')
const { AppModule } = require('./dist/app.module.js')
const validationOptions = require('./dist/utils/validation-options.js').default

test('page and uni.request adapter complete the workflow against real Nest HTTP endpoints', async () => {
	const app = await NestFactory.create(AppModule, { logger: false })
	app.setGlobalPrefix('api')
	app.enableVersioning({ type: VersioningType.URI })
	app.useGlobalPipes(new ValidationPipe(validationOptions))
	await app.listen(0, '127.0.0.1')
	API_CONFIG.baseUrl = `${await app.getUrl()}/api/v1`
	API_CONFIG.demoUserId = 'frontend-integration-user'
	globalThis.uni = {
		request(options) {
			fetch(options.url, { method: options.method, headers: options.header, body: options.data ? JSON.stringify(options.data) : undefined })
				.then(async response => options.success({ statusCode: response.status, data: await response.json() }))
				.catch(error => options.fail({ errMsg: error.message }))
		},
		showToast() {},
		showModal(options) { options.success({ confirm: true }) }
	}
	try {
		const page = createSubscriptionPageState()
		for (const [key, value] of Object.entries(subscriptionMethods)) page[key] = value.bind(page)
		for (const [key, value] of Object.entries(subscriptionComputed)) Object.defineProperty(page, key, { get: value.bind(page) })
		assert.equal(await page.refreshData(), true)
		assert.equal(page.subscriptions.length, 0)
		assert.equal(page.serviceTemplates.length, 3)
		page.openForm('2028-01-31')
		Object.assign(page.form, { name: '联调订阅', amount: '20', category: '音乐' })
		await page.saveSubscription()
		assert.equal(page.activeView, 'detail')
		assert.equal(page.subscriptions.length, 1)
		assert.equal(page.selectedSubscription.isDemo, false)
		assert.equal(page.statsTotal, 20)
		const id = page.selectedId
		page.openForm(null, page.selectedSubscription)
		page.form.amount = '25'
		await page.saveSubscription()
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
		assert.equal(page.statsTotal, 0)
		await page.handleSubscriptionAction('resume')
		assert.equal(page.statsTotal, 25)
		await page.updateSetting('reminderTime', '10:30')
		assert.equal((await api.settings()).reminderTime, '10:30')
		await page.activateMembership()
		assert.equal(page.isMember, true)
		await page.restoreFreePlan()
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
		API_CONFIG.demoUserId = 'different-integration-user'
		await assert.rejects(api.detail(savedId), error => error.status === 404)
	} finally { await app.close() }
})
