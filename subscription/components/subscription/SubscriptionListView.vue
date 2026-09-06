<template>
	<view class="page list-page">
		<view class="primary-titlebar" :style="{ height: navigationBarHeight + 'px' }"><text class="page-title">全部订阅</text></view>
		<view class="search-box"><uni-icons type="search" size="19" color="#8c938e" /><input v-model="searchDraft" @input="handleSearchInput" confirm-type="search" placeholder="搜索服务或套餐" placeholder-class="placeholder" /><button v-if="searchDraft" class="clear-search" @tap="clearSearch"><uni-icons type="clear" size="18" color="#9ca19d" /></button></view>
		<scroll-view class="filter-scroll" scroll-x :show-scrollbar="false"><view class="filter-row"><button v-for="filter in categoryFilters" :key="filter.name" class="filter-pill" :class="{ active: activeCategory === filter.name }" @tap="$emit('category', filter.name)"><text class="filter-label">{{ filter.name }}</text><text class="filter-count">{{ filter.count }}</text></button></view></scroll-view>
		<scroll-view class="status-scroll" scroll-x :show-scrollbar="false"><view class="status-row"><button v-for="status in statusFilters" :key="status.value" class="status-pill" :class="{ active: activeStatus === status.value }" @tap="$emit('status', status.value)">{{ status.label }}</button></view></scroll-view>
		<button class="sort-summary" aria-label="选择排序方式" @tap="$emit('choose-sort')"><view><text>{{ sortLabel }}</text><text class="sort-divider">·</text><text>{{ activeStatusLabel }}</text></view><uni-icons type="right" size="15" color="#89938c" /></button>
		<view v-if="visibleSubscriptions.length" class="subscription-list"><view v-for="item in visibleSubscriptions" :key="item.id" class="list-item" @tap="$emit('open-detail', item)"><brand-logo :item="item" /><view class="list-main"><view class="name-line"><text class="list-name">{{ item.name }}</text><text class="status-badge" :class="getStatus(item)">{{ statusText(item) }}</text></view><text class="list-detail">{{ cycleText(item) }} · {{ item.amount === null ? '金额待补充' : formatMoney(item.amount, item.currency) }} · {{ item.payment }}</text><text class="list-date">{{ formatDate(item.nextBillingDate) }} · {{ daysText(item) }}</text></view><uni-icons type="right" size="17" color="#b0b5b1" /></view></view>
		<empty-state-view v-if="!visibleSubscriptions.length && liveSubscriptions.length" icon="search" title="没有匹配的订阅" description="调整搜索词或筛选条件，也可以新增一条订阅" action-label="重置筛选" action-class="secondary-button" @action="$emit('reset-filters')" />
		<empty-state-view v-else-if="!liveSubscriptions.length" icon="plus" title="还没有添加订阅" description="添加第一条订阅后，这里会显示所有续费项目" action-label="新增订阅" action-class="primary-button empty-add" @action="$emit('open-form')" />
		<button class="float-add" aria-label="新增订阅" @tap="$emit('open-form')"><uni-icons type="plus" size="27" color="#ffffff" /></button>
	</view>
</template>

<script>
	import BrandLogo from './brand-logo.vue'
	import EmptyStateView from './EmptyStateView.vue'

		export default {
			name: 'SubscriptionListView',
			components: { BrandLogo, EmptyStateView },
			emits: ['search', 'clear-search', 'category', 'status', 'choose-sort', 'open-detail', 'reset-filters', 'open-form'],
			data() {
				return { searchDraft: this.searchKeyword }
			},
			watch: {
				searchKeyword(value) {
					if (value !== this.searchDraft) this.searchDraft = value
				}
			},
			methods: {
				handleSearchInput(event) {
					const value = (event.detail && event.detail.value || '').trim()
					if (value !== this.searchDraft) this.searchDraft = value
					this.$emit('search', value)
				},
				clearSearch() {
					this.searchDraft = ''
					this.$emit('clear-search')
				}
			},
			props: {
			navigationBarHeight: { type: Number, default: 0 },
			searchKeyword: { type: String, default: '' },
			categoryFilters: { type: Array, default: () => [] },
			activeCategory: { type: String, default: '全部' },
			statusFilters: { type: Array, default: () => [] },
			activeStatus: { type: String, default: 'all' },
			sortLabel: { type: String, default: '按日期' },
			activeStatusLabel: { type: String, default: '全部状态' },
			visibleSubscriptions: { type: Array, default: () => [] },
			liveSubscriptions: { type: Array, default: () => [] },
			formatDate: { type: Function, required: true },
			formatMoney: { type: Function, required: true },
			cycleText: { type: Function, required: true },
			daysText: { type: Function, required: true },
			getStatus: { type: Function, required: true },
			statusText: { type: Function, required: true }
		}
	}
</script>
