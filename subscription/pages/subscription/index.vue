<template>
	<view class="app-shell">
		<view class="safe-top" :class="{ 'form-safe-top': activeView === 'form' }" :style="{ height: statusBarHeight + 'px' }"></view>
		<scroll-view class="page-scroll" :style="{ height: `calc(100vh - ${statusBarHeight}px)` }" scroll-y :show-scrollbar="false" :scroll-top="scrollTop">
			<!-- 首页 -->
				<view v-if="activeView === 'home'" class="page home-page">
					<view class="primary-titlebar home-head" :style="{ height: navigationBarHeight + 'px' }">
						<text class="page-title">续订清单</text>
				</view>
				<text class="home-lead">每一笔续费，都提前心中有数</text>

				<view class="summary-card">
					<view class="summary-top"><text>未来 30 天预计扣费</text><button class="summary-eye" aria-label="显示或隐藏金额" @tap="toggleAmount"><uni-icons :type="settings.amountVisible ? 'eye' : 'eye-slash'" size="20" color="#ffffff" /></button></view>
					<text class="summary-amount">{{ settings.amountVisible ? formatMoney(next30Total) : '¥ ••••' }}</text>
					<view class="summary-meta"><text>共 {{ next30Subscriptions.length }} 项</text><view class="divider"></view><text>月均约 {{ settings.amountVisible ? formatMoney(monthlyAverage) : '¥•••' }}</text></view>
					<view class="summary-spark" aria-hidden="true"><view v-for="bar in trendData.slice(0, 5)" :key="bar.month" class="summary-spark-bar" :style="{ height: bar.height + '%' }"></view></view>
				</view>

				<view v-if="!settings.notificationEnabled" class="notice-banner" @tap="enableNotification">
					<view class="notice-icon"><uni-icons type="notification" size="20" color="#a86210" /></view>
					<view class="notice-copy"><text class="notice-title">续费提醒尚未开启</text><text class="notice-desc">当前为本地演示，开启后模拟通知授权状态</text></view>
					<button class="notice-action" @tap.stop="enableNotification">开启</button>
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
				<view class="primary-titlebar" :style="{ height: navigationBarHeight + 'px' }"><text class="page-title">全部订阅</text></view>
				<view class="search-box"><uni-icons type="search" size="19" color="#8c938e" /><input v-model.trim="searchKeyword" confirm-type="search" placeholder="搜索服务或套餐" placeholder-class="placeholder" /><button v-if="searchKeyword" class="clear-search" @tap="searchKeyword = ''"><uni-icons type="clear" size="18" color="#9ca19d" /></button></view>
				<scroll-view class="filter-scroll" scroll-x :show-scrollbar="false"><view class="filter-row"><button v-for="filter in categoryFilters" :key="filter.name" class="filter-pill" :class="{ active: activeCategory === filter.name }" @tap="activeCategory = filter.name"><text class="filter-label">{{ filter.name }}</text><text class="filter-count">{{ filter.count }}</text></button></view></scroll-view>
				<scroll-view class="status-scroll" scroll-x :show-scrollbar="false"><view class="status-row"><button v-for="status in statusFilters" :key="status.value" class="status-pill" :class="{ active: activeStatus === status.value }" @tap="activeStatus = status.value">{{ status.label }}</button></view></scroll-view>
				<button class="sort-summary" aria-label="选择排序方式" @tap="chooseSort"><view><text>{{ sortLabel }}</text><text class="sort-divider">·</text><text>{{ activeStatusLabel }}</text></view><uni-icons type="right" size="15" color="#89938c" /></button>
				<view v-if="visibleSubscriptions.length" class="subscription-list"><view v-for="item in visibleSubscriptions" :key="item.id" class="list-item" @tap="openDetail(item)"><brand-logo :item="item" /><view class="list-main"><view class="name-line"><text class="list-name">{{ item.name }}</text><text class="status-badge" :class="getStatus(item)">{{ statusText(item) }}</text></view><text class="list-detail">{{ item.cycle }} · {{ item.amount === null ? '金额待补充' : formatMoney(item.amount) }} · {{ item.payment }}</text><text class="list-date">{{ formatDate(item.nextBillingDate) }} · {{ daysText(item) }}</text></view><uni-icons type="right" size="17" color="#b0b5b1" /></view></view>
				<view v-else class="empty-state"><view class="empty-icon"><uni-icons :type="subscriptions.length ? 'search' : 'plus'" size="30" color="#4a9a6c" /></view><text class="empty-title">{{ subscriptions.length ? '没有匹配的订阅' : '还没有添加订阅' }}</text><text class="empty-desc">{{ subscriptions.length ? '调整搜索词或筛选条件，也可以新增一条订阅' : '添加第一条订阅后，这里会显示所有续费项目' }}</text><button v-if="subscriptions.length" class="secondary-button" @tap="resetFilters">重置筛选</button><button v-else class="primary-button empty-add" @tap="openForm()">新增订阅</button></view>
				<button class="float-add" aria-label="新增订阅" @tap="openForm()"><uni-icons type="plus" size="27" color="#ffffff" /></button>
			</view>

			<!-- 日历 -->
			<view v-else-if="activeView === 'calendar'" class="page calendar-page">
				<view class="primary-titlebar" :style="{ height: navigationBarHeight + 'px' }"><text class="page-title">续费日历</text></view>
				<view class="month-nav"><button class="month-arrow" @tap="changeMonth(-1)"><uni-icons type="left" size="19" color="#5d655f" /></button><text class="month-name">{{ calendarTitle }}</text><button class="month-arrow" @tap="changeMonth(1)"><uni-icons type="right" size="19" color="#5d655f" /></button><button class="today-button" @tap="goToday">今天</button></view>
				<view class="calendar-card"><view class="calendar-grid week-grid"><text v-for="day in weekdays" :key="day">{{ day }}</text></view><view class="calendar-grid dates-grid"><button v-for="day in calendarDays" :key="day.key" class="date-cell" :class="{ muted: !day.currentMonth, selected: day.key === selectedDate, today: day.key === todayKey }" @tap="selectDate(day.key)"><text class="day-number">{{ day.day }}</text><view v-if="day.count" class="event-count">{{ day.count }}</view><text v-if="day.amount" class="tiny-price">¥{{ compactAmount(day.amount) }}</text></button></view></view>
				<view class="calendar-detail"><view class="detail-heading"><view><text class="detail-date">{{ selectedDateTitle }}</text><text class="detail-week">{{ selectedWeekday }}</text></view><text class="detail-total">{{ selectedDateSubscriptions.length }} 项 · {{ formatMoney(selectedDateTotal) }}</text></view><view v-if="selectedDateSubscriptions.length"><view v-for="item in selectedDateSubscriptions" :key="item.id" class="calendar-subscription" @tap="openDetail(item)"><brand-logo :item="item" /><view class="list-main"><text class="list-name">{{ item.name }}</text><text class="list-detail">{{ item.cycle }} · {{ item.payment }}</text></view><text class="item-amount">{{ formatMoney(item.amount) }}</text></view></view><view v-else class="empty-compact calendar-empty"><text>当天没有续费项目</text><button class="text-button green" @tap="openForm(selectedDate)">添加到这一天</button></view></view>
			</view>

			<!-- 统计 -->
			<view v-else-if="activeView === 'stats'" class="page stats-page">
				<view class="primary-titlebar" :style="{ height: navigationBarHeight + 'px' }"><text class="page-title">支出统计</text></view>
				<view class="stats-summary"><view class="stats-summary-head"><text class="stats-label">{{ statsLabel }}</text><view class="stats-period-switch"><button v-for="period in statPeriods" :key="period.value" :class="{ active: statsPeriod === period.value }" @tap="statsPeriod = period.value">{{ period.label }}</button></view></view><text class="stats-total">{{ formatMoney(statsTotal) }}</text><text class="stats-compare">基于 {{ statsSubscriptionCount }} 项有效订阅 · 金额为本地估算</text></view>
				<view class="chart-card category-chart-card"><view class="card-heading"><text class="section-title">分类构成</text><text>{{ statsPeriod === 'year' ? '年度' : statsPeriod === 'next' ? '未来 30 天' : '月均' }}</text></view><view class="category-chart-body"><view class="donut" :style="{ background: donutBackground }"><view class="donut-hole"><text class="donut-value">{{ statsPeriod === 'year' ? '年度' : '月均' }}</text><text class="donut-label">分类占比</text></view></view><view class="legend"><view v-for="item in categoryStats" :key="item.name" class="legend-row"><view class="legend-color" :style="{ backgroundColor: item.color }"></view><text class="legend-name">{{ item.name }}</text><text class="legend-value">{{ formatMoney(item.value) }}</text><text class="legend-percent">{{ item.percent }}%</text></view></view></view></view>
				<view class="trend-card"><view class="trend-head"><view><text class="section-title">支出趋势</text><text class="trend-sub">未来 6 个月预计扣费</text></view><text class="unit-label">单位：元</text></view><view class="bar-chart"><view v-for="bar in trendData" :key="bar.month" class="bar-column"><text class="bar-value">{{ compactAmount(bar.value) }}</text><view class="bar-track"><view class="bar-fill" :style="{ height: bar.height + '%' }"></view></view><text>{{ bar.month }}</text></view></view></view>
				<view class="insight-card"><view class="insight-icon"><uni-icons type="info-filled" size="20" color="#177e4b" /></view><view><text class="insight-title">年度订阅可重点检查</text><text class="insight-desc">年度订阅单次扣费更高，建议至少提前 14 天确认是否继续使用。</text></view></view>
			</view>

			<!-- 我的 -->
			<view v-else-if="activeView === 'profile'" class="page profile-page">
				<view class="primary-titlebar" :style="{ height: navigationBarHeight + 'px' }"><text class="page-title">我的</text></view>
					<view class="profile-head"><view class="profile-user-row"><view class="avatar">续</view><view class="profile-copy"><text class="profile-name">续订清单用户</text><text class="profile-sub">本地数据 · {{ subscriptions.length }} 项订阅</text></view><text class="local-badge">演示模式</text></view><view class="profile-metrics"><view><text>月均支出</text><text>{{ formatMoney(monthlyAverage) }}</text></view><view><text>提醒状态</text><text>{{ settings.notificationEnabled ? '已开启' : '未开启' }}</text></view></view></view>
					<view class="membership-entry" :class="{ active: isMember }" role="button" aria-label="查看会员权益" hover-class="membership-entry-pressed" @tap="openMembership">
						<view class="membership-entry-head">
							<view class="membership-icon"><uni-icons :type="isMember ? 'checkbox-filled' : 'vip-filled'" size="22" color="#ffffff" /></view>
							<view class="membership-copy"><text class="membership-kicker">{{ isMember ? '会员权益' : '升级会员' }}</text><text class="membership-title">{{ isMember ? '会员已开启' : '开通会员' }}</text><text class="membership-desc">{{ isMember ? '无限新增订阅 · 本地模拟会员' : '解锁无限订阅，重要支出更从容' }}</text></view>
							<uni-icons class="membership-arrow" type="right" size="18" :color="isMember ? '#3c7c5a' : '#9b6a28'" />
						</view>
						<view v-if="!isMember" class="membership-quota"><view class="membership-quota-line"><text>免费额度</text><text>{{ freeQuotaText }}</text></view><view class="membership-progress"><view class="membership-progress-fill" :style="{ width: membershipQuotaPercent + '%' }"></view></view><view class="membership-benefits"><text><uni-icons type="checkmarkempty" size="13" color="#8b641f" /> 无限订阅</text><text><uni-icons type="checkmarkempty" size="13" color="#8b641f" /> 高级统计</text><text><uni-icons type="checkmarkempty" size="13" color="#8b641f" /> 续费提醒</text></view></view>
					</view>
					<view class="settings-section"><text class="settings-title">提醒设置</text><view class="settings-card"><view class="setting-row"><view class="setting-icon green-bg"><uni-icons type="notification" size="18" color="#177e4b" /></view><view class="setting-copy"><text>续费通知</text><text>{{ settings.notificationEnabled ? '已模拟开启' : '未开启' }}</text></view><switch :checked="settings.notificationEnabled" color="#16834d" @change="setNotification($event.detail.value)" /></view><view class="setting-row" @tap="openReminderSettings"><view class="setting-icon orange-bg"><uni-icons type="calendar" size="18" color="#bb6b18" /></view><view class="setting-copy"><text>默认提醒规则</text><text>提前 {{ settings.defaultReminders.join('、') }} 天 · {{ settings.reminderTime }}</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view><view class="setting-row"><view class="setting-icon blue-bg"><uni-icons type="email" size="18" color="#3c7fc1" /></view><view class="setting-copy"><text>每周订阅摘要</text><text>每周一汇总未来扣费</text></view><switch :checked="settings.weeklySummary" color="#16834d" @change="updateSetting('weeklySummary', $event.detail.value)" /></view></view></view>
				<view class="settings-section"><text class="settings-title">数据与偏好</text><view class="settings-card"><picker :range="currencies" @change="updateSetting('defaultCurrency', currencies[$event.detail.value])"><view class="setting-row"><view class="setting-icon violet-bg"><uni-icons type="wallet" size="18" color="#6458c9" /></view><view class="setting-copy"><text>默认币种</text><text>{{ settings.defaultCurrency }}</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view></picker><view class="setting-row" @tap="exportData"><view class="setting-icon green-bg"><uni-icons type="download" size="18" color="#177e4b" /></view><view class="setting-copy"><text>导出订阅数据</text><text>生成 CSV 或复制表格数据</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view><view class="setting-row" @tap="showPrivacy"><view class="setting-icon blue-bg"><uni-icons type="locked" size="18" color="#3c7fc1" /></view><view class="setting-copy"><text>隐私与数据说明</text><text>了解本地演示的数据边界</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view><view class="setting-row" @tap="resetDemoData"><view class="setting-icon red-bg"><uni-icons type="refresh" size="18" color="#cc4b52" /></view><view class="setting-copy"><text>恢复演示数据</text><text>覆盖当前本地订阅与设置</text></view><uni-icons type="right" size="17" color="#aab0ac" /></view></view></view>
					<text class="version-text">续订清单 · 本地交互原型 v0.2</text>
				</view>

				<!-- 会员中心 -->
				<view v-else-if="activeView === 'membership'" class="page membership-page">
					<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="goBackView('profile')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">会员中心</text><view class="icon-spacer"></view></view>

					<!-- Hero 卡片 -->
					<view class="membership-hero" :class="{ active: isMember }">
						<view class="membership-hero-deco"></view>
						<view class="membership-hero-deco2"></view>
						<view class="membership-hero-top">
							<view class="membership-hero-icon">
								<uni-icons :type="isMember ? 'checkbox-filled' : 'vip-filled'" size="36" color="#e6a526" />
							</view>
							<view class="membership-hero-copy">
								<text class="membership-hero-tag">{{ isMember ? '✦ 会员已激活' : '✦ 升级会员' }}</text>
								<text class="membership-hero-title">{{ isMember ? '无限订阅已解锁' : '解锁无限订阅' }}</text>
								<text class="membership-hero-desc">{{ isMember ? '感谢使用，所有会员权益均已开放' : '不再受 5 条免费额度限制，尽情记录' }}</text>
							</view>
						</view>
						<view class="hero-benefits">
							<view class="hero-benefit-item">
								<view class="hero-benefit-icon"><uni-icons type="list" size="22" color="#c87f1a" /></view>
								<text class="hero-benefit-label">无限订阅</text>
								<text class="hero-benefit-sub">不限数量</text>
							</view>
							<view class="hero-benefit-item">
								<view class="hero-benefit-icon"><uni-icons type="notification-filled" size="22" color="#c87f1a" /></view>
								<text class="hero-benefit-label">续费提醒</text>
								<text class="hero-benefit-sub">多节点提醒</text>
							</view>
							<view class="hero-benefit-item">
								<view class="hero-benefit-icon"><uni-icons type="bars" size="22" color="#c87f1a" /></view>
								<text class="hero-benefit-label">数据统计</text>
								<text class="hero-benefit-sub">全量洞察</text>
							</view>
						</view>
					</view>

					<!-- CTA 按钮（非会员显示） -->
					<button v-if="!isMember" class="membership-cta" @tap="activateMembership">
						<view class="membership-cta-inner">
							<uni-icons type="vip-filled" size="24" color="#fff" />
							<view class="membership-cta-copy">
								<text class="membership-cta-main">立即开通会员</text>
								<text class="membership-cta-sub">本地模拟 · 体验全部权益</text>
							</view>
							<uni-icons type="right" size="18" color="rgba(255,255,255,.7)" />
						</view>
					</button>

					<!-- 权益详情 -->
					<view class="membership-section">
						<text class="membership-section-title">会员权益</text>
						<view class="benefit-list">
							<view class="benefit-row">
								<view class="benefit-icon-wrap gold"><uni-icons type="list" size="20" color="#b8720f" /></view>
								<view class="benefit-copy">
									<text class="benefit-name">无限订阅数量</text>
									<text class="benefit-desc">免费版仅限 5 条，会员无上限</text>
								</view>
								<view class="benefit-badge member">会员专享</view>
							</view>
							<view class="benefit-row">
								<view class="benefit-icon-wrap green"><uni-icons type="notification-filled" size="20" color="#16834d" /></view>
								<view class="benefit-copy">
									<text class="benefit-name">多节点续费提醒</text>
									<text class="benefit-desc">提前 14、7、3、1 天及当天提醒</text>
								</view>
								<view class="benefit-badge all">免费可用</view>
							</view>
							<view class="benefit-row">
								<view class="benefit-icon-wrap green"><uni-icons type="bars" size="20" color="#16834d" /></view>
								<view class="benefit-copy">
									<text class="benefit-name">支出统计与趋势</text>
									<text class="benefit-desc">月均、年度、分类占比全览</text>
								</view>
								<view class="benefit-badge all">免费可用</view>
							</view>
							<view class="benefit-row no-border">
								<view class="benefit-icon-wrap green"><uni-icons type="locked" size="20" color="#16834d" /></view>
								<view class="benefit-copy">
									<text class="benefit-name">本地数据存储</text>
									<text class="benefit-desc">数据仅存本机，不上传服务器</text>
								</view>
								<view class="benefit-badge all">免费可用</view>
							</view>
						</view>
					</view>

					<!-- 当前状态 -->
					<view class="membership-section">
						<text class="membership-section-title">当前状态</text>
						<view class="membership-status">
							<view class="status-card" :class="{ 'status-card-active': isMember }">
								<view class="status-card-icon-wrap" :class="{ gold: isMember }">
									<uni-icons :type="isMember ? 'vip-filled' : 'person'" size="22" :color="isMember ? '#b8720f' : '#16834d'" />
								</view>
								<view class="status-card-body">
									<text class="membership-status-label">当前方案</text>
									<text class="membership-status-value">{{ isMember ? '会员版' : '免费版' }}</text>
									<text class="membership-status-note">{{ isMember ? '全部权益已开放' : '基础功能可用' }}</text>
								</view>
							</view>
							<view class="status-card">
								<view class="status-card-icon-wrap">
									<uni-icons type="compose" size="22" color="#16834d" />
								</view>
								<view class="status-card-body">
									<text class="membership-status-label">已用额度</text>
									<text class="membership-status-value">{{ isMember ? '无限' : freeQuotaValue }}</text>
									<text class="membership-status-note">{{ isMember ? '不受数量限制' : '5 条免费上限' }}</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 会员已激活时的次级操作 -->
					<button v-if="isMember" class="membership-secondary-cta" @tap="restoreFreePlan">恢复为免费版</button>

					<!-- 信任条 -->
					<view class="membership-trust">
						<view class="trust-item">
							<view class="trust-icon"><uni-icons type="locked" size="18" color="#16834d" /></view>
							<text class="trust-label">仅本地演示</text>
							<text class="trust-sub">数据存本机</text>
						</view>
						<view class="trust-divider"></view>
						<view class="trust-item">
							<view class="trust-icon"><uni-icons type="wallet" size="18" color="#16834d" /></view>
							<text class="trust-label">无需付款</text>
							<text class="trust-sub">模拟体验</text>
						</view>
						<view class="trust-divider"></view>
						<view class="trust-item">
							<view class="trust-icon"><uni-icons type="refresh" size="18" color="#16834d" /></view>
							<text class="trust-label">随时切换</text>
							<text class="trust-sub">可恢复免费</text>
						</view>
					</view>
					<text class="membership-footnote">当前仅用于本地交互演示，不会产生真实扣款。</text>
				</view>

				<!-- 详情 -->
			<view v-else-if="activeView === 'detail' && selectedSubscription" class="page detail-page">
				<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="goBackView('all')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">订阅详情</text><view class="icon-spacer"></view></view>
				<view class="detail-hero"><brand-logo :item="selectedSubscription" /><view class="detail-hero-copy"><text class="detail-name">{{ selectedSubscription.name }}</text><text class="detail-plan">{{ selectedSubscription.plan || selectedSubscription.category }}</text></view><text class="status-badge large" :class="getStatus(selectedSubscription)">{{ statusText(selectedSubscription) }}</text></view>
				<view class="detail-amount-card"><text class="detail-amount-label">下次预计扣费</text><text class="detail-amount">{{ selectedSubscription.amount === null ? '金额待补充' : formatMoney(selectedSubscription.amount) }}</text><text class="detail-countdown">{{ formatDate(selectedSubscription.nextBillingDate) }} · {{ daysText(selectedSubscription) }}</text></view>
				<view class="detail-grid"><view><text>计费周期</text><text>{{ selectedSubscription.cycle }}</text></view><view><text>付款渠道</text><text>{{ selectedSubscription.payment }}</text></view><view><text>分类</text><text>{{ selectedSubscription.category }}</text></view><view><text>自动续费</text><text>{{ selectedSubscription.autoRenew ? '已开启' : '未开启' }}</text></view></view>
				<view class="detail-block"><view class="block-head"><text>提醒计划</text><text>{{ settings.notificationEnabled ? '通知可用' : '仅站内提醒' }}</text></view><view class="reminder-tags"><text v-for="day in selectedSubscription.reminders" :key="day">{{ day === 0 ? '当天' : `提前 ${day} 天` }}</text></view><text class="block-note">最近提醒：{{ nextReminderText(selectedSubscription) }}</text></view>
				<view v-if="selectedRenewalHistory.length" class="detail-block"><view class="block-head"><text>续费记录</text><text>共 {{ selectedSubscription.renewalHistory.length }} 次</text></view><view class="history-list"><view v-for="record in selectedRenewalHistory" :key="record.confirmedAt" class="history-row"><view><text>{{ formatDate(record.billingDate) }}</text><text>已确认续费</text></view><text>{{ formatMoney(record.amount) }}</text></view></view></view>
				<view v-if="selectedSubscription.note || selectedSubscription.cancelGuide" class="detail-block"><view v-if="selectedSubscription.note" class="text-info"><text>备注</text><text>{{ selectedSubscription.note }}</text></view><view v-if="selectedSubscription.cancelGuide" class="text-info"><text>取消路径</text><text>{{ selectedSubscription.cancelGuide }}</text></view></view>
				<view v-if="!['cancelled','archived','paused'].includes(selectedSubscription.status)" class="process-card" :class="{ completed: renewalLocked }"><view v-if="renewalLocked" class="renewal-result"><view class="result-icon"><uni-icons type="checkbox-filled" size="24" color="#177e4b" /></view><view class="result-copy"><text class="section-title">本期续费已确认</text><text class="process-note">{{ formatDate(selectedSubscription.lastRenewedBillingDate, false) }} 已记录，下次预计 {{ formatDate(selectedSubscription.nextBillingDate, false) }} 扣费。</text></view></view><view v-else-if="daysUntil(selectedSubscription.nextBillingDate) > 7"><view class="process-countdown"><uni-icons type="calendar" size="20" color="#8a9590" /><text>距扣费还有 {{ daysUntil(selectedSubscription.nextBillingDate) }} 天</text></view><button class="process-button early" @tap="confirmRenewal"><uni-icons type="checkbox-filled" size="20" color="#8a9590" /><text>提前记录续费</text></button></view><view v-else><text class="section-title">{{ daysUntil(selectedSubscription.nextBillingDate) === 0 ? '今天扣费' : daysUntil(selectedSubscription.nextBillingDate) > 0 ? `${daysUntil(selectedSubscription.nextBillingDate)} 天后扣费` : `已逾期 ${Math.abs(daysUntil(selectedSubscription.nextBillingDate))} 天未确认` }}</text><text class="process-desc">确认实际扣费完成后再更新日期，系统将保存本次记录。</text><view class="process-actions"><button class="process-button success" @tap="confirmRenewal"><uni-icons type="checkbox-filled" size="20" color="#177e4b" /><text>确认已续费</text></button></view></view></view>
				<view class="detail-bottom"><button class="secondary-button manage-button" @tap="showMoreActions"><uni-icons type="more-filled" size="19" color="#177e4b" />管理订阅</button><button class="primary-button edit-button" @tap="openForm(null, selectedSubscription)"><uni-icons type="compose" size="19" color="#ffffff" />编辑订阅</button></view>
			</view>

			<!-- 新增 / 编辑 -->
			<view v-else-if="activeView === 'form'" class="page form-page subscription-form-page">
				<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="goBackView(editingId ? 'detail' : 'home')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">{{ editingId ? '编辑订阅' : '新增订阅' }}</text><view class="icon-spacer"></view></view>
				<view v-if="!editingId" class="template-section"><view class="form-section-head"><text>常用模板</text><text>快速填充</text></view><scroll-view scroll-x :show-scrollbar="false" class="template-scroll"><view class="template-row"><button v-for="item in serviceTemplates" :key="item.name" class="template-chip" @tap="applyTemplate(item)"><view class="template-logo" :style="{ background: item.color }"><uni-icons :type="item.icon" size="26" color="#ffffff" /></view><text>{{ item.short }}</text></button></view></scroll-view></view>
				<view class="form-section"><text class="form-section-title">基本信息</text><view class="form-card"><label class="form-row"><text class="form-label required">服务名称</text><input v-model.trim="form.name" maxlength="30" class="form-input" placeholder="例如：腾讯视频 VIP" placeholder-class="placeholder" /></label><label class="form-row"><text class="form-label">套餐名称</text><input v-model.trim="form.plan" maxlength="30" class="form-input" placeholder="选填" placeholder-class="placeholder" /></label><picker :range="categories" @change="form.category = categories[$event.detail.value]"><view class="form-row"><text class="form-label required">分类</text><view class="form-value"><text>{{ form.category }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><view class="form-row"><text class="form-label">品牌标识</text><view class="color-options"><button v-for="color in logoColors" :key="color" :aria-label="`选择品牌色 ${color}`" :class="{ selected: form.color === color }" :style="{ background: color }" @tap="form.color = color"></button></view></view></view></view>
				<view class="form-section"><text class="form-section-title">扣费信息</text><view class="form-card"><label class="form-row"><text class="form-label required">金额</text><view class="money-input"><text>¥</text><input v-model="form.amount" type="digit" placeholder="输入金额" placeholder-class="placeholder" /></view></label><picker :range="cycles" @change="form.cycle = cycles[$event.detail.value]"><view class="form-row"><text class="form-label required">计费周期</text><view class="form-value"><text>{{ form.cycle }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><picker :range="payments" @change="form.payment = payments[$event.detail.value]"><view class="form-row"><text class="form-label">付款渠道</text><view class="form-value"><text>{{ form.payment }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><picker mode="date" :start="todayKey" :value="form.nextBillingDate" @change="form.nextBillingDate = $event.detail.value"><view class="form-row"><text class="form-label required">下次扣费日</text><view class="form-value"><text>{{ formatDate(form.nextBillingDate) }}</text><uni-icons type="right" size="16" color="#a2a7a3" /></view></view></picker><view class="form-row auto-renew-row"><view><text class="form-label">自动续费</text><text class="form-hint">关闭后将不再自动扣费</text></view><switch :checked="form.autoRenew" color="#16834d" @change="form.autoRenew = $event.detail.value" /></view></view></view>
				<view class="form-section reminder-form-section"><view class="form-section-head"><text class="form-section-title no-margin">提醒节点</text><text>可多选</text></view><view class="reminder-options"><button v-for="option in reminderOptions" :key="option.value" :class="{ selected: form.reminders.includes(option.value) }" @tap="toggleReminder(option.value)"><uni-icons v-if="form.reminders.includes(option.value)" type="checkmarkempty" size="12" color="#177e4b" />{{ option.label }}</button></view><view class="form-preview"><uni-icons type="notification" size="14" color="#3c9a68" /><text>预计最近提醒：{{ formReminderPreview }}</text></view></view>
				<view class="form-section supplement-form-section"><text class="form-section-title">补充信息</text><view class="form-card"><label class="form-row textarea-row"><text class="form-label">备注</text><textarea v-model.trim="form.note" maxlength="500" placeholder="记录使用人、账号尾号等非敏感信息" placeholder-class="placeholder" /></label><label class="form-row textarea-row no-border"><text class="form-label">取消路径</text><textarea v-model.trim="form.cancelGuide" maxlength="300" placeholder="例如：微信支付 > 自动续费管理" placeholder-class="placeholder" /></label></view></view>
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

		<view v-if="sortSheetVisible" class="sheet-mask" @tap="closeSortSheet" @touchmove.stop.prevent>
			<view class="sort-sheet" @tap.stop>
				<view class="sheet-handle"></view>
				<view class="sheet-head"><view><text class="sheet-title">订阅排序</text><text class="sheet-subtitle">选择列表的排列方式</text></view><button class="sheet-close" aria-label="关闭排序" @tap="closeSortSheet"><uni-icons type="closeempty" size="21" color="#5f6862" /></button></view>
				<view class="sort-options"><button v-for="option in sortOptions" :key="option.value" class="sort-option" :class="{ active: sortMode === option.value }" @tap="selectSort(option.value)"><view class="sort-option-icon"><uni-icons :type="option.icon" size="20" :color="sortMode === option.value ? '#177e4b' : '#6f7972'" /></view><view class="sort-option-copy"><text>{{ option.label }}</text><text>{{ option.desc }}</text></view><view class="sort-check" :class="{ checked: sortMode === option.value }"><uni-icons v-if="sortMode === option.value" type="checkmarkempty" size="15" color="#ffffff" /></view></button></view>
			</view>
		</view>

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
				statusBarHeight: 20, navigationBarHeight: 44,
				tabs: [
					{ key: 'home', label: '首页', icon: 'home', activeIcon: 'home-filled' },
					{ key: 'all', label: '订阅', icon: 'list', activeIcon: 'list' },
					{ key: 'calendar', label: '日历', icon: 'calendar', activeIcon: 'calendar-filled' },
					{ key: 'stats', label: '统计', icon: 'wallet', activeIcon: 'wallet-filled' },
					{ key: 'profile', label: '我的', icon: 'person', activeIcon: 'person-filled' }
				],
				subscriptions: [], settings: createDefaultSettings(),
				subscriptionLimit: 5,
				searchKeyword: '', activeCategory: '全部', activeStatus: 'default', sortMode: 'date', sortSheetVisible: false,
				sortOptions: [
					{ value: 'date', label: '按扣费日期', desc: '即将扣费的订阅排在前面', icon: 'calendar' },
					{ value: 'amount', label: '按金额从高到低', desc: '优先查看支出较高的订阅', icon: 'wallet' },
					{ value: 'created', label: '按添加时间', desc: '最近添加的订阅排在前面', icon: 'compose' }
				],
				weekdays: ['日', '一', '二', '三', '四', '五', '六'], calendarCursor: today.slice(0, 7) + '-01', selectedDate: today,
				statsPeriod: 'month', statPeriods: [{ value: 'month', label: '月均' }, { value: 'year', label: '年度' }, { value: 'next', label: '未来30天' }],
				selectedId: null, editingId: null, formError: '',
				categories: ['影音娱乐', '音乐', '云存储', 'AI 工具', '效率工具', '阅读', '其他'],
				cycles: ['每周', '每月', '每季度', '每半年', '每年', '一次性'],
				payments: ['微信支付', '支付宝', 'App Store', '信用卡', '官网', '其他'], currencies: ['CNY', 'USD', 'HKD', 'JPY'],
				logoColors: ['#16834d', '#3f91ed', '#ef3943', '#e43c86', '#6658d9', '#202622'],
				reminderOptions: [{ value: 14, label: '提前 14 天', desc: '适合年度或高金额订阅' }, { value: 7, label: '提前 7 天', desc: '预留充分处理时间' }, { value: 3, label: '提前 3 天', desc: '默认提醒节点' }, { value: 1, label: '提前 1 天', desc: '临近扣费再次确认' }, { value: 0, label: '扣费当天', desc: '当天站内待办' }],
				serviceTemplates: [
					{ name: '腾讯视频 VIP', short: '腾讯视频', plan: '连续包月', logo: '视', icon: 'videocam-filled', color: '#19a768', category: '影音娱乐', amount: 25, payment: '微信支付' },
					{ name: '网易云音乐黑胶 VIP', short: '网易云', plan: '黑胶 VIP', logo: '音', icon: 'headphones', color: '#ef3943', category: '音乐', amount: 15, payment: '微信支付' },
					{ name: 'iCloud+ 200GB', short: 'iCloud', plan: '200GB', logo: '云', icon: 'cloud-upload-filled', color: '#3f98ee', category: '云存储', amount: 21, payment: 'App Store' },
					{ name: 'ChatGPT Plus', short: 'ChatGPT', plan: 'Plus', logo: 'AI', icon: 'loop', color: '#1f9c70', category: 'AI 工具', amount: 145, payment: '信用卡' }
				],
				form: {}
			}
		},
		computed: {
			todayKey() { return toDateKey(new Date()) },
			showTabBar() { return ['home', 'all', 'calendar', 'stats', 'profile'].includes(this.activeView) },
			isMember() { return this.settings.membership && this.settings.membership.status === 'active' },
			canCreateSubscription() { return this.isMember || this.subscriptions.length < this.subscriptionLimit },
			freeQuotaText() { return this.subscriptions.length >= this.subscriptionLimit ? `免费额度已用完 · 共 ${this.subscriptions.length} 条` : `已使用 ${this.subscriptions.length} / ${this.subscriptionLimit} 个免费名额` },
			freeQuotaValue() { return this.subscriptions.length > this.subscriptionLimit ? `${this.subscriptions.length} 条（已超额度）` : `${this.subscriptions.length} / ${this.subscriptionLimit}` },
			membershipQuotaPercent() { return Math.min(100, this.subscriptions.length / this.subscriptionLimit * 100) },
			selectedSubscription() { return this.subscriptions.find(item => item.id === this.selectedId) || null },
			selectedRenewalHistory() { return this.selectedSubscription ? (this.selectedSubscription.renewalHistory || []).slice().reverse().slice(0, 3) : [] },
			renewalLocked() { const item = this.selectedSubscription; if (!item || !item.lastRenewedBillingDate) return false; return item.lastRenewedBillingDate === item.nextBillingDate },
			activeSubscriptions() { return this.subscriptions.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status)).sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)) },
			next30Subscriptions() { return this.activeSubscriptions.filter(item => daysUntil(item.nextBillingDate) >= 0 && daysUntil(item.nextBillingDate) <= 30) },
			upcoming7() { return this.next30Subscriptions.filter(item => daysUntil(item.nextBillingDate) <= 7) },
			upcoming30Later() { return this.next30Subscriptions.filter(item => daysUntil(item.nextBillingDate) > 7) },
			next30Total() { return this.next30Subscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0) },
			monthlyAverage() { return this.subscriptions.reduce((sum, item) => sum + getMonthlyEquivalent(item), 0) },
			actionableReminders() {
				const list = []
				if (!this.settings.notificationEnabled) list.push({ key: 'notification', tone: 'warning', icon: 'notification', title: '开启续费提醒', desc: '当前只能在小程序内查看到期待办', action: 'notification' })
				const overdue = this.subscriptions.filter(item => !['cancelled','archived','paused'].includes(item.status) && daysUntil(item.nextBillingDate) < 0)
				if (overdue.length) list.push({ key: 'overdue', tone: 'danger', icon: 'info-filled', title: `${overdue.length} 项订阅已逾期未确认`, desc: '请确认是否已完成续费', action: 'overdue' })
				const incomplete = this.subscriptions.filter(item => item.amount === null)
				if (incomplete.length) list.push({ key: 'incomplete', tone: 'info', icon: 'compose', title: `${incomplete.length} 项金额待补充`, desc: '补充后统计结果会更准确', action: 'incomplete' })
				if (!list.length) list.push({ key: 'done', tone: 'success', icon: 'checkbox-filled', title: '订阅状态良好', desc: '当前没有需要立即处理的事项', action: 'none' })
				return list.slice(0, 3)
			},
			categoryFilters() {
				const counts = this.subscriptions.reduce((map, item) => { map[item.category] = (map[item.category] || 0) + 1; return map }, {})
				return [{ name: '全部', count: this.subscriptions.length }].concat(Object.keys(counts).sort().map(name => ({ name, count: counts[name] })))
			},
			statusFilters() { return [{ value: 'all', label: '全部状态' }, { value: 'default', label: '有效订阅' }, { value: 'upcoming', label: '即将到期' }, { value: 'overdue', label: '逾期未确认' }, { value: 'incomplete', label: '金额待补充' }, { value: 'paused', label: '已暂停' }, { value: 'cancelled', label: '已取消' }, { value: 'archived', label: '已归档' }] },
			activeStatusLabel() { return (this.statusFilters.find(item => item.value === this.activeStatus) || {}).label || '全部状态' },
			sortLabel() { return { date: '按扣费日排序', amount: '按金额排序', created: '按创建时间排序' }[this.sortMode] },
			visibleSubscriptions() {
				let list = this.subscriptions.filter(item => this.activeCategory === '全部' || item.category === this.activeCategory)
				if (this.activeStatus === 'default') list = list.filter(item => !['cancelled', 'archived', 'paused'].includes(item.status))
				else if (this.activeStatus === 'incomplete') list = list.filter(item => item.amount === null || item.amount === '')
				else if (this.activeStatus === 'overdue') list = list.filter(item => !['cancelled','archived','paused'].includes(item.status) && daysUntil(item.nextBillingDate) < 0)
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
		onLoad() { this.initNavigationLayout(); this.loadLocalData() },
		onBackPress() {
			if (this.sortSheetVisible) { this.closeSortSheet(); return true }
			if (this.showTabBar) return false
			this.goBackView('home')
			return true
		},
		methods: {
			formatDate, getStatus: getDisplayStatus,
			initNavigationLayout() {
				try {
					const windowInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
					const statusBarHeight = Number(windowInfo.statusBarHeight) || 20
					let navigationBarHeight = 44
					if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
						const menu = uni.getMenuButtonBoundingClientRect()
						const calculatedHeight = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 0
						if (calculatedHeight >= 40 && calculatedHeight <= 56) navigationBarHeight = calculatedHeight
					}
					this.statusBarHeight = statusBarHeight
					this.navigationBarHeight = navigationBarHeight
				} catch (error) {
					this.statusBarHeight = 20
					this.navigationBarHeight = 44
				}
			},
			formatMoney(value) { if (value === null || value === '' || Number.isNaN(Number(value))) return '金额待补充'; return `¥ ${Number(value).toFixed(2)}` },
			compactAmount(value) { const number = Number(value || 0); return number >= 1000 ? `${(number / 1000).toFixed(1)}k` : Math.round(number) },
			daysUntil(dateKey) { return daysUntil(dateKey) },
			statusText(item) { return STATUS_LABELS[getDisplayStatus(item)] },
			decorateItem(item) { return { ...item, shortDate: formatDate(item.nextBillingDate, false), days: daysUntil(item.nextBillingDate), displayStatus: this.statusText(item) } },
			daysText(item) { const days = daysUntil(item.nextBillingDate); return days < 0 ? `已逾期 ${Math.abs(days)} 天` : days === 0 ? '今天扣费' : `${days} 天后` },
			loadLocalData() { const saved = uni.getStorageSync(STORAGE_KEYS.subscriptions), savedSettings = uni.getStorageSync(STORAGE_KEYS.settings); this.subscriptions = Array.isArray(saved) ? saved : createSeedSubscriptions(); this.settings = savedSettings ? { ...createDefaultSettings(), ...savedSettings } : createDefaultSettings(); this.persist() },
			persist() { uni.setStorageSync(STORAGE_KEYS.subscriptions, this.subscriptions); uni.setStorageSync(STORAGE_KEYS.settings, this.settings) },
			navigateToView(view) { if (view === this.activeView) return; this.viewStack.push(this.activeView); this.activeView = view; this.scrollToTop() },
			goBackView(fallback = 'home') { this.activeView = this.viewStack.length ? this.viewStack.pop() : fallback; this.formError = ''; this.scrollToTop() },
			switchTab(tab) { this.sortSheetVisible = false; this.viewStack = []; this.activeView = tab; this.scrollToTop() },
			scrollToTop() { this.scrollTop = this.scrollTop === 0 ? 1 : 0 },
			toggleAmount() { this.settings.amountVisible = !this.settings.amountVisible; this.persist() },
			enableNotification() { uni.showModal({ title: '开启续费提醒', content: '当前未接入后端，将在本地模拟“通知已开启”状态。接入微信订阅消息后需由用户主动授权。', confirmText: '模拟开启', success: res => { if (res.confirm) this.setNotification(true) } }) },
			setNotification(value) { this.settings.notificationEnabled = value; this.persist(); uni.showToast({ title: value ? '提醒状态已开启' : '提醒状态已关闭', icon: 'none' }) },
			updateSetting(key, value) { this.settings[key] = value; this.persist() },
			handleReminder(item) { if (item.action === 'notification') this.enableNotification(); else if (item.action === 'overdue') { this.activeStatus = 'overdue'; this.switchTab('all') } else if (item.action === 'incomplete') { this.activeStatus = 'incomplete'; this.switchTab('all') } },
			chooseSort() { this.sortSheetVisible = true },
			closeSortSheet() { this.sortSheetVisible = false },
			selectSort(value) { this.sortMode = value; this.sortSheetVisible = false },
			resetFilters() { this.searchKeyword = ''; this.activeCategory = '全部'; this.activeStatus = 'default'; this.sortMode = 'date' },
			changeMonth(delta) { const date = parseDate(this.calendarCursor); date.setMonth(date.getMonth() + delta); this.calendarCursor = toDateKey(date).slice(0, 7) + '-01'; this.selectedDate = this.calendarCursor },
			goToday() { this.calendarCursor = this.todayKey.slice(0, 7) + '-01'; this.selectedDate = this.todayKey },
			selectDate(key) { this.selectedDate = key; if (key.slice(0, 7) !== this.calendarCursor.slice(0, 7)) this.calendarCursor = key.slice(0, 7) + '-01' },
			openDetail(item) { this.selectedId = item.id; this.navigateToView('detail') },
			createEmptyForm(date) { return { name: '', plan: '', logo: '订', color: '#16834d', amount: '', currency: this.settings.defaultCurrency, cycle: '每月', nextBillingDate: date || addDays(this.todayKey, 7), payment: '微信支付', category: '其他', status: 'active', autoRenew: true, reminders: this.settings.defaultReminders.slice(), note: '', cancelGuide: '' } },
			openMembership() { this.navigateToView('membership') },
			showMembershipLimit() { uni.showModal({ title: '免费额度已用完', content: `免费版最多保存 ${this.subscriptionLimit} 条订阅，开通会员后可无限新增。`, confirmText: '开通会员', success: res => { if (res.confirm) this.openMembership() } }) },
			openForm(date, item) { if (!item && !this.canCreateSubscription()) { this.showMembershipLimit(); return } this.formError = ''; this.editingId = item ? item.id : null; this.form = item ? { ...item, amount: item.amount === null ? '' : String(item.amount), reminders: (item.reminders || []).slice() } : this.createEmptyForm(date); this.navigateToView('form') },
			applyTemplate(template) { Object.assign(this.form, { ...template, amount: String(template.amount), cycle: '每月' }); uni.showToast({ title: `已选择${template.short}`, icon: 'none' }) },
			toggleReminder(value) { const index = this.form.reminders.indexOf(value); if (index >= 0) this.form.reminders.splice(index, 1); else this.form.reminders.push(value); this.form.reminders.sort((a, b) => b - a) },
			validateForm() { if (!this.form.name) return '请输入服务名称'; if (this.form.name.length > 30) return '服务名称不能超过 30 个字符'; if (this.form.amount === '') return '请输入金额'; if (Number.isNaN(Number(this.form.amount)) || Number(this.form.amount) < 0) return '金额必须是大于或等于 0 的数字'; if (!this.form.nextBillingDate || daysUntil(this.form.nextBillingDate) < 0) return '下次扣费日不能早于今天'; if (!this.form.reminders.length) return '请至少选择一个提醒节点'; return '' },
			saveSubscription(force = false) {
				if (!this.editingId && !this.canCreateSubscription()) { this.showMembershipLimit(); return }
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
				const isEarly = daysUntil(currentBillingDate) > 7
				const isOneOff = item.cycle === '一次性'
				const content = isOneOff
					? `确认 ${formatDate(currentBillingDate)} 已完成付款吗？确认后将自动归档。`
					: isEarly
						? `扣费日为 ${formatDate(currentBillingDate)}，确认已提前完成续费吗？下次扣费日将更新为 ${formatDate(nextBillingDate)}。`
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
				if (action === 'copy') { if (!this.canCreateSubscription()) { this.showMembershipLimit(); return } const copy = { ...item, id: Date.now(), name: `${item.name} 副本`, status: 'active', renewalHistory: [], lastRenewedAt: null, lastRenewedBillingDate: null, createdAt: Date.now() }; this.subscriptions.push(copy); this.persist(); return uni.showToast({ title: '已复制订阅', icon: 'success' }) }
				if (action === 'pause') item.status = 'paused'
				else if (action === 'resume' || action === 'restore') item.status = 'active'
				else if (action === 'archive') item.status = 'archived'
				item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: { pause: '订阅已暂停', resume: '订阅已恢复', restore: '已恢复为有效订阅', archive: '订阅已归档' }[action], icon: 'none' })
			},
			cancelSubscription() { const item = this.selectedSubscription; const guide = item.cancelGuide ? `\n\n取消路径：${item.cancelGuide}` : ''; uni.showModal({ title: `取消“${item.name}”`, content: `确认已在实际付款渠道关闭自动续费吗？此操作只更新清单状态，不会代替你向服务商取消。${guide}`, confirmText: '已完成取消', confirmColor: '#c5444c', success: res => { if (res.confirm) { item.status = 'cancelled'; item.autoRenew = false; item.updatedAt = Date.now(); this.persist(); uni.showToast({ title: '已标记为取消', icon: 'success' }) } } }) },
			deleteSubscription() { const item = this.selectedSubscription; uni.showModal({ title: `删除“${item.name}”`, content: '删除后仅可通过恢复演示数据找回，确定继续吗？', confirmColor: '#c5444c', success: res => { if (res.confirm) { this.subscriptions = this.subscriptions.filter(row => row.id !== item.id); this.persist(); this.selectedId = null; this.switchTab('all'); uni.showToast({ title: '订阅已删除', icon: 'success' }) } } }) },
			nextReminderText(item) { if (!item.reminders || !item.reminders.length) return '未设置'; const days = Math.max(...item.reminders); return `${formatDate(addDays(item.nextBillingDate, -days))} ${this.settings.reminderTime}` },
			openReminderSettings() { this.navigateToView('reminder-settings') },
			activateMembership() { uni.showModal({ title: '本地模拟开通', content: '当前仅修改本地会员状态，不会产生真实扣款。确定开通吗？', confirmText: '确认开通', success: res => { if (res.confirm) { this.settings.membership = { status: 'active', plan: '会员版', startedAt: Date.now() }; this.persist(); uni.showToast({ title: '会员已开通', icon: 'success' }) } } }) },
			restoreFreePlan() { uni.showModal({ title: '恢复免费版', content: '恢复后新增订阅将受 5 条额度限制，已有订阅不会被删除。', confirmText: '确认恢复', success: res => { if (res.confirm) { this.settings.membership = { status: 'free', plan: '免费版', startedAt: null }; this.persist(); uni.showToast({ title: '已恢复免费版', icon: 'none' }) } } }) },
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
	.safe-top { height: 20px; background: $bg; }
	.page-scroll { height: calc(100vh - 20px); }
	.page { box-sizing: border-box; min-height: calc(100vh - var(--status-bar-height)); padding: 0 28rpx 180rpx; background: $bg; }
	.primary-titlebar, .detail-titlebar { height: 88rpx; display: flex; align-items: center; }
	.primary-titlebar { box-sizing: border-box; padding: 0 184rpx 0 8rpx; justify-content: flex-start; }
	.primary-titlebar > view:first-child { flex: 1; min-width: 0; }
	.primary-titlebar > .page-title { transform: translateY(10rpx); }
	.detail-titlebar { position: relative; justify-content: space-between; }.detail-titlebar > .page-title { position: absolute; left: 50%; max-width: 360rpx; transform: translateX(-50%); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.page-title { font-size: 34rpx; line-height: 1.2; font-weight: 750; }
	.home-lead { display: block; margin: 2rpx 0 0 8rpx; color: #707a73; font-size: 22rpx; line-height: 1.4; }
	.icon-button, .summary-eye, .text-button, .month-arrow, .clear-search { margin: 0; padding: 0; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; }
	.icon-button { width: 76rpx; height: 76rpx; border-radius: 50%; background: #fff; box-shadow: 0 6rpx 22rpx rgba(28,52,36,.06); }
	.icon-button.plain { background: transparent; box-shadow: none; }
	.icon-button::after, .summary-eye::after, .text-button::after, .month-arrow::after, .clear-search::after { border: 0; }
	.summary-card { position: relative; overflow: hidden; margin-top: 18rpx; padding: 30rpx 30rpx 32rpx; border-radius: 18rpx; color: #fff; background: linear-gradient(135deg, #087744, #1b9358); box-shadow: 0 12rpx 28rpx rgba(12,113,63,.16); }
	.summary-top { position: relative; z-index: 1; display: flex; align-items: center; font-size: 26rpx; font-weight: 650; }
	.summary-eye { width: 60rpx; height: 48rpx; margin-left: 5rpx; }
	.summary-amount { position: relative; z-index: 1; display: block; min-height: 66rpx; margin: 18rpx 0 16rpx; font-size: 54rpx; line-height: 1.15; font-weight: 780; }
	.summary-meta { position: relative; z-index: 1; display: flex; align-items: center; font-size: 22rpx; opacity: .86; }
	.divider { width: 1rpx; height: 22rpx; margin: 0 20rpx; background: rgba(255,255,255,.42); }
	.summary-spark { position: absolute; right: 24rpx; bottom: 25rpx; width: 150rpx; height: 112rpx; display: flex; align-items: flex-end; justify-content: space-between; opacity: .34; transform: skewY(-16deg); }
	.summary-spark-bar { width: 17rpx; min-height: 12rpx; border-radius: 8rpx 8rpx 2rpx 2rpx; background: rgba(255,255,255,.72); }
	.notice-banner { min-height: 96rpx; margin-top: 20rpx; padding: 16rpx 18rpx; box-sizing: border-box; display: flex; align-items: center; border: 1rpx solid #f1dfc7; border-radius: 16rpx; background: #fff8ef; }
	.notice-icon { width: 56rpx; height: 56rpx; margin-right: 18rpx; border-radius: 15rpx; background: #fee9cd; display: flex; align-items: center; justify-content: center; }
	.notice-copy { flex: 1; min-width: 0; }.notice-title { display: block; color: #825115; font-size: 25rpx; font-weight: 700; }.notice-desc { display: block; margin-top: 5rpx; color: #9b7950; font-size: 20rpx; }.notice-action { flex: 0 0 auto; min-width: 88rpx; height: 56rpx; margin: 0 0 0 12rpx; padding: 0 16rpx; border: 0; border-radius: 28rpx; color: #fff; background: #c67b20; font-size: 21rpx; line-height: 56rpx; }.notice-action::after { border: 0; }
	.section-card, .chart-card, .trend-card, .settings-card, .detail-block, .process-card, .form-card { margin-top: 24rpx; border: 1rpx solid #edf1ee; border-radius: 16rpx; background: #fff; box-shadow: 0 5rpx 18rpx rgba(31,54,39,.035); }
	.section-card { padding: 26rpx 22rpx; }.section-head { display: flex; align-items: center; justify-content: space-between; }.section-title { font-size: 28rpx; font-weight: 750; }.section-caption { color: $muted; font-size: 22rpx; }
	.text-button { min-height: 60rpx; color: $muted; font-size: 23rpx; }.text-button.green { color: $green; font-weight: 650; }
	.group-title { display: flex; align-items: center; margin-top: 22rpx; font-size: 24rpx; font-weight: 700; }.group-title.second { margin-top: 18rpx; }.count-dot { min-width: 29rpx; height: 29rpx; margin-left: 9rpx; border-radius: 15rpx; color: #fff; font-size: 18rpx; line-height: 29rpx; text-align: center; }.count-dot.red { background: #e94b53; }.count-dot.orange { background: #ee923b; }
	.view-more { width: 100%; min-height: 68rpx; margin: 8rpx 0 0; padding: 0; border: 0; color: #737c76; background: transparent; font-size: 23rpx; line-height: 68rpx; }.view-more::after { border: 0; }
	.empty-compact { min-height: 130rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8b938e; font-size: 23rpx; }
	.reminder-card { padding-bottom: 12rpx; }.reminder-row { min-height: 104rpx; display: flex; align-items: center; }.reminder-icon { flex: 0 0 auto; width: 48rpx; height: 48rpx; margin-right: 18rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; }.reminder-icon.warning { background: #e89a43; }.reminder-icon.danger { background: #dd4d55; }.reminder-icon.info { background: #6d91b7; }.reminder-icon.success { background: $green; }.reminder-copy { flex: 1; min-width: 0; }.reminder-title { display: block; font-size: 25rpx; font-weight: 650; }.reminder-desc { display: block; overflow: hidden; margin-top: 5rpx; color: #7f8882; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }
	.primary-button, .secondary-button { min-height: 88rpx; margin: 28rpx 0 0; border-radius: 15rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: 650; }.primary-button { border: 0; color: #fff; background: $green; box-shadow: 0 10rpx 24rpx rgba(14,116,64,.14); }.primary-button::after, .secondary-button::after { border: 0; }.primary-button uni-icons, .secondary-button uni-icons { margin-right: 8rpx; }.secondary-button { border: 1rpx solid #dce4de; color: $text; background: #fff; }
	.search-box { height: 82rpx; margin-top: 12rpx; padding: 0 22rpx; display: flex; align-items: center; border: 1rpx solid #e6ece8; border-radius: 16rpx; background: #fff; }.search-box input { flex: 1; height: 82rpx; margin-left: 14rpx; font-size: 25rpx; }.placeholder { color: #abb2ad; }.clear-search { width: 52rpx; height: 52rpx; }
	.filter-scroll, .status-scroll { width: calc(100% + 56rpx); margin: 20rpx -28rpx 0; white-space: nowrap; }.filter-row, .status-row { display: inline-flex; padding: 0 28rpx; }.filter-pill, .status-pill { min-height: 64rpx; margin: 0 12rpx 0 0; padding: 0 22rpx; border: 1rpx solid #e2e8e4; border-radius: 32rpx; color: #68716b; background: #fff; font-size: 23rpx; line-height: 62rpx; white-space: nowrap; }.filter-pill::after, .status-pill::after { border: 0; }.filter-pill.active, .status-pill.active { border-color: #b9dbc7; color: $deep; background: #eaf6ef; font-weight: 650; }.filter-count { margin-left: 7rpx; font-size: 19rpx; opacity: .75; }.status-scroll { margin-top: 14rpx; }.status-pill { min-height: 56rpx; line-height: 54rpx; background: transparent; }.sort-summary { height: 64rpx; display: flex; align-items: center; color: #929a94; font-size: 21rpx; }.sort-summary text { margin-right: 9rpx; }
	.filter-row, .status-row { flex-wrap: nowrap; }.filter-pill { flex: 0 0 auto; width: auto; min-width: 112rpx; min-height: 72rpx; padding: 0 24rpx; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 24rpx; line-height: 1; }.filter-pill .filter-label, .filter-pill .filter-count { display: inline-block; flex: 0 0 auto; white-space: nowrap; }.filter-pill .filter-count { min-width: 24rpx; margin-left: 9rpx; color: #7e8781; font-size: 20rpx; line-height: 1; text-align: center; opacity: 1; }.filter-pill.active .filter-count { color: #42805f; }.status-pill { flex: 0 0 auto; width: auto; padding: 0 22rpx; display: inline-flex; align-items: center; justify-content: center; line-height: 1; white-space: nowrap; }
	.sort-summary { width: 100%; min-height: 70rpx; margin: 0; padding: 0 4rpx; border: 0; background: transparent; justify-content: space-between; text-align: left; line-height: 1; }.sort-summary::after { border: 0; }.sort-summary > view { display: flex; align-items: center; }.sort-summary text { margin-right: 0; }.sort-summary .sort-divider { margin: 0 10rpx; color: #b1b8b3; }
	.subscription-list { overflow: hidden; margin: 0 -28rpx; background: #fff; }.list-item { min-height: 142rpx; padding: 0 28rpx; display: flex; align-items: center; border-bottom: 1rpx solid $line; }.list-main { flex: 1; min-width: 0; margin-left: 20rpx; }.name-line { display: flex; align-items: center; }.list-name { overflow: hidden; max-width: 70%; font-size: 27rpx; font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }.list-detail, .list-date { display: block; overflow: hidden; margin-top: 7rpx; color: $muted; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }.list-date { color: #919993; }.status-badge { flex: 0 0 auto; margin-left: 10rpx; padding: 4rpx 10rpx; border-radius: 7rpx; font-size: 18rpx; }.status-badge.active { color: #40745a; background: #e9f4ed; }.status-badge.upcoming { color: #b86819; background: #fff0dd; }.status-badge.pending { color: #c3434b; background: #fde8e9; }.status-badge.paused, .status-badge.archived { color: #68716b; background: #edf0ee; }.status-badge.cancelled { color: #7b7f7c; background: #eee; }.status-badge.large { padding: 7rpx 14rpx; font-size: 20rpx; }
	.empty-state { min-height: 540rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }.empty-icon { width: 100rpx; height: 100rpx; margin-bottom: 22rpx; border-radius: 50%; background: #eaf0ec; display: flex; align-items: center; justify-content: center; }.empty-title { font-size: 28rpx; font-weight: 700; }.empty-desc { max-width: 460rpx; margin-top: 12rpx; color: $muted; font-size: 23rpx; line-height: 1.6; text-align: center; }.empty-state .secondary-button { min-height: 72rpx; padding: 0 34rpx; font-size: 24rpx; }
	.float-add { position: fixed; z-index: 15; right: 32rpx; bottom: calc(138rpx + env(safe-area-inset-bottom)); width: 88rpx; height: 88rpx; padding: 0; border: 0; border-radius: 50%; background: $green; display: flex; align-items: center; justify-content: center; box-shadow: 0 12rpx 28rpx rgba(11,105,58,.25); }.float-add::after { border: 0; }
	.month-nav { min-height: 88rpx; margin-top: 12rpx; display: flex; align-items: center; }.month-name { flex: 1; min-width: 0; font-size: 27rpx; font-weight: 700; text-align: center; }.month-arrow { flex: 0 0 auto; width: 70rpx; height: 70rpx; border-radius: 50%; background: #fff; }.today-button { flex: 0 0 auto; min-width: 78rpx; height: 58rpx; margin: 0 0 0 10rpx; padding: 0 16rpx; border: 1rpx solid #cfe1d6; border-radius: 29rpx; color: $deep; background: #edf7f1; font-size: 21rpx; line-height: 56rpx; }.today-button::after { border: 0; }
	.calendar-card { overflow: hidden; border-radius: 18rpx; background: #fff; box-shadow: 0 7rpx 25rpx rgba(31,54,39,.04); }.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }.week-grid { padding: 20rpx 0 10rpx; color: #717a74; font-size: 21rpx; text-align: center; }.dates-grid { padding: 5rpx 8rpx 18rpx; }.date-cell { position: relative; height: 86rpx; margin: 0; padding: 5rpx 0 0; border: 0; border-radius: 12rpx; color: #303832; background: transparent; display: flex; flex-direction: column; align-items: center; line-height: 1; }.date-cell::after { border: 0; }.date-cell.muted { color: #bdc2be; }.day-number { width: 42rpx; height: 42rpx; border-radius: 50%; font-size: 22rpx; line-height: 42rpx; text-align: center; }.date-cell.today .day-number { box-shadow: inset 0 0 0 2rpx #8ec4a5; }.date-cell.selected { background: #edf7f1; }.date-cell.selected .day-number { color: #fff; background: $green; font-weight: 700; }.event-count { position: absolute; top: 2rpx; right: 7rpx; min-width: 26rpx; height: 26rpx; padding: 0 5rpx; border-radius: 13rpx; color: #fff; background: #e64d55; font-size: 16rpx; line-height: 26rpx; text-align: center; }.tiny-price { margin-top: 5rpx; color: #7f8982; font-size: 16rpx; }.calendar-detail { margin-top: 24rpx; padding: 26rpx 24rpx; border-radius: 18rpx; background: #fff; }.detail-heading { display: flex; align-items: center; justify-content: space-between; }.detail-date { font-size: 27rpx; font-weight: 700; }.detail-week { margin-left: 10rpx; color: $muted; font-size: 21rpx; }.detail-total { color: $muted; font-size: 21rpx; }.calendar-subscription { min-height: 112rpx; display: flex; align-items: center; border-bottom: 1rpx solid $line; }.calendar-subscription:last-child { border-bottom: 0; }.item-amount { font-size: 24rpx; font-weight: 700; }.calendar-empty { min-height: 160rpx; }
	.stats-summary { padding: 30rpx 4rpx 22rpx; display: flex; flex-direction: column; }.stats-summary-head { display: flex; align-items: center; justify-content: space-between; }.stats-label { flex: 1; min-width: 0; margin-right: 18rpx; color: $muted; font-size: 22rpx; }.stats-period-switch { flex: 0 0 auto; width: 330rpx; height: 56rpx; padding: 4rpx; box-sizing: border-box; display: flex; border: 1rpx solid #dfe6e1; border-radius: 12rpx; background: #e9eeeb; }.stats-period-switch button { flex: 1; min-width: 0; height: 46rpx; margin: 0; padding: 0 4rpx; border: 0; border-radius: 8rpx; color: #747d77; background: transparent; font-size: 20rpx; line-height: 46rpx; white-space: nowrap; }.stats-period-switch button::after { border: 0; }.stats-period-switch button.active { color: $deep; background: #fff; font-weight: 700; box-shadow: 0 2rpx 7rpx rgba(22,48,31,.07); }.stats-total { margin-top: 14rpx; font-size: 48rpx; font-weight: 800; }.stats-compare { margin-top: 9rpx; color: #868f89; font-size: 21rpx; }.chart-card { margin-top: 8rpx; padding: 28rpx 20rpx; display: flex; align-items: center; }.donut { flex: 0 0 auto; width: 220rpx; height: 220rpx; border-radius: 50%; background: #e7ece8; display: flex; align-items: center; justify-content: center; }.donut-hole { width: 138rpx; height: 138rpx; border-radius: 50%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }.donut-value { font-size: 25rpx; font-weight: 750; }.donut-label { margin-top: 5rpx; color: $muted; font-size: 18rpx; }.legend { flex: 1; min-width: 0; margin-left: 26rpx; }.legend-row { height: 42rpx; display: flex; align-items: center; font-size: 19rpx; }.legend-color { flex: 0 0 auto; width: 12rpx; height: 12rpx; margin-right: 9rpx; border-radius: 50%; }.legend-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.legend-value { width: 92rpx; text-align: right; }.legend-percent { width: 56rpx; color: $muted; text-align: right; }.trend-card { padding: 26rpx 22rpx; }.trend-head { display: flex; align-items: flex-start; justify-content: space-between; }.trend-sub { display: block; margin-top: 6rpx; color: $muted; font-size: 20rpx; }.unit-label { color: #919994; font-size: 18rpx; }.bar-chart { height: 280rpx; margin-top: 26rpx; display: flex; align-items: flex-end; justify-content: space-between; }.bar-column { width: 14%; color: #858e88; font-size: 18rpx; text-align: center; }.bar-value { display: block; height: 30rpx; color: #66706a; font-size: 16rpx; }.bar-track { position: relative; height: 210rpx; margin-bottom: 10rpx; border-radius: 7rpx 7rpx 2rpx 2rpx; background: #eef2ef; }.bar-fill { position: absolute; right: 0; bottom: 0; left: 0; border-radius: 7rpx 7rpx 2rpx 2rpx; background: linear-gradient(180deg, #3cb974, #16834d); }.insight-card { margin-top: 24rpx; padding: 22rpx; display: flex; border: 1rpx solid #d9eadf; border-radius: 16rpx; background: #f0f8f3; }.insight-icon { margin-right: 16rpx; }.insight-title { display: block; font-size: 24rpx; font-weight: 700; }.insight-desc { display: block; margin-top: 7rpx; color: #587062; font-size: 21rpx; line-height: 1.55; }
	.profile-head { min-height: 128rpx; margin-top: 22rpx; padding: 24rpx; box-sizing: border-box; display: flex; align-items: center; border-radius: 20rpx; color: #fff; background: linear-gradient(135deg, #126f43, #238f59); }.avatar { width: 78rpx; height: 78rpx; margin-right: 18rpx; border-radius: 50%; background: rgba(255,255,255,.18); font-size: 31rpx; line-height: 78rpx; text-align: center; }.profile-copy { flex: 1; }.profile-name { display: block; font-size: 28rpx; font-weight: 700; }.profile-sub { display: block; margin-top: 6rpx; font-size: 20rpx; opacity: .75; }.local-badge { padding: 7rpx 12rpx; border-radius: 8rpx; background: rgba(255,255,255,.15); font-size: 18rpx; }.settings-section { margin-top: 30rpx; }.settings-title { margin-left: 6rpx; color: #68716b; font-size: 22rpx; font-weight: 650; }.settings-card { overflow: hidden; margin-top: 12rpx; padding: 0 22rpx; }.setting-row { min-height: 104rpx; display: flex; align-items: center; border-bottom: 1rpx solid $line; }.setting-row:last-child { border-bottom: 0; }.setting-icon { width: 54rpx; height: 54rpx; margin-right: 16rpx; border-radius: 15rpx; display: flex; align-items: center; justify-content: center; }.green-bg { background: #e7f4ec; }.orange-bg { background: #fff0dd; }.blue-bg { background: #e9f2fb; }.violet-bg { background: #efedfb; }.red-bg { background: #fdebed; }.setting-copy { flex: 1; min-width: 0; }.setting-copy text:first-child { display: block; font-size: 25rpx; font-weight: 620; }.setting-copy text:last-child { display: block; overflow: hidden; margin-top: 5rpx; color: $muted; font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }.setting-row switch { transform: scale(.78); transform-origin: right center; }.version-text { display: block; margin-top: 36rpx; color: #9da49f; font-size: 19rpx; text-align: center; }
	.profile-page .profile-head { margin-top: 12rpx; }
	.category-chart-card { display: block; padding: 24rpx 22rpx; }.card-heading { display: flex; align-items: center; justify-content: space-between; }.card-heading > text:last-child { color: $muted; font-size: 20rpx; }.category-chart-body { margin-top: 22rpx; display: flex; align-items: center; }
	.profile-head { min-height: 0; padding: 26rpx 24rpx 24rpx; display: block; border-radius: 18rpx; box-shadow: 0 10rpx 26rpx rgba(14,112,62,.14); }.profile-user-row { display: flex; align-items: center; }.profile-metrics { margin-top: 24rpx; padding-top: 22rpx; display: grid; grid-template-columns: 1fr 1fr; border-top: 1rpx solid rgba(255,255,255,.18); }.profile-metrics > view + view { padding-left: 24rpx; border-left: 1rpx solid rgba(255,255,255,.18); }.profile-metrics text:first-child { display: block; font-size: 19rpx; opacity: .7; }.profile-metrics text:last-child { display: block; margin-top: 7rpx; font-size: 25rpx; font-weight: 700; }
	.search-box { box-shadow: 0 4rpx 14rpx rgba(31,54,39,.025); }.status-pill { min-height: 64rpx; line-height: 62rpx; }.subscription-list { border-top: 1rpx solid #edf1ee; border-bottom: 1rpx solid #edf1ee; }.calendar-card, .calendar-detail { border: 1rpx solid #edf1ee; box-shadow: 0 5rpx 18rpx rgba(31,54,39,.03); }.detail-amount-card { border-radius: 16rpx; box-shadow: 0 10rpx 24rpx rgba(14,112,62,.13); }.detail-grid { border: 1rpx solid #edf1ee; border-radius: 16rpx; }.settings-card, .form-card, .reminder-check-list { border: 1rpx solid #edf1ee; }
	.detail-titlebar { margin: 0 -10rpx; }.icon-spacer { width: 76rpx; }.detail-hero { min-height: 116rpx; display: flex; align-items: center; }.detail-hero-copy { flex: 1; min-width: 0; margin-left: 20rpx; }.detail-name { display: block; font-size: 31rpx; font-weight: 780; }.detail-plan { display: block; margin-top: 6rpx; color: $muted; font-size: 22rpx; }.detail-amount-card { padding: 32rpx 28rpx; border-radius: 20rpx; color: #fff; background: $green; box-shadow: 0 12rpx 28rpx rgba(14,112,62,.16); }.detail-amount-label { display: block; font-size: 22rpx; opacity: .76; }.detail-amount { display: block; margin-top: 10rpx; font-size: 45rpx; font-weight: 800; }.detail-countdown { display: block; margin-top: 9rpx; font-size: 22rpx; opacity: .83; }.detail-grid { margin-top: 22rpx; display: grid; grid-template-columns: 1fr 1fr; border-radius: 18rpx; background: #fff; overflow: hidden; }.detail-grid view { min-height: 96rpx; padding: 20rpx 24rpx; box-sizing: border-box; border-right: 1rpx solid $line; border-bottom: 1rpx solid $line; }.detail-grid view:nth-child(2n) { border-right: 0; }.detail-grid view:nth-child(n+3) { border-bottom: 0; }.detail-grid text:first-child { display: block; color: $muted; font-size: 20rpx; }.detail-grid text:last-child { display: block; margin-top: 7rpx; font-size: 24rpx; font-weight: 650; }.detail-block, .process-card { padding: 26rpx 24rpx; }.block-head { display: flex; justify-content: space-between; }.block-head text:first-child { font-size: 26rpx; font-weight: 700; }.block-head text:last-child { color: $green; font-size: 20rpx; }.reminder-tags { display: flex; flex-wrap: wrap; margin-top: 18rpx; }.reminder-tags text { margin: 0 10rpx 10rpx 0; padding: 8rpx 13rpx; border-radius: 8rpx; color: $deep; background: #e8f5ed; font-size: 20rpx; }.block-note { display: block; margin-top: 7rpx; color: $muted; font-size: 21rpx; }.text-info + .text-info { margin-top: 22rpx; padding-top: 20rpx; border-top: 1rpx solid $line; }.text-info text:first-child { display: block; color: $muted; font-size: 20rpx; }.text-info text:last-child { display: block; margin-top: 7rpx; font-size: 23rpx; line-height: 1.55; }.process-actions { display: flex; margin-top: 22rpx; }.process-button { flex: 1; min-height: 92rpx; margin: 0 10rpx 0 0; padding: 10rpx 4rpx; border: 0; border-radius: 13rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 20rpx; }.process-button:last-child { margin-right: 0; }.process-button::after { border: 0; }.process-button text { margin-top: 7rpx; }.process-button.success { color: #177e4b; background: #eaf6ef; }.process-button.later { color: #9a601b; background: #fff3e4; }.process-button.cancel { color: #bd4048; background: #fcecee; }.detail-bottom { display: flex; }.detail-bottom .secondary-button { flex: .7; margin-right: 16rpx; }.detail-bottom .primary-button { flex: 1; }.manage-button { color: $deep; font-size: 24rpx; }.edit-button { font-size: 27rpx; }
	.process-button.success.processed, .process-button.later.processed { color: #8b9690; background: #edf0ee; opacity: 1; }.process-card.completed { border: 1rpx solid #d5eadc; background: #f1f8f4; }.process-desc { display: block; margin-top: 9rpx; color: $muted; font-size: 21rpx; line-height: 1.5; }.renewal-result { display: flex; align-items: flex-start; }.result-icon { flex: 0 0 auto; width: 54rpx; height: 54rpx; margin-right: 16rpx; border-radius: 50%; background: #dff1e6; display: flex; align-items: center; justify-content: center; }.result-copy { flex: 1; min-width: 0; }.process-note { display: block; margin-top: 8rpx; color: $muted; font-size: 20rpx; line-height: 1.5; }.history-list { margin-top: 14rpx; }.history-row { min-height: 76rpx; display: flex; align-items: center; justify-content: space-between; border-top: 1rpx solid $line; }.history-row > view text:first-child { display: block; font-size: 22rpx; font-weight: 650; }.history-row > view text:last-child { display: block; margin-top: 4rpx; color: $muted; font-size: 19rpx; }.history-row > text { font-size: 22rpx; font-weight: 650; }
	.template-section { margin-top: 18rpx; }.form-section-head { display: flex; align-items: center; justify-content: space-between; }.form-section-head > text:first-child { font-size: 25rpx; font-weight: 700; }.form-section-head > text:last-child { color: $muted; font-size: 20rpx; }.template-scroll { width: calc(100% + 56rpx); margin: 15rpx -28rpx 0; white-space: nowrap; }.template-row { display: inline-flex; padding: 0 28rpx; }.template-chip { width: 142rpx; min-height: 126rpx; margin: 0 14rpx 0 0; padding: 14rpx 8rpx; border: 1rpx solid #e2e9e4; border-radius: 16rpx; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 20rpx; }.template-chip::after { border: 0; }.template-logo { width: 54rpx; height: 54rpx; margin-bottom: 10rpx; border-radius: 14rpx; color: #fff; font-size: 20rpx; font-weight: 750; line-height: 54rpx; text-align: center; }.form-section { margin-top: 28rpx; }.form-section-title { display: block; margin: 0 0 12rpx 6rpx; color: #5f6962; font-size: 22rpx; font-weight: 650; }.form-section-title.no-margin { margin: 0; }.form-card { overflow: hidden; margin-top: 0; padding: 0 22rpx; }.form-row { min-height: 98rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid $line; }.form-row.no-border { border-bottom: 0; }.form-label { flex: 0 0 auto; font-size: 25rpx; font-weight: 620; }.form-label.required::after { margin-left: 4rpx; color: #d84b52; content: '*'; }.form-hint { display: block; margin-top: 5rpx; color: $muted; font-size: 19rpx; font-weight: 400; }.form-input { flex: 1; height: 94rpx; margin-left: 28rpx; font-size: 24rpx; text-align: right; }.form-value { display: flex; align-items: center; color: #68716b; font-size: 24rpx; }.form-value uni-icons { margin-left: 12rpx; }.money-input { display: flex; align-items: center; color: #68716b; }.money-input input { width: 210rpx; height: 94rpx; margin-left: 8rpx; font-size: 25rpx; text-align: right; }.form-row switch { transform: scale(.8); transform-origin: right center; }.color-options { display: flex; }.color-options button { width: 42rpx; height: 42rpx; margin: 0 0 0 12rpx; padding: 0; border: 5rpx solid #fff; border-radius: 50%; box-shadow: 0 0 0 1rpx #dce3de; }.color-options button::after { border: 0; }.color-options button.selected { box-shadow: 0 0 0 3rpx #a7cfb7; }.textarea-row { min-height: 154rpx; align-items: flex-start; padding: 25rpx 0; box-sizing: border-box; }.textarea-row textarea { flex: 1; height: 106rpx; margin-left: 28rpx; font-size: 23rpx; line-height: 1.5; text-align: right; }.reminder-options { display: flex; flex-wrap: wrap; }.reminder-options button { min-height: 64rpx; margin: 0 12rpx 12rpx 0; padding: 0 18rpx; border: 1rpx solid #dfe6e1; border-radius: 11rpx; color: #68716b; background: #fff; font-size: 22rpx; line-height: 62rpx; }.reminder-options button::after { border: 0; }.reminder-options button.selected { border-color: #aad1ba; color: $deep; background: #eaf6ef; font-weight: 650; }.reminder-options button uni-icons { margin-right: 4rpx; }.form-help { display: block; margin-top: 5rpx; color: $muted; font-size: 20rpx; }.form-error { min-height: 76rpx; margin-top: 20rpx; padding: 14rpx 18rpx; box-sizing: border-box; display: flex; align-items: center; border: 1rpx solid #f0cfd2; border-radius: 12rpx; color: #a83a42; background: #fff1f2; font-size: 22rpx; }.form-error uni-icons { margin-right: 10rpx; }.save-button { width: 100%; }
	.settings-intro { margin-top: 24rpx; padding: 24rpx; display: flex; align-items: center; border: 1rpx solid #d5eadc; border-radius: 16rpx; background: #eff8f2; }.settings-intro > uni-icons { margin-right: 17rpx; }.settings-intro text:first-child { display: block; font-size: 24rpx; font-weight: 700; }.settings-intro text:last-child { display: block; margin-top: 6rpx; color: #637269; font-size: 20rpx; }.reminder-check-list { overflow: hidden; margin-top: 24rpx; padding: 0 22rpx; border-radius: 18rpx; background: #fff; }.reminder-check-row { width: 100%; min-height: 104rpx; margin: 0; padding: 0; border: 0; border-bottom: 1rpx solid $line; background: #fff; display: flex; align-items: center; justify-content: space-between; text-align: left; }.reminder-check-row::after { border: 0; }.reminder-check-row > view:first-child text:first-child { display: block; font-size: 25rpx; font-weight: 650; }.reminder-check-row > view:first-child text:last-child { display: block; margin-top: 5rpx; color: $muted; font-size: 20rpx; }.check-box { width: 38rpx; height: 38rpx; border: 2rpx solid #cbd4ce; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }.check-box.checked { border-color: $green; background: $green; }
	.detail-page .detail-hero { padding: 8rpx 4rpx; }.detail-page .detail-amount-card { border-radius: 16rpx; background: linear-gradient(135deg, #137d4b, #20955a); box-shadow: 0 10rpx 24rpx rgba(14,112,62,.13); }.detail-page .detail-grid { border: 1rpx solid #edf1ee; border-radius: 16rpx; }.form-page .form-card, .form-page .reminder-check-list { border-radius: 16rpx; box-shadow: none; }.template-chip { border-radius: 14rpx; box-shadow: 0 4rpx 12rpx rgba(31,54,39,.025); }.empty-state { min-height: 560rpx; }.empty-icon { width: 116rpx; height: 116rpx; border-radius: 24rpx; background: #e8f5ed; box-shadow: inset 0 0 0 1rpx #d9ebdf; }.empty-title { margin-top: 4rpx; font-size: 29rpx; }.empty-desc { color: #6f7972; }.empty-add { min-height: 72rpx; padding: 0 34rpx; font-size: 24rpx; }
	.sheet-mask { position: fixed; z-index: 100; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; justify-content: center; background: rgba(18,27,21,.42); }.sort-sheet { width: 100%; max-width: 750rpx; padding: 0 28rpx calc(24rpx + env(safe-area-inset-bottom)); box-sizing: border-box; border-radius: 24rpx 24rpx 0 0; background: #fff; box-shadow: 0 -16rpx 48rpx rgba(18,36,24,.14); }.sheet-handle { width: 64rpx; height: 7rpx; margin: 14rpx auto 5rpx; border-radius: 4rpx; background: #d9dfdb; }.sheet-head { min-height: 116rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid $line; }.sheet-title { display: block; font-size: 30rpx; font-weight: 750; }.sheet-subtitle { display: block; margin-top: 6rpx; color: $muted; font-size: 21rpx; }.sheet-close { width: 72rpx; height: 72rpx; margin: 0; padding: 0; border: 0; border-radius: 50%; background: #f1f4f2; display: flex; align-items: center; justify-content: center; }.sheet-close::after { border: 0; }.sort-options { padding-top: 10rpx; }.sort-option { width: 100%; min-height: 112rpx; margin: 0; padding: 0 14rpx; border: 0; border-radius: 12rpx; background: #fff; display: flex; align-items: center; text-align: left; }.sort-option::after { border: 0; }.sort-option.active { background: #f0f8f3; }.sort-option-icon { flex: 0 0 auto; width: 66rpx; height: 66rpx; margin-right: 18rpx; border-radius: 14rpx; background: #f0f3f1; display: flex; align-items: center; justify-content: center; }.sort-option.active .sort-option-icon { background: #dff1e6; }.sort-option-copy { flex: 1; min-width: 0; }.sort-option-copy text:first-child { display: block; color: $text; font-size: 25rpx; font-weight: 650; }.sort-option-copy text:last-child { display: block; margin-top: 6rpx; color: $muted; font-size: 20rpx; }.sort-check { flex: 0 0 auto; width: 38rpx; height: 38rpx; margin-left: 16rpx; border: 2rpx solid #cbd4ce; border-radius: 50%; display: flex; align-items: center; justify-content: center; }.sort-check.checked { border-color: $green; background: $green; }
	.bottom-space { height: 20rpx; }.tab-bar { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; width: 100%; max-width: 750rpx; height: calc(112rpx + env(safe-area-inset-bottom)); margin: 0 auto; padding: 10rpx 12rpx env(safe-area-inset-bottom); box-sizing: border-box; display: flex; border-top: 1rpx solid #e9eeea; background: rgba(255,255,255,.98); box-shadow: 0 -7rpx 24rpx rgba(25,45,31,.04); }.tab-item { flex: 1; height: 92rpx; margin: 0; padding: 7rpx 0 3rpx; border: 0; border-radius: 12rpx; color: #8e9690; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 19rpx; line-height: 1.2; }.tab-item::after { border: 0; }.tab-item text { margin-top: 7rpx; }.tab-item.active { color: $green; font-weight: 700; }
	/* ── 首页 ── */
	.home-page { padding: 0 24rpx 180rpx; }

	/* 标题 */
	.home-page .primary-titlebar { padding: 0 184rpx 0 4rpx; }
	.home-page .page-title { font-size: 38rpx; font-weight: 800; letter-spacing: -0.5rpx; color: #111a14; }
	.home-lead { margin: 0rpx 0 0 4rpx; color: #8a9590; font-size: 23rpx; }

	/* 汇总卡片 */
	.summary-card {
		margin-top: 20rpx; padding: 32rpx 32rpx 36rpx;
		border-radius: 24rpx;
		background: linear-gradient(145deg, #0a7f4e 0%, #12a060 55%, #1db870 100%);
		box-shadow: 0 16rpx 40rpx rgba(10,120,70,.22), 0 4rpx 12rpx rgba(10,120,70,.12);
	}
	.summary-top { font-size: 24rpx; font-weight: 580; opacity: .88; }
	.summary-eye { opacity: .88; }
	.summary-amount {
		margin: 14rpx 0 14rpx;
		font-size: 60rpx; font-weight: 800; letter-spacing: -1rpx;
		text-shadow: 0 2rpx 8rpx rgba(0,0,0,.1);
	}
	.summary-meta { font-size: 23rpx; opacity: .82; }
	.summary-spark {
		right: 28rpx; bottom: 28rpx; width: 160rpx; height: 120rpx;
		opacity: .28; transform: skewY(-14deg);
	}
	.summary-spark-bar { width: 20rpx; border-radius: 10rpx 10rpx 3rpx 3rpx; }

	/* 通知横幅 */
	.notice-banner {
		margin-top: 18rpx; padding: 18rpx 20rpx;
		border: 1.5rpx solid #f5dfc5; border-radius: 18rpx;
		background: linear-gradient(90deg, #fffaf3, #fff8ee);
		box-shadow: 0 4rpx 14rpx rgba(200,120,20,.06);
	}
	.notice-icon { width: 60rpx; height: 60rpx; border-radius: 16rpx; background: #fde8c8; }
	.notice-title { font-size: 26rpx; }
	.notice-desc { font-size: 21rpx; }
	.notice-action { height: 60rpx; border-radius: 30rpx; font-size: 22rpx; font-weight: 660; background: #c97a1c; }

	/* 通用卡片覆盖 */
	.home-page .section-card {
		margin-top: 20rpx; padding: 24rpx 24rpx 8rpx;
		border: 1.5rpx solid #edf1ee; border-radius: 20rpx;
		box-shadow: 0 6rpx 22rpx rgba(31,54,39,.04);
	}
	.section-head { margin-bottom: 4rpx; }
	.section-title { font-size: 29rpx; font-weight: 760; color: #111a14; }
	.text-button { font-size: 23rpx; color: #8a9590; display: flex; align-items: center; }

	/* 分组标题 */
	.group-title {
		margin-top: 20rpx; margin-bottom: 4rpx;
		font-size: 22rpx; font-weight: 680; color: #6a7670; letter-spacing: 0.3rpx;
	}
	.group-title.second { margin-top: 16rpx; }
	.count-dot {
		min-width: 32rpx; height: 32rpx; margin-left: 10rpx;
		border-radius: 16rpx; font-size: 18rpx; line-height: 32rpx;
	}

	/* 查看更多 */
	.view-more {
		min-height: 72rpx; margin-top: 4rpx;
		color: #16834d; font-size: 23rpx; font-weight: 620;
	}

	/* 待处理卡片 */
	.home-page .reminder-card {
		padding: 24rpx 24rpx 16rpx; border-radius: 20rpx;
	}
	.reminder-row { min-height: 96rpx; padding: 4rpx 0; border-bottom: 1rpx solid #f0f4f1; }
	.reminder-row:last-child { border-bottom: 0; }
	.reminder-icon {
		width: 52rpx; height: 52rpx; margin-right: 20rpx; border-radius: 14rpx;
		box-shadow: 0 3rpx 8rpx rgba(0,0,0,.1);
	}
	.reminder-icon.warning { background: linear-gradient(135deg, #f0a845, #e88c28); }
	.reminder-icon.danger  { background: linear-gradient(135deg, #f05f66, #d94049); }
	.reminder-icon.info    { background: linear-gradient(135deg, #7aa8d4, #5a8cbd); }
	.reminder-icon.success { background: linear-gradient(135deg, #2ab870, #16834d); }
	.reminder-title { font-size: 26rpx; font-weight: 660; color: #111a14; }
	.reminder-desc  { font-size: 22rpx; color: #8a9590; margin-top: 6rpx; }

	/* 新增订阅按钮 */
	.home-add {
		margin-top: 28rpx; height: 88rpx; border-radius: 44rpx;
		font-size: 28rpx; font-weight: 720; letter-spacing: 1rpx;
		background: linear-gradient(135deg, #18934f, #16834d);
		box-shadow: 0 12rpx 28rpx rgba(14,116,64,.22);
	}

	/* ── 订阅列表页 ── */
	.list-page { padding: 0 24rpx 180rpx; }
	.list-page .page-title { font-size: 36rpx; font-weight: 800; letter-spacing: -0.5rpx; }
	.search-box {
		height: 86rpx; margin-top: 16rpx; padding: 0 24rpx;
		border: 1.5rpx solid #e8eee9; border-radius: 18rpx;
		background: #fff; box-shadow: 0 4rpx 16rpx rgba(31,54,39,.04);
	}
	.search-box input { font-size: 26rpx; }
	.filter-scroll, .status-scroll { width: calc(100% + 48rpx); margin: 18rpx -24rpx 0; }
	.filter-row, .status-row { padding: 0 24rpx; }
	.filter-pill {
		min-height: 68rpx; padding: 0 24rpx;
		border: 1.5rpx solid #e4ebe6; border-radius: 34rpx;
		font-size: 24rpx; font-weight: 560;
		box-shadow: 0 2rpx 8rpx rgba(31,54,39,.04);
	}
	.filter-pill.active {
		border-color: #16834d; color: #0f6f40; background: #eaf6ef;
		font-weight: 680; box-shadow: 0 2rpx 10rpx rgba(22,131,77,.1);
	}
	.status-pill { min-height: 60rpx; padding: 0 22rpx; border-radius: 30rpx; font-size: 23rpx; }
	.status-pill.active { border-color: #16834d; color: #0f6f40; background: #eaf6ef; font-weight: 680; }
	.sort-summary { min-height: 68rpx; font-size: 22rpx; color: #8a9590; }
	.subscription-list { margin: 0; border-radius: 20rpx; overflow: hidden; border: 1.5rpx solid #edf1ee; box-shadow: 0 4rpx 16rpx rgba(31,54,39,.04); }
	.list-item { min-height: 148rpx; padding: 0 28rpx; border-bottom-color: #f0f4f1; }
	.list-name { font-size: 28rpx; font-weight: 700; }
	.list-detail { font-size: 22rpx; margin-top: 8rpx; }
	.list-date { font-size: 21rpx; color: #8a9590; }
	.status-badge { border-radius: 8rpx; font-size: 19rpx; font-weight: 580; }
	.status-badge.active  { color: #177e4b; background: #e6f5ec; }
	.status-badge.upcoming { color: #b36215; background: #fff1de; }
	.status-badge.pending { color: #c03641; background: #fde6e7; }
	.float-add {
		right: 28rpx; bottom: calc(136rpx + env(safe-area-inset-bottom));
		width: 96rpx; height: 96rpx; border-radius: 48rpx;
		background: linear-gradient(135deg, #18934f, #16834d);
		box-shadow: 0 14rpx 32rpx rgba(11,105,58,.28);
	}
	.empty-state { min-height: 560rpx; }
	.empty-icon { width: 120rpx; height: 120rpx; border-radius: 28rpx; background: #e8f5ed; box-shadow: 0 4rpx 16rpx rgba(22,131,77,.1); }
	.empty-title { font-size: 30rpx; font-weight: 760; margin-top: 6rpx; }
	.empty-desc { font-size: 24rpx; color: #8a9590; line-height: 1.65; }

	/* ── 日历页 ── */
	.calendar-page { padding: 0 24rpx 180rpx; }
	.calendar-page .page-title { font-size: 36rpx; font-weight: 800; }
	.month-nav { min-height: 92rpx; margin-top: 8rpx; }
	.month-name { font-size: 30rpx; font-weight: 760; }
	.month-arrow {
		width: 72rpx; height: 72rpx; border-radius: 50%;
		background: #fff; border: 1.5rpx solid #edf1ee;
		box-shadow: 0 3rpx 10rpx rgba(31,54,39,.06);
	}
	.today-button {
		height: 62rpx; padding: 0 20rpx;
		border: 1.5rpx solid #b8d9c6; border-radius: 31rpx;
		color: #0f6f40; background: #eaf6ef;
		font-size: 22rpx; font-weight: 640;
		box-shadow: 0 2rpx 8rpx rgba(22,131,77,.08);
	}
	.calendar-card {
		border-radius: 22rpx; border: 1.5rpx solid #edf1ee;
		box-shadow: 0 6rpx 24rpx rgba(31,54,39,.05);
	}
	.week-grid { padding: 22rpx 0 12rpx; font-size: 22rpx; color: #8a9590; font-weight: 600; }
	.dates-grid { padding: 6rpx 10rpx 20rpx; }
	.date-cell { height: 90rpx; border-radius: 14rpx; }
	.day-number { width: 46rpx; height: 46rpx; border-radius: 50%; font-size: 24rpx; font-weight: 560; line-height: 46rpx; }
	.date-cell.today .day-number { box-shadow: inset 0 0 0 2.5rpx #16834d; color: #0f6f40; font-weight: 700; }
	.date-cell.selected { background: #eaf6ef; }
	.date-cell.selected .day-number { background: linear-gradient(135deg, #18934f, #16834d); font-weight: 780; }
	.event-count { min-width: 28rpx; height: 28rpx; border-radius: 14rpx; font-size: 17rpx; line-height: 28rpx; background: #e84d55; }
	.tiny-price { font-size: 17rpx; color: #8a9590; margin-top: 4rpx; }
	.calendar-detail {
		margin-top: 20rpx; padding: 28rpx 26rpx;
		border-radius: 22rpx; border: 1.5rpx solid #edf1ee;
		background: #fff; box-shadow: 0 6rpx 22rpx rgba(31,54,39,.04);
	}
	.detail-date { font-size: 29rpx; font-weight: 760; }
	.detail-week { font-size: 22rpx; }
	.detail-total { font-size: 22rpx; font-weight: 620; color: #16834d; }
	.calendar-subscription { min-height: 116rpx; border-bottom-color: #f0f4f1; }
	.item-amount { font-size: 26rpx; font-weight: 740; color: #111a14; }
	.calendar-empty { min-height: 170rpx; }

	/* ── 统计页 ── */
	.stats-page { padding: 0 24rpx 180rpx; }
	.stats-page .page-title { font-size: 36rpx; font-weight: 800; }
	.stats-summary { padding: 24rpx 4rpx 18rpx; }
	.stats-label { font-size: 23rpx; color: #8a9590; }
	.stats-period-switch {
		width: 340rpx; height: 60rpx; padding: 5rpx;
		border: 1.5rpx solid #dce4de; border-radius: 14rpx; background: #eaeeeb;
	}
	.stats-period-switch button { height: 48rpx; border-radius: 10rpx; font-size: 21rpx; line-height: 48rpx; }
	.stats-period-switch button.active { color: #0f6f40; font-weight: 760; box-shadow: 0 3rpx 10rpx rgba(22,48,31,.09); }
	.stats-total { font-size: 52rpx; font-weight: 820; letter-spacing: -1rpx; color: #111a14; }
	.stats-compare { font-size: 22rpx; color: #8a9590; }
	.chart-card { margin-top: 16rpx; padding: 28rpx 24rpx; border: 1.5rpx solid #edf1ee; border-radius: 22rpx; box-shadow: 0 6rpx 22rpx rgba(31,54,39,.04); }
	.card-heading > text:first-child { font-size: 28rpx; font-weight: 760; color: #111a14; }
	.donut { width: 230rpx; height: 230rpx; box-shadow: 0 4rpx 16rpx rgba(31,54,39,.06); }
	.donut-hole { width: 144rpx; height: 144rpx; }
	.donut-value { font-size: 26rpx; font-weight: 760; }
	.donut-label { font-size: 19rpx; color: #8a9590; }
	.legend-row { height: 46rpx; font-size: 20rpx; }
	.legend-color { width: 14rpx; height: 14rpx; border-radius: 4rpx; }
	.trend-card { border: 1.5rpx solid #edf1ee; border-radius: 22rpx; box-shadow: 0 6rpx 22rpx rgba(31,54,39,.04); padding: 28rpx 24rpx; }
	.trend-card .section-title { font-size: 28rpx; font-weight: 760; color: #111a14; }
	.trend-sub { font-size: 21rpx; color: #8a9590; }
	.bar-chart { height: 300rpx; margin-top: 28rpx; }
	.bar-track { height: 220rpx; background: #eef3ef; border-radius: 8rpx 8rpx 3rpx 3rpx; }
	.bar-fill { background: linear-gradient(180deg, #2dcc78, #16834d); border-radius: 8rpx 8rpx 3rpx 3rpx; }
	.bar-value { font-size: 17rpx; color: #6a7670; }
	.insight-card {
		margin-top: 20rpx; padding: 24rpx;
		border: 1.5rpx solid #c8e5d4; border-radius: 18rpx;
		background: linear-gradient(90deg, #eef8f3, #f5fbf7);
	}
	.insight-title { font-size: 26rpx; font-weight: 720; }
	.insight-desc { font-size: 22rpx; line-height: 1.6; color: #4e6e5a; }

	/* ── 详情页 ── */
	.detail-page { padding: 0 24rpx 200rpx; }
	.detail-page .detail-titlebar { margin: 0 -6rpx; }
	.icon-button {
		width: 80rpx; height: 80rpx; border-radius: 50%;
		background: #fff; border: 1.5rpx solid #edf1ee;
		box-shadow: 0 4rpx 14rpx rgba(31,54,39,.07);
	}
	.icon-button.plain { background: transparent; border: 0; box-shadow: none; }

	/* Hero 区：logo + 名称 + 状态角标 */
	.detail-page .detail-hero {
		min-height: 0; padding: 18rpx 0 22rpx;
		display: flex; align-items: center;
	}
	.detail-hero-copy { margin-left: 22rpx; }
	.detail-name { font-size: 36rpx; font-weight: 820; letter-spacing: -0.5rpx; color: #0d1710; }
	.detail-plan { font-size: 24rpx; color: #8a9590; margin-top: 8rpx; font-weight: 500; }
	.detail-page .status-badge.large {
		align-self: flex-start; margin-top: 4rpx;
		padding: 8rpx 16rpx; border-radius: 10rpx;
		font-size: 21rpx; font-weight: 640;
	}

	/* 金额卡 */
	.detail-amount-card {
		padding: 36rpx 32rpx 34rpx; border-radius: 24rpx;
		background: linear-gradient(145deg, #0a7f4e 0%, #12a060 55%, #1db870 100%);
		box-shadow: 0 18rpx 44rpx rgba(10,120,70,.24), 0 4rpx 14rpx rgba(10,120,70,.12);
		position: relative; overflow: hidden;
	}
	.detail-amount-card::after {
		content: ''; position: absolute;
		right: -30rpx; top: -30rpx;
		width: 200rpx; height: 200rpx; border-radius: 50%;
		background: rgba(255,255,255,.07); pointer-events: none;
	}
	.detail-amount-label {
		font-size: 23rpx; font-weight: 580; opacity: .84;
		letter-spacing: 0.3rpx;
	}
	.detail-amount {
		font-size: 54rpx; font-weight: 840; letter-spacing: -1.5rpx;
		margin-top: 14rpx;
		text-shadow: 0 2rpx 10rpx rgba(0,0,0,.1);
	}
	.detail-countdown {
		font-size: 23rpx; opacity: .88; margin-top: 12rpx;
		font-weight: 520; letter-spacing: 0.2rpx;
	}

	/* 信息网格 */
	.detail-grid {
		margin-top: 20rpx; border: 1.5rpx solid #edf1ee; border-radius: 22rpx;
		box-shadow: 0 4rpx 16rpx rgba(31,54,39,.05); overflow: hidden;
	}
	.detail-grid view {
		min-height: 104rpx; padding: 22rpx 28rpx;
		border-right-color: #f0f4f1; border-bottom-color: #f0f4f1;
	}
	.detail-grid text:first-child { font-size: 21rpx; color: #8a9590; letter-spacing: 0.2rpx; }
	.detail-grid text:last-child  { font-size: 27rpx; font-weight: 700; margin-top: 8rpx; color: #0d1710; }

	/* 通用 block 卡片 */
	.detail-block, .process-card {
		padding: 28rpx 28rpx 26rpx;
		border: 1.5rpx solid #edf1ee; border-radius: 22rpx;
		box-shadow: 0 4rpx 16rpx rgba(31,54,39,.04);
		background: #fff;
	}
	.block-head { margin-bottom: 4rpx; }
	.block-head text:first-child { font-size: 28rpx; font-weight: 760; color: #0d1710; }
	.block-head text:last-child  { font-size: 21rpx; color: #16834d; font-weight: 620; }

	/* 提醒标签 */
	.reminder-tags { margin-top: 20rpx; gap: 10rpx; }
	.reminder-tags text {
		font-size: 21rpx; padding: 9rpx 18rpx; border-radius: 12rpx;
		font-weight: 600; color: #0f6f40; background: #e6f5ec;
		border: 1rpx solid #c8e5d4;
	}
	.block-note { font-size: 22rpx; color: #8a9590; margin-top: 12rpx; line-height: 1.5; }

	/* 续费记录 */
	.history-row { min-height: 80rpx; padding: 4rpx 0; }
	.history-row > view text:first-child { font-size: 23rpx; font-weight: 680; color: #0d1710; }
	.history-row > view text:last-child  { font-size: 20rpx; color: #8a9590; margin-top: 5rpx; }
	.history-row > text { font-size: 23rpx; font-weight: 720; color: #0f6f40; }

	/* 处理卡 */
		.process-card { margin-top: 20rpx; }
		.process-card > text.section-title { font-size: 28rpx; font-weight: 760; color: #0d1710; }
		.process-desc { margin-top: 10rpx; font-size: 22rpx; color: #8a9590; line-height: 1.55; }
		.process-actions { margin-top: 20rpx; gap: 12rpx; justify-content: flex-start; }
		.process-button {
			flex: 1; min-width: 0; min-height: 64rpx; padding: 0 24rpx; border-radius: 32rpx;
			font-size: 22rpx; font-weight: 660;
			box-shadow: none; flex-direction: row;
		}
		.process-button text { margin-top: 0; margin-left: 8rpx; }
		.process-button.success {
			color: #0f6f40; background: #e8f5ed;
			border: 1.5rpx solid #c0e4cf;
		}
		.process-button.early {
			width: 100%; box-sizing: border-box;
			color: #8a9590; background: #f4f7f5;
			border: 1.5rpx solid #e0e6e2;
			font-weight: 580; margin-top: 12rpx;
		}
	.process-card.completed {
		border-color: #c0e5d0; background: linear-gradient(135deg, #f0f8f4, #f7fbf8);
	}
	.result-icon {
		width: 58rpx; height: 58rpx; border-radius: 50%;
		background: linear-gradient(135deg, #d8f0e4, #e8f7ee);
		border: 1.5rpx solid #b8dfc8;
		box-shadow: 0 4rpx 12rpx rgba(22,131,77,.1);
	}
	.result-copy .section-title { font-size: 27rpx; font-weight: 740; color: #0d1710; }
	.process-note { margin-top: 8rpx; font-size: 21rpx; color: #8a9590; line-height: 1.55; }
	.process-countdown {
		min-height: 72rpx; display: flex; align-items: center;
		color: #8a9590; font-size: 23rpx; font-weight: 560;
	}
	.process-countdown uni-icons { margin-right: 12rpx; flex-shrink: 0; }

	/* 底部操作栏 */
	.detail-bottom {
		margin-top: 28rpx; gap: 16rpx;
	}
	.detail-bottom .secondary-button {
		border-color: #dce4de; border-radius: 18rpx; font-size: 25rpx; font-weight: 640;
		background: #fff; color: #0f6f40;
		box-shadow: 0 4rpx 14rpx rgba(31,54,39,.06);
	}
	.detail-bottom .primary-button {
		border-radius: 18rpx; font-size: 27rpx; font-weight: 720;
		background: linear-gradient(135deg, #18934f, #16834d);
		box-shadow: 0 10rpx 26rpx rgba(14,116,64,.2);
	}
	.manage-button uni-icons { margin-right: 9rpx; }
		.edit-button uni-icons   { margin-right: 9rpx; }

		/* ── 会员中心 ── */
		.membership-entry {
			width: 100%; margin: 18rpx 0 0; padding: 22rpx;
			box-sizing: border-box; border: 1.5rpx solid #efd8ad; border-radius: 20rpx;
			background: linear-gradient(135deg, #fffdf6, #fff8e8); text-align: left;
			box-shadow: 0 6rpx 18rpx rgba(143,91,24,.08);
		}
		.membership-entry.active { border-color: #b8ddc8; background: linear-gradient(135deg, #f6fcf8, #edf8f1); box-shadow: 0 6rpx 18rpx rgba(26,132,79,.08); }
		.membership-entry-pressed { opacity: .88; transform: scale(.995); }
		.membership-entry-head { display: flex; align-items: center; }
		.membership-icon {
			flex: 0 0 auto; width: 58rpx; height: 58rpx; margin-right: 18rpx;
			border-radius: 16rpx;
			background: linear-gradient(135deg, #d4921e, #c07a10);
			display: flex; align-items: center; justify-content: center;
			box-shadow: 0 4rpx 10rpx rgba(180,110,20,.2);
		}
		.membership-entry.active .membership-icon { background: linear-gradient(135deg, #1a9358, #16834d); box-shadow: 0 4rpx 10rpx rgba(22,131,77,.2); }
		.membership-copy { flex: 1; min-width: 0; }
		.membership-kicker { display: block; color: #9b7a42; font-size: 18rpx; font-weight: 680; letter-spacing: .4rpx; }
		.membership-title { display: block; margin-top: 3rpx; color: #3e2b12; font-size: 28rpx; font-weight: 740; }
		.membership-entry.active .membership-title { color: #0d5e34; }
		.membership-desc { display: block; margin-top: 5rpx; color: #876a42; font-size: 20rpx; line-height: 1.35; }
		.membership-entry.active .membership-desc { color: #4e7060; }
		.membership-arrow { flex: 0 0 auto; margin-left: 10rpx; }
		.membership-quota { margin-top: 20rpx; padding-top: 18rpx; border-top: 1rpx solid rgba(180,134,49,.16); }
		.membership-quota-line { display: flex; justify-content: space-between; color: #8a6c39; font-size: 19rpx; }
		.membership-progress { height: 10rpx; margin-top: 9rpx; overflow: hidden; border-radius: 10rpx; background: #f4e8c9; }
		.membership-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #d69b2b, #c27b0e); }
		.membership-benefits { display: flex; justify-content: space-between; margin-top: 15rpx; color: #86672e; font-size: 18rpx; }
		.membership-benefits text { display: flex; align-items: center; white-space: nowrap; }
		.membership-benefits uni-icons { margin-right: 3rpx; }

		/* 会员中心页 */
		.membership-page { padding: 0 24rpx 100rpx; }
		.membership-page .detail-titlebar { margin: 0 -6rpx; }

		/* Hero 卡片 */
		.membership-hero {
			position: relative; overflow: hidden;
			margin-top: 8rpx; padding: 36rpx 30rpx 32rpx;
			border-radius: 24rpx;
			background: linear-gradient(145deg, #f0c040 0%, #e8a820 45%, #d49018 100%);
			box-shadow: 0 18rpx 44rpx rgba(180,120,20,.22), 0 4rpx 12rpx rgba(180,120,20,.12);
		}
		.membership-hero.active {
			background: linear-gradient(145deg, #f0c040 0%, #e8a820 45%, #d49018 100%);
		}
		/* 装饰光晕 */
		.membership-hero-deco {
			position: absolute; pointer-events: none;
			right: -60rpx; top: -60rpx;
			width: 260rpx; height: 260rpx; border-radius: 50%;
			background: rgba(255,255,255,.12);
		}
		.membership-hero-deco2 {
			position: absolute; pointer-events: none;
			left: -40rpx; bottom: -50rpx;
			width: 180rpx; height: 180rpx; border-radius: 50%;
			background: rgba(255,255,255,.07);
		}

		.membership-hero-top { position: relative; z-index: 1; display: flex; align-items: flex-start; }
		.membership-hero-icon {
			flex: 0 0 auto; width: 80rpx; height: 80rpx; margin-right: 20rpx;
			border-radius: 22rpx;
			background: rgba(255,255,255,.9);
			display: flex; align-items: center; justify-content: center;
			box-shadow: 0 6rpx 16rpx rgba(140,80,10,.16);
		}
		.membership-hero-copy { flex: 1; min-width: 0; }
		.membership-hero-tag {
			display: block; margin-bottom: 7rpx;
			color: rgba(100,60,10,.7); font-size: 20rpx; font-weight: 680; letter-spacing: 0.5rpx;
		}
		.membership-hero-title {
			display: block; font-size: 36rpx; font-weight: 840; color: #3a2508;
			letter-spacing: -0.5rpx; line-height: 1.2;
		}
		.membership-hero-desc {
			display: block; margin-top: 9rpx;
			font-size: 22rpx; line-height: 1.55; color: #6b4c1c;
		}

		/* Hero 权益三格 */
		.hero-benefits {
			position: relative; z-index: 1;
			margin-top: 28rpx; padding-top: 24rpx;
			display: grid; grid-template-columns: repeat(3, 1fr);
			border-top: 1rpx solid rgba(140,80,10,.14);
		}
		.hero-benefit-item {
			min-width: 0; padding: 0 8rpx;
			display: flex; flex-direction: column; align-items: center;
			position: relative;
		}
		.hero-benefit-item + .hero-benefit-item::before {
			content: ''; position: absolute; top: 10rpx; bottom: 4rpx; left: 0;
			width: 1rpx; background: rgba(140,80,10,.14);
		}
		.hero-benefit-icon {
			width: 56rpx; height: 56rpx; border-radius: 16rpx;
			background: rgba(255,255,255,.32);
			display: flex; align-items: center; justify-content: center;
		}
		.hero-benefit-label {
			display: block; margin-top: 10rpx;
			color: #3a2508; font-size: 22rpx; font-weight: 720; text-align: center;
		}
		.hero-benefit-sub {
			display: block; margin-top: 4rpx;
			color: #7a5628; font-size: 18rpx; line-height: 1.35; text-align: center;
		}

		/* CTA 按钮（非会员） */
		.membership-cta {
			width: 100%; min-height: 96rpx; margin-top: 28rpx; padding: 0 28rpx;
			border: 0; border-radius: 20rpx;
			background: linear-gradient(135deg, #1a9a58, #16834d);
			box-shadow: 0 14rpx 36rpx rgba(14,112,62,.22);
			display: flex; align-items: center; justify-content: center;
		}
		.membership-cta::after { border: 0; }
		.membership-cta-inner { width: 100%; display: flex; align-items: center; }
		.membership-cta-copy { flex: 1; min-width: 0; margin: 0 14rpx; text-align: left; }
		.membership-cta-main { display: block; color: #fff; font-size: 28rpx; font-weight: 760; line-height: 1.2; }
		.membership-cta-sub { display: block; margin-top: 5rpx; color: rgba(255,255,255,.72); font-size: 19rpx; font-weight: 480; }

		/* 权益列表 */
		.membership-section { margin-top: 32rpx; }
		.membership-section-title {
			display: block; margin: 0 2rpx 14rpx;
			color: #111a14; font-size: 28rpx; font-weight: 780; letter-spacing: -0.3rpx;
		}
		.benefit-list {
			overflow: hidden; padding: 0 24rpx;
			border: 1.5rpx solid #edf1ee; border-radius: 20rpx; background: #fff;
			box-shadow: 0 6rpx 20rpx rgba(31,54,39,.04);
		}
		.benefit-row {
			min-height: 104rpx; display: flex; align-items: center;
			border-bottom: 1rpx solid #f0f4f1;
		}
		.benefit-row.no-border { border-bottom: 0; }
		.benefit-icon-wrap {
			flex: 0 0 auto; width: 56rpx; height: 56rpx; margin-right: 18rpx;
			border-radius: 16rpx; display: flex; align-items: center; justify-content: center;
		}
		.benefit-icon-wrap.gold { background: linear-gradient(135deg, #fde8b8, #faf0d4); }
		.benefit-icon-wrap.green { background: linear-gradient(135deg, #d8f2e5, #e8f7ee); }
		.benefit-copy { flex: 1; min-width: 0; }
		.benefit-name { display: block; font-size: 26rpx; font-weight: 660; color: #111a14; }
		.benefit-desc { display: block; margin-top: 5rpx; font-size: 20rpx; color: #8a9590; line-height: 1.4; }
		.benefit-badge {
			flex: 0 0 auto; margin-left: 12rpx;
			padding: 6rpx 14rpx; border-radius: 20rpx;
			font-size: 18rpx; font-weight: 640;
		}
		.benefit-badge.member { color: #a06010; background: #fef3d8; border: 1rpx solid #f0d898; }
		.benefit-badge.all { color: #2e7a52; background: #e4f5ec; border: 1rpx solid #c0e4cf; }

		/* 当前状态卡片 */
		.membership-status { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
		.status-card {
			min-height: 136rpx; padding: 22rpx 20rpx; box-sizing: border-box;
			border: 1.5rpx solid #e7ece8; border-radius: 20rpx; background: #fff;
			display: flex; align-items: center;
			box-shadow: 0 5rpx 16rpx rgba(31,54,39,.04);
		}
		.status-card.status-card-active {
			border-color: #d4b870; background: linear-gradient(135deg, #fffcf0, #fef8e2);
		}
		.status-card-icon-wrap {
			flex: 0 0 auto; width: 58rpx; height: 58rpx; margin-right: 14rpx;
			border-radius: 16rpx; background: #eaf6ef;
			display: flex; align-items: center; justify-content: center;
		}
		.status-card-icon-wrap.gold { background: linear-gradient(135deg, #fde8b8, #faf0d4); }
		.status-card-body { min-width: 0; }
		.membership-status-label { display: block; color: #8a9590; font-size: 19rpx; }
		.membership-status-value {
			display: block; margin-top: 6rpx;
			color: #111a14; font-size: 26rpx; font-weight: 780; line-height: 1.2;
		}
		.membership-status-note { display: block; margin-top: 5rpx; color: #8a9590; font-size: 18rpx; line-height: 1.3; }

		/* 次级 CTA（会员状态） */
		.membership-secondary-cta {
			width: 100%; min-height: 84rpx; margin-top: 28rpx;
			border: 1.5rpx solid #dce4de; border-radius: 18rpx;
			color: #5a6860; background: #fff; font-size: 25rpx; font-weight: 600;
			box-shadow: none;
		}
		.membership-secondary-cta::after { border: 0; }

		/* 信任条 */
		.membership-trust {
			margin-top: 24rpx; padding: 22rpx 16rpx;
			display: flex; align-items: center; justify-content: space-around;
			border: 1.5rpx solid #daeee4; border-radius: 20rpx;
			background: linear-gradient(135deg, #f0f9f4, #f6fbf8);
		}
		.trust-item { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; }
		.trust-icon {
			width: 52rpx; height: 52rpx; border-radius: 50%;
			background: #e2f4eb; display: flex; align-items: center; justify-content: center;
		}
		.trust-label { margin-top: 9rpx; color: #1e3a28; font-size: 20rpx; font-weight: 700; text-align: center; }
		.trust-sub { margin-top: 3rpx; color: #7a8d82; font-size: 17rpx; text-align: center; line-height: 1.3; }
		.trust-divider { width: 1rpx; height: 60rpx; background: #cce8d8; flex-shrink: 0; }

		.membership-footnote { display: block; margin-top: 20rpx; color: #a0a8a3; font-size: 19rpx; line-height: 1.55; text-align: center; }

		/* ── 我的页 ── */
	.profile-page { padding: 0 24rpx 180rpx; }
	.profile-page .page-title { font-size: 36rpx; font-weight: 800; }
	.profile-head {
		margin-top: 16rpx; padding: 28rpx 26rpx 26rpx;
		border-radius: 22rpx;
		background: linear-gradient(145deg, #0a7f4e 0%, #12a060 55%, #1db870 100%);
		box-shadow: 0 16rpx 40rpx rgba(10,120,70,.22), 0 4rpx 12rpx rgba(10,120,70,.12);
	}
	.avatar {
		width: 84rpx; height: 84rpx; border-radius: 50%;
		background: rgba(255,255,255,.22); font-size: 33rpx; line-height: 84rpx;
		box-shadow: 0 4rpx 12rpx rgba(0,0,0,.1);
	}
	.profile-name { font-size: 30rpx; font-weight: 760; }
	.profile-sub { font-size: 22rpx; opacity: .78; margin-top: 7rpx; }
	.local-badge { padding: 8rpx 14rpx; border-radius: 10rpx; font-size: 19rpx; font-weight: 580; background: rgba(255,255,255,.18); }
	.profile-metrics { margin-top: 26rpx; padding-top: 24rpx; }
	.profile-metrics text:first-child { font-size: 20rpx; opacity: .72; }
	.profile-metrics text:last-child  { font-size: 27rpx; font-weight: 740; margin-top: 8rpx; }
	.settings-section { margin-top: 28rpx; }
	.settings-title { font-size: 23rpx; font-weight: 680; color: #6a7670; margin-left: 4rpx; letter-spacing: 0.2rpx; }
	.settings-card {
		margin-top: 14rpx; padding: 0 24rpx;
		border: 1.5rpx solid #edf1ee; border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(31,54,39,.04);
	}
	.setting-row { min-height: 108rpx; border-bottom-color: #f0f4f1; }
	.setting-icon { width: 58rpx; height: 58rpx; border-radius: 16rpx; margin-right: 18rpx; }
	.green-bg  { background: linear-gradient(135deg, #d8f2e5, #e8f7ee); }
	.orange-bg { background: linear-gradient(135deg, #fce8cc, #fef2e0); }
	.blue-bg   { background: linear-gradient(135deg, #daeaf9, #ebf3fd); }
	.violet-bg { background: linear-gradient(135deg, #e8e5f9, #f0eefb); }
	.red-bg    { background: linear-gradient(135deg, #fcd9db, #fde8e9); }
	.setting-copy text:first-child { font-size: 26rpx; font-weight: 640; }
	.setting-copy text:last-child  { font-size: 21rpx; color: #8a9590; margin-top: 6rpx; }
	.version-text { margin-top: 40rpx; font-size: 20rpx; color: #aab4af; }

	/* ── 新增/编辑订阅页整体 ── */
	.subscription-form-page { padding: 0 32rpx 200rpx; background: #f4f7f5; }

	/* 顶部标题栏 */
	.subscription-form-page .detail-titlebar { height: 96rpx; padding: 0 4rpx; }
	.subscription-form-page .detail-titlebar > .page-title { font-size: 34rpx; font-weight: 780; letter-spacing: -0.5rpx; }

	/* 常用模板区 */
	.subscription-form-page .template-section { margin-top: 20rpx; padding: 22rpx 24rpx 24rpx; background: #fff; border: 1rpx solid #edf1ee; border-radius: 18rpx; box-shadow: 0 4rpx 16rpx rgba(31,54,39,.03); }
	.subscription-form-page .template-section .form-section-head { margin-bottom: 0; }
	.subscription-form-page .template-section .form-section-head > text:first-child { font-size: 26rpx; font-weight: 720; color: #1a2120; }
	.subscription-form-page .template-section .form-section-head > text:last-child { font-size: 22rpx; color: #16834d; font-weight: 600; }
	.subscription-form-page .template-scroll { width: calc(100% + 64rpx); margin: 16rpx -32rpx 0; }
	.subscription-form-page .template-row { padding: 4rpx 32rpx 4rpx; gap: 16rpx; }
	.subscription-form-page .template-chip {
		width: 128rpx; min-height: 122rpx; margin-right: 0; padding: 16rpx 8rpx 14rpx;
		border: 1.5rpx solid #edf1ee; border-radius: 16rpx; background: #fff;
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		font-size: 20rpx; color: #303830; font-weight: 560;
		box-shadow: 0 4rpx 14rpx rgba(31,54,39,.05);
		transition: all .15s;
	}
	.subscription-form-page .template-logo {
		width: 60rpx; height: 60rpx; margin-bottom: 10rpx; border-radius: 15rpx;
		display: flex; align-items: center; justify-content: center;
		box-shadow: 0 4rpx 10rpx rgba(0,0,0,.14);
	}

	/* 分区间距 */
	.subscription-form-page .form-section { margin-top: 22rpx; }
	.subscription-form-page .template-section + .form-section { margin-top: 22rpx; }
	.subscription-form-page .reminder-form-section { margin-top: 22rpx; }
	.subscription-form-page .supplement-form-section { margin-top: 22rpx; }

	/* 分区标题 */
	.subscription-form-page .form-section-title {
		display: block; margin: 0 4rpx 12rpx;
		color: #58665e; font-size: 23rpx; font-weight: 680; letter-spacing: 0.2rpx;
	}
	.subscription-form-page .form-section-head {
		min-height: 32rpx; margin-bottom: 14rpx; display: flex; align-items: center; justify-content: space-between;
	}
	.subscription-form-page .form-section-head > text:first-child { font-size: 23rpx; font-weight: 680; color: #58665e; }
	.subscription-form-page .form-section-head > text:last-child { font-size: 21rpx; color: #16834d; font-weight: 580; }

	/* 表单卡片 */
	.subscription-form-page .form-card {
		padding: 0 26rpx; border: 1.5rpx solid #edf1ee; border-radius: 18rpx;
		background: #fff; box-shadow: 0 4rpx 18rpx rgba(31,54,39,.04);
	}

	/* 表单行 */
	.subscription-form-page .form-row { min-height: 100rpx; padding: 0; border-bottom: 1rpx solid #f0f4f1; }
	.subscription-form-page .form-row:last-child { border-bottom: 0; }
	.subscription-form-page .form-label { font-size: 26rpx; font-weight: 640; color: #1a2120; }
	.subscription-form-page .form-label.required::after { color: #e04851; }
	.subscription-form-page .form-input { height: 98rpx; font-size: 24rpx; color: #303830; }
	.subscription-form-page .form-value { font-size: 24rpx; color: #68716b; }
	.subscription-form-page .form-value uni-icons { margin-left: 8rpx; opacity: .7; }
	.subscription-form-page .form-hint { font-size: 19rpx; color: #96a09b; }

	/* 金额输入 */
	.subscription-form-page .money-input { color: #303830; }
	.subscription-form-page .money-input > text { font-size: 26rpx; font-weight: 600; color: #444e47; }
	.subscription-form-page .money-input input { width: 200rpx; height: 98rpx; font-size: 26rpx; font-weight: 650; color: #1a2120; }

	/* 自动续费行 */
	.subscription-form-page .auto-renew-row { min-height: 88rpx; }
	.subscription-form-page .auto-renew-row switch { transform: scale(.72); transform-origin: right center; }

	/* 品牌色点 */
	.subscription-form-page .color-options button { width: 36rpx; height: 36rpx; margin-left: 16rpx; border-width: 4rpx; border-color: #fff; box-shadow: 0 0 0 1.5rpx rgba(0,0,0,.1); }
	.subscription-form-page .color-options button.selected { box-shadow: 0 0 0 3rpx #16834d; }

	/* 提醒节点 */
	.subscription-form-page .reminder-options { display: flex; flex-wrap: wrap; margin-right: -10rpx; gap: 0; }
	.subscription-form-page .reminder-options button {
		height: 60rpx; min-height: 60rpx; margin: 0 10rpx 10rpx 0; padding: 0 20rpx;
		border: 1.5rpx solid #e2e9e4; border-radius: 12rpx;
		color: #68716b; background: #fff;
		font-size: 22rpx; font-weight: 560; line-height: 58rpx;
		box-shadow: 0 2rpx 8rpx rgba(31,54,39,.04);
	}
	.subscription-form-page .reminder-options button.selected {
		border-color: #16834d; color: #0f6f40; background: #eaf6ef;
		font-weight: 680; box-shadow: 0 2rpx 8rpx rgba(22,131,77,.1);
	}
	.subscription-form-page .reminder-options button uni-icons { margin-right: 5rpx; }

	/* 提醒预览条 */
	.subscription-form-page .form-preview {
		min-height: 62rpx; margin-top: 6rpx; padding: 0 18rpx;
		box-sizing: border-box; display: flex; align-items: center;
		border: 1.5rpx solid #c8e8d6; border-radius: 12rpx;
		color: #3a7a56; background: linear-gradient(90deg, #edf8f2, #f5faf7);
		font-size: 20rpx; font-weight: 560;
	}
	.subscription-form-page .form-preview uni-icons { margin-right: 9rpx; flex-shrink: 0; }

	/* 补充信息 textarea */
	.subscription-form-page .textarea-row { min-height: 100rpx; padding: 0; align-items: center; box-sizing: border-box; }
	.subscription-form-page .textarea-row textarea { height: 56rpx; font-size: 22rpx; line-height: 56rpx; color: #303830; }

	/* 保存按钮 — 固定底部 */
	.subscription-form-page .save-button {
		position: fixed; z-index: 30;
		left: 50%; transform: translateX(-50%);
		bottom: calc(32rpx + env(safe-area-inset-bottom));
		width: calc(750rpx - 64rpx); max-width: calc(100vw - 64rpx);
		min-height: 0; height: 88rpx; margin: 0; padding: 0;
		border-radius: 44rpx;
		font-size: 28rpx; font-weight: 700; letter-spacing: 1rpx;
		background: linear-gradient(135deg, #18934f, #16834d);
		box-shadow: 0 12rpx 28rpx rgba(14,116,64,.28);
		display: flex; align-items: center; justify-content: center;
	}
	.subscription-form-page .save-button uni-icons { margin-right: 10rpx; }
	.subscription-form-page .form-error { margin-top: 16rpx; margin-bottom: 12rpx; }

	/* #ifdef H5 */
	.safe-top.form-safe-top { height: 10px !important; }
	/* #endif */
	@media screen and (min-width: 768px) { .app-shell { max-width: 750rpx; margin: 0 auto; box-shadow: 0 0 48px rgba(20,40,27,.09); }.float-add { right: calc((100vw - 750rpx) / 2 + 32rpx); } }
</style>
