<template>
	<view class="stats-summary">
		<view class="stats-summary-head">
			<text class="stats-label">{{ statsLabel }}</text>
			<picker :range="currencies" :value="currencies.indexOf(statsCurrency)" @change="$emit('currency-change', currencies[$event.detail.value])"><view class="currency-filter">{{ statsCurrency }} <uni-icons type="down" size="12" color="#177e4b" /></view></picker>
			<view class="stats-period-switch"><button v-for="period in statPeriods" :key="period.value" :class="{ active: statsPeriod === period.value }" @tap="$emit('period-change', period.value)">{{ period.label }}</button></view>
		</view>
		<text class="stats-total">{{ formatMoney(statsTotal, statsCurrency) }}</text>
		<text class="stats-compare">基于 {{ statsSubscriptionCount }} 项 {{ statsCurrency }} 有效订阅 · 不自动换汇</text>
	</view>
</template>

<script>
	export default {
		name: 'StatSummaryCard',
		emits: ['currency-change', 'period-change'],
		props: {
			currencies: { type: Array, default: () => [] },
			statsCurrency: { type: String, default: 'CNY' },
			statsLabel: { type: String, default: '' },
			statPeriods: { type: Array, default: () => [] },
			statsPeriod: { type: String, default: 'month' },
			statsTotal: { type: Number, default: 0 },
			statsSubscriptionCount: { type: Number, default: 0 },
			formatMoney: { type: Function, required: true }
		}
	}
</script>
