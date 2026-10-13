"use strict";
const api_membership = require("../../api/membership.js");
const api_auth = require("../../api/auth.js");
const requestKey = () => "mp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 14).padEnd(12, "0");
const membershipMethods = {
  async refundMembershipOrder() {
    var _a;
    if (this.membershipError || ((_a = this.membershipOrder) == null ? void 0 : _a.status) !== "paid")
      return;
    const id = this.membershipOrder.id;
    await this.membershipWrite(() => api_membership.membershipApi.refund(id));
  },
  async loadMembershipOrders() {
    if (this.membershipBusy)
      return;
    const sequence = ++this.membershipRequestId;
    const userId = this.currentUserId;
    this.membershipLoading = true;
    this.membershipError = "";
    try {
      const session = await api_auth.ensureSession();
      if (session.user.id !== userId) {
        this.clearAccountData();
        this.loadError = "账号已切换，请重新加载后操作";
        return;
      }
      const [membership, orders] = await Promise.all([
        api_membership.membershipApi.status(),
        api_membership.membershipApi.orders()
      ]);
      if (sequence !== this.membershipRequestId || userId !== this.currentUserId)
        return;
      this.applyMembership(membership);
      this.membershipOrders = orders.items;
      if (this.membershipOrder)
        this.membershipOrder = orders.items.find((order) => order.id === this.membershipOrder.id) || null;
      this.membershipPurchaseKey = "";
    } catch (error) {
      if (sequence === this.membershipRequestId && userId === this.currentUserId)
        this.membershipError = error.message;
    } finally {
      if (sequence === this.membershipRequestId)
        this.membershipLoading = false;
    }
  },
  async beginMembershipPurchase() {
    var _a;
    if (this.membershipBusy || this.membershipLoading || this.isMember || this.membershipError || !this.dataReady)
      return;
    if (!((_a = this.settings.membership.product) == null ? void 0 : _a.available))
      return;
    if (!this.membershipPurchaseKey)
      this.membershipPurchaseKey = requestKey();
    await this.membershipWrite(
      () => api_membership.membershipApi.create(this.membershipPurchaseKey)
    );
  },
  async simulateMembershipPayment(outcome) {
    if (this.membershipError)
      return;
    if (!this.membershipOrder || this.membershipOrder.status !== "pending")
      return;
    const id = this.membershipOrder.id;
    await this.membershipWrite(() => api_membership.membershipApi.simulate(id, outcome));
  },
  selectMembershipOrder(order) {
    if (!this.membershipBusy && !this.membershipLoading) {
      this.membershipOrder = order;
      this.membershipMessage = "";
    }
  },
  async membershipWrite(operation) {
    if (this.membershipBusy || this.membershipLoading)
      return;
    const sequence = ++this.membershipRequestId;
    const userId = this.currentUserId;
    this.membershipBusy = true;
    this.membershipError = "";
    this.membershipMessage = "";
    try {
      const session = await api_auth.ensureSession();
      if (session.user.id !== userId) {
        this.clearAccountData();
        this.loadError = "账号已切换，请重新加载后操作";
        return;
      }
      const order = await operation();
      if (sequence !== this.membershipRequestId || userId !== this.currentUserId)
        return;
      this.membershipOrder = order;
      this.membershipOrders = [
        order,
        ...this.membershipOrders.filter((item) => item.id !== order.id)
      ].slice(0, 50);
      if (order.status !== "pending")
        this.membershipPurchaseKey = "";
      const messages = {
        pending: "订单已创建，请在下方选择模拟结果。",
        paid: "模拟支付成功，正在确认会员权益…",
        cancelled: "模拟支付已取消，不会扣款。",
        failed: "模拟支付失败，未开通会员。可重新创建订单。",
        refunded: "模拟开通已撤销，正在确认账号权益；未发生实际退款。"
      };
      this.membershipMessage = messages[order.status];
      const membership = await api_membership.membershipApi.status();
      if (sequence !== this.membershipRequestId || userId !== this.currentUserId)
        return;
      this.applyMembership(membership);
      if (order.status === "refunded")
        this.membershipMessage = "模拟开通已撤销，账号权益已重新读取；未发生实际退款。";
      if (order.status === "paid")
        this.membershipMessage = "永久会员测试权益已开通，未发生实际扣款。";
    } catch (error) {
      if (sequence === this.membershipRequestId && userId === this.currentUserId)
        this.membershipError = error.uncertain ? "操作结果尚未确认，请点击「刷新订单与权益」查询，勿重复支付。" : error.message;
    } finally {
      if (sequence === this.membershipRequestId)
        this.membershipBusy = false;
    }
  }
};
exports.membershipMethods = membershipMethods;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/membership-remote.js.map
