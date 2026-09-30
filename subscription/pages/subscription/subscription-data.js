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
	overdue: '逾期未确认',
	upcoming: '即将到期',
	trial: '试用中',
	pending: '待处理',
	paused: '已暂停',
	cancelled: '已取消',
	archived: '已归档'
}

export const CURRENCY_SYMBOLS = {
	CNY: '¥',
	USD: '$',
	HKD: 'HK$',
	JPY: 'JP¥'
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

export function createDefaultSettings() {
	return {
		amountVisible: true,
		notificationEnabled: false,


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
