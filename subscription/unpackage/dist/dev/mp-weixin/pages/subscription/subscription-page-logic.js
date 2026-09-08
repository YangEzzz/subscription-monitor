"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_subscription_subscriptionRemote = require("./subscription-remote.js");
const pages_subscription_subscriptionData = require("./subscription-data.js");
function createSubscriptionPageState() {
  const today = pages_subscription_subscriptionData.toDateKey(/* @__PURE__ */ new Date());
  return {
    activeView: "home",
    viewStack: [],
    scrollTop: 0,
    statusBarHeight: 20,
    navigationBarHeight: 44,
    tabs: [
      { key: "home", label: "首页", icon: "home", activeIcon: "home-filled" },
      { key: "all", label: "订阅", icon: "list", activeIcon: "list" },
      { key: "calendar", label: "日历", icon: "calendar", activeIcon: "calendar-filled" },
      { key: "stats", label: "统计", icon: "wallet", activeIcon: "wallet-filled" },
      { key: "profile", label: "我的", icon: "person", activeIcon: "person-filled" }
    ],
    subscriptions: [],
    settings: pages_subscription_subscriptionData.createDefaultSettings(),
    authStatus: "demo",
    loading: false,
    mutating: false,
    dataReady: false,
    loadError: "",
    serverStats: {},
    serverReminders: [],
    statsRequestId: 0,
    statsLoading: false,
    statsError: "",
    trashPage: 0,
    subscribeTemplateIds: [],
    // 填写微信公众平台中的订阅消息模板 ID
    subscriptionLimit: 5,
    searchKeyword: "",
    activeCategory: "全部",
    activeStatus: "default",
    sortMode: "date",
    sortSheetVisible: false,
    sortOptions: [
      { value: "date", label: "按扣费日期", desc: "即将扣费的订阅排在前面", icon: "calendar" },
      { value: "amount", label: "按金额从高到低", desc: "优先查看支出较高的订阅", icon: "wallet" },
      { value: "created", label: "按添加时间", desc: "最近添加的订阅排在前面", icon: "compose" }
    ],
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    calendarCursor: today.slice(0, 7) + "-01",
    selectedDate: today,
    statsPeriod: "month",
    statsCurrency: "CNY",
    statPeriods: [{ value: "month", label: "月均" }, { value: "year", label: "年度" }, { value: "next", label: "未来30天" }],
    selectedId: null,
    editingId: null,
    originalBillingDate: null,
    formError: "",
    formBaseline: "",
    categories: ["影音娱乐", "音乐", "云存储", "AI 工具", "效率工具", "阅读", "其他"],
    cycles: ["每周", "每月", "每季度", "每半年", "每年", "自定义天数", "一次性"],
    payments: ["微信支付", "支付宝", "App Store", "信用卡", "官网", "其他"],
    currencies: ["CNY", "USD", "HKD", "JPY"],
    logoColors: ["#16834d", "#3f91ed", "#ef3943", "#e43c86", "#6658d9", "#202622"],
    reminderOptions: [{ value: 14, label: "提前 14 天", desc: "适合年度或高金额订阅" }, { value: 7, label: "提前 7 天", desc: "预留充分处理时间" }, { value: 3, label: "提前 3 天", desc: "默认提醒节点" }, { value: 1, label: "提前 1 天", desc: "临近扣费再次确认" }, { value: 0, label: "扣费当天", desc: "当天站内待办" }],
    serviceTemplates: [
      { name: "腾讯视频 VIP", short: "腾讯视频", plan: "连续包月", logo: "视", icon: "videocam-filled", color: "#19a768", category: "影音娱乐", amount: 25, payment: "微信支付" },
      { name: "网易云音乐黑胶 VIP", short: "网易云", plan: "黑胶 VIP", logo: "音", icon: "headphones", color: "#ef3943", category: "音乐", amount: 15, payment: "微信支付" },
      { name: "iCloud+ 200GB", short: "iCloud", plan: "200GB", logo: "云", icon: "cloud-upload-filled", color: "#3f98ee", category: "云存储", amount: 21, payment: "App Store" },
      { name: "ChatGPT Plus", short: "ChatGPT", plan: "Plus", logo: "AI", icon: "loop", color: "#1f9c70", category: "AI 工具", amount: 145, payment: "信用卡" }
    ],
    form: {}
  };
}
const subscriptionComputed = {
  ...pages_subscription_subscriptionRemote.remoteComputed,
  todayKey() {
    return pages_subscription_subscriptionData.toDateKey(/* @__PURE__ */ new Date());
  },
  showTabBar() {
    return ["home", "all", "calendar", "stats", "profile"].includes(this.activeView);
  },
  liveSubscriptions() {
    return this.subscriptions.filter((item) => !item.deletedAt);
  },
  deletedSubscriptions() {
    return this.subscriptions.filter((item) => item.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
  },
  quotaSubscriptions() {
    return this.liveSubscriptions.filter((item) => !item.isDemo);
  },
  isMember() {
    return this.settings.membership && this.settings.membership.status === "active";
  },
  canCreateSubscription() {
    return this.isMember || this.quotaSubscriptions.length < this.subscriptionLimit;
  },
  freeQuotaText() {
    return this.quotaSubscriptions.length >= this.subscriptionLimit ? `免费额度已用完 · ${this.quotaSubscriptions.length} / ${this.subscriptionLimit}` : `已使用 ${this.quotaSubscriptions.length} / ${this.subscriptionLimit} · 演示数据不计入`;
  },
  freeQuotaValue() {
    return `${this.quotaSubscriptions.length} / ${this.subscriptionLimit}`;
  },
  membershipQuotaPercent() {
    return Math.min(100, this.quotaSubscriptions.length / this.subscriptionLimit * 100);
  },
  selectedSubscription() {
    return this.liveSubscriptions.find((item) => item.id === this.selectedId) || null;
  },
  selectedRenewalHistory() {
    return this.selectedSubscription ? (this.selectedSubscription.renewalHistory || []).slice().reverse().slice(0, 3) : [];
  },
  selectedNextReminderText() {
    return this.selectedSubscription ? this.nextReminderText(this.selectedSubscription) : "";
  },
  renewalLocked() {
    const item = this.selectedSubscription;
    return Boolean(item && item.lastRenewedAt && item.lastRenewalNextBillingDate === item.nextBillingDate && Date.now() - item.lastRenewedAt < 10 * 60 * 1e3);
  },
  activeSubscriptions() {
    return this.liveSubscriptions.filter((item) => !["cancelled", "archived", "paused"].includes(item.status)).sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
  },
  next30Subscriptions() {
    return this.activeSubscriptions.filter((item) => pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) >= 0 && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) <= 30);
  },
  upcoming7() {
    return this.next30Subscriptions.filter((item) => pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) <= 7);
  },
  upcoming30Later() {
    return this.next30Subscriptions.filter((item) => pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) > 7);
  },
  next30Total() {
    return this.next30Subscriptions.filter((item) => item.currency === this.statsCurrency).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  },
  next30TotalText() {
    return this.formatCurrencyTotals(this.next30Subscriptions, (item) => Number(item.amount || 0));
  },
  monthlyAverage() {
    return this.liveSubscriptions.filter((item) => item.currency === this.statsCurrency).reduce((sum, item) => sum + (item.monthlyEquivalent ?? pages_subscription_subscriptionData.getMonthlyEquivalent(item)), 0);
  },
  monthlyAverageText() {
    return this.formatCurrencyTotals(this.liveSubscriptions, (item) => item.monthlyEquivalent ?? pages_subscription_subscriptionData.getMonthlyEquivalent(item));
  },
  actionableReminders() {
    const list = [];
    if (!this.settings.notificationEnabled)
      list.push({ key: "notification", tone: "warning", icon: "notification", title: "当前仅支持站内提醒", desc: "当前只能在小程序内查看到期待办", action: "notification" });
    const overdue = this.liveSubscriptions.filter((item) => !["cancelled", "archived", "paused"].includes(item.status) && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) < 0);
    if (overdue.length)
      list.push({ key: "overdue", tone: "danger", icon: "info-filled", title: `${overdue.length} 项订阅已逾期未确认`, desc: "请确认是否已完成续费", action: "overdue" });
    const pending = this.liveSubscriptions.filter((item) => item.status === "pending" && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) >= 0);
    if (pending.length)
      list.push({ key: "pending", tone: "warning", icon: "redo", title: `${pending.length} 项等待稍后处理`, desc: "已保留在站内待办中", action: "pending" });
    const incomplete = this.liveSubscriptions.filter((item) => item.amount === null);
    if (incomplete.length)
      list.push({ key: "incomplete", tone: "info", icon: "compose", title: `${incomplete.length} 项金额待补充`, desc: "补充后统计结果会更准确", action: "incomplete" });
    if (!list.length)
      list.push({ key: "done", tone: "success", icon: "checkbox-filled", title: "订阅状态良好", desc: "当前没有需要立即处理的事项", action: "none" });
    return list.slice(0, 3);
  },
  categoryFilters() {
    const counts = this.liveSubscriptions.reduce((map, item) => {
      map[item.category] = (map[item.category] || 0) + 1;
      return map;
    }, {});
    return [{ name: "全部", count: this.liveSubscriptions.length }].concat(Object.keys(counts).sort().map((name) => ({ name, count: counts[name] })));
  },
  statusFilters() {
    return [{ value: "all", label: "全部状态" }, { value: "default", label: "有效订阅" }, { value: "trial", label: "试用中" }, { value: "upcoming", label: "即将到期" }, { value: "pending", label: "待处理" }, { value: "overdue", label: "逾期未确认" }, { value: "incomplete", label: "金额待补充" }, { value: "paused", label: "已暂停" }, { value: "cancelled", label: "已取消" }, { value: "archived", label: "已归档" }];
  },
  activeStatusLabel() {
    return (this.statusFilters.find((item) => item.value === this.activeStatus) || {}).label || "全部状态";
  },
  sortLabel() {
    return { date: "按扣费日排序", amount: "按金额排序", created: "按创建时间排序" }[this.sortMode];
  },
  visibleSubscriptions() {
    let list = this.liveSubscriptions.filter((item) => this.activeCategory === "全部" || item.category === this.activeCategory);
    if (this.activeStatus === "default")
      list = list.filter((item) => !["cancelled", "archived", "paused"].includes(item.status));
    else if (this.activeStatus === "incomplete")
      list = list.filter((item) => item.amount === null || item.amount === "");
    else if (this.activeStatus === "overdue")
      list = list.filter((item) => !["cancelled", "archived", "paused"].includes(item.status) && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) < 0);
    else if (this.activeStatus !== "all")
      list = list.filter((item) => this.getStatus(item) === this.activeStatus);
    if (this.searchKeyword) {
      const word = this.searchKeyword.toLowerCase();
      list = list.filter((item) => `${item.name} ${item.plan || ""}`.toLowerCase().includes(word));
    }
    return list.slice().sort((a, b) => this.sortMode === "amount" ? Number(b.amount || 0) - Number(a.amount || 0) : this.sortMode === "created" ? b.createdAt - a.createdAt : a.nextBillingDate.localeCompare(b.nextBillingDate));
  },
  calendarTitle() {
    const date = pages_subscription_subscriptionData.parseDate(this.calendarCursor);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  },
  calendarDays() {
    const cursor = pages_subscription_subscriptionData.parseDate(this.calendarCursor), year = cursor.getFullYear(), month = cursor.getMonth(), firstWeekday = new Date(year, month, 1).getDay(), result = [];
    for (let index = 0; index < 42; index++) {
      const date = new Date(year, month, index - firstWeekday + 1, 12);
      const key = pages_subscription_subscriptionData.toDateKey(date);
      const items = this.liveSubscriptions.filter((item) => item.nextBillingDate === key && !["cancelled", "archived", "paused"].includes(item.status));
      result.push({ key, day: date.getDate(), currentMonth: date.getMonth() === month, count: items.length, amountText: this.formatCompactTotals(items) });
    }
    return result;
  },
  selectedDateSubscriptions() {
    return this.liveSubscriptions.filter((item) => item.nextBillingDate === this.selectedDate && !["cancelled", "archived", "paused"].includes(item.status));
  },
  selectedDateTotalText() {
    return this.formatCurrencyTotals(this.selectedDateSubscriptions, (item) => Number(item.amount || 0));
  },
  selectedDateTitle() {
    return pages_subscription_subscriptionData.formatDate(this.selectedDate, false);
  },
  selectedWeekday() {
    return `星期${this.weekdays[pages_subscription_subscriptionData.parseDate(this.selectedDate).getDay()]}`;
  },
  statsLabel() {
    return { month: "月均订阅支出（估算）", year: "年度预计支出", next: "未来 30 天预计扣费" }[this.statsPeriod];
  },
  donutBackground() {
    let start = 0;
    const stops = this.categoryStats.map((item) => {
      const end = Math.min(100, start + item.percent);
      const stop = `${item.color} ${start}% ${end}%`;
      start = end;
      return stop;
    });
    return stops.length ? `conic-gradient(${stops.join(",")})` : "#e7ece8";
  },
  formReminderPreview() {
    if (!this.form.nextBillingDate || !this.form.reminders || !this.form.reminders.length)
      return "未设置提醒";
    const maxDay = Math.max(...this.form.reminders);
    return `${pages_subscription_subscriptionData.formatDate(pages_subscription_subscriptionData.addDays(this.form.nextBillingDate, -maxDay))} ${this.settings.reminderTime}`;
  }
};
const subscriptionLifecycle = {
  onLoad() {
    this.initNavigationLayout();
    this.refreshData();
  },
  onBackPress() {
    if (this.sortSheetVisible) {
      this.closeSortSheet();
      return true;
    }
    if (this.showTabBar)
      return false;
    this.goBackView("home");
    return true;
  }
};
const subscriptionMethods = {
  ...pages_subscription_subscriptionRemote.remoteMethods,
  formatDate: pages_subscription_subscriptionData.formatDate,
  getStatus(item) {
    return item.displayStatus || pages_subscription_subscriptionData.getDisplayStatus(item);
  },
  cycleText(item) {
    if (!item)
      return "";
    return item.cycle === "自定义天数" ? `每 ${item.cycleValue || "?"} 天` : item.cycle;
  },
  initNavigationLayout() {
    try {
      const windowInfo = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : common_vendor.index.getSystemInfoSync();
      const statusBarHeight = Number(windowInfo.statusBarHeight) || 20;
      let navigationBarHeight = 44;
      if (typeof common_vendor.index.getMenuButtonBoundingClientRect === "function") {
        const menu = common_vendor.index.getMenuButtonBoundingClientRect();
        const calculatedHeight = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 0;
        if (calculatedHeight >= 40 && calculatedHeight <= 56)
          navigationBarHeight = calculatedHeight;
      }
      this.statusBarHeight = statusBarHeight;
      this.navigationBarHeight = navigationBarHeight;
    } catch (error) {
      this.statusBarHeight = 20;
      this.navigationBarHeight = 44;
    }
  },
  formatMoney(value, currency = "CNY") {
    if (value === null || value === "" || Number.isNaN(Number(value)))
      return "金额待补充";
    return `${pages_subscription_subscriptionData.CURRENCY_SYMBOLS[currency] || currency + " "}${Number(value).toFixed(2)}`;
  },
  formatCurrencyTotals(items, valueGetter) {
    const totals = items.reduce((map, item) => {
      const value = Number(valueGetter(item) || 0);
      if (value)
        map[item.currency || "CNY"] = (map[item.currency || "CNY"] || 0) + value;
      return map;
    }, {});
    const entries = Object.keys(totals).map((currency) => this.formatMoney(totals[currency], currency));
    return entries.length ? entries.join(" + ") : this.formatMoney(0, this.settings.defaultCurrency);
  },
  formatCompactTotals(items) {
    const currencies = [...new Set(items.filter((item) => item.amount !== null).map((item) => item.currency || "CNY"))];
    if (!currencies.length)
      return "";
    if (currencies.length > 1)
      return "多币种";
    const currency = currencies[0], total = items.filter((item) => (item.currency || "CNY") === currency).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `${pages_subscription_subscriptionData.CURRENCY_SYMBOLS[currency] || currency}${this.compactAmount(total)}`;
  },
  compactAmount(value) {
    const number = Number(value || 0);
    return number >= 1e3 ? `${(number / 1e3).toFixed(1)}k` : Math.round(number);
  },
  handleKeyboardAction(event) {
  },
  daysUntil(dateKey) {
    return pages_subscription_subscriptionData.daysUntil(dateKey);
  },
  statusText(item) {
    return pages_subscription_subscriptionData.STATUS_LABELS[this.getStatus(item)] || "逾期未确认";
  },
  decorateItem(item) {
    return { ...item, shortDate: pages_subscription_subscriptionData.formatDate(item.nextBillingDate, false), days: pages_subscription_subscriptionData.daysUntil(item.nextBillingDate), amountText: item.amount === null ? "待补充" : this.formatMoney(item.amount, item.currency), displayStatus: this.statusText(item) };
  },
  daysText(item) {
    const days = pages_subscription_subscriptionData.daysUntil(item.nextBillingDate);
    return days < 0 ? `已逾期 ${Math.abs(days)} 天` : days === 0 ? "今天扣费" : `${days} 天后`;
  },
  navigateToView(view) {
    if (view === this.activeView)
      return;
    this.viewStack.push(this.activeView);
    this.activeView = view;
    this.scrollToTop();
  },
  goBackView(fallback = "home") {
    if (this.activeView === "form" && this.formBaseline && JSON.stringify(this.form) !== this.formBaseline) {
      common_vendor.index.showModal({ title: "放弃未保存的修改？", content: "返回后，本次修改不会保存。", confirmText: "放弃修改", cancelText: "继续编辑", success: (result) => {
        if (result.confirm) {
          this.formBaseline = "";
          this.goBackView(fallback);
        }
      } });
      return;
    }
    this.activeView = this.viewStack.length ? this.viewStack.pop() : fallback;
    this.formError = "";
    this.scrollToTop();
  },
  switchTab(tab) {
    this.sortSheetVisible = false;
    this.viewStack = [];
    this.activeView = tab;
    this.scrollToTop();
  },
  scrollToTop() {
    this.scrollTop = this.scrollTop === 0 ? 1 : 0;
  },
  handleReminder(item) {
    if (item.action === "notification")
      this.enableNotification();
    else if (item.action === "overdue") {
      this.activeStatus = "overdue";
      this.switchTab("all");
    } else if (item.action === "pending") {
      this.activeStatus = "pending";
      this.switchTab("all");
    } else if (item.action === "incomplete") {
      this.activeStatus = "incomplete";
      this.switchTab("all");
    }
  },
  chooseSort() {
    this.sortSheetVisible = true;
  },
  closeSortSheet() {
    this.sortSheetVisible = false;
  },
  selectSort(value) {
    this.sortMode = value;
    this.sortSheetVisible = false;
  },
  resetFilters() {
    this.searchKeyword = "";
    this.activeCategory = "全部";
    this.activeStatus = "default";
    this.sortMode = "date";
  },
  changeMonth(delta) {
    const date = pages_subscription_subscriptionData.parseDate(this.calendarCursor);
    date.setMonth(date.getMonth() + delta);
    this.calendarCursor = pages_subscription_subscriptionData.toDateKey(date).slice(0, 7) + "-01";
    this.selectedDate = this.calendarCursor;
  },
  goToday() {
    this.calendarCursor = this.todayKey.slice(0, 7) + "-01";
    this.selectedDate = this.todayKey;
  },
  selectDate(key) {
    this.selectedDate = key;
    if (key.slice(0, 7) !== this.calendarCursor.slice(0, 7))
      this.calendarCursor = key.slice(0, 7) + "-01";
  },
  createEmptyForm(date) {
    const nextBillingDate = date || pages_subscription_subscriptionData.addDays(this.todayKey, 7);
    return { name: "", plan: "", logo: "订", color: "#16834d", amount: "", currency: this.settings.defaultCurrency, cycle: "每月", cycleValue: "", nextBillingDate, anchorDay: pages_subscription_subscriptionData.parseDate(nextBillingDate).getDate(), payment: "微信支付", category: "其他", status: "active", autoRenew: true, trial: false, trialEndDate: null, reminders: this.settings.defaultReminders.slice(), note: "", cancelGuide: "" };
  },
  openMembership() {
    this.navigateToView("membership");
  },
  showMembershipLimit() {
    common_vendor.index.showModal({ title: "免费额度已用完", content: `免费版最多保存 ${this.subscriptionLimit} 条订阅，开通会员后可无限新增。`, confirmText: "开通会员", success: (res) => {
      if (res.confirm)
        this.openMembership();
    } });
  },
  openForm(date, item) {
    if (!item && !this.canCreateSubscription) {
      this.showMembershipLimit();
      return;
    }
    this.formError = "";
    this.editingId = item ? item.id : null;
    this.originalBillingDate = item ? item.nextBillingDate : null;
    this.form = item ? { ...item, amount: item.amount === null ? "" : String(item.amount), cycleValue: item.cycleValue || "", trial: Boolean(item.trialEndDate), trialEndDate: item.trialEndDate || null, reminders: (item.reminders || []).slice() } : this.createEmptyForm(date);
    this.formBaseline = JSON.stringify(this.form);
    this.navigateToView("form");
  },
  applyTemplate(template) {
    Object.assign(this.form, { ...template, amount: template.amount == null ? "" : String(template.amount) });
    common_vendor.index.showToast({ title: `已选择${template.short}`, icon: "none" });
  },
  toggleReminder(value) {
    const index = this.form.reminders.indexOf(value);
    if (index >= 0)
      this.form.reminders.splice(index, 1);
    else
      this.form.reminders.push(value);
    this.form.reminders.sort((a, b) => b - a);
  },
  changeCycle(value) {
    this.form.cycle = value;
    if (value !== "自定义天数")
      this.form.cycleValue = "";
    if (value === "一次性") {
      this.form.autoRenew = false;
      this.form.trial = false;
      this.form.trialEndDate = null;
    }
  },
  setTrial(value) {
    this.form.trial = Boolean(value);
    if (!this.form.trial)
      this.form.trialEndDate = null;
    else if (!this.form.trialEndDate)
      this.form.trialEndDate = this.form.nextBillingDate;
  },
  validateForm() {
    if (!this.form.name)
      return "请输入服务名称";
    if (this.form.name.length > 30)
      return "服务名称不能超过 30 个字符";
    if (this.form.amount !== "" && (Number.isNaN(Number(this.form.amount)) || Number(this.form.amount) < 0))
      return "金额必须是大于或等于 0 的数字";
    if (this.form.amount !== "" && !/^\d+(\.\d{0,2})?$/.test(String(this.form.amount)))
      return "金额最多保留两位小数";
    if (this.form.cycle === "自定义天数" && (!/^\d+$/.test(String(this.form.cycleValue)) || Number(this.form.cycleValue) < 1 || Number(this.form.cycleValue) > 365))
      return "自定义周期请输入1–365天";
    if (!this.form.nextBillingDate || pages_subscription_subscriptionData.daysUntil(this.form.nextBillingDate) < 0)
      return `下次${this.form.autoRenew ? "扣费" : "到期"}日不能早于今天`;
    if (this.form.trial && (!this.form.trialEndDate || pages_subscription_subscriptionData.daysUntil(this.form.trialEndDate) < 0))
      return "试用截止日不能早于今天";
    if (this.form.trial && this.form.trialEndDate > this.form.nextBillingDate)
      return "试用截止日不能晚于下次扣费日";
    if (!this.form.reminders.length)
      return "请至少选择一个提醒节点";
    return "";
  },
  processTitle(item) {
    if (item.status === "pending")
      return "等待你处理";
    const days = pages_subscription_subscriptionData.daysUntil(item.nextBillingDate), subject = item.cycle === "一次性" ? "付款" : item.autoRenew ? "扣费" : "到期";
    return days === 0 ? `今天${subject}` : days > 0 ? `${days} 天后${subject}` : `已逾期 ${Math.abs(days)} 天未确认`;
  },
  showMoreActions() {
    const item = this.selectedSubscription;
    if (!item)
      return;
    const actions = [];
    if (item.status === "archived" || item.status === "cancelled")
      actions.push({ label: "恢复为有效订阅", key: "restore" });
    else
      actions.push({ label: item.status === "paused" ? "恢复订阅" : "暂停订阅", key: item.status === "paused" ? "resume" : "pause" }, { label: "取消订阅", key: "cancel" });
    actions.push({ label: "复制订阅", key: "copy" });
    if (item.status !== "archived")
      actions.push({ label: "归档订阅", key: "archive" });
    actions.push({ label: "删除订阅", key: "delete" });
    common_vendor.index.showActionSheet({ itemList: actions.map((action) => action.label), success: (res) => this.handleSubscriptionAction(actions[res.tapIndex].key) });
  },
  openReminderSettings() {
    this.navigateToView("reminder-settings");
  },
  exportData() {
    if (!this.liveSubscriptions.length)
      return common_vendor.index.showToast({ title: "暂无可导出的订阅", icon: "none" });
    common_vendor.index.showModal({ title: "导出订阅数据", content: `将导出 ${this.liveSubscriptions.length} 条订阅记录，金额和备注等订阅数据会包含在文件中。`, confirmText: "确认导出", success: (res) => {
      if (res.confirm)
        this.performExport();
    } });
  },
  performExport() {
    const header = "服务名称,套餐,分类,金额,币种,周期,下次扣费日,状态,付款渠道,备注";
    const rows = this.liveSubscriptions.map((item) => [item.name, item.plan || "", item.category, item.amount === null ? "" : item.amount, item.currency, this.cycleText(item), item.nextBillingDate, this.statusText(item), item.payment, item.note || ""].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    const csv = [header].concat(rows).join("\n");
    common_vendor.index.setClipboardData({ data: csv, success: () => common_vendor.index.showToast({ title: "表格数据已复制", icon: "success" }) });
  }
};
exports.createSubscriptionPageState = createSubscriptionPageState;
exports.subscriptionComputed = subscriptionComputed;
exports.subscriptionLifecycle = subscriptionLifecycle;
exports.subscriptionMethods = subscriptionMethods;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/subscription-page-logic.js.map
