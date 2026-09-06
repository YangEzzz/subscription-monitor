<template>
	<view class="setting-row" @tap="$emit('tap')">
		<view class="setting-icon" :class="iconClass"><uni-icons :type="icon" size="18" :color="iconColor" /></view>
		<view class="setting-copy"><text>{{ title }}</text><text>{{ description }}</text></view>
		<switch v-if="switchable" :checked="checked" color="#16834d" @change="$emit('change', $event.detail.value)" />
		<uni-icons v-else-if="action" type="right" size="17" color="#aab0ac" />
	</view>
</template>

<script>
	export default {
		name: 'SettingsRow',
		emits: ['tap', 'change'],
		props: {
			icon: { type: String, required: true },
			iconClass: { type: String, default: '' },
			iconColor: { type: String, default: '#177e4b' },
			title: { type: String, required: true },
			description: { type: String, default: '' },
			switchable: { type: Boolean, default: false },
			checked: { type: Boolean, default: false },
			action: { type: Boolean, default: false }
		}
	}
</script>
