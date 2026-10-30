import { membershipApi } from "../../api/membership.js";
import { ensureSession } from "../../api/auth.js";

const requestKey = () =>
  "mp_" +
  Date.now().toString(36) +
  "_" +
  Math.random().toString(36).slice(2, 14).padEnd(12, "0");

export const membershipMethods = {
  openMembership(reason = "general") {
    if (!this.membershipEntryEnabled) return;
    this.membershipEntryReason = reason === "quota" ? "quota" : "general";
    if (this.membershipEntryReason !== "quota") this.membershipIntent = null;
    this.navigateToView("membership");
    void this.loadMembershipOrders();
  },
  showMembershipLimit(intent) {
    this.membershipIntent =
      intent ||
      (this.activeView === "form" && !this.editingId
        ? { kind: "draft" }
        : { kind: "manage" });
    if (this.membershipEntryEnabled && this.settings.membership.benefits?.membershipPurchaseAvailable && (this.settings.membership.product?.channel !== "virtual" || this.virtualPaymentAvailable())) return this.openMembership("quota");
    uni.showModal({
      title: "额度已用完，可删除释放位置",
      content: `当前账号最多保存 ${this.subscriptionLimit} 条订阅。可删除不再使用的订阅释放额度，历史账单会保留。`,
      showCancel: false,
      confirmText: "知道了",
    });
  },
  resumeMembershipCreation() {
    if (
      this.membershipBusy ||
      this.membershipLoading ||
      this.membershipError ||
      !this.canCreateSubscription
    )
      return;
    const intent = this.membershipIntent;
    this.membershipIntent = null;
    if (intent?.kind === "new")
      this.openForm(intent.date, null, intent.initialValues);
    else this.goBackView("all");
  },
  async refundMembershipOrder() {
    if (this.membershipError || this.membershipOrder?.status !== "paid") return;
    const id = this.membershipOrder.id;
    await this.membershipWrite(() => membershipApi.refund(id));
  },
  async loadMembershipOrders() {
    if (this.membershipBusy) return;
    const sequence = ++this.membershipRequestId;
    const userId = this.currentUserId;
    this.membershipLoading = true;
    this.membershipError = "";
    try {
      const session = await ensureSession();
      if (session.user.id !== userId) {
        this.clearAccountData();
        this.loadError = "账号已切换，请重新加载后操作";
        return;
      }
      const orders = await membershipApi.orders();
      // Reading orders reconciles pending WeChat payments before reading entitlement.
      const membership = await membershipApi.status();
      if (
        sequence !== this.membershipRequestId ||
        userId !== this.currentUserId
      )
        return;
      this.applyMembership(membership);
      this.membershipOrders = orders.items;
      if (this.membershipOrder)
        this.membershipOrder =
          orders.items.find((order) => order.id === this.membershipOrder.id) ||
          null;
      this.membershipPurchaseKey = "";
    } catch (error) {
      if (
        sequence === this.membershipRequestId &&
        userId === this.currentUserId
      )
        this.membershipError = error.message;
    } finally {
      if (sequence === this.membershipRequestId) this.membershipLoading = false;
    }
  },
  async beginMembershipPurchase() {
    if (
      this.membershipBusy ||
      this.membershipLoading ||
      this.isMember ||
      this.membershipError ||
      !this.dataReady
    )
      return;
    if (!this.settings.membership.product?.available) return;
    if (
      this.settings.membership.product?.channel === "virtual" &&
      !this.virtualPaymentAvailable()
    ) {
      this.membershipError =
        "当前设备暂不支持会员支付，请使用支持虚拟支付的安卓微信";
      return;
    }
    if (!this.membershipPurchaseKey) this.membershipPurchaseKey = requestKey();
    await this.membershipWrite(async () => {
      const sequence = this.membershipRequestId;
      const userId = this.currentUserId;
      const order = await membershipApi.create(this.membershipPurchaseKey);
      if (
        sequence !== this.membershipRequestId ||
        userId !== this.currentUserId
      )
        return order;
      if (order.channel === "virtual") {
        this.membershipOrder = order;
        this.membershipOrders = [
          order,
          ...this.membershipOrders.filter((item) => item.id !== order.id),
        ].slice(0, 50);
      }
      return order.channel === "virtual" && order.status === "pending"
        ? this.requestMembershipPayment(order.id)
        : order;
    });
  },
  async payMembershipOrder() {
    if (
      this.membershipError ||
      this.membershipOrder?.channel !== "virtual" ||
      this.membershipOrder.status !== "pending"
    )
      return;
    const id = this.membershipOrder.id;
    await this.membershipWrite(() => this.requestMembershipPayment(id));
  },
  virtualPaymentAvailable() {
    if (
      typeof wx === "undefined" ||
      typeof wx.requestVirtualPayment !== "function"
    )
      return false;
    const device = wx.getDeviceInfo?.() || wx.getSystemInfoSync?.() || {};
    if (device.platform === "ios") {
      if (!this.settings.membership.product?.iosEnabled) return false;
      const version = (wx.getAppBaseInfo?.() || device).version || "0";
      const numbers = version.split(".").map(Number);
      if (
        numbers[0] < 8 ||
        (numbers[0] === 8 && numbers[1] === 0 && numbers[2] < 68)
      )
        return false;
    }
    return !wx.canIUse || wx.canIUse("requestVirtualPayment");
  },
  async requestMembershipPayment(id) {
    if (!this.virtualPaymentAvailable())
      throw new Error("当前设备暂不支持会员支付，请使用支持虚拟支付的安卓微信");
    const sequence = this.membershipRequestId;
    const userId = this.currentUserId;
    const session = await ensureSession({ force: true });
    if (session.user.id !== userId) {
      this.clearAccountData();
      throw new Error("账号已切换，请重新加载后操作");
    }
    if (sequence !== this.membershipRequestId || userId !== this.currentUserId)
      return this.membershipOrder;
    const { order, payment } = await membershipApi.payment(id);
    if (sequence !== this.membershipRequestId || userId !== this.currentUserId)
      return order;
    if (!payment) return order;
    if (
      payment.mode !== "short_series_goods" ||
      typeof payment.signData !== "string" ||
      typeof payment.paySig !== "string" ||
      typeof payment.signature !== "string"
    )
      throw new Error("支付参数不正确，请刷新订单");
    // Keep the server-created order available when the cashier is cancelled or times out.
    this.membershipOrder = order;
    this.membershipOrders = [
      order,
      ...this.membershipOrders.filter((item) => item.id !== order.id),
    ].slice(0, 50);
    await new Promise((resolve, reject) => {
      wx.requestVirtualPayment({
        ...payment,
        success: resolve,
        fail: (error) =>
          reject(
            new Error(
              String(error.errMsg || "").includes("cancel")
                ? "支付已取消，未确认开通。请刷新订单与权益后继续。"
                : "支付结果尚未确认，请刷新订单与权益，勿重复支付。",
            ),
          ),
      });
    });
    let confirmed = order;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (
        sequence !== this.membershipRequestId ||
        userId !== this.currentUserId
      )
        return confirmed;
      confirmed = await membershipApi.order(id);
      if (confirmed.status !== "pending") return confirmed;
      if (attempt < 2)
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return confirmed;
  },
  async simulateMembershipPayment(outcome) {
    if (this.membershipError) return;
    if (!this.membershipOrder || this.membershipOrder.status !== "pending")
      return;
    const id = this.membershipOrder.id;
    await this.membershipWrite(() => membershipApi.simulate(id, outcome));
  },
  selectMembershipOrder(order) {
    if (!this.membershipBusy && !this.membershipLoading) {
      this.membershipOrder = order;
      this.membershipMessage = "";
    }
  },
  async membershipWrite(operation) {
    if (this.membershipBusy || this.membershipLoading) return;
    const sequence = ++this.membershipRequestId;
    const userId = this.currentUserId;
    this.membershipBusy = true;
    this.membershipError = "";
    this.membershipMessage = "";
    try {
      const session = await ensureSession();
      if (session.user.id !== userId) {
        this.clearAccountData();
        this.loadError = "账号已切换，请重新加载后操作";
        return;
      }
      const order = await operation();
      if (
        sequence !== this.membershipRequestId ||
        userId !== this.currentUserId
      )
        return;
      this.membershipOrder = order;
      this.membershipOrders = [
        order,
        ...this.membershipOrders.filter((item) => item.id !== order.id),
      ].slice(0, 50);
      if (order.status !== "pending") this.membershipPurchaseKey = "";
      const messages = {
        pending: "订单已创建，请在下方选择模拟结果。",
        paid: "模拟支付成功，正在确认会员权益…",
        cancelled: "模拟支付已取消，不会扣款。",
        failed: "模拟支付失败，未开通会员。可重新创建订单。",
        refunded: "模拟开通已撤销，正在确认账号权益；未发生实际退款。",
      };
      this.membershipMessage =
        order.channel === "virtual"
          ? {
              pending: "支付结果尚未确认，请刷新订单与权益，勿重复支付。",
              paid: "微信支付已确认，正在读取会员权益…",
              cancelled: "订单已关闭，请重新创建订单。",
              failed: "订单支付失败，请重新创建订单。",
              refunded: "订单已退款，正在重新读取账号权益。",
            }[order.status] || ""
          : messages[order.status];
      // Confirm the entitlement from the server, never infer it from the client outcome.
      const membership = await membershipApi.status();
      if (
        sequence !== this.membershipRequestId ||
        userId !== this.currentUserId
      )
        return;
      this.applyMembership(membership);
      if (order.status === "refunded" && order.channel === "simulation")
        this.membershipMessage =
          "模拟开通已撤销，账号权益已重新读取；未发生实际退款。";
      if (order.status === "paid")
        this.membershipMessage =
          order.channel === "virtual"
            ? membership.status === "active"
              ? "永久会员已开通。"
              : "支付已确认，请刷新后确认会员权益。"
            : "永久会员测试权益已开通，未发生实际扣款。";
    } catch (error) {
      if (
        sequence === this.membershipRequestId &&
        userId === this.currentUserId
      )
        this.membershipError = error.uncertain
          ? "操作结果尚未确认，请点击「刷新订单与权益」查询，勿重复支付。"
          : error.message;
    } finally {
      if (sequence === this.membershipRequestId) this.membershipBusy = false;
    }
  },
};
