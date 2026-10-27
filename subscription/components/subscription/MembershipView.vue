<template>
  <view class="page membership-page redesign-page">
    <page-header
      :title="quotaPrompt ? '订阅额度' : '会员中心'"
      secondary
      :disabled="busy"
      @back="$emit('back')"
    />
    <view v-if="quotaPrompt && !isMember" class="quota-upgrade-hero">
      <view class="quota-upgrade-top"
        ><text class="quota-upgrade-label">免费版订阅额度</text
        ><text class="quota-upgrade-status">{{
          loading
            ? "确认中"
            : error
              ? "状态待确认"
              : (membership.quota?.remaining || 0) > 0
                ? "已有可用位置"
                : "免费额度已用完"
        }}</text></view
      >
      <text class="quota-upgrade-title"
        >给下一份订阅，<text class="quota-upgrade-accent">留个位置</text></text
      >
      <text class="quota-upgrade-copy"
        >免费版可保存
        {{ subscriptionLimit ?? 10 }}
        个订阅。开通永久会员，让新增不再受数量限制。</text
      >
      <view class="quota-upgrade-meter">
        <view class="quota-upgrade-count"
          ><text class="quota-upgrade-number num">{{
            loading || error ? "—" : (membership.quota?.used ?? "—")
          }}</text
          ><text class="quota-upgrade-count-label"
            >已使用 / {{ subscriptionLimit ?? "—" }} 个</text
          ></view
        >
        <view class="quota-upgrade-progress"
          ><view
            class="quota-upgrade-progress-fill"
            :style="{ width: quotaPercent + '%' }"
          ></view
        ></view>
        <view class="quota-upgrade-unlimited"
          ><text class="quota-upgrade-infinity">∞</text
          ><text class="quota-upgrade-count-label">会员不限数量</text></view
        >
      </view>
    </view>
    <button
      v-if="quotaPrompt && resumeCreate && canResume"
      class="quota-upgrade-resume membership-primary pressable"
      hover-class="is-pressed"
      @tap="$emit('resume-create')"
    >
      继续添加订阅
    </button>
    <template v-if="!quotaPrompt || isMember">
      <view
        class="club-pass"
        :class="{ 'club-pass-active': isMember, 'club-pass-free': !isMember }"
      >
        <view class="club-pass-top">
          <text class="club-brand">续订清单 · 会员俱乐部</text>
          <text class="club-status">{{
            loading
              ? "读取中"
              : error
                ? "状态待确认"
                : isMember
                  ? "权益已生效"
                  : "未开通"
          }}</text>
        </view>
        <view class="club-pass-body">
          <view class="club-pass-copy">
            <text class="club-eyebrow">{{
              isMember ? "很高兴，有你同行" : "给每一份订阅，留个位置"
            }}</text>
            <text class="club-title">{{ "永久会员" }}</text>
            <text class="club-description">{{
              isMember
                ? "不限订阅数量，陪你从容管理每一次续费。"
                : "解锁无限订阅，让喜欢的服务都有迹可循。"
            }}</text>
          </view>
          <view class="club-emblem" aria-hidden="true">
            <view class="club-emblem-ring"></view>
            <view class="club-emblem-face"
              ><uni-icons
                type="vip-filled"
                size="52"
                color="var(--member-gold)"
            /></view>
            <text class="club-spark club-spark-one">✦</text
            ><text class="club-spark club-spark-two">✦</text>
          </view>
        </view>
        <view class="club-pass-bottom">
          <text>{{
            loading
              ? "正在读取会员权益…"
              : error
                ? "请刷新以确认最新权益"
                : isMember
                  ? "有效期：永久"
                  : "订阅用量：" + (freeQuotaValue || "待确认") + " 条"
          }}</text>
          <text>{{ isMember ? "无需续费" : "升级后数量不限" }}</text>
        </view>
      </view>
      <text
        v-if="isMember && membership.source === 'simulation'"
        class="club-test-note"
        >测试权益 · 模拟支付开通，未发生实际扣款</text
      >
      <view class="club-section-heading"
        ><text class="club-section-title">把喜欢的，都安排好</text
        ><text class="club-section-caption">永久会员权益</text></view
      >
      <view class="club-benefits">
        <view class="club-benefit-main">
          <view class="club-benefit-icon"
            ><uni-icons type="list" size="26" color="var(--violet)"
          /></view>
          <view class="club-benefit-copy"
            ><text class="club-benefit-title">订阅数量，不设上限</text
            ><text class="club-benefit-description"
              >从日常影音到效率工具，想记多少就记多少</text
            ></view
          >
          <text class="club-infinity" aria-hidden="true">∞</text>
        </view>
        <view class="club-benefit-pair">
          <view class="club-benefit-small"
            ><uni-icons type="medal" size="25" color="var(--gold)" /><text
              class="club-benefit-title"
              >一次开通，永久拥有</text
            ><text class="club-benefit-description"
              >无到期日，不会自动续费</text
            ></view
          >
          <view class="club-benefit-small"
            ><uni-icons
              type="cloud-upload"
              size="25"
              color="var(--blue)"
            /><text class="club-benefit-title">换台设备，权益还在</text
            ><text class="club-benefit-description"
              >会员权益跟随微信账号</text
            ></view
          >
        </view>
      </view>
      <view class="club-basic-note"
        ><uni-icons type="checkmarkempty" size="17" color="var(--blue)" /><text
          >提醒、统计与导出，免费版也能用</text
        ></view
      >
    </template>
    <view class="membership-purchase club-plan">
      <view class="club-plan-heading"
        ><text class="club-section-title">{{
          isMember
            ? "你的会员方案"
            : quotaPrompt
              ? "一次开通，订阅数量不限"
              : "一份开通，长久陪伴"
        }}</text
        ><text class="club-plan-tag">永久有效</text></view
      >
      <view class="membership-price-line"
        ><view
          ><text class="club-plan-name">永久会员</text
          ><text class="club-plan-description"
            >一次性购买 · 无自动续费</text
          ></view
        >
        <text class="membership-price">{{
          membership.product ? price(membership.product.amount) : "—"
        }}</text></view
      >
      <button
        role="button"
        tabindex="0"
        class="membership-primary pressable"
        :class="{ 'membership-owned': isMember }"
        hover-class="is-pressed"
        :disabled="
          isMember ||
          busy ||
          loading ||
          !!error ||
          !membership.product?.available
        "
        :aria-disabled="
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
            ? "已开通 · 好好享受订阅自由"
            : busy
              ? "正在处理订单…"
              : loading
                ? "正在读取开通信息…"
                : error
                  ? "请刷新后开通"
                  : membership.product?.available
                    ? membership.product.channel === "virtual"
                      ? `${price(membership.product.amount)} · 开通永久会员`
                      : "体验模拟开通（不扣款）"
                    : "会员购买暂未开放"
        }}
      </button>
      <text class="membership-notice">{{
        isMember
          ? "权益已绑定当前微信账号，无需重复购买。"
          : !membership.product?.available
            ? "当前暂未开放购买，免费功能可正常使用。"
            : membership.product?.notice || "开通结果以订单与会员权益查询为准。"
      }}</text>
      <text
        v-if="
          !isMember &&
          membership.product?.available &&
          membership.product?.channel === 'virtual' &&
          !membership.product?.iosEnabled
        "
        class="club-platform-note"
        >当前暂不支持 iOS 购买。</text
      >
    </view>
    <view v-if="quotaPrompt && !isMember" class="quota-upgrade-alternative">
      <button
        class="quota-upgrade-defer pressable"
        :disabled="busy"
        hover-class="is-pressed"
        @tap="$emit('back')"
      >
        暂不升级，返回
      </button>
      <text class="quota-upgrade-free-note"
        >提醒、统计与导出仍可免费使用。也可以删除不再使用的订阅腾出位置，历史账单会保留。</text
      >
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
    <view
      v-if="message"
      class="membership-feedback"
      role="status"
      aria-live="polite"
      ><text>{{ message }}</text></view
    >
    <view v-if="order" class="membership-cashier">
      <text class="settings-title">{{
        order.status === "pending"
          ? order.channel === "virtual"
            ? "待支付订单"
            : order.channel === "simulation"
              ? "模拟收银台"
              : "历史订单详情"
          : "订单详情"
      }}</text>
      <text class="membership-order-line"
        >{{ order.productName }} · {{ price(order.amount) }}</text
      >
      <text class="membership-order-id">{{ order.id }}</text>
      <text class="membership-order-line"
        >{{ statusText(order.status, order.channel) }} ·
        {{ channelText(order.channel) }}订单</text
      >
      <view
        v-if="
          order.status === 'pending' &&
          order.channel === 'simulation' &&
          membership.product?.channel !== 'virtual'
        "
        class="membership-cashier-actions"
      >
        <button
          role="button"
          tabindex="0"
          class="membership-primary"
          :disabled="
            busy || loading || !!error || !membership.product?.available
          "
          :aria-disabled="
            busy || loading || !!error || !membership.product?.available
          "
          @tap="$emit('simulate', 'success')"
        >
          {{ busy ? "正在处理…" : "模拟支付成功" }}
        </button>
        <button
          role="button"
          tabindex="0"
          class="membership-secondary"
          :disabled="
            busy || loading || !!error || !membership.product?.available
          "
          :aria-disabled="
            busy || loading || !!error || !membership.product?.available
          "
          @tap="$emit('simulate', 'cancel')"
        >
          模拟取消
        </button>
        <button
          role="button"
          tabindex="0"
          class="membership-secondary"
          :disabled="
            busy || loading || !!error || !membership.product?.available
          "
          :aria-disabled="
            busy || loading || !!error || !membership.product?.available
          "
          @tap="$emit('simulate', 'failure')"
        >
          模拟失败
        </button>
      </view>
      <button
        role="button"
        tabindex="0"
        v-if="order.status === 'pending' && order.channel === 'virtual'"
        class="membership-primary"
        :disabled="
          busy ||
          loading ||
          !!error ||
          !membership.product?.available ||
          membership.product?.channel !== 'virtual'
        "
        :aria-disabled="
          busy ||
          loading ||
          !!error ||
          !membership.product?.available ||
          membership.product?.channel !== 'virtual'
        "
        :aria-busy="busy ? 'true' : 'false'"
        @tap="$emit('pay')"
      >
        {{ busy ? "正在确认订单…" : "继续微信支付" }}
      </button>
    </view>
    <view
      v-if="
        order &&
        order.status === 'paid' &&
        order.channel === 'simulation' &&
        membership.product?.channel !== 'virtual'
      "
      class="membership-cashier"
    >
      <text class="membership-notice"
        >可撤销本订单的测试权益以重测购买流程；已有订阅保留，不会发生实际退款。</text
      >
      <button
        role="button"
        tabindex="0"
        v-if="!refundConfirm"
        class="membership-secondary"
        :disabled="busy || loading || !!error || !membership.product?.available"
        :aria-disabled="
          busy || loading || !!error || !membership.product?.available
        "
        @tap="refundConfirm = true"
      >
        撤销模拟开通
      </button>
      <view v-else>
        <text class="membership-notice"
          >确认撤销此订单的测试权益？撤销后按账号剩余权益重新计算额度。</text
        >
        <button
          role="button"
          tabindex="0"
          class="membership-secondary"
          :disabled="
            busy || loading || !!error || !membership.product?.available
          "
          :aria-disabled="
            busy || loading || !!error || !membership.product?.available
          "
          @tap="
            $emit('refund');
            refundConfirm = false;
          "
        >
          确认撤销测试权益
        </button>
        <button
          role="button"
          tabindex="0"
          class="membership-secondary"
          :disabled="busy"
          :aria-disabled="busy"
          @tap="refundConfirm = false"
        >
          保留会员
        </button>
      </view>
    </view>
    <button
      class="club-service-row"
      role="button"
      tabindex="0"
      :disabled="busy"
      :aria-disabled="busy"
      :aria-expanded="showOrders"
      @tap="showOrders = !showOrders"
    >
      <view class="club-service-icon"
        ><uni-icons type="wallet" size="21" color="var(--violet)"
      /></view>
      <view class="club-service-copy"
        ><text class="club-service-title">我的订单</text
        ><text class="club-service-description"
          >查看购买记录与支付状态</text
        ></view
      >
      <uni-icons
        :type="showOrders ? 'up' : 'right'"
        size="17"
        color="var(--ink-3)"
      />
    </button>
    <view v-if="showOrders" class="club-order-history">
      <view class="membership-orders-heading"
        ><text class="settings-title">最近订单</text
        ><button
          role="button"
          tabindex="0"
          class="membership-refresh"
          :disabled="busy || loading"
          :aria-disabled="busy || loading"
          @tap="$emit('refresh')"
        >
          {{ loading ? "读取中…" : "刷新订单与权益" }}
        </button></view
      >
      <view
        v-if="!orders.length && !loading"
        class="membership-empty soft-panel"
        ><text>暂无订单</text
        ><text>订单生成后，可在这里查询处理结果。</text></view
      >
      <view v-else class="membership-orders">
        <button
          role="button"
          tabindex="0"
          v-for="item in orders"
          :key="item.id"
          class="membership-order"
          :disabled="busy || loading"
          :aria-disabled="busy || loading"
          @tap="$emit('select-order', item)"
        >
          <view class="membership-order-top"
            ><text>{{ item.productName }} · {{ price(item.amount) }}</text
            ><text>{{ statusText(item.status, item.channel) }}</text></view
          >
          <text class="membership-order-id">{{ item.id }}</text>
          <text class="membership-order-time"
            >{{ dateText(item.createdAt) }} · {{ channelText(item.channel)
            }}{{
              item.status === "pending" && item.channel === "virtual"
                ? " · 点击查看"
                : ""
            }}</text
          >
        </button>
      </view>
    </view>
    <view class="club-faq">
      <text class="club-section-title">开通前，你可能想知道</text>
      <view
        v-for="(item, index) in questions"
        :key="item.title"
        class="club-faq-item"
      >
        <button
          class="club-question"
          role="button"
          tabindex="0"
          :aria-expanded="openQuestion === index"
          @tap="openQuestion = openQuestion === index ? -1 : index"
        >
          <text>{{ item.title }}</text
          ><uni-icons
            :type="openQuestion === index ? 'minus' : 'plus'"
            size="18"
            color="var(--ink-3)"
          />
        </button>
        <text v-if="openQuestion === index" class="club-answer">{{
          item.answer
        }}</text>
      </view>
    </view>
    <text class="membership-footnote"
      >认真记录每一份喜欢，从容迎接每一次续费。</text
    >
  </view>
</template>
<script>
import UiSkeleton from "./UiSkeleton.vue";
import PageHeader from "./PageHeader.vue";
import AsyncStateView from "./AsyncStateView.vue";
export default {
  name: "MembershipView",
  components: { AsyncStateView, PageHeader, UiSkeleton },
  emits: [
    "back",
    "purchase",
    "pay",
    "simulate",
    "refresh",
    "select-order",
    "refund",
    "resume-create",
  ],
  data() {
    return { refundConfirm: false, showOrders: false, openQuestion: -1 };
  },
  watch: {
    "order.id"() {
      this.refundConfirm = false;
    },
  },
  props: {
    quotaPrompt: { type: Boolean, default: false },
    resumeCreate: { type: Boolean, default: false },
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
  computed: {
    quotaPercent() {
      return this.subscriptionLimit
        ? Math.min(
            100,
            ((this.membership.quota?.used || 0) / this.subscriptionLimit) * 100,
          )
        : 0;
    },
    canResume() {
      return (
        !this.loading &&
        !this.busy &&
        !this.error &&
        (this.isMember || (this.membership.quota?.remaining || 0) > 0)
      );
    },
    questions() {
      return [
        {
          title: "免费版与永久会员有什么区别？",
          answer: `免费版最多保存 ${this.subscriptionLimit ?? 10} 条订阅，永久会员不限数量。提醒、支出统计和导出在免费版同样可用，提醒需完成授权。删除订阅可释放免费额度，历史账单保留。`,
        },
        {
          title: "会自动续费或再次扣款吗？",
          answer:
            "不会。永久会员为一次性购买，没有到期日，也不会自动续费或周期扣款。",
        },
        {
          title: "更换手机后，会员还在吗？",
          answer:
            "在。使用同一微信账号重新登录，即可读取会员权益，无需再次购买。",
        },
        {
          title: "支付后权益没有更新怎么办？",
          answer:
            "展开「我的订单」，点击「刷新订单与权益」重新查询。请先确认现有订单的结果，再继续操作。",
        },
      ];
    },
  },
  methods: {
    channelText(channel) {
      return (
        {
          virtual: "虚拟支付",
          wechat: "微信支付（历史）",
          simulation: "模拟支付",
        }[channel] || channel
      );
    },
    price(amount) {
      if (amount == null || !Number.isFinite(Number(amount))) return "—";
      return "¥" + (Number(amount) / 100).toFixed(2);
    },
    statusText(status, channel) {
      if (["virtual", "wechat"].includes(channel))
        return (
          {
            pending: "待支付",
            paid: "已支付",
            cancelled: "已关闭",
            failed: "支付失败",
            refunded: "已退款",
          }[status] || status
        );
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
@import "../../styles/membership";
</style>
