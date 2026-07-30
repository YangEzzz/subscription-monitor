<template>
	<view class="renewal-row" @tap="$emit('tap')">
		<brand-logo :item="item" />
		<view class="renewal-main">
			<text class="renewal-name">{{ item.name }}</text>
			<text class="renewal-date">{{ item.shortDate }} 续费</text>
		</view>
		<view class="renewal-side">
			<text class="renewal-price">{{ item.amount === null ? '待补充' : '¥' + Number(item.amount).toFixed(2) }}</text>
			<text class="days" :class="item.days <= 7 ? 'urgent' : 'normal'">{{ item.days }}天后</text>
			<text v-if="item.displayStatus" class="row-status">{{ item.displayStatus }}</text>
		</view>
	</view>
</template>

<script>
	import BrandLogo from './brand-logo.vue'

	export default {
		name: 'SubscriptionRow',
		components: { BrandLogo },
		emits: ['tap'],
		props: {
			item: { type: Object, required: true }
		}
	}
</script>

<style scoped>
	.renewal-row { min-height: 112rpx; display: flex; align-items: center; }
	.renewal-main { flex: 1; min-width: 0; margin-left: 22rpx; }
	.renewal-name { display: block; overflow: hidden; color: #171b18; font-size: 28rpx; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
	.renewal-date { display: block; margin-top: 7rpx; color: #818781; font-size: 23rpx; }
	.renewal-side { text-align: right; }
	.renewal-price { display: block; font-size: 26rpx; font-weight: 650; }
	.days { display: block; margin-top: 7rpx; font-size: 23rpx; white-space: nowrap; }
	.days.urgent { color: #f0444d; }
	.days.normal { color: #ff7b2f; }
	.row-status { display: block; margin-top: 4rpx; color: #727b75; font-size: 18rpx; }
</style>
