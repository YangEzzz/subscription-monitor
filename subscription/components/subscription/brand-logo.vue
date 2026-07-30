<template>
	<view class="brand-logo" :style="{ background: item.color }">
		<text>{{ item.logo }}</text>
	</view>
</template>

<script>
	export default {
		name: 'BrandLogo',
		props: {
			item: { type: Object, required: true }
		}
	}
</script>

<style scoped>
	.brand-logo { flex: 0 0 auto; width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: inset 0 0 0 1rpx rgba(255,255,255,.14); }
	.brand-logo text { font-size: 30rpx; font-weight: 800; }
</style>
