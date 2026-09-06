<template>
	<view class="page home-page">
		<view class="primary-titlebar home-head" :style="{ height: navigationBarHeight + 'px' }">
			<text class="page-title">续订清单</text>
		</view>
		<text class="home-lead">每一笔续费，都提前心中有数</text>

		<view class="summary-card">
			<view class="summary-top"><text>未来 30 天预计扣费</text><button class="summary-eye" aria-label="显示或隐藏金额" @tap="$emit('toggle-amount')"><uni-icons :type="settings.amountVisible ? 'eye' : 'eye-slash'" size="20" color="#ffffff" /></button></view>
			<text class="summary-amount compact-total">{{ settings.amountVisible ? next30TotalText : '••••' }}</text>
			<view class="summary-meta"><text>共 {{ next30Subscriptions.length }} 项</text><view class="divider"></view><text>月均约 {{ settings.amountVisible ? monthlyAverageText : '•••' }}</text></view>
			<view class="summary-spark" aria-hidden="true"><view v-for="bar in trendData.slice(0, 5)" :key="bar.month" class="summary-spark-bar" :style="{ height: bar.height + '%' }"></view></view>
		</view>

		<view v-if="!settings.notificationEnabled" class="notice-banner" @tap="$emit('enable-notification')">
			<view class="notice-icon"><uni-icons type="notification" size="20" color="#a86210" /></view>
			<view class="notice-copy"><text class="notice-title">续费提醒尚未开启</text><text class="notice-desc">点击后申请微信订阅消息授权</text></view>
			<button class="notice-action" @tap.stop="$emit('enable-notification')">开启</button>
		</view>

		<view class="section-card">
			<view class="section-head"><text class="section-title">即将续费</text><button class="text-button" @tap="$emit('switch-all')">全部 {{ activeSubscriptions.length }} <uni-icons type="right" size="14" color="#747b76" /></button></view>
			<view v-if="upcoming7.length" class="group-title"><text>未来 7 天</text><text class="count-dot red">{{ upcoming7.length }}</text></view>
			<subscription-row v-for="item in upcoming7" :key="item.id" :item="decorateItem(item)" @tap="$emit('open-detail', item)" />
			<view v-if="upcoming30Later.length" class="group-title second"><text>未来 30 天</text><text class="count-dot orange">{{ upcoming30Later.length }}</text></view>
			<subscription-row v-for="item in upcoming30Later.slice(0, 3)" :key="item.id" :item="decorateItem(item)" @tap="$emit('open-detail', item)" />
			<view v-if="!next30Subscriptions.length" class="empty-compact"><text>未来 30 天暂无扣费</text><button class="text-button green" @tap="$emit('open-form')">新增订阅</button></view>
			<button v-if="next30Subscriptions.length > 4" class="view-more" @tap="$emit('switch-all')">查看全部 {{ next30Subscriptions.length }} 项</button>
		</view>

		<view class="section-card reminder-card">
			<view class="section-head"><text class="section-title">待处理事项</text><text class="section-caption">{{ actionableReminders.length }} 项</text></view>
			<view v-for="reminder in actionableReminders" :key="reminder.key" class="reminder-row" @tap="$emit('handle-reminder', reminder)">
				<view class="reminder-icon" :class="reminder.tone"><uni-icons :type="reminder.icon" size="18" color="#ffffff" /></view>
				<view class="reminder-copy"><text class="reminder-title">{{ reminder.title }}</text><text class="reminder-desc">{{ reminder.desc }}</text></view>
				<uni-icons v-if="reminder.action !== 'none'" type="right" size="16" color="#a2a7a3" />
			</view>
		</view>
		<button class="primary-button home-add" @tap="$emit('open-form')"><uni-icons type="plus" size="20" color="#ffffff" />新增订阅</button>
	</view>
</template>

<script>
	import SubscriptionRow from './subscription-row.vue'

	export default {
		name: 'SubscriptionHomeView',
		components: { SubscriptionRow },
		emits: ['toggle-amount', 'enable-notification', 'switch-all', 'open-detail', 'open-form', 'handle-reminder'],
		props: {
			settings: { type: Object, required: true },
			navigationBarHeight: { type: Number, default: 0 },
			next30TotalText: { type: String, default: '¥0.00' },
			monthlyAverageText: { type: String, default: '¥0.00' },
			next30Subscriptions: { type: Array, default: () => [] },
			activeSubscriptions: { type: Array, default: () => [] },
			upcoming7: { type: Array, default: () => [] },
			upcoming30Later: { type: Array, default: () => [] },
			actionableReminders: { type: Array, default: () => [] },
			trendData: { type: Array, default: () => [] },
			decorateItem: { type: Function, required: true }
		}
	}
</script>
