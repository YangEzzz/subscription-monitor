import { subscriptionApi as api, toSubscription, CATEGORIES, CYCLES, PAYMENTS } from '../../api/subscriptions.js'
import { CATEGORY_COLORS, createDefaultSettings, daysUntil, formatDate } from './subscription-data.js'

const confirm = options => new Promise(resolve => uni.showModal({ ...options, success: result => resolve(result.confirm), fail: () => resolve(false) }))
const toast = title => uni.showToast({ title, icon: 'none' })

export const remoteComputed = {
	statsTotal() { return this.currentStats ? this.currentStats.total : 0 },
	currentStats() { return this.serverStats[this.statsPeriod === 'next' ? 'next30' : this.statsPeriod] || null },
	statsSubscriptionCount() { return this.currentStats ? this.currentStats.subscriptionCount : 0 },
	categoryStats() {
		return (this.currentStats ? this.currentStats.categoryStats : []).map(item => ({
			name: CATEGORIES[item.category] || item.category, value: item.value, percent: item.percent,
			color: CATEGORY_COLORS[CATEGORIES[item.category]] || CATEGORY_COLORS['其他']
		}))
	},
	trendData() {
		const values = this.serverStats.month ? this.serverStats.month.trend : []
		const max = Math.max(1, ...values.map(item => item.value))
		return values.map(item => ({ ...item, month: `${Number(item.month.slice(5))}月`, height: Math.max(8, Math.round(item.value / max * 100)) }))
	}
}

export const remoteMethods = {
	applyMembership(membership) {
		this.settings = { ...this.settings, membership: { ...membership, plan: membership.status === 'active' ? '会员版' : '免费版', startedAt: membership.startedAt ? new Date(membership.startedAt).getTime() : null } }
		this.subscriptionLimit = membership.quota.limit || 5
	},
	applyCatalog(catalog) {
		this.categories = catalog.categories.map(key => CATEGORIES[key] || key)
		this.cycles = catalog.cycles.map(key => CYCLES[key] || key)
		this.payments = catalog.paymentMethods.map(key => PAYMENTS[key] || key)
		this.currencies = catalog.currencies
		this.serviceTemplates = catalog.templates.map(item => ({ ...item, category: CATEGORIES[item.category], cycle: CYCLES[item.cycle], payment: PAYMENTS[item.payment], short: item.shortName, icon: 'star-filled' }))
	},
	async refreshData() {
		if (this.loading || this.mutating) return false
		this.loading = true
		this.loadError = ''
		try {
			const [subscriptions, settings, membership, catalog, reminders] = await Promise.all([
				api.listAll(), api.settings(), api.membership(), api.catalog(), api.reminders()
			])
			this.subscriptions = subscriptions
			this.settings = { ...createDefaultSettings(), ...settings }
			this.applyMembership(membership)
			this.applyCatalog(catalog)
			this.serverReminders = reminders.data
			if (!this.dataReady) this.statsCurrency = settings.defaultCurrency
			this.dataReady = true
			this.authStatus = 'demo'
			if (this.selectedId && !this.selectedSubscription) { this.selectedId = null; this.switchTab('all') }
			await this.refreshStats()
			return true
		} catch (error) {
			this.loadError = error.message
			return false
		} finally { this.loading = false }
	},
	async refreshStats() {
		const sequence = ++this.statsRequestId
		const currency = this.statsCurrency
		this.statsLoading = true
		this.statsError = ''
		this.serverStats = {}
		try {
			const values = await Promise.all(['month', 'year', 'next30'].map(period => api.stats(period, currency)))
			if (sequence !== this.statsRequestId) return
			this.serverStats = Object.fromEntries(values.map(value => [value.period, value]))
		} catch (error) {
			if (sequence === this.statsRequestId) this.statsError = error.message
		} finally { if (sequence === this.statsRequestId) this.statsLoading = false }
	},
	changeStatsCurrency(currency) { if (currency === this.statsCurrency) return; this.statsCurrency = currency; this.refreshStats() },
	upsertSubscription(item) {
		const index = this.subscriptions.findIndex(row => row.id === item.id)
		if (index < 0) this.subscriptions.push(item)
		else this.subscriptions.splice(index, 1, item)
	},
	async mutate(operation, successMessage, applyResult = result => this.upsertSubscription(result)) {
		if (this.mutating || this.loading || !this.dataReady) return false
		if (this.loadError) { toast('请先刷新数据，确认当前状态后再操作'); return false }
		this.mutating = true
		if (uni.showLoading) uni.showLoading({ title: '正在保存', mask: true })
		let operationError = null
		try {
			const result = await operation()
			applyResult(result)
		} catch (error) {
			operationError = error
			this.formError = error.message
			// 请求结果不确定时先重新读取，不自动重发写请求。
			this.loadError = error.code === 'NETWORK_ERROR' ? '请求结果未确认，请刷新数据后再操作' : ''
		} finally {
			if (uni.hideLoading) uni.hideLoading()
			this.mutating = false
		}
		if (operationError) { toast(operationError.message); return false }
		// 写操作已经成功；刷新失败单独呈现，避免诱导用户重复新增或续费。
		await this.refreshData()
		if (successMessage) toast(successMessage)
		return true
	},
	async openDetail(item) {
		if (this.loading || this.mutating) return
		this.loading = true
		try {
			const detail = await api.detail(item.id)
			this.upsertSubscription(detail)
			this.selectedId = detail.id
			this.navigateToView('detail')
		} catch (error) { toast(error.message) }
		finally { this.loading = false }
	},
	async saveSubscription(force = false) {
		if (this.loading || this.mutating || !this.dataReady) return
		if (!this.editingId && !this.canCreateSubscription) return this.showMembershipLimit()
		this.form.name = (this.form.name || '').trim()
		this.formError = this.validateForm()
		if (this.formError) return toast(this.formError)
		const payload = toSubscription(this.form, Boolean(this.editingId))
		const duplicate = !this.editingId && this.activeSubscriptions.find(item => item.name === payload.name && item.currency === payload.currency && item.amount === payload.amount && Math.abs(daysUntil(item.nextBillingDate) - daysUntil(payload.nextBillingDate)) <= 3)
		if (duplicate && force !== true) {
			if (await confirm({ title: '可能重复录入', content: `已有“${duplicate.name}”在相近日期扣费，仍要继续保存吗？`, confirmText: '继续保存' })) return this.saveSubscription(true)
			return
		}
		const id = this.editingId
		const form = { ...this.form }
		const saved = await this.mutate(() => id ? api.update(id, payload) : api.create(form), id ? '修改已保存' : '订阅已添加', item => {
			this.upsertSubscription(item)
			this.selectedId = item.id
		})
		if (!saved) return
		if (id && this.viewStack[this.viewStack.length - 1] === 'detail') this.viewStack.pop()
		this.activeView = 'detail'
		this.editingId = null
		this.originalBillingDate = null
		this.formError = ''
		this.scrollToTop()
	},
	async confirmRenewal() {
		const item = this.selectedSubscription
		if (!item || this.renewalLocked || this.mutating) return
		const id = item.id, billingDate = item.nextBillingDate
		if (!await confirm({ title: '确认本次付款', content: `确认 ${formatDate(billingDate)} 已完成${item.cycle === '一次性' ? '付款？确认后自动归档。' : '续费？确认后将推进下一扣费日。'}`, confirmText: '确认完成' })) return
		await this.mutate(() => api.renew(id, billingDate), item.cycle === '一次性' ? '已完成并归档' : '本期续费已确认')
	},
	async undoRenewal() {
		const item = this.selectedSubscription
		if (!item || !this.renewalLocked) return
		if (!await confirm({ title: '撤销本次确认', content: `扣费日将恢复为 ${formatDate(item.lastRenewedBillingDate)}。`, confirmText: '确认撤销' })) return
		await this.mutate(() => api.undo(item.id), '已撤销本次确认')
	},
	async snoozeSubscription() {
		const item = this.selectedSubscription
		if (!item) return
		if (!await confirm({ title: '稍后处理', content: '将保留为站内待办，扣费日不变。当前后端尚未接入消息发送，不会发送微信再提醒。', confirmText: '加入待办' })) return
		await this.mutate(() => api.update(item.id, { status: 'pending' }), '已加入站内待办')
	},
	async handleSubscriptionAction(action) {
		const item = this.selectedSubscription
		if (!item || this.mutating) return
		if (action === 'cancel') return this.cancelSubscription()
		if (action === 'delete') return this.deleteSubscription()
		if (action === 'copy') {
			if (!this.canCreateSubscription) return this.showMembershipLimit()
			this.openForm()
			this.form = { ...this.form, ...item, name: `${item.name.slice(0, 27)} 副本`, amount: item.amount === null ? '' : String(item.amount), status: 'active', reminders: [...item.reminders] }
			return
		}
		if (action === 'resume' || action === 'restore') {
			if (daysUntil(item.nextBillingDate) < 0) {
				if (await confirm({ title: '需要更新日期', content: '原扣费日已过，请选择新的扣费日并保存后恢复。', confirmText: '去修改' })) {
					this.openForm(null, item)
					this.form.status = 'active'
				}
				return
			}
		}
		const status = { pause: 'paused', resume: 'active', restore: 'active', archive: 'archived' }[action]
		if (status) await this.mutate(() => api.update(item.id, { status }), '订阅状态已更新')
	},
	async cancelSubscription() {
		const item = this.selectedSubscription
		if (!item) return
		if (!await confirm({ title: `标记“${item.name}”已取消`, content: `请确认已在原付款渠道完成取消。本工具只更新记录。${item.cancelGuide ? '\n取消路径：' + item.cancelGuide : ''}`, confirmText: '我已取消' })) return
		await this.mutate(() => api.update(item.id, { status: 'cancelled', autoRenew: false }), '已标记取消')
	},
	async deleteSubscription() {
		const item = this.selectedSubscription
		if (!item) return
		if (!await confirm({ title: `删除“${item.name}”`, content: '订阅将移入回收站，可在“我的”中恢复。', confirmText: '移入回收站' })) return
		await this.mutate(() => api.remove(item.id), '已移入回收站', record => { this.upsertSubscription(record); this.selectedId = null; this.switchTab('all') })
	},
	openTrash() {
		if (!this.deletedSubscriptions.length) return toast('回收站是空的')
		this.trashPage = 0
		this.showTrashPage()
	},
	showTrashPage() {
		const items = this.deletedSubscriptions.slice(this.trashPage * 4, this.trashPage * 4 + 4)
		const labels = items.map(item => `恢复 ${item.name}`)
		const hasNext = (this.trashPage + 1) * 4 < this.deletedSubscriptions.length
		if (hasNext) labels.push('下一页')
		if (this.trashPage > 0) labels.push('上一页')
		uni.showActionSheet({ itemList: labels, success: async result => {
			if (result.tapIndex >= items.length) { this.trashPage += hasNext && result.tapIndex === items.length ? 1 : -1; return this.showTrashPage() }
			const item = items[result.tapIndex]
			await this.mutate(() => api.restore(item.id), '订阅已恢复')
		} })
	},
	async updateSetting(key, value) {
		await this.mutate(() => api.updateSettings({ [key]: value }), '', settings => { this.settings = { ...this.settings, ...settings } })
	},
	toggleAmount() { return this.updateSetting('amountVisible', !this.settings.amountVisible) },
	async updateDefaultCurrency(value) { await this.updateSetting('defaultCurrency', value); this.changeStatsCurrency(this.settings.defaultCurrency) },
	toggleDefaultReminder(value) {
		const list = [...this.settings.defaultReminders]
		const index = list.indexOf(value)
		if (index >= 0) { if (list.length === 1) return toast('至少保留一个提醒节点'); list.splice(index, 1) }
		else list.push(value)
		return this.updateSetting('defaultReminders', list.sort((a, b) => b - a))
	},
	enableNotification() { uni.showModal({ title: '暂未接入微信发送', content: '当前 API 仅提供站内到期待办。真实通知发送接入后，再申请消息授权并展示发送状态。', showCancel: false }) },
	handleNotificationSwitch(value) { if (value) this.enableNotification(); else this.updateSetting('notificationEnabled', false) },
	async activateMembership() {
		if (await confirm({ title: '模拟开通会员', content: '仅修改后端演示会员状态，不产生真实扣款；重启后端后会重置。', confirmText: '模拟开通' })) await this.mutate(() => api.activateMembership(), '模拟会员已开通', this.applyMembership)
	},
	async restoreFreePlan() {
		if (await confirm({ title: '恢复免费版', content: '已有订阅不会删除，后续新增受五条额度限制。', confirmText: '确认恢复' })) await this.mutate(() => api.restoreMembership(), '已恢复免费版', this.applyMembership)
	},
	nextReminderText(item) {
		if (['paused', 'cancelled', 'archived'].includes(item.status)) return '已停止提醒'
		const reminder = this.serverReminders.find(row => row.subscription.id === item.id)
		return reminder ? (reminder.nextReminderInDays === 0 ? '当前有站内到期待办（不发送微信消息）' : `${reminder.nextReminderInDays} 天后进入站内提醒窗口`) : '仅站内记录，未安排微信发送'
	},
	showPrivacy() { uni.showModal({ title: '隐私与数据说明', content: '当前订阅、备注和设置发送至配置的后端，并存于演示服务内存。使用演示用户标识，尚未接入真实登录、数据库和消息发送；服务重启会重置数据。请勿录入敏感信息。', showCancel: false }) },
	resetDemoData() { return this.refreshData() }
}
