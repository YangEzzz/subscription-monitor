import { request } from './request.js'

export const CATEGORIES = { video: '影音娱乐', music: '音乐', cloud: '云存储', ai: 'AI 工具', productivity: '效率工具', reading: '阅读', other: '其他' }
export const CYCLES = { weekly: '每周', monthly: '每月', quarterly: '每季度', semiannual: '每半年', yearly: '每年', custom_days: '自定义天数', one_off: '一次性' }
export const PAYMENTS = { wechat: '微信支付', alipay: '支付宝', app_store: 'App Store', card: '信用卡', official_site: '官网', other: '其他' }
const encode = (mapping, value) => Object.keys(mapping).find(key => mapping[key] === value) || value
const timestamp = value => value ? new Date(value).getTime() : null

export function fromSubscription(record) {
	const history = (record.renewalHistory || []).map(event => ({ ...event, billingDate: event.previousNextBillingDate, confirmedAt: timestamp(event.renewedAt) }))
	return {
		...record, id: String(record.id),
		category: CATEGORIES[record.category] || record.category,
		cycle: CYCLES[record.cycle] || record.cycle,
		payment: PAYMENTS[record.payment] || record.payment,
		trial: Boolean(record.trialEndDate),
		anchorDay: record.anchorDay || Number((record.nextBillingDate || '').slice(8, 10)),
		createdAt: timestamp(record.createdAt), updatedAt: timestamp(record.updatedAt), deletedAt: timestamp(record.deletedAt),
		lastRenewedAt: timestamp(record.lastRenewedAt),
		lastRenewedBillingDate: history.length ? history[history.length - 1].billingDate : null,
		renewalHistory: history
	}
}

// 白名单防止把演示标记、历史、展示字段或本地 ID 发送到写接口。
export function toSubscription(form, update = false) {
	const payload = {
		name: form.name.trim(), plan: form.plan || '', logo: form.logo || form.name.slice(0, 2), color: form.color,
		amount: form.amount === '' || form.amount == null ? null : Number(form.amount), currency: form.currency,
		cycle: encode(CYCLES, form.cycle), nextBillingDate: form.nextBillingDate,
		category: encode(CATEGORIES, form.category), payment: encode(PAYMENTS, form.payment),
		autoRenew: form.cycle === '一次性' ? false : form.autoRenew,
		reminders: [...form.reminders], trialEndDate: form.trial && form.cycle !== '一次性' ? form.trialEndDate : null,
		note: form.note || '', cancelGuide: form.cancelGuide || ''
	}
	if (payload.cycle === 'custom_days') payload.cycleValue = Number(form.cycleValue)
	if (update && form.status) payload.status = form.status
	return payload
}

const pathFor = id => `/subscriptions/${encodeURIComponent(id)}`
export const subscriptionApi = {
	async listAll() {
		const records = []
		for (let page = 1; ; page++) {
			const result = await request('/subscriptions', { query: { page, limit: 100, includeDeleted: true, sort: 'created' } })
			records.push(...result.data.map(fromSubscription))
			if (!result.meta.hasMore) return records
		}
	},
	async detail(id) { return fromSubscription(await request(pathFor(id))) },
	async create(form) { return fromSubscription(await request('/subscriptions', { method: 'POST', data: toSubscription(form) })) },
	async update(id, data) { return fromSubscription(await request(pathFor(id), { method: 'PATCH', data })) },
	async remove(id) { return fromSubscription(await request(pathFor(id), { method: 'DELETE' })) },
	async restore(id) { return fromSubscription(await request(pathFor(id) + '/restore', { method: 'POST' })) },
	async renew(id, billingDate) { return fromSubscription((await request(pathFor(id) + '/renew', { method: 'POST', data: { billingDate } })).subscription) },
	async undo(id) { return fromSubscription(await request(pathFor(id) + '/undo-renewal', { method: 'POST' })) },
	settings: () => request('/settings'),
	updateSettings: data => request('/settings', { method: 'PATCH', data }),
	membership: () => request('/membership'),
	activateMembership: () => request('/membership/activate', { method: 'POST' }),
	restoreMembership: () => request('/membership/restore', { method: 'POST' }),
	stats: (period, currency) => request('/dashboard/stats', { query: { period, currency } }),
	reminders: () => request('/reminders', { query: { days: 30 } }),
	catalog: () => request('/catalog')
}
