<template>
  <view class="page membership-page">
    <view class="detail-titlebar">
      <button
        class="icon-button plain"
        aria-label="返回"
        :disabled="busy"
        @tap="$emit('back')"
      >
        <uni-icons type="left" size="24" color="#172a22" />
      </button>
      <text class="page-title">会员中心</text><view class="icon-spacer"></view>
    </view>
    <view class="membership-summary">
      <text class="membership-label">{{
        isMember ? "永久会员" : "免费版"
      }}</text>
      <text class="membership-headline">{{
        isMember ? "所有订阅，一处管理" : "给每一笔续费留个位置"
      }}</text>
      <text class="membership-summary-copy">{{
        isMember
          ? "订阅数量不限，权益跟随你的微信账号。"
          : "当前已使用 " + freeQuotaValue + " 条订阅额度。"
      }}</text>
      <text
        v-if="isMember && membership.source === 'simulation'"
        class="membership-test-label"
        >当前为模拟支付开通的测试权益</text
      >
    </view>
    <view class="settings-section">
      <text class="settings-title">永久会员权益</text>
      <view class="settings-card">
        <settings-row
          icon="list"
          title="不限数量的订阅"
          description="一次开通，无到期日，也不会自动续费"
        />
        <settings-row
          icon="cloud-upload"
          title="跟随微信账号"
          description="换手机或重新登录，仍可读取会员权益"
        />
        <settings-row
          icon="notification"
          title="保留所有基础功能"
          description="免费版同样支持已授权提醒、统计和导出"
        />
      </view>
    </view>
    <view class="membership-purchase">
      <view class="membership-price-line"
        ><text>永久会员 · 一次开通</text
        ><text class="membership-price">{{
          membership.product ? price(membership.product.amount) : "—"
        }}</text></view
      >
      <text class="membership-notice"
        >模拟支付，不会实际扣款。开通后获得永久会员测试权益。</text
      >
      <button
        class="membership-primary"
        :disabled="
          isMember ||
          busy ||
          loading ||
          !!error ||
          !membership.product?.available
        "
        :aria-busy="busy ? 'true' : 'false'"
        @tap="$emit('purchase')"
      >
        {{
          isMember
            ? "已开通永久会员"
            : busy
              ? "正在处理订单…"
              : membership.product?.available
                ? "创建模拟支付订单"
                : "模拟支付暂未开放"
        }}
      </button>
    </view>
    <async-state-view
      v-if="error"
      title="订单或权益需要重新确认"
      :description="error"
      action-label="刷新订单与权益"
      :busy="busy || loading"
      @action="$emit('refresh')"
    />
    <async-state-view
      v-else-if="loading"
      tone="loading"
      title="正在读取订单与权益"
      description="订单状态以服务器记录为准"
    />
    <view class="membership-feedback" role="status" aria-live="polite"
      ><text>{{ message }}</text></view
    >
    <view v-if="order" class="membership-cashier">
      <text class="settings-title">{{
        order.status === "pending" ? "模拟收银台" : "订单详情"
      }}</text>
      <text class="membership-order-line"
        >{{ order.productName }} · {{ price(order.amount) }}</text
      >
      <text class="membership-order-id">{{ order.id }}</text>
      <text class="membership-order-line"
        >{{ statusText(order.status) }} · 模拟订单</text
      >
      <view
        v-if="order.status === 'pending'"
        class="membership-cashier-actions"
      >
        <button
          class="membership-primary"
          :disabled="busy || loading || !!error || !membership.product?.available"
          @tap="$emit('simulate', 'success')"
        >
          {{ busy ? "正在处理…" : "模拟支付成功" }}
        </button>
        <button
          class="membership-secondary"
          :disabled="busy || loading || !!error || !membership.product?.available"
          @tap="$emit('simulate', 'cancel')"
        >
          模拟取消
        </button>
        <button
          class="membership-secondary"
          :disabled="busy || loading || !!error || !membership.product?.available"
          @tap="$emit('simulate', 'failure')"
        >
          模拟失败
        </button>
      </view>
    </view>
    <view v-if="order && order.status === 'paid'" class="membership-cashier">
      <text class="membership-notice"
        >可撤销本订单的测试权益以重测购买流程；已有订阅保留，不会发生实际退款。</text
      >
      <button
        v-if="!refundConfirm"
        class="membership-secondary"
        :disabled="busy || loading || !!error || !membership.product?.available"
        @tap="refundConfirm = true"
      >
        撤销模拟开通
      </button>
      <view v-else>
        <text class="membership-notice"
          >确认撤销此订单的测试权益？撤销后按账号剩余权益重新计算额度。</text
        >
        <button
          class="membership-secondary"
          :disabled="busy || loading || !!error || !membership.product?.available"
          @tap="
            $emit('refund');
            refundConfirm = false;
          "
        >
          确认撤销测试权益
        </button>
        <button
          class="membership-secondary"
          :disabled="busy"
          @tap="refundConfirm = false"
        >
          保留会员
        </button>
      </view>
    </view>
    <view class="membership-orders-heading"
      ><text class="settings-title">最近订单</text
      ><button
        class="membership-refresh"
        :disabled="busy || loading"
        @tap="$emit('refresh')"
      >
        {{ loading ? "读取中…" : "刷新订单与权益" }}
      </button></view
    >
    <view v-if="!orders.length && !loading" class="membership-empty"
      ><text>暂无订单</text
      ><text>创建模拟订单后，可在这里查询处理结果。</text></view
    >
    <view v-else class="membership-orders">
      <button
        v-for="item in orders"
        :key="item.id"
        class="membership-order"
        :disabled="busy || loading"
        @tap="$emit('select-order', item)"
      >
        <view class="membership-order-top"
          ><text>{{ item.productName }} · {{ price(item.amount) }}</text
          ><text>{{ statusText(item.status) }}</text></view
        >
        <text class="membership-order-id">{{ item.id }}</text>
        <text class="membership-order-time"
          >{{ dateText(item.createdAt) }} · 模拟支付{{
            item.status === "pending" ? " · 点击继续" : ""
          }}</text
        >
      </button>
    </view>
    <text class="membership-footnote"
      >模拟支付由后端配置开启。所有订单均为模拟订单，不会产生实际扣款。免费版最多
      {{ subscriptionLimit ?? 5 }}
      条，删除释放额度；会员不影响基础提醒、统计和导出。</text
    >
  </view>
</template>
<script>
import SettingsRow from "./SettingsRow.vue";
import AsyncStateView from "./AsyncStateView.vue";
export default {
  name: "MembershipView",
  components: { SettingsRow, AsyncStateView },
  emits: ["back", "purchase", "simulate", "refresh", "select-order", "refund"],
  data() {
    return { refundConfirm: false };
  },
  watch: {
    "order.id"() {
      this.refundConfirm = false;
    },
  },
  props: {
    isMember: { type: Boolean, default: false },
    freeQuotaValue: { type: String, default: "" },
    subscriptionLimit: { type: Number, default: null },
    membership: { type: Object, default: () => ({}) },
    orders: { type: Array, default: () => [] },
    order: { type: Object, default: null },
    busy: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    error: { type: String, default: "" },
    message: { type: String, default: "" },
  },
  methods: {
    price(amount) {
      return "¥" + (Number(amount) / 100).toFixed(2);
    },
    statusText(status) {
      return (
        {
          pending: "待模拟支付",
          paid: "模拟成功",
          cancelled: "已取消",
          failed: "模拟失败",
          refunded: "已撤销测试权益",
        }[status] || status
      );
    },
    dateText(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../styles/tokens";
.membership-summary {
  padding: 32rpx;
  background: $deep;
  color: $surface;
  border-radius: 24rpx;
}
.membership-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.85;
}
.membership-headline {
  display: block;
  font-size: 38rpx;
  font-weight: 650;
  margin: 16rpx 0;
  line-height: 1.4;
}
.membership-summary-copy,
.membership-test-label {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
}
.membership-test-label {
  margin-top: 16rpx;
}
.membership-purchase > .membership-primary {
  width: 100%;
}
.membership-purchase,
.membership-cashier {
  padding: 32rpx;
  margin: 24rpx 0;
  border: 1rpx solid $line;
  background: $surface;
  border-radius: 24rpx;
}
.membership-price-line,
.membership-order-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  flex-wrap: wrap;
}
.membership-price {
  font-family: $number-font;
  font-size: 48rpx;
  font-weight: 650;
  color: $green;
}
.membership-notice,
.membership-order-line,
.membership-order-id,
.membership-order-time {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
}
.membership-notice {
  margin: 16rpx 0 24rpx;
  color: $amber;
}
.membership-primary,
.membership-secondary,
.membership-refresh {
  min-height: 88rpx;
  margin: 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  padding: 20rpx 24rpx;
  line-height: 1.6;
}
.membership-primary {
  background: $green;
  color: $surface;
}
.membership-secondary {
  background: $bg;
  color: $text;
}
.membership-refresh {
  background: $surface;
  color: $green;
  font-size: 24rpx;
}
button[disabled] {
  opacity: 0.5;
}
button:focus-visible {
  outline: 3px solid $green;
  outline-offset: 3px;
}
.membership-feedback {
  min-height: 64rpx;
  font-size: 26rpx;
  color: $green;
  line-height: 1.6;
}
.membership-cashier-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-top: 24rpx;
}
.membership-cashier-actions .membership-primary {
  grid-column: 1 / -1;
}
.membership-order-id {
  color: $muted;
  overflow-wrap: anywhere;
  text-align: left;
}
.membership-orders-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.membership-orders-heading .settings-title {
  margin: 0;
}
.membership-order {
  display: block;
  padding: 24rpx;
  width: 100%;
  margin: 0;
  border-radius: 0;
  text-align: left;
  background: $surface;
  color: $text;
  border-bottom: 1rpx solid $line;
}
.membership-order-top {
  font-size: 26rpx;
}
.membership-order-time {
  color: $muted;
}
.membership-empty {
  padding: 40rpx 24rpx;
  color: $muted;
  text-align: center;
}
.membership-empty text {
  display: block;
  font-size: 24rpx;
  line-height: 1.8;
}
</style>
