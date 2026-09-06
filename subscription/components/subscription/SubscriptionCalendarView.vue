<template>
	<view class="page calendar-page">
		<view class="primary-titlebar" :style="{ height: navigationBarHeight + 'px' }"><text class="page-title">续费日历</text></view>
		<view class="month-nav"><button class="month-arrow" @tap="$emit('change-month', -1)"><uni-icons type="left" size="19" color="#5d655f" /></button><text class="month-name">{{ calendarTitle }}</text><button class="month-arrow" @tap="$emit('change-month', 1)"><uni-icons type="right" size="19" color="#5d655f" /></button><button class="today-button" @tap="$emit('today')">今天</button></view>
		<view class="calendar-card"><view class="calendar-grid week-grid"><text v-for="day in weekdays" :key="day">{{ day }}</text></view><view class="calendar-grid dates-grid"><button v-for="day in calendarDays" :key="day.key" class="date-cell" :class="{ muted: !day.currentMonth, selected: day.key === selectedDate, today: day.key === todayKey }" @tap="$emit('select-date', day.key)"><text class="day-number">{{ day.day }}</text><view v-if="day.count" class="event-count">{{ day.count }}</view><text v-if="day.amountText" class="tiny-price">{{ day.amountText }}</text></button></view></view>
		<view class="calendar-detail"><view class="detail-heading"><view><text class="detail-date">{{ selectedDateTitle }}</text><text class="detail-week">{{ selectedWeekday }}</text></view><text class="detail-total">{{ selectedDateSubscriptions.length }} 项 · {{ selectedDateTotalText }}</text></view><view v-if="selectedDateSubscriptions.length"><view v-for="item in selectedDateSubscriptions" :key="item.id" class="calendar-subscription" @tap="$emit('open-detail', item)"><brand-logo :item="item" /><view class="list-main"><text class="list-name">{{ item.name }}</text><text class="list-detail">{{ cycleText(item) }} · {{ item.payment }}</text></view><text class="item-amount">{{ formatMoney(item.amount, item.currency) }}</text></view></view><view v-else class="empty-compact calendar-empty"><text>当天没有续费项目</text><button class="text-button green" @tap="$emit('open-form', selectedDate)">添加到这一天</button></view></view>
	</view>
</template>

<script>
	import BrandLogo from './brand-logo.vue'

	export default {
		name: 'SubscriptionCalendarView',
		components: { BrandLogo },
		emits: ['change-month', 'today', 'select-date', 'open-detail', 'open-form'],
		props: {
			navigationBarHeight: { type: Number, default: 0 },
			calendarTitle: { type: String, default: '' },
			weekdays: { type: Array, default: () => [] },
			calendarDays: { type: Array, default: () => [] },
			selectedDate: { type: String, default: '' },
			selectedDateSubscriptions: { type: Array, default: () => [] },
			selectedDateTitle: { type: String, default: '' },
			selectedWeekday: { type: String, default: '' },
			selectedDateTotalText: { type: String, default: '¥0.00' },
			todayKey: { type: String, default: '' },
			formatMoney: { type: Function, required: true },
			cycleText: { type: Function, required: true }
		}
	}
</script>
