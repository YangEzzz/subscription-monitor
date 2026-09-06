<template>
	<view class="page membership-page">
		<view class="detail-titlebar"><button class="icon-button plain" aria-label="返回" @tap.stop="$emit('back')"><uni-icons type="left" size="24" color="#202622" /></button><text class="page-title">会员中心</text><view class="icon-spacer"></view></view>

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
		<button v-if="!isMember" class="membership-cta" @tap="$emit('activate')">
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
		<button v-if="isMember" class="membership-secondary-cta" @tap="$emit('restore')">恢复为免费版</button>

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
</template>

<script>
	export default {
		name: 'MembershipView',
		emits: ['back', 'activate', 'restore'],
		props: {
			isMember: { type: Boolean, default: false },
			freeQuotaValue: { type: String, default: '0 / 5' }
		}
	}
</script>
