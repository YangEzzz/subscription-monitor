"use strict";
const common_vendor = require("../../common/vendor.js");
const api_subscriptions = require("../../api/subscriptions.js");
const pages_subscription_subscriptionData = require("./subscription-data.js");
const api_auth = require("../../api/auth.js");
const api_notifications = require("../../api/notifications.js");
const confirm = (options) => new Promise((resolve) => common_vendor.index.showModal({ ...options, success: (result) => resolve(result.confirm), fail: () => resolve(false) }));
const toast = (title) => common_vendor.index.showToast({ title, icon: "none" });
const remoteComputed = {
  notificationAuthorized() {
    return this.notifications.subscriptionType === "long_term" ? this.notifications.authorized === true : this.notifications.credits > 0;
  },
  notificationReady() {
    return Boolean(!this.notificationError && this.notifications.configured && this.notifications.schedulerEnabled && this.notifications.identityLinked && this.settings.notificationEnabled && this.notificationAuthorized);
  },
  notificationDescription() {
    if (this.notificationError)
      return "通知状态暂不可用，请重新加载";
    if (this.notificationAuthorizing)
      return "正在确认授权，请稍候";
    if (!this.notifications.configured)
      return "微信通知服务尚未配置";
    if (!this.notifications.schedulerEnabled)
      return "微信通知暂未开放，请稍后再试";
    if (this.notifications.subscriptionType === "long_term") {
      if (!this.notificationAuthorized)
        return "点击授权长期提醒，可随时暂停";
      return this.settings.notificationEnabled ? "已开启长期提醒 · 仅发送已填写金额的记录" : "长期授权已保留 · 点击恢复通知";
    }
    if (!this.settings.notificationEnabled)
      return this.notifications.credits > 0 ? `已暂停 · 剩余 ${this.notifications.credits} 次授权，点击恢复通知` : "点击授权，每次允许可发送一条通知";
    if (!this.notifications.credits)
      return "授权次数已用完，点击再次授权";
    return `剩余 ${this.notifications.credits} 次授权 · 点击增加；仅发送已填写金额的记录`;
  },
  loadErrorTitle() {
    if (this.authStatus !== "authenticated")
      return "微信登录未完成";
    if (this.dataReady)
      return this.loadErrorCode === "RESULT_UNKNOWN" ? "请确认刚才的操作" : "同步暂时中断";
    if (this.loadErrorCode === "TIMEOUT")
      return "连接等待时间过长";
    if (this.loadErrorCode === "NETWORK_ERROR")
      return "暂时无法连接";
    return "数据没有加载完成";
  },
  loadErrorDescription() {
    const stale = this.dataReady && this.loadErrorCode !== "RESULT_UNKNOWN" ? " 当前显示上次读取的数据。" : "";
    const reference = this.loadErrorRequestId ? ` 参考编号：${this.loadErrorRequestId}` : "";
    return `${this.loadError}${stale}${reference}`;
  },
  statsErrorDescription() {
    return `${this.statsError}${this.statsErrorRequestId ? ` 参考编号：${this.statsErrorRequestId}` : ""}`;
  },
  statsTotal() {
    return this.currentStats ? this.currentStats.total : 0;
  },
  currentStats() {
    return this.serverStats[this.statsPeriod === "next" ? "next30" : this.statsPeriod] || null;
  },
  statsSubscriptionCount() {
    return this.currentStats ? this.currentStats.subscriptionCount : 0;
  },
  categoryStats() {
    return (this.currentStats ? this.currentStats.categoryStats : []).map((item) => ({
      name: api_subscriptions.CATEGORIES[item.category] || item.category,
      value: item.value,
      percent: item.percent,
      color: pages_subscription_subscriptionData.CATEGORY_COLORS[api_subscriptions.CATEGORIES[item.category]] || pages_subscription_subscriptionData.CATEGORY_COLORS["其他"]
    }));
  },
  trendData() {
    const values = this.serverStats.month ? this.serverStats.month.trend : [];
    const max = Math.max(1, ...values.map((item) => item.value));
    return values.map((item) => ({ ...item, month: `${Number(item.month.slice(5))}月`, height: Math.max(8, Math.round(item.value / max * 100)) }));
  }
};
const remoteMethods = {
  clearAccountData() {
    this.subscriptions = [];
    this.settings = pages_subscription_subscriptionData.createDefaultSettings();
    this.notifications = { configured: false, schedulerEnabled: false, credits: 0, recentDeliveries: [] };
    this.notificationError = "";
    this.serverStats = {};
    this.serverReminders = [];
    this.statsRequestId++;
    this.statsLoading = false;
    this.statsError = "";
    this.subscriptionLimit = null;
    this.selectedId = null;
    this.editingId = null;
    this.originalBillingDate = null;
    this.form = {};
    this.formBaseline = "";
    this.formError = "";
    this.dataReady = false;
    this.activeView = "home";
    this.viewStack = [];
    this.serviceTemplates = [];
    this.categories = [];
    this.cycles = [];
    this.payments = [];
    this.currencies = [];
    this.resetFilters();
  },
  applyMembership(membership) {
    this.settings = { ...this.settings, membership: { ...membership, plan: membership.status === "active" ? "会员版" : "免费版", startedAt: membership.startedAt ? new Date(membership.startedAt).getTime() : null } };
    this.subscriptionLimit = membership.quota.limit;
  },
  applyCatalog(catalog) {
    this.categories = catalog.categories.map((key) => api_subscriptions.CATEGORIES[key] || key);
    this.cycles = catalog.cycles.map((key) => api_subscriptions.CYCLES[key] || key);
    this.payments = catalog.paymentMethods.map((key) => api_subscriptions.PAYMENTS[key] || key);
    this.currencies = catalog.currencies;
    this.serviceTemplates = catalog.templates.filter((item) => item.category !== "ai").map((item) => ({ ...item, category: api_subscriptions.CATEGORIES[item.category], cycle: api_subscriptions.CYCLES[item.cycle], payment: api_subscriptions.PAYMENTS[item.payment], short: item.shortName, icon: "star-filled" }));
  },
  async refreshData() {
    var _a;
    if (this.loading || this.mutating)
      return false;
    this.loading = true;
    this.loadError = "";
    this.loadErrorCode = "";
    this.loadErrorRequestId = "";
    try {
      let session = await api_auth.ensureSession();
      if (this.currentUserId && this.currentUserId !== session.user.id) {
        this.clearAccountData();
      }
      this.currentUserId = session.user.id;
      this.authStatus = "authenticated";
      this.notificationError = "";
      try {
        let notifications = await api_notifications.notificationApi.status();
        if (notifications.configured && !notifications.identityLinked) {
          api_auth.clearSession(session.accessToken);
          session = await api_auth.ensureSession();
          if (this.currentUserId !== session.user.id)
            this.clearAccountData();
          this.currentUserId = session.user.id;
          notifications = await api_notifications.notificationApi.status();
        }
        if (notifications.configured)
          notifications = await api_notifications.syncPendingAuthorization(this.currentUserId) || notifications;
        this.notifications = notifications;
      } catch (error) {
        if (error.status === 401 || ["WECHAT_LOGIN_FAILED", "WECHAT_UNAVAILABLE", "AUTH_NOT_CONFIGURED"].includes(error.code))
          throw error;
        this.notificationError = error.message;
      }
      const [subscriptions, settings, membership, catalog, reminders] = await Promise.all([
        api_subscriptions.subscriptionApi.listAll(),
        api_subscriptions.subscriptionApi.settings(),
        api_subscriptions.subscriptionApi.membership(),
        api_subscriptions.subscriptionApi.catalog(),
        api_subscriptions.subscriptionApi.reminders()
      ]);
      if (((_a = api_auth.getSession()) == null ? void 0 : _a.user.id) !== this.currentUserId) {
        this.clearAccountData();
        throw Object.assign(new Error("账号已切换，请重新加载"), { code: "AUTH_ACCOUNT_CHANGED" });
      }
      this.subscriptions = subscriptions;
      this.settings = { ...pages_subscription_subscriptionData.createDefaultSettings(), ...settings };
      this.applyMembership(membership);
      this.applyCatalog(catalog);
      this.serverReminders = reminders.data;
      if (!this.dataReady)
        this.statsCurrency = settings.defaultCurrency;
      this.dataReady = true;
      if (this.selectedId && !this.selectedSubscription) {
        this.selectedId = null;
        this.switchTab("all");
      }
      await this.refreshStats();
      return true;
    } catch (error) {
      if (error.status === 401 || ["WECHAT_LOGIN_FAILED", "WECHAT_UNAVAILABLE", "AUTH_NOT_CONFIGURED"].includes(error.code)) {
        this.authStatus = "unauthenticated";
        this.clearAccountData();
      }
      this.loadError = error.message;
      this.loadErrorCode = error.code || "UNKNOWN_ERROR";
      this.loadErrorRequestId = error.requestId || "";
      return false;
    } finally {
      this.loading = false;
    }
  },
  async refreshStats() {
    const sequence = ++this.statsRequestId;
    const currency = this.statsCurrency;
    this.statsLoading = true;
    this.statsError = "";
    this.statsErrorCode = "";
    this.statsErrorRequestId = "";
    this.serverStats = {};
    try {
      const values = await Promise.all(["month", "year", "next30"].map((period) => api_subscriptions.subscriptionApi.stats(period, currency)));
      if (sequence !== this.statsRequestId)
        return;
      this.serverStats = Object.fromEntries(values.map((value) => [value.period, value]));
    } catch (error) {
      if (sequence === this.statsRequestId) {
        this.statsError = error.message;
        this.statsErrorCode = error.code || "UNKNOWN_ERROR";
        this.statsErrorRequestId = error.requestId || "";
      }
    } finally {
      if (sequence === this.statsRequestId)
        this.statsLoading = false;
    }
  },
  changeStatsCurrency(currency) {
    if (currency === this.statsCurrency)
      return;
    this.statsCurrency = currency;
    this.refreshStats();
  },
  upsertSubscription(item) {
    const index = this.subscriptions.findIndex((row) => row.id === item.id);
    if (index < 0)
      this.subscriptions.push(item);
    else
      this.subscriptions.splice(index, 1, item);
  },
  async mutate(operation, successMessage, applyResult = (result) => this.upsertSubscription(result)) {
    if (this.mutating || this.loading || !this.dataReady)
      return false;
    if (this.loadError) {
      toast("请先刷新数据，确认当前状态后再操作");
      return false;
    }
    this.mutating = true;
    if (common_vendor.index.showLoading)
      common_vendor.index.showLoading({ title: "正在保存", mask: true });
    let operationError = null;
    try {
      if (this.currentUserId && (await api_auth.ensureSession()).user.id !== this.currentUserId) {
        this.clearAccountData();
        this.loadError = "账号已切换，请重新加载后操作";
        this.loadErrorCode = "AUTH_ACCOUNT_CHANGED";
        throw new Error("账号已切换，请重新加载后操作");
      }
      const result = await operation();
      applyResult(result);
    } catch (error) {
      operationError = error;
      this.formError = error.message;
      if (error.uncertain) {
        this.loadError = "操作结果尚未确认，请重新加载后再继续操作";
        this.loadErrorCode = "RESULT_UNKNOWN";
        this.loadErrorRequestId = error.requestId || "";
      }
    } finally {
      if (common_vendor.index.hideLoading)
        common_vendor.index.hideLoading();
      this.mutating = false;
    }
    if (operationError) {
      toast(operationError.message);
      return false;
    }
    await this.refreshData();
    if (successMessage)
      toast(successMessage);
    return true;
  },
  async openDetail(item) {
    if (this.loading || this.mutating)
      return;
    this.loading = true;
    try {
      const detail = await api_subscriptions.subscriptionApi.detail(item.id);
      this.upsertSubscription(detail);
      this.selectedId = detail.id;
      this.navigateToView("detail");
    } catch (error) {
      toast(error.message);
    } finally {
      this.loading = false;
    }
  },
  async saveSubscription(force = false) {
    if (this.loading || this.mutating || !this.dataReady)
      return;
    if (!this.editingId && !this.canCreateSubscription)
      return this.showMembershipLimit();
    this.form.name = (this.form.name || "").trim();
    this.formError = this.validateForm();
    if (this.formError)
      return toast(this.formError);
    const payload = api_subscriptions.toSubscription(this.form, Boolean(this.editingId));
    const duplicate = !this.editingId && this.activeSubscriptions.find((item) => item.name === payload.name && item.currency === payload.currency && item.amount === payload.amount && Math.abs(pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) - pages_subscription_subscriptionData.daysUntil(payload.nextBillingDate)) <= 3);
    if (duplicate && force !== true) {
      if (await confirm({ title: "可能重复录入", content: `已有“${duplicate.name}”在相近日期扣费，仍要继续保存吗？`, confirmText: "继续保存" }))
        return this.saveSubscription(true);
      return;
    }
    const id = this.editingId;
    const form = { ...this.form };
    const saved = await this.mutate(() => id ? api_subscriptions.subscriptionApi.update(id, payload) : api_subscriptions.subscriptionApi.create(form), id ? "修改已保存" : "订阅已添加", (item) => {
      this.upsertSubscription(item);
      this.selectedId = item.id;
    });
    if (!saved)
      return;
    if (id && this.viewStack[this.viewStack.length - 1] === "detail")
      this.viewStack.pop();
    this.activeView = "detail";
    this.editingId = null;
    this.originalBillingDate = null;
    this.formError = "";
    this.scrollToTop();
  },
  async confirmRenewal() {
    const item = this.selectedSubscription;
    if (!item || this.renewalLocked || this.mutating)
      return;
    const id = item.id, billingDate = item.nextBillingDate;
    if (!await confirm({ title: "确认本次付款", content: `确认 ${pages_subscription_subscriptionData.formatDate(billingDate)} 已完成${item.cycle === "一次性" ? "付款？确认后自动归档。" : "续费？确认后将推进下一扣费日。"}`, confirmText: "确认完成" }))
      return;
    await this.mutate(() => api_subscriptions.subscriptionApi.renew(id, billingDate), item.cycle === "一次性" ? "已完成并归档" : "本期续费已确认");
  },
  async undoRenewal() {
    const item = this.selectedSubscription;
    if (!item || !this.renewalLocked)
      return;
    if (!await confirm({ title: "撤销本次确认", content: `扣费日将恢复为 ${pages_subscription_subscriptionData.formatDate(item.lastRenewedBillingDate)}。`, confirmText: "确认撤销" }))
      return;
    await this.mutate(() => api_subscriptions.subscriptionApi.undo(item.id), "已撤销本次确认");
  },
  async snoozeSubscription() {
    const item = this.selectedSubscription;
    if (!item)
      return;
    if (!await confirm({ title: "稍后处理", content: "将保留为站内待办，扣费日和提醒节点不变，不额外安排微信通知。", confirmText: "加入待办" }))
      return;
    await this.mutate(() => api_subscriptions.subscriptionApi.update(item.id, { status: "pending" }), "已加入站内待办");
  },
  async handleSubscriptionAction(action) {
    const item = this.selectedSubscription;
    if (!item || this.mutating)
      return;
    if (action === "cancel")
      return this.cancelSubscription();
    if (action === "delete")
      return this.deleteSubscription();
    if (action === "copy") {
      if (!this.canCreateSubscription)
        return this.showMembershipLimit();
      this.openForm();
      this.form = { ...this.form, ...item, name: `${item.name.slice(0, 27)} 副本`, amount: item.amount === null ? "" : String(item.amount), status: "active", reminders: [...item.reminders] };
      return;
    }
    if (action === "resume" || action === "restore") {
      if (pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) < 0) {
        if (await confirm({ title: "需要更新日期", content: "原扣费日已过，请选择新的扣费日并保存后恢复。", confirmText: "去修改" })) {
          this.openForm(null, item);
          this.form.status = "active";
        }
        return;
      }
    }
    const status = { pause: "paused", resume: "active", restore: "active", archive: "archived" }[action];
    if (status)
      await this.mutate(() => api_subscriptions.subscriptionApi.update(item.id, { status }), "订阅状态已更新");
  },
  async cancelSubscription() {
    const item = this.selectedSubscription;
    if (!item)
      return;
    if (!await confirm({ title: `标记“${item.name}”已取消`, content: `请确认已在原付款渠道完成取消。本工具只更新记录。${item.cancelGuide ? "\n取消路径：" + item.cancelGuide : ""}`, confirmText: "我已取消" }))
      return;
    await this.mutate(() => api_subscriptions.subscriptionApi.update(item.id, { status: "cancelled", autoRenew: false }), "已标记取消");
  },
  async deleteSubscription() {
    const item = this.selectedSubscription;
    if (!item)
      return;
    if (!await confirm({ title: `删除“${item.name}”`, content: "订阅将移入回收站，可在“我的”中恢复。", confirmText: "移入回收站" }))
      return;
    await this.mutate(() => api_subscriptions.subscriptionApi.remove(item.id), "已移入回收站", (record) => {
      this.upsertSubscription(record);
      this.selectedId = null;
      this.switchTab("all");
    });
  },
  openTrash() {
    if (!this.deletedSubscriptions.length)
      return toast("回收站是空的");
    this.trashPage = 0;
    this.showTrashPage();
  },
  showTrashPage() {
    const items = this.deletedSubscriptions.slice(this.trashPage * 4, this.trashPage * 4 + 4);
    const labels = items.map((item) => `恢复 ${item.name}`);
    const hasNext = (this.trashPage + 1) * 4 < this.deletedSubscriptions.length;
    if (hasNext)
      labels.push("下一页");
    if (this.trashPage > 0)
      labels.push("上一页");
    common_vendor.index.showActionSheet({ itemList: labels, success: async (result) => {
      if (result.tapIndex >= items.length) {
        this.trashPage += hasNext && result.tapIndex === items.length ? 1 : -1;
        return this.showTrashPage();
      }
      const item = items[result.tapIndex];
      await this.mutate(() => api_subscriptions.subscriptionApi.restore(item.id), "订阅已恢复");
    } });
  },
  async updateSetting(key, value) {
    await this.mutate(() => api_subscriptions.subscriptionApi.updateSettings({ [key]: value }), "", (settings) => {
      this.settings = { ...this.settings, ...settings };
    });
  },
  toggleAmount() {
    return this.updateSetting("amountVisible", !this.settings.amountVisible);
  },
  async updateDefaultCurrency(value) {
    await this.updateSetting("defaultCurrency", value);
    this.changeStatsCurrency(this.settings.defaultCurrency);
  },
  toggleDefaultReminder(value) {
    const list = [...this.settings.defaultReminders];
    const index = list.indexOf(value);
    if (index >= 0) {
      if (list.length === 1)
        return toast("至少保留一个提醒节点");
      list.splice(index, 1);
    } else
      list.push(value);
    return this.updateSetting("defaultReminders", list.sort((a, b) => b - a));
  },
  async enableNotification() {
    var _a;
    if (this.notificationAuthorizing || this.loading || this.mutating || !this.dataReady)
      return;
    if (((_a = api_auth.getSession()) == null ? void 0 : _a.user.id) !== this.currentUserId) {
      this.clearAccountData();
      this.loadError = "登录状态已变化，请重新加载后授权";
      this.loadErrorCode = "AUTH_ACCOUNT_CHANGED";
      return toast(this.loadError);
    }
    if (this.notificationError || !this.notifications.configured || !this.notifications.schedulerEnabled)
      return toast(this.notificationDescription);
    if (this.notificationAuthorized) {
      if (!this.settings.notificationEnabled)
        return this.updateSetting("notificationEnabled", true);
      if (this.notifications.subscriptionType === "long_term")
        return toast("长期提醒已开启");
    }
    this.notificationAuthorizing = true;
    try {
      const { status, answer } = await api_notifications.requestNotificationAuthorization(this.notifications.templateId, this.currentUserId);
      this.notifications = status;
      this.settings.notificationEnabled = status.enabled;
      toast(answer === "accept" ? status.subscriptionType === "long_term" ? "已开启长期提醒" : "已增加一次通知授权" : answer === "ban" ? "微信通知已关闭" : "本次未授权");
    } catch (error) {
      toast(error.message + "；授权记录将在刷新时重新确认");
    } finally {
      this.notificationAuthorizing = false;
    }
  },
  showNotificationHistory() {
    const labels = { sent: "已发送", failed: "发送失败", unknown: "结果未知，不自动重发", sending: "发送中", skipped: "记录已变更，未发送" };
    const rows = this.notifications.recentDeliveries || [];
    common_vendor.index.showModal({ title: "最近通知记录", content: rows.length ? rows.slice(0, 8).map((row) => `${row.subscriptionName} · ${row.billingDate}
${labels[row.status] || row.status}${row.errorCode ? `（${row.errorCode}）` : ""}`).join("\n\n") : `暂无发送记录。授权后会按提醒日期与时间发送；${this.notifications.subscriptionType === "long_term" ? "长期授权可持续接收提醒，可随时暂停。" : "每条消息使用一次授权。"}`, showCancel: false });
  },
  handleNotificationSwitch(value) {
    if (value)
      this.enableNotification();
    else
      this.updateSetting("notificationEnabled", false);
  },
  nextReminderText(item) {
    if (["paused", "cancelled", "archived"].includes(item.status))
      return "已停止提醒";
    if (item.amount === null)
      return "请填写金额后接收微信通知";
    if (this.notificationReady)
      return `按提醒节点于 ${this.settings.reminderTime} 发送微信通知${this.notifications.subscriptionType === "long_term" ? "" : "，每条使用一次授权"}`;
    const reminder = this.serverReminders.find((row) => row.subscription.id === item.id);
    return reminder ? reminder.nextReminderInDays === 0 ? "当前有站内到期待办，请授权微信通知" : `${reminder.nextReminderInDays} 天后进入站内提醒窗口` : "请在“我的”中开启微信通知";
  },
  showPrivacy() {
    common_vendor.index.showModal({ title: "隐私与数据说明", content: `小程序通过微信登录识别账号，订阅、备注和设置发送至后端并按账号保存。后端保存微信账号标识，用于发送你授权的订阅消息，消息含扣费日期和金额。${this.notifications.subscriptionType === "long_term" ? "长期授权后可持续接收提醒" : "每次授权允许发送一条消息"}；可在“我的”中暂停。登录凭证保存在本机，不获取昵称、头像或手机号。`, showCancel: false });
  }
};
exports.remoteComputed = remoteComputed;
exports.remoteMethods = remoteMethods;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/subscription-remote.js.map
