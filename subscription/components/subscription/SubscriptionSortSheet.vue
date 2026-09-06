<template>
		<view class="sheet-mask" @tap="$emit('close')" @touchmove.stop.prevent>
<view class="sort-sheet" @tap.stop>
	<view class="sheet-handle"></view>
	<view class="sheet-head"><view><text class="sheet-title">订阅排序</text><text class="sheet-subtitle">选择列表的排列方式</text></view><button class="sheet-close" aria-label="关闭排序" @tap="$emit('close')"><uni-icons type="closeempty" size="21" color="#5f6862" /></button></view>
	<view class="sort-options"><button v-for="option in sortOptions" :key="option.value" class="sort-option" :class="{ active: sortMode === option.value }" @tap="$emit('select', option.value)"><view class="sort-option-icon"><uni-icons :type="option.icon" size="20" :color="sortMode === option.value ? '#177e4b' : '#6f7972'" /></view><view class="sort-option-copy"><text>{{ option.label }}</text><text>{{ option.desc }}</text></view><view class="sort-check" :class="{ checked: sortMode === option.value }"><uni-icons v-if="sortMode === option.value" type="checkmarkempty" size="15" color="#ffffff" /></view></button></view>
</view>
		</view>
</template>

<script>
	export default {
		name: 'SubscriptionSortSheet',
		emits: ['close', 'select'],
		props: {
			sortOptions: { type: Array, default: () => [] },
			sortMode: { type: String, default: 'date' }
		}
	}
</script>

