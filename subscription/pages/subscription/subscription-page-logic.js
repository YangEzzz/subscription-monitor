import {
	STORAGE_KEYS,
	CATEGORY_COLORS,
	STATUS_LABELS,
	CURRENCY_SYMBOLS,
	toDateKey,
	parseDate,
	addDays,
	formatDate,
	daysUntil,
	getDisplayStatus,
	getMonthlyEquivalent,
	getNextBillingDate,
	createSeedSubscriptions,
	createDefaultSettings
} from './subscription-data.js'

/**
 * Page-level state defaults stay outside the view so the shell only wires
 * reactive state into the extracted views.
 */
export function createSubscriptionPageState() {
			const today = toDateKey(new Date())
			return {
				activeView: 'home', viewStack: [], scrollTop: 0,
				statusBarHeight: 20, navigationBarHeight: 44,
						tabs: [
					{ key: 'home', label: '首页', icon: 'home', activeIcon: 'home-filled' },
					{ key: 'all', label: '订阅', icon: 'list', activeIcon: 'list' },
					{ key: 'calendar', label: '日历', icon: 'calendar', activeIcon: 'calendar-filled' },
					{ key: 'stats', label: '统计', icon: 'wallet', activeIcon: 'wallet-filled' },
					{ key: 'profile', label: '我的', icon: 'person', activeIcon: 'person-filled' }
					],
					subscriptions: [], settings: createDefaultSettings(),
					authStatus: 'idle',
					subscribeTemplateIds: [], // 填写微信公众平台中的订阅消息模板 ID
				subscriptionLimit: 5,
				searchKeyword: '', activeCategory: '全部', activeStatus: 'default', sortMode: 'date', sortSheetVisible: false,
				sortOptions: [
					{ value: 'date', label: '按扣费日期', desc: '即将扣费的订阅排在前面', icon: 'calendar' },
					{ value: 'amount', label: '按金额从高到低', desc: '优先查看支出较高的订阅', icon: 'wallet' },
					{ value: 'created', label: '按添加时间', desc: '最近添加的订阅排在前面', icon: 'compose' }
				],
				weekdays: ['日', '一', '二', '三', '四', '五', '六'], calendarCursor: today.slice(0, 7) + '-01', selectedDate: today,
				statsPeriod: 'month', statsCurrency: 'CNY', statPeriods: [{ value: 'month', label: '月均' }, { value: 'year', label: '年度' }, { value: 'next', label: '未来30天' }],
				selectedId: null, editingId: null, originalBillingDate: null, formError: '',
				categories: ['影音娱乐', '音乐', '云存储', 'AI 工具', '效率工具', '阅读', '其他'],
				cycles: ['每周', '每月', '每季度', '每半年', '每年', '自定义天数', '一次性'],
				payments: ['微信支付', '支付宝', 'App Store', '信用卡', '官网', '其他'], currencies: ['CNY', 'USD', 'HKD', 'JPY'],
				logoColors: ['#16834d', '#3f91ed', '#ef3943', '#e43c86', '#6658d9', '#202622'],
				reminderOptions: [{ value: 14, label: '提前 14 天', desc: '适合年度或高金额订阅' }, { value: 7, label: '提前 7 天', desc: '预留充分处理时间' }, { value: 3, label: '提前 3 天', desc: '默认提醒节点' }, { value: 1, label: '提前 1 天', desc: '临近扣费再次确认' }, { value: 0, label: '扣费当天', desc: '当天站内待办' }],
				serviceTemplates: [
					{ name: '腾讯视频 VIP', short: '腾讯视频', plan: '连续包月', logo: '视', icon: 'videocam-filled', color: '#19a768', category: '影音娱乐', amount: 25, payment: '微信支付' },
					{ name: '网易云音乐黑胶 VIP', short: '网易云', plan: '黑胶 VIP', logo: '音', icon: 'headphones', color: '#ef3943', category: '音乐', amount: 15, payment: '微信支付' },
					{ name: 'iCloud+ 200GB', short: 'iCloud', plan: '200GB', logo: '云', icon: 'cloud-upload-filled', color: '#3f98ee', category: '云存储', amount: 21, payment: 'App Store' },
					{ name: 'ChatGPT Plus', short: 'ChatGPT', plan: 'Plus', logo: 'AI', icon: 'loop', color: '#1f9c70', category: 'AI 工具', amount: 145, payment: '信用卡' }
				],
				form: {}
			}
}

/**
 * Options API computed properties and actions are kept in one reusable module.
 * Every function intentionally uses this so Vue still owns reactivity.
 */
export const subscriptionComputed = {
			todayKey() { return toDateKey(new Date()) },
			showTabBar() { return ['home', 'all', 'calendar', 'stats', 'profile'].includes(this.activeView) },
			liveSubscriptions() { return this.subscriptions.filter(item => !item.deletedAt) },
			deletedSubscriptions() { return this.subscriptions.filter(item => item.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt) },
			quotaSubscriptions() { return this.liveSubscriptions.filter(item => !item.isDemo) },
			isMember() { return this.settings.membership && this.settings.membership.status === 'active' },
			canCreateSubscription() { return this.isMember || this.quotaSubscriptions.length < this.subscriptionLimit },
			freeQuotaText() { return this.quotaSubscriptions.length >= this.subscriptionLimit ? `免费额度已用完 · ${this.quotaSubscriptions.length} / ${this.subscriptionLimit}` : `已使用 ${this.quotaSubscriptions.length} / ${this.subscriptionLimit} · 演示数据不计入` },
			freeQuotaValue() { return `${this.quotaSubscriptions.length} / ${this.subscriptionLimit}` },
			membershipQuotaPercent() { return Math.min(100, this.quotaSubscriptions.length / this.subscriptionLimit * 100) },
			selectedSubscription() { return this.liveSubscriptions.find(item => item.id === this.selectedId) || null },
			selectedRenewalHistory() { return this.selectedSubscription ? (this.selectedSubscription.renewalHistory || []).slice().reverse().slice(0, 3) : [] },
			selectedNextReminderText() { return this.selectedSubscription ? this.nextReminderText(this.selectedSubscription) : '' },
			renewalLocked() { const item = this.selectedSubscription; return Boolean(item && item.lastRenewedAt && item.lastRenewalNextBillingDate === item.nextBillingDate && Date.now() - item.lastRenewedAt < 10 * 60 * 1000) },
			activeSubscriptions() { return this.liveSubscriptions.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status)).sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)) },
			next30Subscriptions() { return this.activeSubscriptions.filter(item => daysUntil(item.nextBillingDate) >= 0 && daysUntil(item.nextBillingDate) <= 30) },
			upcoming7() { return this.next30Subscriptions.filter(item => daysUntil(item.nextBillingDate) <= 7) },
			upcoming30Later() { return this.next30Subscriptions.filter(item => daysUntil(item.nextBillingDate) > 7) },
			next30Total() { return this.next30Subscriptions.filter(item => item.currency === this.statsCurrency).reduce((sum, item) => sum + Number(item.amount || 0), 0) },
			next30TotalText() { return this.formatCurrencyTotals(this.next30Subscriptions, item => Number(item.amount || 0)) },
			monthlyAverage() { return this.liveSubscriptions.filter(item => item.currency === this.statsCurrency).reduce((sum, item) => sum + getMonthlyEquivalent(item), 0) },
			monthlyAverageText() { return this.formatCurrencyTotals(this.liveSubscriptions, item => getMonthlyEquivalent(item)) },
			actionableReminders() {
				const list = []
				if (!this.settings.notificationEnabled) list.push({ key: 'notification', tone: 'warning', icon: 'notification', title: '开启续费提醒', desc: '当前只能在小程序内查看到期待办', action: 'notification' })
				const overdue = this.liveSubscriptions.filter(item => !['cancelled','archived','paused'].includes(item.status) && daysUntil(item.nextBillingDate) < 0)
				if (overdue.length) list.push({ key: 'overdue', tone: 'danger', icon: 'info-filled', title: `${overdue.length} 项订阅已逾期未确认`, desc: '请确认是否已完成续费', action: 'overdue' })
				const pending = this.liveSubscriptions.filter(item => item.status === 'pending' && daysUntil(item.nextBillingDate) >= 0)
				if (pending.length) list.push({ key: 'pending', tone: 'warning', icon: 'redo', title: `${pending.length} 项等待稍后处理`, desc: '已保留在站内待办中', action: 'pending' })
				const incomplete = this.liveSubscriptions.filter(item => item.amount === null)
				if (incomplete.length) list.push({ key: 'incomplete', tone: 'info', icon: 'compose', title: `${incomplete.length} 项金额待补充`, desc: '补充后统计结果会更准确', action: 'incomplete' })
				if (!list.length) list.push({ key: 'done', tone: 'success', icon: 'checkbox-filled', title: '订阅状态良好', desc: '当前没有需要立即处理的事项', action: 'none' })
				return list.slice(0, 3)
			},
			categoryFilters() {
				const counts = this.liveSubscriptions.reduce((map, item) => { map[item.category] = (map[item.category] || 0) + 1; return map }, {})
				return [{ name: '全部', count: this.liveSubscriptions.length }].concat(Object.keys(counts).sort().map(name => ({ name, count: counts[name] })))
			},
			statusFilters() { return [{ value: 'all', label: '全部状态' }, { value: 'default', label: '有效订阅' }, { value: 'trial', label: '试用中' }, { value: 'upcoming', label: '即将到期' }, { value: 'pending', label: '待处理' }, { value: 'overdue', label: '逾期未确认' }, { value: 'incomplete', label: '金额待补充' }, { value: 'paused', label: '已暂停' }, { value: 'cancelled', label: '已取消' }, { value: 'archived', label: '已归档' }] },
			activeStatusLabel() { return (this.statusFilters.find(item => item.value === this.activeStatus) || {}).label || '全部状态' },
			sortLabel() { return { date: '按扣费日排序', amount: '按金额排序', created: '按创建时间排序' }[this.sortMode] },
			visibleSubscriptions() {
				let list = this.liveSubscriptions.filter(item => this.activeCategory === '全部' || item.category === this.activeCategory)
				if (this.activeStatus === 'default') list = list.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status))
				else if (this.activeStatus === 'incomplete') list = list.filter(item => item.amount === null || item.amount === '')
				else if (this.activeStatus === 'overdue') list = list.filter(item => !['cancelled','archived','paused'].includes(item.status) && daysUntil(item.nextBillingDate) < 0)
				else if (this.activeStatus !== 'all') list = list.filter(item => getDisplayStatus(item) === this.activeStatus)
				if (this.searchKeyword) { const word = this.searchKeyword.toLowerCase(); list = list.filter(item => `${item.name} ${item.plan || ''}`.toLowerCase().includes(word)) }
				return list.slice().sort((a, b) => this.sortMode === 'amount' ? Number(b.amount || 0) - Number(a.amount || 0) : this.sortMode === 'created' ? b.createdAt - a.createdAt : a.nextBillingDate.localeCompare(b.nextBillingDate))
			},
			calendarTitle() { const date = parseDate(this.calendarCursor); return `${date.getFullYear()}年${date.getMonth() + 1}月` },
			calendarDays() {
				const cursor = parseDate(this.calendarCursor), year = cursor.getFullYear(), month = cursor.getMonth(), firstWeekday = new Date(year, month, 1).getDay(), result = []
				for (let index = 0; index < 42; index++) { const date = new Date(year, month, index - firstWeekday + 1, 12); const key = toDateKey(date); const items = this.liveSubscriptions.filter(item => item.nextBillingDate === key && !['cancelled', 'archived', 'paused'].includes(item.status)); result.push({ key, day: date.getDate(), currentMonth: date.getMonth() === month, count: items.length, amountText: this.formatCompactTotals(items) }) }
				return result
			},
			selectedDateSubscriptions() { return this.liveSubscriptions.filter(item => item.nextBillingDate === this.selectedDate && !['cancelled', 'archived', 'paused'].includes(item.status)) },
			selectedDateTotalText() { return this.formatCurrencyTotals(this.selectedDateSubscriptions, item => Number(item.amount || 0)) },
			selectedDateTitle() { return formatDate(this.selectedDate, false) },
			selectedWeekday() { return `星期${this.weekdays[parseDate(this.selectedDate).getDay()]}` },
			statsTotal() { if (this.statsPeriod === 'year') return this.monthlyAverage * 12; if (this.statsPeriod === 'next') return this.next30Total; return this.monthlyAverage },
			statsLabel() { return { month: '月均订阅支出（估算）', year: '年度预计支出', next: '未来 30 天预计扣费' }[this.statsPeriod] },
			statsSubscriptionCount() { const source = this.statsPeriod === 'next' ? this.next30Subscriptions : this.liveSubscriptions; return source.filter(item => item.currency === this.statsCurrency && (this.statsPeriod === 'next' ? item.amount !== null && item.amount !== '' : getMonthlyEquivalent(item) > 0)).length },
			categoryStats() {
				const map = {}, factor = this.statsPeriod === 'year' ? 12 : 1
				this.liveSubscriptions.filter(item => item.currency === this.statsCurrency).forEach(item => { const value = this.statsPeriod === 'next' ? (this.next30Subscriptions.includes(item) ? Number(item.amount || 0) : 0) : getMonthlyEquivalent(item) * factor; if (value) map[item.category] = (map[item.category] || 0) + value })
				const total = Object.values(map).reduce((sum, value) => sum + value, 0) || 1
				return Object.keys(map).sort((a, b) => map[b] - map[a]).map(name => ({ name, value: map[name], percent: Math.round(map[name] / total * 100), color: CATEGORY_COLORS[name] || CATEGORY_COLORS['其他'] }))
			},
			donutBackground() { let start = 0; const stops = this.categoryStats.map(item => { const end = Math.min(100, start + item.percent); const stop = `${item.color} ${start}% ${end}%`; start = end; return stop }); return stops.length ? `conic-gradient(${stops.join(',')})` : '#e7ece8' },
			trendData() {
				const cursor = parseDate(this.todayKey), values = []
				for (let offset = 0; offset < 6; offset++) { const monthDate = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1); const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0); let value = 0; this.liveSubscriptions.filter(item => item.currency === this.statsCurrency && !['cancelled', 'archived', 'paused'].includes(item.status)).forEach(item => { let billing = parseDate(item.nextBillingDate), guard = 0; while (billing <= monthEnd && guard < 24) { if (billing >= monthDate) value += Number(item.amount || 0); if (item.cycle === '一次性') break; billing = parseDate(getNextBillingDate(toDateKey(billing), item.cycle, item.anchorDay, item.cycleValue)); guard++ } }); values.push({ month: `${monthDate.getMonth() + 1}月`, value }) }
				const max = Math.max(...values.map(item => item.value), 1); return values.map(item => ({ ...item, height: Math.max(8, Math.round(item.value / max * 100)) }))
			},
			formReminderPreview() { if (!this.form.nextBillingDate || !this.form.reminders || !this.form.reminders.length) return '未设置提醒'; const maxDay = Math.max(...this.form.reminders); return `${formatDate(addDays(this.form.nextBillingDate, -maxDay))} ${this.settings.reminderTime}` }
}

export const subscriptionLifecycle = {
		onLoad() { this.initNavigationLayout(); this.loadLocalData(); this.loginWithWechat() },
		onBackPress() {
			if (this.sortSheetVisible) { this.closeSortSheet(); return true }
			if (this.showTabBar) return false
			this.goBackView('home')
			return true
		},
}

export const subscriptionMethods = {
			formatDate, getStatus: getDisplayStatus,
			cycleText(item) { if (!item) return ''; return item.cycle === '自定义天数' ? `每 ${item.cycleValue || '?'} 天` : item.cycle },
			initNavigationLayout() {
				try {
					const windowInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
					const statusBarHeight = Number(windowInfo.statusBarHeight) || 20
					let navigationBarHeight = 44
					if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
						const menu = uni.getMenuButtonBoundingClientRect()
						const calculatedHeight = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 0
						if (calculatedHeight >= 40 && calculatedHeight <= 56) navigationBarHeight = calculatedHeight
					}
					this.statusBarHeight = statusBarHeight
					this.navigationBarHeight = navigationBarHeight
				} catch (error) {
					this.statusBarHeight = 20
					this.navigationBarHeight = 44
				}
			},
			formatMoney(value, currency = 'CNY') { if (value === null || value === '' || Number.isNaN(Number(value))) return '金额待补充'; return `${CURRENCY_SYMBOLS[currency] || currency + ' '}${Number(value).toFixed(2)}` },
			formatCurrencyTotals(items, valueGetter) {
				const totals = items.reduce((map, item) => { const value = Number(valueGetter(item) || 0); if (value) map[item.currency || 'CNY'] = (map[item.currency || 'CNY'] || 0) + value; return map }, {})
				const entries = Object.keys(totals).map(currency => this.formatMoney(totals[currency], currency))
				return entries.length ? entries.join(' + ') : this.formatMoney(0, this.settings.defaultCurrency)
			},
			formatCompactTotals(items) {
				const currencies = [...new Set(items.filter(item => item.amount !== null).map(item => item.currency || 'CNY'))]
				if (!currencies.length) return ''
				if (currencies.length > 1) return '多币种'
				const currency = currencies[0], total = items.filter(item => (item.currency || 'CNY') === currency).reduce((sum, item) => sum + Number(item.amount || 0), 0)
				return `${CURRENCY_SYMBOLS[currency] || currency}${this.compactAmount(total)}`
			},
			compactAmount(value) { const number = Number(value || 0); return number >= 1000 ? `${(number / 1000).toFixed(1)}k` : Math.round(number) },
			daysUntil(dateKey) { return daysUntil(dateKey) },
			statusText(item) { return STATUS_LABELS[getDisplayStatus(item)] },
			decorateItem(item) { return { ...item, shortDate: formatDate(item.nextBillingDate, false), days: daysUntil(item.nextBillingDate), amountText: item.amount === null ? '待补充' : this.formatMoney(item.amount, item.currency), displayStatus: this.statusText(item) } },
			daysText(item) { const days = daysUntil(item.nextBillingDate); return days < 0 ? `已逾期 ${Math.abs(days)} 天` : days === 0 ? '今天扣费' : `${days} 天后` },
			loadLocalData() {
				const saved = uni.getStorageSync(STORAGE_KEYS.subscriptions), savedSettings = uni.getStorageSync(STORAGE_KEYS.settings)
				const source = Array.isArray(saved) ? saved : createSeedSubscriptions()
				const demoNames = new Set(createSeedSubscriptions().map(item => item.name))
				this.subscriptions = source.map(item => ({ ...item, isDemo: item.isDemo || (Number(item.id) <= 11 && demoNames.has(item.name)), currency: item.currency || 'CNY', anchorDay: item.anchorDay || parseDate(item.nextBillingDate).getDate(), cycleValue: item.cycleValue || null, trial: Boolean(item.trialEndDate), trialEndDate: item.trialEndDate || null, renewalHistory: item.renewalHistory || [] }))
				this.settings = savedSettings ? { ...createDefaultSettings(), ...savedSettings } : createDefaultSettings()
				this.statsCurrency = this.settings.defaultCurrency || 'CNY'
				this.persist()
			},
			loginWithWechat() {
				this.authStatus = 'logging-in'
				uni.login({
					provider: 'weixin',
					success: result => {
						if (!result || !result.code) {
							this.authStatus = 'local'
							console.warn('[auth] 微信登录未返回 code，继续使用本地模式')
							return
						}
						this.authStatus = 'authenticated'
						console.info('[auth] uni.login 成功，临时 code:', result.code)
						// code 只能短暂使用，正式接入时应立即发送给服务端，不要写入本地存储。
					},
					fail: error => {
						this.authStatus = 'local'
						console.warn('[auth] 微信登录失败，继续使用本地模式', error)
					}
				})
			},
			persist() { uni.setStorageSync(STORAGE_KEYS.subscriptions, this.subscriptions); uni.setStorageSync(STORAGE_KEYS.settings, this.settings) },
			navigateToView(view) { if (view === this.activeView) return; this.viewStack.push(this.activeView); this.activeView = view; this.scrollToTop() },
			goBackView(fallback = 'home') { this.activeView = this.viewStack.length ? this.viewStack.pop() : fallback; this.formError = ''; this.scrollToTop() },
			switchTab(tab) { this.sortSheetVisible = false; this.viewStack = []; this.activeView = tab; this.scrollToTop() },
			scrollToTop() { this.scrollTop = this.scrollTop === 0 ? 1 : 0 },
			toggleAmount() { this.settings.amountVisible = !this.settings.amountVisible; this.persist() },
			enableNotification() {
				if (!this.subscribeTemplateIds.length) return uni.showModal({ title: '暂未配置通知模板', content: '请先在代码中配置微信订阅消息模板 ID，再发起授权。当前不会修改提醒状态。', showCancel: false })
				if (typeof uni.requestSubscribeMessage !== 'function') return uni.showModal({ title: '当前平台不支持', content: '请在微信小程序真机或微信开发者工具中发起订阅消息授权。', showCancel: false })
				uni.requestSubscribeMessage({
					tmplIds: this.subscribeTemplateIds,
					success: result => {
						const statuses = this.subscribeTemplateIds.map(templateId => ({ templateId, status: result[templateId] || 'unknown', updatedAt: Date.now() }))
						const accepted = statuses.some(item => item.status === 'accept')
						this.settings.notificationAuthorization = statuses
						this.settings.notificationEnabled = accepted
						this.persist()
						uni.showToast({ title: accepted ? '授权成功' : '未获得授权', icon: 'none' })
						console.info('[notification] 订阅消息授权结果:', statuses)
					},
					fail: error => {
						console.warn('[notification] 订阅消息授权失败:', error)
						uni.showToast({ title: '授权未完成', icon: 'none' })
					}
				})
			},
			handleNotificationSwitch(value) { if (value) this.enableNotification(); else this.setNotification(false) },
			setNotification(value) { this.settings.notificationEnabled = value; this.persist(); uni.showToast({ title: value ? '提醒状态已开启' : '提醒状态已关闭', icon: 'none' }) },
			updateSetting(key, value) { this.settings[key] = value; this.persist() },
			updateDefaultCurrency(value) { this.settings.defaultCurrency = value; this.statsCurrency = value; this.persist() },
			handleReminder(item) { if (item.action === 'notification') this.enableNotification(); else if (item.action === 'overdue') { this.activeStatus = 'overdue'; this.switchTab('all') } else if (item.action === 'pending') { this.activeStatus = 'pending'; this.switchTab('all') } else if (item.action === 'incomplete') { this.activeStatus = 'incomplete'; this.switchTab('all') } },
			chooseSort() { this.sortSheetVisible = true },
			closeSortSheet() { this.sortSheetVisible = false },
			selectSort(value) { this.sortMode = value; this.sortSheetVisible = false },
			resetFilters() { this.searchKeyword = ''; this.activeCategory = '全部'; this.activeStatus = 'default'; this.sortMode = 'date' },
			changeMonth(delta) { const date = parseDate(this.calendarCursor); date.setMonth(date.getMonth() + delta); this.calendarCursor = toDateKey(date).slice(0, 7) + '-01'; this.selectedDate = this.calendarCursor },
			goToday() { this.calendarCursor = this.todayKey.slice(0, 7) + '-01'; this.selectedDate = this.todayKey },
			selectDate(key) { this.selectedDate = key; if (key.slice(0, 7) !== this.calendarCursor.slice(0, 7)) this.calendarCursor = key.slice(0, 7) + '-01' },
			openDetail(item) { this.selectedId = item.id; this.navigateToView('detail') },
			createEmptyForm(date) { const nextBillingDate = date || addDays(this.todayKey, 7); return { name: '', plan: '', logo: '订', color: '#16834d', amount: '', currency: this.settings.defaultCurrency, cycle: '每月', cycleValue: '', nextBillingDate, anchorDay: parseDate(nextBillingDate).getDate(), payment: '微信支付', category: '其他', status: 'active', autoRenew: true, trial: false, trialEndDate: null, reminders: this.settings.defaultReminders.slice(), note: '', cancelGuide: '' } },
			openMembership() { this.navigateToView('membership') },
			showMembershipLimit() { uni.showModal({ title: '免费额度已用完', content: `免费版最多保存 ${this.subscriptionLimit} 条订阅，开通会员后可无限新增。`, confirmText: '开通会员', success: res => { if (res.confirm) this.openMembership() } }) },
			openForm(date, item) { if (!item && !this.canCreateSubscription) { this.showMembershipLimit(); return } this.formError = ''; this.editingId = item ? item.id : null; this.originalBillingDate = item ? item.nextBillingDate : null; this.form = item ? { ...item, amount: item.amount === null ? '' : String(item.amount), cycleValue: item.cycleValue || '', trial: Boolean(item.trialEndDate), trialEndDate: item.trialEndDate || null, reminders: (item.reminders || []).slice() } : this.createEmptyForm(date); this.navigateToView('form') },
			applyTemplate(template) { Object.assign(this.form, { ...template, amount: String(template.amount), cycle: '每月' }); uni.showToast({ title: `已选择${template.short}`, icon: 'none' }) },
			toggleReminder(value) { const index = this.form.reminders.indexOf(value); if (index >= 0) this.form.reminders.splice(index, 1); else this.form.reminders.push(value); this.form.reminders.sort((a, b) => b - a) },
			changeCycle(value) { this.form.cycle = value; if (value !== '自定义天数') this.form.cycleValue = ''; if (value === '一次性') { this.form.autoRenew = false; this.form.trial = false; this.form.trialEndDate = null } },
			setTrial(value) { this.form.trial = Boolean(value); if (!this.form.trial) this.form.trialEndDate = null; else if (!this.form.trialEndDate) this.form.trialEndDate = this.form.nextBillingDate },
			validateForm() { if (!this.form.name) return '请输入服务名称'; if (this.form.name.length > 30) return '服务名称不能超过 30 个字符'; if (this.form.amount !== '' && (Number.isNaN(Number(this.form.amount)) || Number(this.form.amount) < 0)) return '金额必须是大于或等于 0 的数字'; if (this.form.amount !== '' && !/^\d+(\.\d{0,2})?$/.test(String(this.form.amount))) return '金额最多保留两位小数'; if (this.form.cycle === '自定义天数' && (!/^\d+$/.test(String(this.form.cycleValue)) || Number(this.form.cycleValue) < 1 || Number(this.form.cycleValue) > 365)) return '自定义周期请输入1–365天'; if (!this.form.nextBillingDate || daysUntil(this.form.nextBillingDate) < 0) return `下次${this.form.autoRenew ? '扣费' : '到期'}日不能早于今天`; if (this.form.trial && (!this.form.trialEndDate || daysUntil(this.form.trialEndDate) < 0)) return '试用截止日不能早于今天'; if (this.form.trial && this.form.trialEndDate > this.form.nextBillingDate) return '试用截止日不能晚于下次扣费日'; if (!this.form.reminders.length) return '请至少选择一个提醒节点'; return '' },
			saveSubscription(force = false) {
				if (!this.editingId && !this.canCreateSubscription) { this.showMembershipLimit(); return }
				this.formError = this.validateForm(); if (this.formError) { uni.showToast({ title: this.formError, icon: 'none' }); return }
				const duplicate = !this.editingId && this.liveSubscriptions.find(item => item.name === this.form.name && Number(item.amount) === Number(this.form.amount || 0) && Math.abs(daysUntil(item.nextBillingDate) - daysUntil(this.form.nextBillingDate)) <= 3)
				if (duplicate && !force) { uni.showModal({ title: '可能重复录入', content: `已有“${duplicate.name}”在相近日期扣费，仍要继续保存吗？`, confirmText: '继续保存', success: res => { if (res.confirm) this.saveSubscription(true) } }); return }
				const wasEditing = Boolean(this.editingId)
				if (this.form.cycle === '一次性') { this.form.autoRenew = false; this.form.trial = false; this.form.trialEndDate = null }
				const billingDateChanged = this.editingId && this.originalBillingDate !== this.form.nextBillingDate
				const payload = { ...this.form, isDemo: this.editingId ? Boolean(this.form.isDemo) : false, cycleValue: this.form.cycle === '自定义天数' ? Number(this.form.cycleValue) : null, trial: Boolean(this.form.trial), trialEndDate: this.form.trial ? this.form.trialEndDate : null, amount: this.form.amount === '' ? null : Number(Number(this.form.amount).toFixed(2)), anchorDay: billingDateChanged || !this.editingId ? parseDate(this.form.nextBillingDate).getDate() : this.form.anchorDay, logo: this.form.logo || this.form.name.slice(0, 2), updatedAt: Date.now() }
				if (this.editingId) { const index = this.subscriptions.findIndex(item => item.id === this.editingId); payload.id = this.editingId; payload.createdAt = this.subscriptions[index].createdAt; this.subscriptions.splice(index, 1, payload); this.selectedId = payload.id } else { payload.id = Date.now(); payload.createdAt = Date.now(); this.subscriptions.push(payload); this.selectedId = payload.id }
				this.persist(); uni.vibrateShort({ type: 'light' }); uni.showToast({ title: wasEditing ? '修改已保存' : '订阅已添加', icon: 'success' }); if (wasEditing && this.viewStack[this.viewStack.length - 1] === 'detail') this.viewStack.pop(); this.activeView = 'detail'; this.editingId = null; this.originalBillingDate = null; this.scrollToTop()
			},
			confirmRenewal() {
				const item = this.selectedSubscription
				if (!item || this.renewalLocked) return
				const currentBillingDate = item.nextBillingDate
				const nextBillingDate = getNextBillingDate(currentBillingDate, item.cycle, item.anchorDay, item.cycleValue)
				const isEarly = daysUntil(currentBillingDate) > 7
				const isOneOff = item.cycle === '一次性'
				const content = isOneOff
					? `确认 ${formatDate(currentBillingDate)} 已完成付款吗？确认后将自动归档。`
					: isEarly
						? `扣费日为 ${formatDate(currentBillingDate)}，确认已提前完成续费吗？下次扣费日将更新为 ${formatDate(nextBillingDate)}。`
						: `确认 ${formatDate(currentBillingDate)} 已完成续费吗？下次扣费日将更新为 ${formatDate(nextBillingDate)}。`
				uni.showModal({ title: '确认本次续费', content, confirmText: '确认续费', success: res => { if (res.confirm) this.processSubscription('renewed') } })
			},
			processSubscription(action) {
				const item = this.selectedSubscription
				if (!item) return
				if (action === 'renewed') {
					if (this.renewalLocked) return uni.showToast({ title: '本期续费已经确认', icon: 'none' })
					const billingDate = item.nextBillingDate
					const renewedAt = Date.now()
					const nextBillingDate = getNextBillingDate(billingDate, item.cycle, item.anchorDay, item.cycleValue)
					item.renewalHistory = (item.renewalHistory || []).concat({ billingDate, amount: item.amount, currency: item.currency, nextBillingDate, confirmedAt: renewedAt })
					item.lastRenewedBillingDate = billingDate
					item.lastRenewedAt = renewedAt
					item.lastRenewalNextBillingDate = nextBillingDate
					item.nextBillingDate = nextBillingDate
					item.status = item.cycle === '一次性' ? 'archived' : 'active'
					item.snoozedUntil = null
					uni.showToast({ title: item.cycle === '一次性' ? '已完成并归档' : '本期续费已确认', icon: 'success' })
				}
				item.updatedAt = Date.now()
				this.persist()
			},
			undoRenewal() {
				const item = this.selectedSubscription
				if (!item || !this.renewalLocked || !(item.renewalHistory || []).length) return
				uni.showModal({ title: '撤销本次确认', content: `扣费日将恢复为 ${formatDate(item.lastRenewedBillingDate)}，本次历史记录会移除。`, confirmText: '确认撤销', success: res => { if (!res.confirm) return; item.renewalHistory.pop(); item.nextBillingDate = item.lastRenewedBillingDate; item.lastRenewedAt = null; item.lastRenewedBillingDate = null; item.lastRenewalNextBillingDate = null; item.status = 'active'; item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: '已撤销', icon: 'success' }) } })
			},
			processTitle(item) {
				if (item.status === 'pending') return '等待你处理'
				const days = daysUntil(item.nextBillingDate), subject = item.cycle === '一次性' ? '付款' : (item.autoRenew ? '扣费' : '到期')
				return days === 0 ? `今天${subject}` : days > 0 ? `${days} 天后${subject}` : `已逾期 ${Math.abs(days)} 天未确认`
			},
			snoozeSubscription() {
				const item = this.selectedSubscription
				if (!item) return
				uni.showActionSheet({ itemList: ['今天晚些时候', '明天'], success: res => { const tomorrow = res.tapIndex === 1; item.status = 'pending'; item.snoozedUntil = tomorrow ? addDays(this.todayKey, 1) + ' ' + this.settings.reminderTime : this.todayKey + ' 18:00'; item.updatedAt = Date.now(); this.persist(); uni.showModal({ title: '已加入待办', content: this.settings.notificationEnabled ? `将在 ${item.snoozedUntil} 再次提醒。` : `已保留为站内待办。当前没有可用的微信通知，不会承诺发送。`, showCancel: false }) } })
			},
			showMoreActions() {
				const item = this.selectedSubscription
				if (!item) return
				const actions = []
				if (item.status === 'archived' || item.status === 'cancelled') actions.push({ label: '恢复为有效订阅', key: 'restore' })
				else actions.push({ label: item.status === 'paused' ? '恢复订阅' : '暂停订阅', key: item.status === 'paused' ? 'resume' : 'pause' }, { label: '取消订阅', key: 'cancel' })
				actions.push({ label: '复制订阅', key: 'copy' })
				if (item.status !== 'archived') actions.push({ label: '归档订阅', key: 'archive' })
				actions.push({ label: '删除订阅', key: 'delete' })
				uni.showActionSheet({ itemList: actions.map(action => action.label), success: res => this.handleSubscriptionAction(actions[res.tapIndex].key) })
			},
			handleSubscriptionAction(action) {
				const item = this.selectedSubscription
				if (!item) return
				if (action === 'cancel') return this.cancelSubscription()
				if (action === 'delete') return this.deleteSubscription()
				if (action === 'copy') { if (!this.canCreateSubscription) { this.showMembershipLimit(); return } const copy = { ...item, id: Date.now(), name: `${item.name} 副本`, isDemo: false, status: 'active', renewalHistory: [], lastRenewedAt: null, lastRenewedBillingDate: null, lastRenewalNextBillingDate: null, deletedAt: null, createdAt: Date.now() }; this.subscriptions.push(copy); this.persist(); return uni.showToast({ title: '已复制订阅', icon: 'success' }) }
				if (action === 'pause') item.status = 'paused'
				else if (action === 'resume' || action === 'restore') {
					if (daysUntil(item.nextBillingDate) < 0) return uni.showModal({ title: '需要更新日期', content: '原扣费日已过，请先选择新的未来扣费日再恢复。', confirmText: '去修改', success: res => { if (res.confirm) this.openForm(null, item) } })
					item.status = 'active'; item.snoozedUntil = null
				}
				else if (action === 'archive') item.status = 'archived'
				item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: { pause: '订阅已暂停', resume: '订阅已恢复', restore: '已恢复为有效订阅', archive: '订阅已归档' }[action], icon: 'none' })
			},
			cancelSubscription() { const item = this.selectedSubscription; const guide = item.cancelGuide ? `\n\n取消路径：${item.cancelGuide}` : ''; uni.showModal({ title: `标记“${item.name}”已取消`, content: `请先确认你已在原付款渠道完成取消。本工具只更新清单状态，不会代替你向服务商取消。${guide}`, confirmText: '我已取消', confirmColor: '#c5444c', success: res => { if (res.confirm) { item.status = 'cancelled'; item.autoRenew = false; item.snoozedUntil = null; item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: '已停止后续提醒', icon: 'success' }) } } }) },
			deleteSubscription() { const item = this.selectedSubscription; uni.showModal({ title: `删除“${item.name}”`, content: '订阅将移入回收站并释放免费额度，之后可在“我的”中恢复。', confirmText: '移入回收站', confirmColor: '#c5444c', success: res => { if (res.confirm) { item.deletedAt = Date.now(); item.updatedAt = Date.now(); this.persist(); this.selectedId = null; this.switchTab('all'); uni.showToast({ title: '已移入回收站', icon: 'success' }) } } }) },
			openTrash() {
				if (!this.deletedSubscriptions.length) return uni.showToast({ title: '回收站是空的', icon: 'none' })
				const items = this.deletedSubscriptions.slice(0, 6)
				uni.showActionSheet({ itemList: items.map(item => `恢复 ${item.name}`), success: res => {
					const item = items[res.tapIndex]
					if (!item) return
					if (!item.isDemo && !this.isMember && this.quotaSubscriptions.length >= this.subscriptionLimit) return this.showMembershipLimit()
					item.deletedAt = null
					item.updatedAt = Date.now()
					this.persist()
					uni.showToast({ title: '订阅已恢复', icon: 'success' })
				} })
			},
			nextReminderText(item) { if (!item.reminders || !item.reminders.length) return '未设置'; const future = item.reminders.map(days => ({ days, date: addDays(item.nextBillingDate, -days) })).filter(row => daysUntil(row.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)); if (!future.length) return '提醒节点已过，将保留站内待办'; return `${formatDate(future[0].date)} ${this.settings.reminderTime}` },
			openReminderSettings() { this.navigateToView('reminder-settings') },
			activateMembership() { uni.showModal({ title: '本地模拟开通', content: '当前仅修改本地会员状态，不会产生真实扣款。确定开通吗？', confirmText: '确认开通', success: res => { if (res.confirm) { this.settings.membership = { status: 'active', plan: '会员版', startedAt: Date.now() }; this.persist(); uni.showToast({ title: '会员已开通', icon: 'success' }) } } }) },
			restoreFreePlan() { uni.showModal({ title: '恢复免费版', content: '恢复后新增订阅将受 5 条额度限制，已有订阅不会被删除。', confirmText: '确认恢复', success: res => { if (res.confirm) { this.settings.membership = { status: 'free', plan: '免费版', startedAt: null }; this.persist(); uni.showToast({ title: '已恢复免费版', icon: 'none' }) } } }) },
			toggleDefaultReminder(value) { const list = this.settings.defaultReminders; const index = list.indexOf(value); if (index >= 0) { if (list.length === 1) return uni.showToast({ title: '至少保留一个提醒节点', icon: 'none' }); list.splice(index, 1) } else list.push(value); list.sort((a, b) => b - a); this.persist() },
			exportData() {
				if (!this.liveSubscriptions.length) return uni.showToast({ title: '暂无可导出的订阅', icon: 'none' })
				uni.showModal({ title: '导出订阅数据', content: `将导出 ${this.liveSubscriptions.length} 条订阅记录，金额和备注等本地数据会包含在文件中。`, confirmText: '确认导出', success: res => { if (res.confirm) this.performExport() } })
			},
			performExport() { const header = '服务名称,套餐,分类,金额,币种,周期,下次扣费日,状态,付款渠道,备注'; const rows = this.liveSubscriptions.map(item => [item.name, item.plan || '', item.category, item.amount === null ? '' : item.amount, item.currency, this.cycleText(item), item.nextBillingDate, this.statusText(item), item.payment, item.note || ''].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')); const csv = [header].concat(rows).join('\n');
				// #ifdef H5
				const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `续订清单-${this.todayKey}.csv`; link.click(); URL.revokeObjectURL(link.href); uni.showToast({ title: 'CSV 已导出', icon: 'success' })
				// #endif
				// #ifndef H5
				uni.setClipboardData({ data: csv, success: () => uni.showToast({ title: '表格数据已复制', icon: 'success' }) })
				// #endif
			},
			showPrivacy() { uni.showModal({ title: '隐私与数据说明', content: '当前版本只把演示数据保存在本机缓存，不会上传服务端，也不会读取支付账户。接入后端后需要补充正式隐私政策与数据删除机制。', showCancel: false }) },
			resetDemoData() { uni.showModal({ title: '恢复演示数据', content: '当前本地修改将被覆盖，确定继续吗？', confirmColor: '#c5444c', success: res => { if (res.confirm) { this.subscriptions = createSeedSubscriptions(); this.settings = createDefaultSettings(); this.statsCurrency = this.settings.defaultCurrency || 'CNY'; this.searchKeyword = ''; this.activeCategory = '全部'; this.activeStatus = 'default'; this.sortMode = 'date'; this.persist(); uni.showToast({ title: '演示数据已恢复', icon: 'success' }) } } }) }
}
