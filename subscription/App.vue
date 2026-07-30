<script>
	export default {
		onLaunch() {
			console.log('续订清单启动')
		}
	}
</script>

<style lang="scss">
	@import '@/uni_modules/uni-scss/index.scss';
	@import './common/uni.css';
	@import '@/static/customicons.css';

	page {
		min-height: 100%;
		background: #f4f7f5;
		color: #18201b;
		font-size: 28rpx;
	}

	/* #ifdef H5 */
	body {
		margin: 0;
		background: #eef2ef;
	}

	uni-page-body {
		min-height: 100%;
	}
	/* #endif */
</style>
