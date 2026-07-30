<template>
	<view class="app-shell">
		<view class="safe-top"></view>
		<scroll-view class="page-scroll" scroll-y :show-scrollbar="false" :scroll-top="scrollTop">
			<!-- 首页 -->
			<view v-if="activeView === 'home'" class="page home-page">
				<view class="home-head">
					<view><text class="hero-title">续订清单</text><text class="hero-subtitle">每一笔续费，都提前心中有数</text></view>
					<button class="icon-button" aria-label="设置" @tap="switchTab('profile')"><uni-icons type="gear" size="22" color="#202622" /></button>
				</view>

				<view class="summary-card">
					<view class="summary-top"><text>未来 30 天预计扣费</text><button class="summary-eye" aria-label="显示或隐藏金额" @tap="toggleAmount"><uni-icons :type="settings.amountVisible ? 'eye' : 'eye-slash'" size="20" color="#ffffff" /></button></view>
					<text class="summary-amount">{{ settings.amountVisible ? formatMoney(next30Total) : '¥ ••••' }}</text>
					<view class="summary-meta"><text>共 {{ next30Subscriptions.length }} 项</text><view class="divider"></view><text>月均约 {{ settings.amountVisible ? formatMoney(monthlyAverage) : '¥•••' }}</text></view>
					<view class="summary-watermark"><view class="wm-line"></view><view class="wm-line short"></view><view class="wm-line"></view></view>
				</view>

				<view v-if="!settings.notificationEnabled" class="notice-banner" @tap="enableNotification">
					<view class="notice-icon"><uni-icons type="notification" size="20" color="#a86210" /></view>
					<view class="notice-copy"><text class="notice-title">续费提醒尚未开启</text><text class="notice-desc">当前为本地演示，开启后模拟通知授权状态</text></view>
					<uni-icons type="right" size="16" color="#9c7a51" />
				</view>

				<view class="section-card">
					<view class="section-head"><text class="section-title">即将续费</text><button class="text-button" @tap="switchTab('all')">全部 {{ activeSubscriptions.length }} <uni-icons type="right" size="14" color="#747b76" /></button></view>
					<view v-if="upcoming7.length" class="group-title"><text>未来 7 天</text><text class="count-dot red">{{ upcoming7.length }}</text></view>
					<subscription-row v-for="item in upcoming7" :key="item.id" :item="decorateItem(item)" @tap="openDetail(item)" />
					<view v-if="upcoming30Later.length" class="group-title second"><text>未来 30 天</text><text class="count-dot orange">{{ upcoming30Later.length }}</text></view>
					<subscription-row v-for="item in upcoming30Later.slice(0, 3)" :key="item.id" :item="decorateItem(item)" @tap="openDetail(item)" />
					<view v-if="!next30Subscriptions.length" class="empty-compact"><text>未来 30 天暂无扣费</text><button class="text-button green" @tap="openForm()">新增订阅</button></view>
					<button v-if="next30Subscriptions.length > 4" class="view-more" @tap="switchTab('all')">查看全部 {{ next30Subscriptions.length }} 项</button>
				</view>

				<view class="section-card reminder-card">
					<view class="section-head"><text class="section-title">待处理事项</text><text class="section-caption">{{ actionableReminders.length }} 项</text></view>
					<view v-for="reminder in actionableReminders" :key="reminder.key" class="reminder-row" @tap="handleReminder(reminder)">
						<view class="reminder-icon" :class="reminder.tone"><uni-icons :type="reminder.icon" size="18" color="#ffffff" /></view>
						<view class="reminder-copy"><text class="reminder-title">{{ reminder.title }}</text><text class="reminder-desc">{{ reminder.desc }}</text></view>
						<uni-icons v-if="reminder.action !== 'none'" type="right" size="16" color="#a2a7a3" />
					</view>
				</view>
				<button class="primary-button home-add" @tap="openForm()"><uni-icons type="plus" size="20" color="#ffffff" />新增订阅</button>
			</view>

			<!-- 订阅列表 -->
			<view v-else-if="activeView === 'all'" class="page list-page">
				<view class="top-titlebar"><view><text class="page-title">全部订阅</text><text class="page-subtitle">{{ visibleSubscriptions.length }} 项结果</text></view><button class="icon-button" aria-label="排序" @tap="chooseSort"><uni-icons type="bars" size="22" color="#242a26" /></button></view>
				<view class="search-box"><uni-icons type="search" size="19" color="#8c938e" /><input v-model.trim="searchKeyword" confirm-type="search" placeholder="搜索服务或套餐" placeholder-class="placeholder" /><button v-if="searchKeyword" class="clear-search" @tap="searchKeyword = ''"><uni-icons type="clear" size="18" color="#9ca19d" /></button></view>
				<scroll-view class="filter-scroll" scroll-x :show-scrollbar="false"><view class="filter-row"><button v-for="filter in categoryFilters" :key="filter.name" class="filter-pill" :class="{ active: activeCategory === filter.name }" @tap="activeCategory = filter.name"><text>{{ filter.name }}</text><text class="filter-count">{{ filter.count }}</text></button></view></scroll-view>
				<scroll-view class="status-scroll" scroll-x :show-scrollbar="false"><view class="status-row"><button v-for="status in statusFilters" :key="status.value" class="status-pill" :class="{ active: activeStatus === status.value }" @tap="activeStatus = status.value">{{ status.label }}</button></view></scroll-view>
				<view class="sort-summary"><text>{{ sortLabel }}</text><text>·</text><text>{{ activeStatusLabel }}</text></view>
				<view v-if="visibleSubscriptions.length" class="subscription-list"><view v-for="item in visibleSubscriptions" :key="item.id" class="list-item" @tap="openDetail(item)"><brand-logo :item="item" /><view class="list-main"><view class="name-line"><text class="list-name">{{ item.name }}</text><text class="status-badge" :class="getStatus(item)">{{ statusText(item) }}</text></view><text class="list-detail">{{ item.cycle }} · {{ item.amount === null ? '金额待补充' : formatMoney(item.amount) }} · {{ item.payment }}</text><text class="list-date">{{ formatDate(item.nextBillingDate) }} · {{ daysText(item) }}</text></view><uni-icons type="right" size="17" color="#b0b5b1" /></view></view>
				<view v-else class="empty-state"><view class="empty-icon"><uni-icons type="search" size="30" color="#829087" /></view><text class="empty-title">没有匹配的订阅</text><text class="empty-desc">调整搜索词或筛选条件，也可以新增一条订阅</text><button class="secondary-button" @tap="resetFilters">重置筛选</button></view>
				<button class="float-add" aria-label="新增订阅" @tap="openForm()"><uni-icons type="plus" size="27" color="#ffffff" /></button>
			</view>

			<!-- 日历 -->
			<view v-else-if="activeView === 'calendar'" class="page calendar-page">
				<view class="top-titlebar centered"><text class="page-title">续费日历</text><button class="icon-button absolute" aria-label="回到本月" @tap="goToday"><uni-icons type="refresh" size="20" color="#242a26" /></button></view>
				<view class="month-nav"><button class="month-arrow" @tap="changeMonth(-1)"><uni-icons type="left" size="19" color="#5d655f" /></button><text class="month-name">{{ calendarTitle }}</text><button class="month-arrow" @tap="changeMonth(1)"><uni-icons type="right" size="19" color="#5d655f" /></button></view>
				<view class="calendar-card"><view class="calendar-grid week-grid"><text v-for="day in weekdays" :key="day">{{ day }}</text></view><view class="calendar-grid dates-grid"><button v-for="day in calendarDays" :key="day.key" class="date-cell" :class="{ muted: !day.currentMonth, selected: day.key === selectedDate, today: day.key === todayKey }" @tap="selectDate(day.key)"><text class="day-number">{{ day.day }}</text><view v-if="day.count" class="event-count">{{ day.count }}</view><text v-if="day.amount" class="tiny-price">¥{{ compactAmount(day.amount) }}</text></button></view></view>
				<view class="calendar-detail"><view class="detail-heading"><view><text class="detail-date">{{ selectedDateTitle }}</text><text class="detail-week">{{ selectedWeekday }}</text></view><text class="detail-total">{{ selectedDateSubscriptions.length }} 项 · {{ formatMoney(selectedDateTotal) }}</text></view><view v-if="selectedDateSubscriptions.length"><view v-for="item in selectedDateSubscriptions" :key="item.id" class="calendar-subscription" @tap="openDetail(item)"><brand-logo :item="item" /><view class="list-main"><text class="list-name">{{ item.name }}</text><text class="list-detail">{{ item.cycle }} · {{ item.payment }}</text></view><text class="item-amount">{{ formatMoney(item.amount) }}</text></view></view><view v-else class="empty-compact calendar-empty"><text>当天没有续费项目</text><button class="text-button green" @tap="openForm(selectedDate)">添加到这一天</button></view></view>
			</view>

			<!-- 统计 -->
			<view v-else-if="activeView === 'stats'" class="page stats-page">
				<view class="top-titlebar centered"><text class="page-title">支出统计</text></view>
				<view class="segmented-control"><button v-for="period in statPeriods" :key="period.value" :class="{ active: statsPeriod === period.value }" @tap="statsPeriod = period.value">{{ period.label }}</button></view>
				<view class="stats-summary"><text class="stats-label">{{ statsLabel }}</text><text class="stats-total">{{ formatMoney(statsTotal) }}</text><text class="stats-compare">基于 {{ statsSubscriptionCount }} 项有效订阅 · 金额为本地估算</text></view>
				<view class="chart-card"><view class="donut" :style="{ background: donutBackground }"><view class="donut-hole"><text class="donut-value">{{ statsPeriod === 'year' ? '年度' : '月均' }}</text><text class="donut-label">分类占比</text></view></view><view class="legend"><view v-for="item in categoryStats" :key="item.name" class="legend-row"><view class="legend-color" :style="{ backgroundColor: item.color }"></view><text class="legend-name">{{ item.name }}</text><text class="legend-value">{{ formatMoney(item.value) }}</text><text class="legend-percent">{{ item.percent }}%</text></view></view></view>
				<view class="trend-card"><view class="trend-head"><view><text class="section-title">支出趋势</text><text class="trend-sub">未来 6 个月预计扣费</text></view><text class="unit-label">单位：元</text></view><view class="bar-chart"><view v-for="bar in trendData" :key="bar.month" class="bar-column"><text class="bar-value">{{ compactAmount(bar.value) }}</text><view class="bar-track"><view class="bar-fill" :style="{ height: bar.height + '%' }"></view></view><text>{{ bar.month }}</text></view></view></view>
				<view class="insight-card"><view class="insight-icon"><uni-icons type="info-filled" size="20" color="#177e4b" /></view><view><text class="insight-title">年度订阅可重点检查</text><text class="insight-desc">年度订阅单次扣费更高，建议至少提前 14 天确认是否继续使用。</text></view></view>
			</view>

			<!-- 我的 -->
			<view v-else-if="activeView === 'profile'" class="page profile-page">
				<view class="top-titlebar centered"><text class="page-title">我的</text></view>
				<view class="profile-head"><view class="avatar">续</view><view class="profile-copy"><text class="profile-name">续订清单用户</text><text class="profile-sub">本地数据 · {{ subscriptions.length }} 项订阅</text></view><text class="local-badge">演示模式</text></view>
				<view class="settings-section"><text class="settings-title">提醒设置</text><view class="settings-card"><view class="setting-row"><view class="setting-icon green-bg"><uni-icons type="notification" size="18" color="#177e4b" /></view><view class="setting-copy"><text>续费通知</text><text>{{ settings.notificationEnabled ? '已模拟开启' : '未开启' }}</text></view><switch :checked="settings.notificationEnabled" color="#16834d" @change="setNotification($event.detail.value)" /></view><view class="setting-row" @tap="openReminderSettings"><view class="setting-icon orange-bg"><uni-icons type="calendar" size="18" color="#bb6b18" /></view><view class="setting-copy"><text>默认提醒规则</text><text>提前 {{ settings.defaultReminders.join('、') }} 天 · {{ settings.reminderTime }}</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view><view class="setting-row"><view class="setting-icon blue-bg"><uni-icons type="email" size="18" color="#3c7fc1" /></view><view class="setting-copy"><text>每周订阅摘要</text><text>每周一汇总未来扣费</text></view><switch :checked="settings.weeklySummary" color="#16834d" @change="updateSetting('weeklySummary', $event.detail.value)" /></view></view></view>
				<view class="settings-section"><text class="settings-title">数据与偏好</text><view class="settings-card"><picker :range="currencies" @change="updateSetting('defaultCurrency', currencies[$event.detail.value])"><view class="setting-row"><view class="setting-icon violet-bg"><uni-icons type="wallet" size="18" color="#6458c9" /></view><view class="setting-copy"><text>默认币种</text><text>{{ settings.defaultCurrency }}</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view></picker><view class="setting-row" @tap="exportData"><view class="setting-icon green-bg"><uni-icons type="download" size="18" color="#177e4b" /></view><view class="setting-copy"><text>导出订阅数据</text><text>生成 CSV 或复制表格数据</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view><view class="setting-row" @tap="showPrivacy"><view class="setting-icon blue-bg"><uni-icons type="locked" size="18" color="#3c7fc1" /></view><view class="setting-copy"><text>隐私与数据说明</text><text>了解本地演示的数据边界</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view><view class="setting-row" @tap="resetDemoData"><view class="setting-icon red-bg"><uni-icons type="refresh" size="18" color="#cc4b52" /></view><view class="setting-copy"><text>恢复演示数据</text><text>覆盖当前本地订阅与设置</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view></view></view>
				<text class="version-text">续订清单 · 本地交互原型 v0.2</text>
			</view>

			<!-- 详情 -->
			<view v-else-if="activeView === 'detail' && selectedSubscription" class="page detail-page">
				<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="goBackView('all')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">订阅详情</text><button class="icon-button plain" aria-label="更多操作" @tap.stop="showMoreActions"><uni-icons type="more-filled" size="24" color="#202622" /></button></view>
				<view class="detail-hero"><brand-logo :item="selectedSubscription" /><view class="detail-hero-copy"><text class="detail-name">{{ selectedSubscription.name }}</text><text class="detail-plan">{{ selectedSubscription.plan || selectedSubscription.category }}</text></view><text class="status-badge large" :class="getStatus(selectedSubscription)">{{ statusText(selectedSubscription) }}</text></view>
				<view class="detail-amount-card"><text class="detail-amount-label">下次预计扣费</text><text class="detail-amount">{{ selectedSubscription.amount === null ? '金额待补充' : formatMoney(selectedSubscription.amount) }}</text><text class="detail-countdown">{{ formatDate(selectedSubscription.nextBillingDate) }} · {{ daysText(selectedSubscription) }}</text></view>
				<view class="detail-grid"><view><text>计费周期</text><text>{{ selectedSubscription.cycle }}</text></view><view><text>付款渠道</text><text>{{ selectedSubscription.payment }}</text></view><view><text>分类</text><text>{{ selectedSubscription.category }}</text></view><view><text>自动续费</text><text>{{ selectedSubscription.autoRenew ? '已开启' : '未开启' }}</text></view></view>
				<view class="detail-block"><view class="block-head"><text>提醒计划</text><text>{{ settings.notificationEnabled ? '通知可用' : '仅站内提醒' }}</text></view><view class="reminder-tags"><text v-for="day in selectedSubscription.reminders" :key="day">{{ day === 0 ? '当天' : `提前 ${day} 天` }}</text></view><text class="block-note">最近提醒：{{ nextReminderText(selectedSubscription) }}</text></view>
				<view v-if="selectedRenewalHistory.length" class="detail-block"><view class="block-head"><text>续费记录</text><text>共 {{ selectedSubscription.renewalHistory.length }} 次</text></view><view class="history-list"><view v-for="record in selectedRenewalHistory" :key="record.confirmedAt" class="history-row"><view><text>{{ formatDate(record.billingDate) }}</text><text>已确认续费</text></view><text>{{ formatMoney(record.amount) }}</text></view></view></view>
				<view v-if="selectedSubscription.note || selectedSubscription.cancelGuide" class="detail-block"><view v-if="selectedSubscription.note" class="text-info"><text>备注</text><text>{{ selectedSubscription.note }}</text></view><view v-if="selectedSubscription.cancelGuide" class="text-info"><text>取消路径</text><text>{{ selectedSubscription.cancelGuide }}</text></view></view>
				<view v-if="!['cancelled','archived','paused'].includes(selectedSubscription.status)" class="process-card" :class="{ completed: renewalLocked }"><view v-if="renewalLocked" class="renewal-result"><view class="result-icon"><uni-icons type="checkbox-filled" size="24" color="#177e4b" /></view><view class="result-copy"><text class="section-title">本期续费已确认</text><text class="process-note">{{ formatDate(selectedSubscription.lastRenewedBillingDate, false) }} 已记录，下次预计 {{ formatDate(selectedSubscription.nextBillingDate, false) }} 扣费。</text></view></view><view v-else><text class="section-title">处理本期续费</text><text class="process-desc">确认实际扣费完成后再更新日期，系统将保存本次记录。</text><view class="process-actions"><button class="process-button success" @tap="confirmRenewal"><uni-icons type="checkbox-filled" size="20" color="#177e4b" /><text>确认已续费</text></button><button class="process-button later" :class="{ processed: selectedSubscription.status === 'pending' }" :disabled="selectedSubscription.status === 'pending'" @tap="processSubscription('later')"><uni-icons type="calendar" size="20" :color="selectedSubscription.status === 'pending' ? '#8b9690' : '#aa681c'" /><text>{{ selectedSubscription.status === 'pending' ? '已设为稍后处理' : '稍后处理' }}</text></button></view></view></view>
				<view class="detail-bottom"><button class="primary-button edit-button" @tap="openForm(null, selectedSubscription)"><uni-icons type="compose" size="19" color="#ffffff" />编辑订阅</button></view>
			</view>

			<!-- 新增 / 编辑 -->
			<view v-else-if="activeView === 'form'" class="page form-page">
				<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="goBackView(editingId ? 'detail' : 'home')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">{{ editingId ? '编辑订阅' : '新增订阅' }}</text><view class="icon-spacer"></view></view>
				<view v-if="!editingId" class="template-section"><view class="form-section-head"><text>常用模板</text><text>快速填充</text></view><scroll-view scroll-x :show-scrollbar="false" class="template-scroll"><view class="template-row"><button v-for="item in serviceTemplates" :key="item.name" class="template-chip" @tap="applyTemplate(item)"><view class="template-logo" :style="{ background: item.color }">{{ item.logo }}</view><text>{{ item.short }}</text></button></view></scroll-view></view>
				<view class="form-section"><text class="form-section-title">基本信息</text><view class="form-card"><label class="form-row"><text class="form-label required">服务名称</text><input v-model.trim="form.name" maxlength="30" class="form-input" placeholder="例如：腾讯视频 VIP" placeholder-class="placeholder" /></label><label class="form-row"><text class="form-label">套餐名称</text><input v-model.trim="form.plan" maxlength="30" class="form-input" placeholder="选填" placeholder-class="placeholder" /></label><picker :range="categories" @change="form.category = categories[$event.detail.value]"><view class="form-row"><text class="form-label required">分类</text><view class="form-value"><text>{{ form.category }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><view class="form-row"><text class="form-label">品牌标识</text><view class="color-options"><button v-for="color in logoColors" :key="color" :class="{ selected: form.color === color }" :style="{ background: color }" @tap="form.color = color"></button></view></view></view></view>
				<view class="form-section"><text class="form-section-title">扣费信息</text><view class="form-card"><label class="form-row"><text class="form-label">金额</text><view class="money-input"><text>¥</text><input v-model="form.amount" type="digit" placeholder="未知可留空" placeholder-class="placeholder" /></view></label><picker :range="cycles" @change="form.cycle = cycles[$event.detail.value]"><view class="form-row"><text class="form-label required">计费周期</text><view class="form-value"><text>{{ form.cycle }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><picker :range="payments" @change="form.payment = payments[$event.detail.value]"><view class="form-row"><text class="form-label">付款渠道</text><view class="form-value"><text>{{ form.payment }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><picker mode="date" :start="todayKey" :value="form.nextBillingDate" @change="form.nextBillingDate = $event.detail.value"><view class="form-row"><text class="form-label required">下次扣费日</text><view class="form-value"><text>{{ formatDate(form.nextBillingDate) }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><view class="form-row"><view><text class="form-label">自动续费</text><text class="form-hint">关闭后作为普通到期待办</text></view><switch :checked="form.autoRenew" color="#16834d" @change="form.autoRenew = $event.detail.value" /></view></view></view>
				<view class="form-section"><view class="form-section-head"><text class="form-section-title no-margin">提醒节点</text><text>可多选</text></view><view class="reminder-options"><button v-for="option in reminderOptions" :key="option.value" :class="{ selected: form.reminders.includes(option.value) }" @tap="toggleReminder(option.value)"><uni-icons v-if="form.reminders.includes(option.value)" type="checkmarkempty" size="16" color="#177e4b" />{{ option.label }}</button></view><text class="form-help">预计最近提醒：{{ formReminderPreview }}</text></view>
				<view class="form-section"><text class="form-section-title">补充信息</text><view class="form-card"><label class="form-row textarea-row"><text class="form-label">备注</text><textarea v-model.trim="form.note" maxlength="500" placeholder="记录使用人、账号尾号等非敏感信息" placeholder-class="placeholder" /></label><label class="form-row textarea-row no-border"><text class="form-label">取消路径</text><textarea v-model.trim="form.cancelGuide" maxlength="300" placeholder="例如：微信支付 > 自动续费管理" placeholder-class="placeholder" /></label></view></view>
				<view v-if="formError" class="form-error"><uni-icons type="info-filled" size="18" color="#c5444c" /><text>{{ formError }}</text></view>
				<button class="primary-button save-button" @tap="saveSubscription"><uni-icons type="checkmarkempty" size="20" color="#ffffff" />{{ editingId ? '保存修改' : '保存订阅' }}</button>
			</view>

			<!-- 默认提醒设置 -->
			<view v-else-if="activeView === 'reminder-settings'" class="page form-page">
				<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="goBackView('profile')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">默认提醒规则</text><view class="icon-spacer"></view></view>
				<view class="settings-intro"><uni-icons type="notification-filled" size="24" color="#177e4b" /><view><text>新订阅将自动使用这些节点</text><text>单条订阅仍可在编辑时单独调整</text></view></view>
				<view class="reminder-check-list"><button v-for="option in reminderOptions" :key="option.value" class="reminder-check-row" @tap="toggleDefaultReminder(option.value)"><view><text>{{ option.label }}</text><text>{{ option.desc }}</text></view><view class="check-box" :class="{ checked: settings.defaultReminders.includes(option.value) }"><uni-icons v-if="settings.defaultReminders.includes(option.value)" type="checkmarkempty" size="16" color="#ffffff" /></view></button><picker mode="time" :value="settings.reminderTime" @change="updateSetting('reminderTime', $event.detail.value)"><view class="reminder-check-row"><view><text>提醒时间</text><text>按当前时区 {{ settings.timezone }}</text></view><view class="form-value"><text>{{ settings.reminderTime }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker></view>
				<button class="primary-button save-button" @tap="goBackView('profile')">完成</button>
			</view>

			<view class="bottom-space"></view>
		</scroll-view>

		<view v-if="showTabBar" class="tab-bar"><button v-for="tab in tabs" :key="tab.key" class="tab-item" :class="{ active: activeView === tab.key }" @tap="switchTab(tab.key)"><uni-icons :type="activeView === tab.key ? tab.activeIcon : tab.icon" size="23" :color="activeView === tab.key ? '#16834d' : '#8e9690'" /><text>{{ tab.label }}</text></button></view>
	</view>
</template>

<script>
	import BrandLogo from '@/components/subscription/brand-logo.vue'
	import SubscriptionRow from '@/components/subscription/subscription-row.vue'
	import { STORAGE_KEYS, CATEGORY_COLORS, STATUS_LABELS, toDateKey, parseDate, addDays, formatDate, daysUntil, getDisplayStatus, getMonthlyEquivalent, getNextBillingDate, createSeedSubscriptions, createDefaultSettings } from './subscription-data.js'

	export default {
		components: { BrandLogo, SubscriptionRow },
		data() {
			const today = toDateKey(new Date())
			return {
				activeView: 'home', viewStack: [], scrollTop: 0,
				tabs: [
					{ key: 'home', label: '首页', icon: 'home', activeIcon: 'home-filled' },
					{ key: 'all', label: '订阅', icon: 'list', activeIcon: 'list' },
					{ key: 'calendar', label: '日历', icon: 'calendar', activeIcon: 'calendar-filled' },
					{ key: 'stats', label: '统计', icon: 'wallet', activeIcon: 'wallet-filled' },
					{ key: 'profile', label: '我的', icon: 'person', activeIcon: 'person-filled' }
				],
				subscriptions: [], settings: createDefaultSettings(),
				searchKeyword: '', activeCategory: '全部', activeStatus: 'default', sortMode: 'date',
				weekdays: ['日', '一', '二', '三', '四', '五', '六'], calendarCursor: today.slice(0, 7) + '-01', selectedDate: today,
				statsPeriod: 'month', statPeriods: [{ value: 'month', label: '月均' }, { value: 'year', label: '年度' }, { value: 'next', label: '未来30天' }],
				selectedId: null, editingId: null, formError: '',
				categories: ['影音娱乐', '音乐', '云存储', 'AI 工具', '效率工具', '阅读', '其他'],
				cycles: ['每周', '每月', '每季度', '每半年', '每年', '一次性'],
				payments: ['微信支付', '支付宝', 'App Store', '信用卡', '官网', '其他'], currencies: ['CNY', 'USD', 'HKD', 'JPY'],
				logoColors: ['#16834d', '#3f91ed', '#ef3943', '#e43c86', '#6658d9', '#202622'],
				reminderOptions: [{ value: 14, label: '提前 14 天', desc: '适合年度或高金额订阅' }, { value: 7, label: '提前 7 天', desc: '预留充分处理时间' }, { value: 3, label: '提前 3 天', desc: '默认提醒节点' }, { value: 1, label: '提前 1 天', desc: '临近扣费再次确认' }, { value: 0, label: '扣费当天', desc: '当天站内待办' }],
				serviceTemplates: [
					{ name: '腾讯视频 VIP', short: '腾讯视频', plan: '连续包月', logo: '视', color: '#19a768', category: '影音娱乐', amount: 25, payment: '微信支付' },
					{ name: '网易云音乐黑胶 VIP', short: '网易云', plan: '黑胶 VIP', logo: '音', color: '#ef3943', category: '音乐', amount: 15, payment: '微信支付' },
					{ name: 'iCloud+ 200GB', short: 'iCloud', plan: '200GB', logo: '云', color: '#3f98ee', category: '云存储', amount: 21, payment: 'App Store' },
					{ name: 'ChatGPT Plus', short: 'ChatGPT', plan: 'Plus', logo: 'AI', color: '#1f9c70', category: 'AI 工具', amount: 145, payment: '信用卡' }
				],
				form: {}
			}
		},
		computed: {
			todayKey() { return toDateKey(new Date()) },
			showTabBar() { return ['home', 'all', 'calendar', 'stats', 'profile'].includes(this.activeView) },
			selectedSubscription() { return this.subscriptions.find(item => item.id === this.selectedId) || null },
			selectedRenewalHistory() { return this.selectedSubscription ? (this.selectedSubscription.renewalHistory || []).slice().reverse().slice(0, 3) : [] },
			renewalLocked() { const item = this.selectedSubscription; return Boolean(item && item.lastRenewedAt && daysUntil(item.nextBillingDate) > 0) },
			activeSubscriptions() { return this.subscriptions.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status)).sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)) },
			next30Subscriptions() { return this.activeSubscriptions.filter(item => daysUntil(item.nextBillingDate) >= 0 && daysUntil(item.nextBillingDate) <= 30) },
			upcoming7() { return this.next30Subscriptions.filter(item => daysUntil(item.nextBillingDate) <= 7) },
			upcoming30Later() { return this.next30Subscriptions.filter(item => daysUntil(item.nextBillingDate) > 7) },
			next30Total() { return this.next30Subscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0) },
			monthlyAverage() { return this.subscriptions.reduce((sum, item) => sum + getMonthlyEquivalent(item), 0) },
			actionableReminders() {
				const list = []
				if (!this.settings.notificationEnabled) list.push({ key: 'notification', tone: 'warning', icon: 'notification', title: '开启续费提醒', desc: '当前只能在小程序内查看到期待办', action: 'notification' })
				const pending = this.subscriptions.filter(item => getDisplayStatus(item) === 'pending')
				if (pending.length) list.push({ key: 'pending', tone: 'danger', icon: 'info-filled', title: `${pending.length} 项订阅等待处理`, desc: '确认续费、取消或选择稍后处理', action: 'pending' })
				const incomplete = this.subscriptions.filter(item => item.amount === null)
				if (incomplete.length) list.push({ key: 'incomplete', tone: 'info', icon: 'compose', title: `${incomplete.length} 项金额待补充`, desc: '补充后统计结果会更准确', action: 'incomplete' })
				if (!list.length) list.push({ key: 'done', tone: 'success', icon: 'checkbox-filled', title: '订阅状态良好', desc: '当前没有需要立即处理的事项', action: 'none' })
				return list.slice(0, 3)
			},
			categoryFilters() {
				const counts = this.subscriptions.reduce((map, item) => { map[item.category] = (map[item.category] || 0) + 1; return map }, {})
				return [{ name: '全部', count: this.subscriptions.length }].concat(Object.keys(counts).sort().map(name => ({ name, count: counts[name] })))
			},
			statusFilters() { return [{ value: 'default', label: '有效订阅' }, { value: 'all', label: '全部状态' }, { value: 'upcoming', label: '即将到期' }, { value: 'pending', label: '待处理' }, { value: 'incomplete', label: '金额待补充' }, { value: 'paused', label: '已暂停' }, { value: 'cancelled', label: '已取消' }, { value: 'archived', label: '已归档' }] },
			activeStatusLabel() { return (this.statusFilters.find(item => item.value === this.activeStatus) || {}).label || '全部状态' },
			sortLabel() { return { date: '按扣费日排序', amount: '按金额排序', created: '按创建时间排序' }[this.sortMode] },
			visibleSubscriptions() {
				let list = this.subscriptions.filter(item => this.activeCategory === '全部' || item.category === this.activeCategory)
				if (this.activeStatus === 'default') list = list.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status))
				else if (this.activeStatus === 'incomplete') list = list.filter(item => item.amount === null || item.amount === '')
				else if (this.activeStatus !== 'all') list = list.filter(item => getDisplayStatus(item) === this.activeStatus)
				if (this.searchKeyword) { const word = this.searchKeyword.toLowerCase(); list = list.filter(item => `${item.name} ${item.plan || ''}`.toLowerCase().includes(word)) }
				return list.slice().sort((a, b) => this.sortMode === 'amount' ? Number(b.amount || 0) - Number(a.amount || 0) : this.sortMode === 'created' ? b.createdAt - a.createdAt : a.nextBillingDate.localeCompare(b.nextBillingDate))
			},
			calendarTitle() { const date = parseDate(this.calendarCursor); return `${date.getFullYear()}年${date.getMonth() + 1}月` },
			calendarDays() {
				const cursor = parseDate(this.calendarCursor), year = cursor.getFullYear(), month = cursor.getMonth(), firstWeekday = new Date(year, month, 1).getDay(), result = []
				for (let index = 0; index < 42; index++) { const date = new Date(year, month, index - firstWeekday + 1, 12); const key = toDateKey(date); const items = this.subscriptions.filter(item => item.nextBillingDate === key && !['cancelled', 'archived'].includes(item.status)); result.push({ key, day: date.getDate(), currentMonth: date.getMonth() === month, count: items.length, amount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0) }) }
				return result
			},
			selectedDateSubscriptions() { return this.subscriptions.filter(item => item.nextBillingDate === this.selectedDate && !['cancelled', 'archived'].includes(item.status)) },
			selectedDateTotal() { return this.selectedDateSubscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0) },
			selectedDateTitle() { return formatDate(this.selectedDate, false) },
			selectedWeekday() { return `星期${this.weekdays[parseDate(this.selectedDate).getDay()]}` },
			statsTotal() { if (this.statsPeriod === 'year') return this.monthlyAverage * 12; if (this.statsPeriod === 'next') return this.next30Total; return this.monthlyAverage },
			statsLabel() { return { month: '月均订阅支出（估算）', year: '年度预计支出', next: '未来 30 天预计扣费' }[this.statsPeriod] },
			statsSubscriptionCount() { return this.subscriptions.filter(item => getMonthlyEquivalent(item) > 0).length },
			categoryStats() {
				const map = {}, factor = this.statsPeriod === 'year' ? 12 : 1
				this.subscriptions.forEach(item => { const value = this.statsPeriod === 'next' ? (this.next30Subscriptions.includes(item) ? Number(item.amount || 0) : 0) : getMonthlyEquivalent(item) * factor; if (value) map[item.category] = (map[item.category] || 0) + value })
				const total = Object.values(map).reduce((sum, value) => sum + value, 0) || 1
				return Object.keys(map).sort((a, b) => map[b] - map[a]).map(name => ({ name, value: map[name], percent: Math.round(map[name] / total * 100), color: CATEGORY_COLORS[name] || CATEGORY_COLORS['其他'] }))
			},
			donutBackground() { let start = 0; const stops = this.categoryStats.map(item => { const end = Math.min(100, start + item.percent); const stop = `${item.color} ${start}% ${end}%`; start = end; return stop }); return stops.length ? `conic-gradient(${stops.join(',')})` : '#e7ece8' },
			trendData() {
				const cursor = parseDate(this.todayKey), values = []
				for (let offset = 0; offset < 6; offset++) { const monthDate = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1); const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0); let value = 0; this.subscriptions.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status)).forEach(item => { let billing = parseDate(item.nextBillingDate), guard = 0; while (billing <= monthEnd && guard < 24) { if (billing >= monthDate) value += Number(item.amount || 0); if (item.cycle === '一次性') break; billing = parseDate(getNextBillingDate(toDateKey(billing), item.cycle)); guard++ } }); values.push({ month: `${monthDate.getMonth() + 1}月`, value }) }
				const max = Math.max(...values.map(item => item.value), 1); return values.map(item => ({ ...item, height: Math.max(8, Math.round(item.value / max * 100)) }))
			},
			formReminderPreview() { if (!this.form.nextBillingDate || !this.form.reminders || !this.form.reminders.length) return '未设置提醒'; const maxDay = Math.max(...this.form.reminders); return `${formatDate(addDays(this.form.nextBillingDate, -maxDay))} ${this.settings.reminderTime}` }
		},
		onLoad() { this.loadLocalData() },
		onBackPress() {
			if (this.showTabBar) return false
			this.goBackView('home')
			return true
		},
		methods: {
			formatDate, getStatus: getDisplayStatus,
			formatMoney(value) { if (value === null || value === '' || Number.isNaN(Number(value))) return '金额待补充'; return `¥ ${Number(value).toFixed(2)}` },
			compactAmount(value) { const number = Number(value || 0); return number >= 1000 ? `${(number / 1000).toFixed(1)}k` : Math.round(number) },
			statusText(item) { return STATUS_LABELS[getDisplayStatus(item)] },
			decorateItem(item) { return { ...item, shortDate: formatDate(item.nextBillingDate, false), days: daysUntil(item.nextBillingDate), displayStatus: this.statusText(item) } },
			daysText(item) { const days = daysUntil(item.nextBillingDate); return days < 0 ? `已逾期 ${Math.abs(days)} 天` : days === 0 ? '今天扣费' : `${days} 天后` },
			loadLocalData() { const saved = uni.getStorageSync(STORAGE_KEYS.subscriptions), savedSettings = uni.getStorageSync(STORAGE_KEYS.settings); this.subscriptions = Array.isArray(saved) ? saved : createSeedSubscriptions(); this.settings = savedSettings ? { ...createDefaultSettings(), ...savedSettings } : createDefaultSettings(); this.persist() },
			persist() { uni.setStorageSync(STORAGE_KEYS.subscriptions, this.subscriptions); uni.setStorageSync(STORAGE_KEYS.settings, this.settings) },
			navigateToView(view) { if (view === this.activeView) return; this.viewStack.push(this.activeView); this.activeView = view; this.scrollToTop() },
			goBackView(fallback = 'home') { this.activeView = this.viewStack.length ? this.viewStack.pop() : fallback; this.formError = ''; this.scrollToTop() },
			switchTab(tab) { this.viewStack = []; this.activeView = tab; this.scrollToTop() },
			scrollToTop() { this.scrollTop = this.scrollTop === 0 ? 1 : 0 },
			toggleAmount() { this.settings.amountVisible = !this.settings.amountVisible; this.persist() },
			enableNotification() { uni.showModal({ title: '开启续费提醒', content: '当前未接入后端，将在本地模拟“通知已开启”状态。接入微信订阅消息后需由用户主动授权。', confirmText: '模拟开启', success: res => { if (res.confirm) this.setNotification(true) } }) },
			setNotification(value) { this.settings.notificationEnabled = value; this.persist(); uni.showToast({ title: value ? '提醒状态已开启' : '提醒状态已关闭', icon: 'none' }) },
			updateSetting(key, value) { this.settings[key] = value; this.persist() },
			handleReminder(item) { if (item.action === 'notification') this.enableNotification(); else if (item.action === 'pending') { this.activeStatus = 'pending'; this.switchTab('all') } else if (item.action === 'incomplete') { this.activeStatus = 'incomplete'; this.switchTab('all') } },
			chooseSort() { const labels = ['按扣费日排序', '按金额从高到低', '按创建时间排序']; uni.showActionSheet({ itemList: labels, success: res => { this.sortMode = ['date', 'amount', 'created'][res.tapIndex] } }) },
			resetFilters() { this.searchKeyword = ''; this.activeCategory = '全部'; this.activeStatus = 'default'; this.sortMode = 'date' },
			changeMonth(delta) { const date = parseDate(this.calendarCursor); date.setMonth(date.getMonth() + delta); this.calendarCursor = toDateKey(date).slice(0, 7) + '-01'; this.selectedDate = this.calendarCursor },
			goToday() { this.calendarCursor = this.todayKey.slice(0, 7) + '-01'; this.selectedDate = this.todayKey },
			selectDate(key) { this.selectedDate = key; if (key.slice(0, 7) !== this.calendarCursor.slice(0, 7)) this.calendarCursor = key.slice(0, 7) + '-01' },
			openDetail(item) { this.selectedId = item.id; this.navigateToView('detail') },
			createEmptyForm(date) { return { name: '', plan: '', logo: '订', color: '#16834d', amount: '', currency: this.settings.defaultCurrency, cycle: '每月', nextBillingDate: date || addDays(this.todayKey, 7), payment: '微信支付', category: '其他', status: 'active', autoRenew: true, reminders: this.settings.defaultReminders.slice(), note: '', cancelGuide: '' } },
			openForm(date, item) { this.formError = ''; this.editingId = item ? item.id : null; this.form = item ? { ...item, amount: item.amount === null ? '' : String(item.amount), reminders: (item.reminders || []).slice() } : this.createEmptyForm(date); this.navigateToView('form') },
			applyTemplate(template) { Object.assign(this.form, { ...template, amount: String(template.amount), cycle: '每月' }); uni.showToast({ title: `已选择${template.short}`, icon: 'none' }) },
			toggleReminder(value) { const index = this.form.reminders.indexOf(value); if (index >= 0) this.form.reminders.splice(index, 1); else this.form.reminders.push(value); this.form.reminders.sort((a, b) => b - a) },
			validateForm() { if (!this.form.name) return '请输入服务名称'; if (this.form.name.length > 30) return '服务名称不能超过 30 个字符'; if (!this.form.nextBillingDate || daysUntil(this.form.nextBillingDate) < 0) return '下次扣费日不能早于今天'; if (this.form.amount !== '' && (Number.isNaN(Number(this.form.amount)) || Number(this.form.amount) < 0)) return '金额必须是大于或等于 0 的数字'; if (!this.form.reminders.length) return '请至少选择一个提醒节点'; return '' },
			saveSubscription(force = false) {
				this.formError = this.validateForm(); if (this.formError) { uni.showToast({ title: this.formError, icon: 'none' }); return }
				const duplicate = !this.editingId && this.subscriptions.find(item => item.name === this.form.name && Math.abs(daysUntil(item.nextBillingDate) - daysUntil(this.form.nextBillingDate)) <= 3)
				if (duplicate && !force) { uni.showModal({ title: '可能重复录入', content: `已有“${duplicate.name}”在相近日期扣费，仍要继续保存吗？`, confirmText: '继续保存', success: res => { if (res.confirm) this.saveSubscription(true) } }); return }
				const wasEditing = Boolean(this.editingId)
				const payload = { ...this.form, amount: this.form.amount === '' ? null : Number(Number(this.form.amount).toFixed(2)), logo: this.form.logo || this.form.name.slice(0, 2), updatedAt: Date.now() }
				if (this.editingId) { const index = this.subscriptions.findIndex(item => item.id === this.editingId); payload.id = this.editingId; payload.createdAt = this.subscriptions[index].createdAt; this.subscriptions.splice(index, 1, payload); this.selectedId = payload.id } else { payload.id = Date.now(); payload.createdAt = Date.now(); this.subscriptions.push(payload); this.selectedId = payload.id }
				this.persist(); uni.vibrateShort({ type: 'light' }); uni.showToast({ title: wasEditing ? '修改已保存' : '订阅已添加', icon: 'success' }); if (wasEditing && this.viewStack[this.viewStack.length - 1] === 'detail') this.viewStack.pop(); this.activeView = 'detail'; this.editingId = null; this.scrollToTop()
			},
			confirmRenewal() {
				const item = this.selectedSubscription
				if (!item || this.renewalLocked) return
				const currentBillingDate = item.nextBillingDate
				const nextBillingDate = getNextBillingDate(currentBillingDate, item.cycle)
				const content = item.cycle === '一次性'
					? `确认 ${formatDate(currentBillingDate)} 已完成付款吗？确认后将自动归档。`
					: `确认 ${formatDate(currentBillingDate)} 已完成续费吗？下次扣费日将更新为 ${formatDate(nextBillingDate)}。`
				uni.showModal({ title: '确认本次续费', content, confirmText: '确认续费', success: res => { if (res.confirm) this.processSubscription('renewed') } })
			},
			processSubscription(action) {
				const item = this.selectedSubscription
				if (!item) return
				if (action === 'renewed') {
					if (this.renewalLocked) return uni.showToast({ title: '本期续费已经确认', icon: 'none' })
					const billingDate = item.nextBillingDate
					const renewedAt = Date.now()
					item.renewalHistory = (item.renewalHistory || []).concat({ billingDate, amount: item.amount, confirmedAt: renewedAt })
					item.lastRenewedBillingDate = billingDate
					item.lastRenewedAt = renewedAt
					item.nextBillingDate = getNextBillingDate(billingDate, item.cycle)
					item.status = item.cycle === '一次性' ? 'archived' : 'active'
					uni.showToast({ title: item.cycle === '一次性' ? '已完成并归档' : '本期续费已确认', icon: 'success' })
				} else if (action === 'later') {
					if (item.status === 'pending') return
					item.status = 'pending'
					uni.showToast({ title: '已加入待处理', icon: 'none' })
				}
				item.updatedAt = Date.now()
				this.persist()
			},
			showMoreActions() {
				const item = this.selectedSubscription
				if (!item) return
				const actions = []
				if (item.status === 'archived' || item.status === 'cancelled') actions.push({ label: '恢复为有效订阅', key: 'restore' })
				else actions.push({ label: item.status === 'paused' ? '恢复订阅' : '暂停订阅', key: item.status === 'paused' ? 'resume' : 'pause' }, { label: '取消订阅', key: 'cancel' })
				actions.push({ label: '复制订阅', key: 'copy' })
				if (item.status !== 'archived') actions.push({ label: '归档订阅', key: 'archive' })
				actions.push({ label: '删除订阅', key: 'delete' })
				uni.showActionSheet({ itemList: actions.map(action => action.label), success: res => this.handleSubscriptionAction(actions[res.tapIndex].key) })
			},
			handleSubscriptionAction(action) {
				const item = this.selectedSubscription
				if (!item) return
				if (action === 'cancel') return this.cancelSubscription()
				if (action === 'delete') return this.deleteSubscription()
				if (action === 'copy') { const copy = { ...item, id: Date.now(), name: `${item.name} 副本`, status: 'active', renewalHistory: [], lastRenewedAt: null, lastRenewedBillingDate: null, createdAt: Date.now() }; this.subscriptions.push(copy); this.persist(); return uni.showToast({ title: '已复制订阅', icon: 'success' }) }
				if (action === 'pause') item.status = 'paused'
				else if (action === 'resume' || action === 'restore') item.status = 'active'
				else if (action === 'archive') item.status = 'archived'
				item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: { pause: '订阅已暂停', resume: '订阅已恢复', restore: '已恢复为有效订阅', archive: '订阅已归档' }[action], icon: 'none' })
			},
			cancelSubscription() { const item = this.selectedSubscription; const guide = item.cancelGuide ? `\n\n取消路径：${item.cancelGuide}` : ''; uni.showModal({ title: `取消“${item.name}”`, content: `确认已在实际付款渠道关闭自动续费吗？此操作只更新清单状态，不会代替你向服务商取消。${guide}`, confirmText: '已完成取消', confirmColor: '#c5444c', success: res => { if (res.confirm) { item.status = 'cancelled'; item.autoRenew = false; item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: '已标记为取消', icon: 'success' }) } } }) },
			deleteSubscription() { const item = this.selectedSubscription; uni.showModal({ title: `删除“${item.name}”`, content: '删除后仅可通过恢复演示数据找回，确定继续吗？', confirmColor: '#c5444c', success: res => { if (res.confirm) { this.subscriptions = this.subscriptions.filter(row => row.id !== item.id); this.persist(); this.selectedId = null; this.switchTab('all'); uni.showToast({ title: '订阅已删除', icon: 'success' }) } } }) },
			nextReminderText(item) { if (!item.reminders || !item.reminders.length) return '未设置'; const days = Math.max(...item.reminders); return `${formatDate(addDays(item.nextBillingDate, -days))} ${this.settings.reminderTime}` },
			openReminderSettings() { this.navigateToView('reminder-settings') },
			toggleDefaultReminder(value) { const list = this.settings.defaultReminders; const index = list.indexOf(value); if (index >= 0) { if (list.length === 1) return uni.showToast({ title: '至少保留一个提醒节点', icon: 'none' }); list.splice(index, 1) } else list.push(value); list.sort((a, b) => b - a); this.persist() },
			exportData() { const header = '服务名称,套餐,分类,金额,币种,周期,下次扣费日,状态,付款渠道,备注'; const rows = this.subscriptions.map(item => [item.name, item.plan || '', item.category, item.amount === null ? '' : item.amount, item.currency, item.cycle, item.nextBillingDate, this.statusText(item), item.payment, item.note || ''].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')); const csv = [header].concat(rows).join('\n');
				// #ifdef H5
				const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `续订清单-${this.todayKey}.csv`; link.click(); URL.revokeObjectURL(link.href); uni.showToast({ title: 'CSV 已导出', icon: 'success' })
				// #endif
				// #ifndef H5
				uni.setClipboardData({ data: csv, success: () => uni.showToast({ title: '表格数据已复制', icon: 'success' }) })
				// #endif
			},
			showPrivacy() { uni.showModal({ title: '隐私与数据说明', content: '当前版本只把演示数据保存在本机缓存，不会上传服务端，也不会读取支付账户。接入后端后需要补充正式隐私政策与数据删除机制。', showCancel: false }) },
			resetDemoData() { uni.showModal({ title: '恢复演示数据', content: '当前本地修改将被覆盖，确定继续吗？', confirmColor: '#c5444c', success: res => { if (res.confirm) { this.subscriptions = createSeedSubscriptions(); this.settings = createDefaultSettings(); this.persist(); uni.showToast({ title: '演示数据已恢复', icon: 'success' }) } } }) }
		}
	}
</script>

<style lang="scss">
	$green: #16834d; $deep: #0f6f40; $text: #18201b; $muted: #747d77; $line: #e9eeea; $bg: #f4f7f5;
	page { background: $bg; color: $text; }
	.app-shell { width: 100%; min-height: 100vh; background: $bg; }
	.safe-top { height: calc(var(--status-bar-height) + 10rpx); background: #fff; }
	.page-scroll { height: calc(100vh - var(--status-bar-height) - 10rpx); }
	.page { box-sizing: border-box; min-height: calc(100vh - var(--status-bar-height)); padding: 24rpx 28rpx 180rpx; background: $bg; }
	.home-page { padding-top: 20rpx; }
	.home-head, .top-titlebar, .detail-titlebar { min-height: 76rpx; display: flex; align-items: center; justify-content: space-between; }
	.hero-title { display: block; font-size: 46rpx; line-height: 1.2; font-weight: 800; }
	.hero-subtitle, .page-subtitle { display: block; margin-top: 8rpx; color: #7d8680; font-size: 24rpx; }
	.page-title { font-size: 32rpx; font-weight: 750; }
	.top-titlebar.centered { position: relative; justify-content: center; }
	.absolute { position: absolute; right: 0; }
	.icon-button, .summary-eye, .text-button, .month-arrow, .clear-search { margin: 0; padding: 0; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; }
	.icon-button { width: 76rpx; height: 76rpx; border-radius: 50%; background: #fff; box-shadow: 0 6rpx 22rpx rgba(28,52,36,.06); }
	.icon-button.plain { background: transparent; box-shadow: none; }
	.icon-button::after, .summary-eye::after, .text-button::after, .month-arrow::after, .clear-search::after { border: 0; }
	.summary-card { position: relative; overflow: hidden; margin-top: 34rpx; padding: 34rpx 34rpx 36rpx; border-radius: 22rpx; color: #fff; background: linear-gradient(135deg, #087744, #1b9358); box-shadow: 0 16rpx 36rpx rgba(12,113,63,.2); }
	.summary-top { display: flex; align-items: center; font-size: 27rpx; font-weight: 650; }
	.summary-eye { width: 60rpx; height: 48rpx; margin-left: 5rpx; }
	.summary-amount { display: block; min-height: 66rpx; margin: 22rpx 0 18rpx; font-size: 56rpx; line-height: 1.15; font-weight: 780; }
	.summary-meta { display: flex; align-items: center; font-size: 23rpx; opacity: .86; }
	.divider { width: 1rpx; height: 22rpx; margin: 0 20rpx; background: rgba(255,255,255,.42); }
	.summary-watermark { position: absolute; right: -10rpx; bottom: -20rpx; width: 170rpx; height: 154rpx; padding: 42rpx 26rpx; box-sizing: border-box; border: 13rpx solid rgba(255,255,255,.055); border-radius: 24rpx; }
	.wm-line { height: 9rpx; margin-bottom: 17rpx; border-radius: 8rpx; background: rgba(255,255,255,.075); }.wm-line.short { width: 58%; }
	.notice-banner { min-height: 106rpx; margin-top: 24rpx; padding: 18rpx 22rpx; box-sizing: border-box; display: flex; align-items: center; border: 1rpx solid #f1dfc7; border-radius: 18rpx; background: #fff8ef; }
	.notice-icon { width: 56rpx; height: 56rpx; margin-right: 18rpx; border-radius: 15rpx; background: #fee9cd; display: flex; align-items: center; justify-content: center; }
	.notice-copy { flex: 1; min-width: 0; }.notice-title { display: block; color: #825115; font-size: 25rpx; font-weight: 700; }.notice-desc { display: block; margin-top: 5rpx; color: #9b7950; font-size: 21rpx; }
	.section-card, .chart-card, .trend-card, .settings-card, .detail-block, .process-card, .form-card { margin-top: 26rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 7rpx 25rpx rgba(31,54,39,.045); }
	.section-card { padding: 28rpx 24rpx; }.section-head { display: flex; align-items: center; justify-content: space-between; }.section-title { font-size: 30rpx; font-weight: 750; }.section-caption { color: $muted; font-size: 23rpx; }
	.text-button { min-height: 60rpx; color: $muted; font-size: 23rpx; }.text-button.green { color: $green; font-weight: 650; }
	.group-title { display: flex; align-items: center; margin-top: 22rpx; font-size: 24rpx; font-weight: 700; }.group-title.second { margin-top: 18rpx; }.count-dot { min-width: 29rpx; height: 29rpx; margin-left: 9rpx; border-radius: 15rpx; color: #fff; font-size: 18rpx; line-height: 29rpx; text-align: center; }.count-dot.red { background: #e94b53; }.count-dot.orange { background: #ee923b; }
	.view-more { width: 100%; min-height: 68rpx; margin: 8rpx 0 0; padding: 0; border: 0; color: #737c76; background: transparent; font-size: 23rpx; line-height: 68rpx; }.view-more::after { border: 0; }
	.empty-compact { min-height: 130rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8b938e; font-size: 23rpx; }
	.reminder-card { padding-bottom: 12rpx; }.reminder-row { min-height: 104rpx; display: flex; align-items: center; }.reminder-icon { flex: 0 0 auto; width: 48rpx; height: 48rpx; margin-right: 18rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; }.reminder-icon.warning { background: #e89a43; }.reminder-icon.danger { background: #dd4d55; }.reminder-icon.info { background: #6d91b7; }.reminder-icon.success { background: $green; }.reminder-copy { flex: 1; min-width: 0; }.reminder-title { display: block; font-size: 25rpx; font-weight: 650; }.reminder-desc { display: block; overflow: hidden; margin-top: 5rpx; color: #7f8882; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }
	.primary-button, .secondary-button { min-height: 88rpx; margin: 28rpx 0 0; border-radius: 15rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: 650; }.primary-button { border: 0; color: #fff; background: $green; box-shadow: 0 10rpx 24rpx rgba(14,116,64,.14); }.primary-button::after, .secondary-button::after { border: 0; }.primary-button uni-icons, .secondary-button uni-icons { margin-right: 8rpx; }.secondary-button { border: 1rpx solid #dce4de; color: $text; background: #fff; }
	.search-box { height: 82rpx; margin-top: 20rpx; padding: 0 22rpx; display: flex; align-items: center; border: 1rpx solid #e6ece8; border-radius: 16rpx; background: #fff; }.search-box input { flex: 1; height: 82rpx; margin-left: 14rpx; font-size: 25rpx; }.placeholder { color: #abb2ad; }.clear-search { width: 52rpx; height: 52rpx; }
	.filter-scroll, .status-scroll { width: calc(100% + 56rpx); margin: 20rpx -28rpx 0; white-space: nowrap; }.filter-row, .status-row { display: inline-flex; padding: 0 28rpx; }.filter-pill, .status-pill { min-height: 64rpx; margin: 0 12rpx 0 0; padding: 0 22rpx; border: 1rpx solid #e2e8e4; border-radius: 32rpx; color: #68716b; background: #fff; font-size: 23rpx; line-height: 62rpx; white-space: nowrap; }.filter-pill::after, .status-pill::after { border: 0; }.filter-pill.active, .status-pill.active { border-color: #b9dbc7; color: $deep; background: #eaf6ef; font-weight: 650; }.filter-count { margin-left: 7rpx; font-size: 19rpx; opacity: .75; }.status-scroll { margin-top: 14rpx; }.status-pill { min-height: 56rpx; line-height: 54rpx; background: transparent; }.sort-summary { height: 64rpx; display: flex; align-items: center; color: #929a94; font-size: 21rpx; }.sort-summary text { margin-right: 9rpx; }
	.subscription-list { overflow: hidden; margin: 0 -28rpx; background: #fff; }.list-item { min-height: 142rpx; padding: 0 28rpx; display: flex; align-items: center; border-bottom: 1rpx solid $line; }.list-main { flex: 1; min-width: 0; margin-left: 20rpx; }.name-line { display: flex; align-items: center; }.list-name { overflow: hidden; max-width: 70%; font-size: 27rpx; font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }.list-detail, .list-date { display: block; overflow: hidden; margin-top: 7rpx; color: $muted; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }.list-date { color: #919993; }.status-badge { flex: 0 0 auto; margin-left: 10rpx; padding: 4rpx 10rpx; border-radius: 7rpx; font-size: 18rpx; }.status-badge.active { color: #40745a; background: #e9f4ed; }.status-badge.upcoming { color: #b86819; background: #fff0dd; }.status-badge.pending { color: #c3434b; background: #fde8e9; }.status-badge.paused, .status-badge.archived { color: #68716b; background: #edf0ee; }.status-badge.cancelled { color: #7b7f7c; background: #eee; }.status-badge.large { padding: 7rpx 14rpx; font-size: 20rpx; }
	.empty-state { min-height: 540rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }.empty-icon { width: 100rpx; height: 100rpx; margin-bottom: 22rpx; border-radius: 50%; background: #eaf0ec; display: flex; align-items: center; justify-content: center; }.empty-title { font-size: 28rpx; font-weight: 700; }.empty-desc { max-width: 460rpx; margin-top: 12rpx; color: $muted; font-size: 23rpx; line-height: 1.6; text-align: center; }.empty-state .secondary-button { min-height: 72rpx; padding: 0 34rpx; font-size: 24rpx; }
	.float-add { position: fixed; z-index: 15; right: 32rpx; bottom: calc(138rpx + env(safe-area-inset-bottom)); width: 88rpx; height: 88rpx; padding: 0; border: 0; border-radius: 50%; background: $green; display: flex; align-items: center; justify-content: center; box-shadow: 0 12rpx 28rpx rgba(11,105,58,.25); }.float-add::after { border: 0; }
	.month-nav { min-height: 88rpx; display: flex; align-items: center; justify-content: space-between; }.month-name { font-size: 27rpx; font-weight: 700; }.month-arrow { width: 70rpx; height: 70rpx; border-radius: 50%; background: #fff; }
	.calendar-card { overflow: hidden; border-radius: 18rpx; background: #fff; box-shadow: 0 7rpx 25rpx rgba(31,54,39,.04); }.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }.week-grid { padding: 20rpx 0 10rpx; color: #717a74; font-size: 21rpx; text-align: center; }.dates-grid { padding: 5rpx 8rpx 18rpx; }.date-cell { position: relative; height: 86rpx; margin: 0; padding: 5rpx 0 0; border: 0; border-radius: 12rpx; color: #303832; background: transparent; display: flex; flex-direction: column; align-items: center; line-height: 1; }.date-cell::after { border: 0; }.date-cell.muted { color: #bdc2be; }.day-number { width: 42rpx; height: 42rpx; border-radius: 50%; font-size: 22rpx; line-height: 42rpx; text-align: center; }.date-cell.today .day-number { box-shadow: inset 0 0 0 2rpx #8ec4a5; }.date-cell.selected { background: #edf7f1; }.date-cell.selected .day-number { color: #fff; background: $green; font-weight: 700; }.event-count { position: absolute; top: 2rpx; right: 7rpx; min-width: 26rpx; height: 26rpx; padding: 0 5rpx; border-radius: 13rpx; color: #fff; background: #e64d55; font-size: 16rpx; line-height: 26rpx; text-align: center; }.tiny-price { margin-top: 5rpx; color: #7f8982; font-size: 16rpx; }.calendar-detail { margin-top: 24rpx; padding: 26rpx 24rpx; border-radius: 18rpx; background: #fff; }.detail-heading { display: flex; align-items: center; justify-content: space-between; }.detail-date { font-size: 27rpx; font-weight: 700; }.detail-week { margin-left: 10rpx; color: $muted; font-size: 21rpx; }.detail-total { color: $muted; font-size: 21rpx; }.calendar-subscription { min-height: 112rpx; display: flex; align-items: center; border-bottom: 1rpx solid $line; }.calendar-subscription:last-child { border-bottom: 0; }.item-amount { font-size: 24rpx; font-weight: 700; }.calendar-empty { min-height: 160rpx; }
	.segmented-control { height: 72rpx; margin-top: 18rpx; padding: 6rpx; display: flex; border-radius: 14rpx; background: #e8edea; }.segmented-control button { flex: 1; margin: 0; padding: 0; border: 0; border-radius: 10rpx; color: #757e78; background: transparent; font-size: 23rpx; line-height: 60rpx; }.segmented-control button::after { border: 0; }.segmented-control button.active { color: $deep; background: #fff; font-weight: 700; box-shadow: 0 3rpx 10rpx rgba(22,48,31,.06); }
	.stats-summary { padding: 34rpx 4rpx 22rpx; display: flex; flex-direction: column; }.stats-label { color: $muted; font-size: 23rpx; }.stats-total { margin-top: 8rpx; font-size: 48rpx; font-weight: 800; }.stats-compare { margin-top: 9rpx; color: #868f89; font-size: 21rpx; }.chart-card { margin-top: 8rpx; padding: 28rpx 20rpx; display: flex; align-items: center; }.donut { flex: 0 0 auto; width: 220rpx; height: 220rpx; border-radius: 50%; background: #e7ece8; display: flex; align-items: center; justify-content: center; }.donut-hole { width: 138rpx; height: 138rpx; border-radius: 50%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }.donut-value { font-size: 25rpx; font-weight: 750; }.donut-label { margin-top: 5rpx; color: $muted; font-size: 18rpx; }.legend { flex: 1; min-width: 0; margin-left: 26rpx; }.legend-row { height: 42rpx; display: flex; align-items: center; font-size: 19rpx; }.legend-color { flex: 0 0 auto; width: 12rpx; height: 12rpx; margin-right: 9rpx; border-radius: 50%; }.legend-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.legend-value { width: 92rpx; text-align: right; }.legend-percent { width: 56rpx; color: $muted; text-align: right; }.trend-card { padding: 26rpx 22rpx; }.trend-head { display: flex; align-items: flex-start; justify-content: space-between; }.trend-sub { display: block; margin-top: 6rpx; color: $muted; font-size: 20rpx; }.unit-label { color: #919994; font-size: 18rpx; }.bar-chart { height: 280rpx; margin-top: 26rpx; display: flex; align-items: flex-end; justify-content: space-between; }.bar-column { width: 14%; color: #858e88; font-size: 18rpx; text-align: center; }.bar-value { display: block; height: 30rpx; color: #66706a; font-size: 16rpx; }.bar-track { position: relative; height: 210rpx; margin-bottom: 10rpx; border-radius: 7rpx 7rpx 2rpx 2rpx; background: #eef2ef; }.bar-fill { position: absolute; right: 0; bottom: 0; left: 0; border-radius: 7rpx 7rpx 2rpx 2rpx; background: linear-gradient(180deg, #3cb974, #16834d); }.insight-card { margin-top: 24rpx; padding: 22rpx; display: flex; border: 1rpx solid #d9eadf; border-radius: 16rpx; background: #f0f8f3; }.insight-icon { margin-right: 16rpx; }.insight-title { display: block; font-size: 24rpx; font-weight: 700; }.insight-desc { display: block; margin-top: 7rpx; color: #587062; font-size: 21rpx; line-height: 1.55; }
	.profile-head { min-height: 128rpx; margin-top: 22rpx; padding: 24rpx; box-sizing: border-box; display: flex; align-items: center; border-radius: 20rpx; color: #fff; background: linear-gradient(135deg, #126f43, #238f59); }.avatar { width: 78rpx; height: 78rpx; margin-right: 18rpx; border-radius: 50%; background: rgba(255,255,255,.18); font-size: 31rpx; line-height: 78rpx; text-align: center; }.profile-copy { flex: 1; }.profile-name { display: block; font-size: 28rpx; font-weight: 700; }.profile-sub { display: block; margin-top: 6rpx; font-size: 20rpx; opacity: .75; }.local-badge { padding: 7rpx 12rpx; border-radius: 8rpx; background: rgba(255,255,255,.15); font-size: 18rpx; }.settings-section { margin-top: 30rpx; }.settings-title { margin-left: 6rpx; color: #68716b; font-size: 22rpx; font-weight: 650; }.settings-card { overflow: hidden; margin-top: 12rpx; padding: 0 22rpx; }.setting-row { min-height: 104rpx; display: flex; align-items: center; border-bottom: 1rpx solid $line; }.setting-row:last-child { border-bottom: 0; }.setting-icon { width: 54rpx; height: 54rpx; margin-right: 16rpx; border-radius: 15rpx; display: flex; align-items: center; justify-content: center; }.green-bg { background: #e7f4ec; }.orange-bg { background: #fff0dd; }.blue-bg { background: #e9f2fb; }.violet-bg { background: #efedfb; }.red-bg { background: #fdebed; }.setting-copy { flex: 1; min-width: 0; }.setting-copy text:first-child { display: block; font-size: 25rpx; font-weight: 620; }.setting-copy text:last-child { display: block; overflow: hidden; margin-top: 5rpx; color: $muted; font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }.setting-row switch { transform: scale(.78); transform-origin: right center; }.version-text { display: block; margin-top: 36rpx; color: #9da49f; font-size: 19rpx; text-align: center; }
	.detail-titlebar { margin: 0 -10rpx; }.icon-spacer { width: 76rpx; }.detail-hero { min-height: 116rpx; display: flex; align-items: center; }.detail-hero-copy { flex: 1; min-width: 0; margin-left: 20rpx; }.detail-name { display: block; font-size: 31rpx; font-weight: 780; }.detail-plan { display: block; margin-top: 6rpx; color: $muted; font-size: 22rpx; }.detail-amount-card { padding: 32rpx 28rpx; border-radius: 20rpx; color: #fff; background: $green; box-shadow: 0 12rpx 28rpx rgba(14,112,62,.16); }.detail-amount-label { display: block; font-size: 22rpx; opacity: .76; }.detail-amount { display: block; margin-top: 10rpx; font-size: 45rpx; font-weight: 800; }.detail-countdown { display: block; margin-top: 9rpx; font-size: 22rpx; opacity: .83; }.detail-grid { margin-top: 22rpx; display: grid; grid-template-columns: 1fr 1fr; border-radius: 18rpx; background: #fff; overflow: hidden; }.detail-grid view { min-height: 96rpx; padding: 20rpx 24rpx; box-sizing: border-box; border-right: 1rpx solid $line; border-bottom: 1rpx solid $line; }.detail-grid view:nth-child(2n) { border-right: 0; }.detail-grid view:nth-child(n+3) { border-bottom: 0; }.detail-grid text:first-child { display: block; color: $muted; font-size: 20rpx; }.detail-grid text:last-child { display: block; margin-top: 7rpx; font-size: 24rpx; font-weight: 650; }.detail-block, .process-card { padding: 26rpx 24rpx; }.block-head { display: flex; justify-content: space-between; }.block-head text:first-child { font-size: 26rpx; font-weight: 700; }.block-head text:last-child { color: $green; font-size: 20rpx; }.reminder-tags { display: flex; flex-wrap: wrap; margin-top: 18rpx; }.reminder-tags text { margin: 0 10rpx 10rpx 0; padding: 8rpx 13rpx; border-radius: 8rpx; color: $deep; background: #e8f5ed; font-size: 20rpx; }.block-note { display: block; margin-top: 7rpx; color: $muted; font-size: 21rpx; }.text-info + .text-info { margin-top: 22rpx; padding-top: 20rpx; border-top: 1rpx solid $line; }.text-info text:first-child { display: block; color: $muted; font-size: 20rpx; }.text-info text:last-child { display: block; margin-top: 7rpx; font-size: 23rpx; line-height: 1.55; }.process-actions { display: flex; margin-top: 22rpx; }.process-button { flex: 1; min-height: 92rpx; margin: 0 10rpx 0 0; padding: 10rpx 4rpx; border: 0; border-radius: 13rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 20rpx; }.process-button:last-child { margin-right: 0; }.process-button::after { border: 0; }.process-button text { margin-top: 7rpx; }.process-button.success { color: #177e4b; background: #eaf6ef; }.process-button.later { color: #9a601b; background: #fff3e4; }.process-button.cancel { color: #bd4048; background: #fcecee; }.detail-bottom { display: flex; }.detail-bottom .secondary-button { flex: .55; margin-right: 16rpx; }.detail-bottom .primary-button { flex: 1; }.danger-text { color: #c5444c; }.edit-button { font-size: 27rpx; }
	.process-button.success.processed, .process-button.later.processed { color: #8b9690; background: #edf0ee; opacity: 1; }.process-card.completed { border: 1rpx solid #d5eadc; background: #f1f8f4; }.process-desc { display: block; margin-top: 9rpx; color: $muted; font-size: 21rpx; line-height: 1.5; }.renewal-result { display: flex; align-items: flex-start; }.result-icon { flex: 0 0 auto; width: 54rpx; height: 54rpx; margin-right: 16rpx; border-radius: 50%; background: #dff1e6; display: flex; align-items: center; justify-content: center; }.result-copy { flex: 1; min-width: 0; }.process-note { display: block; margin-top: 8rpx; color: $muted; font-size: 20rpx; line-height: 1.5; }.history-list { margin-top: 14rpx; }.history-row { min-height: 76rpx; display: flex; align-items: center; justify-content: space-between; border-top: 1rpx solid $line; }.history-row > view text:first-child { display: block; font-size: 22rpx; font-weight: 650; }.history-row > view text:last-child { display: block; margin-top: 4rpx; color: $muted; font-size: 19rpx; }.history-row > text { font-size: 22rpx; font-weight: 650; }
	.template-section { margin-top: 18rpx; }.form-section-head { display: flex; align-items: center; justify-content: space-between; }.form-section-head > text:first-child { font-size: 25rpx; font-weight: 700; }.form-section-head > text:last-child { color: $muted; font-size: 20rpx; }.template-scroll { width: calc(100% + 56rpx); margin: 15rpx -28rpx 0; white-space: nowrap; }.template-row { display: inline-flex; padding: 0 28rpx; }.template-chip { width: 142rpx; min-height: 126rpx; margin: 0 14rpx 0 0; padding: 14rpx 8rpx; border: 1rpx solid #e2e9e4; border-radius: 16rpx; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 20rpx; }.template-chip::after { border: 0; }.template-logo { width: 54rpx; height: 54rpx; margin-bottom: 10rpx; border-radius: 14rpx; color: #fff; font-size: 20rpx; font-weight: 750; line-height: 54rpx; text-align: center; }.form-section { margin-top: 28rpx; }.form-section-title { display: block; margin: 0 0 12rpx 6rpx; color: #5f6962; font-size: 22rpx; font-weight: 650; }.form-section-title.no-margin { margin: 0; }.form-card { overflow: hidden; margin-top: 0; padding: 0 22rpx; }.form-row { min-height: 98rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid $line; }.form-row.no-border { border-bottom: 0; }.form-label { flex: 0 0 auto; font-size: 25rpx; font-weight: 620; }.form-label.required::after { margin-left: 4rpx; color: #d84b52; content: '*'; }.form-hint { display: block; margin-top: 5rpx; color: $muted; font-size: 19rpx; font-weight: 400; }.form-input { flex: 1; height: 94rpx; margin-left: 28rpx; font-size: 24rpx; text-align: right; }.form-value { display: flex; align-items: center; color: #68716b; font-size: 24rpx; }.form-value uni-icons { margin-left: 12rpx; }.money-input { display: flex; align-items: center; color: #68716b; }.money-input input { width: 210rpx; height: 94rpx; margin-left: 8rpx; font-size: 25rpx; text-align: right; }.form-row switch { transform: scale(.8); transform-origin: right center; }.color-options { display: flex; }.color-options button { width: 42rpx; height: 42rpx; margin: 0 0 0 12rpx; padding: 0; border: 5rpx solid #fff; border-radius: 50%; box-shadow: 0 0 0 1rpx #dce3de; }.color-options button::after { border: 0; }.color-options button.selected { box-shadow: 0 0 0 3rpx #a7cfb7; }.textarea-row { min-height: 154rpx; align-items: flex-start; padding: 25rpx 0; box-sizing: border-box; }.textarea-row textarea { flex: 1; height: 106rpx; margin-left: 28rpx; font-size: 23rpx; line-height: 1.5; text-align: right; }.reminder-options { display: flex; flex-wrap: wrap; }.reminder-options button { min-height: 64rpx; margin: 0 12rpx 12rpx 0; padding: 0 18rpx; border: 1rpx solid #dfe6e1; border-radius: 11rpx; color: #68716b; background: #fff; font-size: 22rpx; line-height: 62rpx; }.reminder-options button::after { border: 0; }.reminder-options button.selected { border-color: #aad1ba; color: $deep; background: #eaf6ef; font-weight: 650; }.reminder-options button uni-icons { margin-right: 4rpx; }.form-help { display: block; margin-top: 5rpx; color: $muted; font-size: 20rpx; }.form-error { min-height: 76rpx; margin-top: 20rpx; padding: 14rpx 18rpx; box-sizing: border-box; display: flex; align-items: center; border: 1rpx solid #f0cfd2; border-radius: 12rpx; color: #a83a42; background: #fff1f2; font-size: 22rpx; }.form-error uni-icons { margin-right: 10rpx; }.save-button { width: 100%; }
	.settings-intro { margin-top: 24rpx; padding: 24rpx; display: flex; align-items: center; border: 1rpx solid #d5eadc; border-radius: 16rpx; background: #eff8f2; }.settings-intro > uni-icons { margin-right: 17rpx; }.settings-intro text:first-child { display: block; font-size: 24rpx; font-weight: 700; }.settings-intro text:last-child { display: block; margin-top: 6rpx; color: #637269; font-size: 20rpx; }.reminder-check-list { overflow: hidden; margin-top: 24rpx; padding: 0 22rpx; border-radius: 18rpx; background: #fff; }.reminder-check-row { width: 100%; min-height: 104rpx; margin: 0; padding: 0; border: 0; border-bottom: 1rpx solid $line; background: #fff; display: flex; align-items: center; justify-content: space-between; text-align: left; }.reminder-check-row::after { border: 0; }.reminder-check-row > view:first-child text:first-child { display: block; font-size: 25rpx; font-weight: 650; }.reminder-check-row > view:first-child text:last-child { display: block; margin-top: 5rpx; color: $muted; font-size: 20rpx; }.check-box { width: 38rpx; height: 38rpx; border: 2rpx solid #cbd4ce; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }.check-box.checked { border-color: $green; background: $green; }
	.bottom-space { height: 20rpx; }.tab-bar { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; width: 100%; max-width: 750rpx; height: calc(112rpx + env(safe-area-inset-bottom)); margin: 0 auto; padding: 10rpx 12rpx env(safe-area-inset-bottom); box-sizing: border-box; display: flex; border-top: 1rpx solid #e9eeea; background: rgba(255,255,255,.98); box-shadow: 0 -7rpx 24rpx rgba(25,45,31,.04); }.tab-item { flex: 1; height: 92rpx; margin: 0; padding: 7rpx 0 3rpx; border: 0; border-radius: 12rpx; color: #8e9690; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 19rpx; line-height: 1.2; }.tab-item::after { border: 0; }.tab-item text { margin-top: 7rpx; }.tab-item.active { color: $green; font-weight: 700; }
	@media screen and (min-width: 768px) { .app-shell { max-width: 750rpx; margin: 0 auto; box-shadow: 0 0 48px rgba(20,40,27,.09); }.float-add { right: calc((100vw - 750rpx) / 2 + 32rpx); } }
</style>
