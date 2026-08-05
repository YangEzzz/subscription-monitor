export const STORAGE_KEYS = {
	subscriptions: 'renewal_demo_subscriptions_v2',
	settings: 'renewal_demo_settings_v2'
}

export const CATEGORY_COLORS = {
	'影音娱乐': '#e74a52',
	'音乐': '#ef6c52',
	'云存储': '#3f91ed',
	'AI 工具': '#1f9c70',
	'效率工具': '#6658d9',
	'阅读': '#c17d2f',
	'其他': '#73817a'
}

export const STATUS_LABELS = {
	active: '正常',
	upcoming: '即将到期',
	pending: '待处理',
	paused: '已暂停',
	cancelled: '已取消',
	archived: '已归档'
}

export function pad(value) {
	return String(value).padStart(2, '0')
}

export function toDateKey(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDate(dateKey) {
	const values = String(dateKey).split('-').map(Number)
	return new Date(values[0], values[1] - 1, values[2], 12, 0, 0)
}

export function addDays(dateKey, days) {
	const date = typeof dateKey === 'string' ? parseDate(dateKey) : new Date(dateKey)
	date.setDate(date.getDate() + Number(days))
	return toDateKey(date)
}

export function formatDate(dateKey, withYear = true) {
	const date = parseDate(dateKey)
	return withYear
		? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
		: `${date.getMonth() + 1}月${date.getDate()}日`
}

export function daysUntil(dateKey) {
	const today = parseDate(toDateKey(new Date()))
	return Math.ceil((parseDate(dateKey) - today) / 86400000)
}

export function getDisplayStatus(item) {
	if (['paused', 'cancelled', 'archived'].includes(item.status)) return item.status
	const days = daysUntil(item.nextBillingDate)
	if (item.status === 'pending' || days < 0) return 'pending'
	if (days <= Math.max(...(item.reminders || [3]))) return 'upcoming'
	return 'active'
}

export function getCycleMonths(cycle) {
	return { '每周': 0.2301, '每月': 1, '每季度': 3, '每半年': 6, '每年': 12, '一次性': 0 }[cycle] || 1
}

export function getMonthlyEquivalent(item) {
	if (item.amount === null || item.amount === '' || item.status === 'cancelled' || item.status === 'paused' || item.status === 'archived') return 0
	const months = getCycleMonths(item.cycle)
	if (!months) return 0
	return Number(item.amount) / months
}

export function getNextBillingDate(dateKey, cycle) {
	const date = parseDate(dateKey)
	const anchorDay = date.getDate()
	if (cycle === '每周') date.setDate(date.getDate() + 7)
	else if (cycle === '每月' || cycle === '每季度' || cycle === '每半年' || cycle === '每年') {
		const months = { '每月': 1, '每季度': 3, '每半年': 6, '每年': 12 }[cycle]
		date.setDate(1)
		date.setMonth(date.getMonth() + months)
		const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
		date.setDate(Math.min(anchorDay, lastDay))
	}
	return toDateKey(date)
}

export function createSeedSubscriptions() {
	const today = toDateKey(new Date())
	return [
		{ id: 1, name: '网易云音乐黑胶 VIP', plan: '黑胶 VIP', logo: '音', color: '#ef3943', amount: 15, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 2), payment: '微信支付', category: '音乐', status: 'active', autoRenew: true, reminders: [7, 3, 1, 0], note: '常用音乐会员', cancelGuide: '网易云音乐 App > 会员中心 > 自动续费管理', createdAt: Date.now() - 60000 },
		{ id: 2, name: 'iCloud+ 200GB', plan: '200GB', logo: '云', color: '#3f98ee', amount: 21, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 4), payment: '支付宝', category: '云存储', status: 'active', autoRenew: true, reminders: [7, 3, 1], note: '', cancelGuide: 'iPhone 设置 > Apple ID > iCloud > 管理储存空间', createdAt: Date.now() - 50000 },
		{ id: 3, name: 'Netflix 高级套餐', plan: '高级套餐', logo: 'N', color: '#181818', amount: 108, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 10), payment: '信用卡', category: '影音娱乐', status: 'active', autoRenew: true, reminders: [7, 3, 1], note: '家庭电视使用', cancelGuide: 'Netflix 账户 > 取消会员资格', createdAt: Date.now() - 40000 },
		{ id: 4, name: '腾讯视频 VIP', plan: '连续包月', logo: '视', color: '#19a768', amount: 25, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 14), payment: '微信支付', category: '影音娱乐', status: 'active', autoRenew: true, reminders: [7, 3, 1], note: '', cancelGuide: '微信支付 > 自动续费 > 腾讯视频', createdAt: Date.now() - 30000 },
		{ id: 5, name: 'ChatGPT Plus', plan: 'Plus', logo: 'AI', color: '#1f9c70', amount: 145, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 16), payment: '信用卡', category: 'AI 工具', status: 'active', autoRenew: true, reminders: [7, 3, 1], note: '工作账号', cancelGuide: 'ChatGPT 设置 > Subscription > Manage', createdAt: Date.now() - 20000 },
		{ id: 6, name: 'Adobe Creative Cloud', plan: '摄影计划', logo: 'A', color: '#e43c86', amount: 173, currency: 'CNY', cycle: '每年', nextBillingDate: addDays(today, 30), payment: '信用卡', category: '效率工具', status: 'active', autoRenew: true, reminders: [14, 7, 3], note: '年度订阅', cancelGuide: 'Adobe 账户 > 计划 > 管理计划', createdAt: Date.now() - 10000 },
		{ id: 7, name: '百度网盘超级会员', plan: '超级会员', logo: '盘', color: '#3f91ed', amount: 30, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, -2), payment: '支付宝', category: '云存储', status: 'active', autoRenew: true, reminders: [7, 3, 1], note: '演示逾期未确认状态', cancelGuide: '百度网盘 App > 我的 > 续费管理', createdAt: Date.now() - 9000 },
		{ id: 8, name: '得到听书会员', plan: '年度会员', logo: '得', color: '#c17d2f', amount: null, currency: 'CNY', cycle: '每年', nextBillingDate: addDays(today, 21), payment: '微信支付', category: '阅读', status: 'active', autoRenew: true, reminders: [14, 7, 3], note: '演示金额待补充状态', cancelGuide: '', createdAt: Date.now() - 8000 },
		{ id: 9, name: 'Keep 会员', plan: '连续包月', logo: 'K', color: '#6658d9', amount: 25, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 8), payment: '微信支付', category: '其他', status: 'paused', autoRenew: true, reminders: [7, 3, 1], note: '暂时不使用，保留记录', cancelGuide: 'Keep App > 我的 > 设置 > 自动续费管理', createdAt: Date.now() - 7000 },
		{ id: 10, name: '知乎盐选会员', plan: '连续包月', logo: '知', color: '#202622', amount: 19, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 12), payment: '支付宝', category: '阅读', status: 'cancelled', autoRenew: false, reminders: [7, 3, 1], note: '已在原付款渠道取消', cancelGuide: '支付宝 > 支付设置 > 免密支付/自动扣款', createdAt: Date.now() - 6000 },
		{ id: 11, name: 'Notion Plus', plan: 'Plus', logo: 'N', color: '#202622', amount: 72, currency: 'CNY', cycle: '每月', nextBillingDate: addDays(today, 25), payment: '信用卡', category: '效率工具', status: 'archived', autoRenew: false, reminders: [7, 3, 1], note: '历史工作项目使用', cancelGuide: 'Notion Settings > Billing > Change plan', createdAt: Date.now() - 5000 }
	]
}

export function createDefaultSettings() {
	return {
		amountVisible: true,
		notificationEnabled: false,
		notificationAuthorization: [],
		weeklySummary: true,
		defaultCurrency: 'CNY',
		defaultReminders: [7, 3, 1],
		reminderTime: '09:00',
		timezone: 'Asia/Shanghai',
		membership: {
			status: 'free',
			plan: '免费版',
			startedAt: null
		}
	}
}
