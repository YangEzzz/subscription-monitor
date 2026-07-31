"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_subscription_subscriptionData = require("./subscription-data.js");
const BrandLogo = () => "../../components/subscription/brand-logo.js";
const SubscriptionRow = () => "../../components/subscription/subscription-row.js";
const _sfc_main = {
  components: { BrandLogo, SubscriptionRow },
  data() {
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
      statPeriods: [{ value: "month", label: "月均" }, { value: "year", label: "年度" }, { value: "next", label: "未来30天" }],
      selectedId: null,
      editingId: null,
      formError: "",
      categories: ["影音娱乐", "音乐", "云存储", "AI 工具", "效率工具", "阅读", "其他"],
      cycles: ["每周", "每月", "每季度", "每半年", "每年", "一次性"],
      payments: ["微信支付", "支付宝", "App Store", "信用卡", "官网", "其他"],
      currencies: ["CNY", "USD", "HKD", "JPY"],
      logoColors: ["#16834d", "#3f91ed", "#ef3943", "#e43c86", "#6658d9", "#202622"],
      reminderOptions: [{ value: 14, label: "提前 14 天", desc: "适合年度或高金额订阅" }, { value: 7, label: "提前 7 天", desc: "预留充分处理时间" }, { value: 3, label: "提前 3 天", desc: "默认提醒节点" }, { value: 1, label: "提前 1 天", desc: "临近扣费再次确认" }, { value: 0, label: "扣费当天", desc: "当天站内待办" }],
      serviceTemplates: [
        { name: "腾讯视频 VIP", short: "腾讯视频", plan: "连续包月", logo: "视", color: "#19a768", category: "影音娱乐", amount: 25, payment: "微信支付" },
        { name: "网易云音乐黑胶 VIP", short: "网易云", plan: "黑胶 VIP", logo: "音", color: "#ef3943", category: "音乐", amount: 15, payment: "微信支付" },
        { name: "iCloud+ 200GB", short: "iCloud", plan: "200GB", logo: "云", color: "#3f98ee", category: "云存储", amount: 21, payment: "App Store" },
        { name: "ChatGPT Plus", short: "ChatGPT", plan: "Plus", logo: "AI", color: "#1f9c70", category: "AI 工具", amount: 145, payment: "信用卡" }
      ],
      form: {}
    };
  },
  computed: {
    todayKey() {
      return pages_subscription_subscriptionData.toDateKey(/* @__PURE__ */ new Date());
    },
    showTabBar() {
      return ["home", "all", "calendar", "stats", "profile"].includes(this.activeView);
    },
    selectedSubscription() {
      return this.subscriptions.find((item) => item.id === this.selectedId) || null;
    },
    selectedRenewalHistory() {
      return this.selectedSubscription ? (this.selectedSubscription.renewalHistory || []).slice().reverse().slice(0, 3) : [];
    },
    renewalLocked() {
      const item = this.selectedSubscription;
      return Boolean(item && item.lastRenewedAt && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) > 0);
    },
    activeSubscriptions() {
      return this.subscriptions.filter((item) => !["cancelled", "archived", "paused"].includes(item.status)).sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
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
      return this.next30Subscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    },
    monthlyAverage() {
      return this.subscriptions.reduce((sum, item) => sum + pages_subscription_subscriptionData.getMonthlyEquivalent(item), 0);
    },
    actionableReminders() {
      const list = [];
      if (!this.settings.notificationEnabled)
        list.push({ key: "notification", tone: "warning", icon: "notification", title: "开启续费提醒", desc: "当前只能在小程序内查看到期待办", action: "notification" });
      const pending = this.subscriptions.filter((item) => pages_subscription_subscriptionData.getDisplayStatus(item) === "pending");
      if (pending.length)
        list.push({ key: "pending", tone: "danger", icon: "info-filled", title: `${pending.length} 项订阅等待处理`, desc: "确认续费、取消或选择稍后处理", action: "pending" });
      const incomplete = this.subscriptions.filter((item) => item.amount === null);
      if (incomplete.length)
        list.push({ key: "incomplete", tone: "info", icon: "compose", title: `${incomplete.length} 项金额待补充`, desc: "补充后统计结果会更准确", action: "incomplete" });
      if (!list.length)
        list.push({ key: "done", tone: "success", icon: "checkbox-filled", title: "订阅状态良好", desc: "当前没有需要立即处理的事项", action: "none" });
      return list.slice(0, 3);
    },
    categoryFilters() {
      const counts = this.subscriptions.reduce((map, item) => {
        map[item.category] = (map[item.category] || 0) + 1;
        return map;
      }, {});
      return [{ name: "全部", count: this.subscriptions.length }].concat(Object.keys(counts).sort().map((name) => ({ name, count: counts[name] })));
    },
    statusFilters() {
      return [{ value: "default", label: "有效订阅" }, { value: "all", label: "全部状态" }, { value: "upcoming", label: "即将到期" }, { value: "pending", label: "待处理" }, { value: "incomplete", label: "金额待补充" }, { value: "paused", label: "已暂停" }, { value: "cancelled", label: "已取消" }, { value: "archived", label: "已归档" }];
    },
    activeStatusLabel() {
      return (this.statusFilters.find((item) => item.value === this.activeStatus) || {}).label || "全部状态";
    },
    sortLabel() {
      return { date: "按扣费日排序", amount: "按金额排序", created: "按创建时间排序" }[this.sortMode];
    },
    visibleSubscriptions() {
      let list = this.subscriptions.filter((item) => this.activeCategory === "全部" || item.category === this.activeCategory);
      if (this.activeStatus === "default")
        list = list.filter((item) => !["cancelled", "archived", "paused"].includes(item.status));
      else if (this.activeStatus === "incomplete")
        list = list.filter((item) => item.amount === null || item.amount === "");
      else if (this.activeStatus !== "all")
        list = list.filter((item) => pages_subscription_subscriptionData.getDisplayStatus(item) === this.activeStatus);
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
        const items = this.subscriptions.filter((item) => item.nextBillingDate === key && !["cancelled", "archived"].includes(item.status));
        result.push({ key, day: date.getDate(), currentMonth: date.getMonth() === month, count: items.length, amount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0) });
      }
      return result;
    },
    selectedDateSubscriptions() {
      return this.subscriptions.filter((item) => item.nextBillingDate === this.selectedDate && !["cancelled", "archived"].includes(item.status));
    },
    selectedDateTotal() {
      return this.selectedDateSubscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    },
    selectedDateTitle() {
      return pages_subscription_subscriptionData.formatDate(this.selectedDate, false);
    },
    selectedWeekday() {
      return `星期${this.weekdays[pages_subscription_subscriptionData.parseDate(this.selectedDate).getDay()]}`;
    },
    statsTotal() {
      if (this.statsPeriod === "year")
        return this.monthlyAverage * 12;
      if (this.statsPeriod === "next")
        return this.next30Total;
      return this.monthlyAverage;
    },
    statsLabel() {
      return { month: "月均订阅支出（估算）", year: "年度预计支出", next: "未来 30 天预计扣费" }[this.statsPeriod];
    },
    statsSubscriptionCount() {
      return this.subscriptions.filter((item) => pages_subscription_subscriptionData.getMonthlyEquivalent(item) > 0).length;
    },
    categoryStats() {
      const map = {}, factor = this.statsPeriod === "year" ? 12 : 1;
      this.subscriptions.forEach((item) => {
        const value = this.statsPeriod === "next" ? this.next30Subscriptions.includes(item) ? Number(item.amount || 0) : 0 : pages_subscription_subscriptionData.getMonthlyEquivalent(item) * factor;
        if (value)
          map[item.category] = (map[item.category] || 0) + value;
      });
      const total = Object.values(map).reduce((sum, value) => sum + value, 0) || 1;
      return Object.keys(map).sort((a, b) => map[b] - map[a]).map((name) => ({ name, value: map[name], percent: Math.round(map[name] / total * 100), color: pages_subscription_subscriptionData.CATEGORY_COLORS[name] || pages_subscription_subscriptionData.CATEGORY_COLORS["其他"] }));
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
    trendData() {
      const cursor = pages_subscription_subscriptionData.parseDate(this.todayKey), values = [];
      for (let offset = 0; offset < 6; offset++) {
        const monthDate = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        let value = 0;
        this.subscriptions.filter((item) => !["cancelled", "archived", "paused"].includes(item.status)).forEach((item) => {
          let billing = pages_subscription_subscriptionData.parseDate(item.nextBillingDate), guard = 0;
          while (billing <= monthEnd && guard < 24) {
            if (billing >= monthDate)
              value += Number(item.amount || 0);
            if (item.cycle === "一次性")
              break;
            billing = pages_subscription_subscriptionData.parseDate(pages_subscription_subscriptionData.getNextBillingDate(pages_subscription_subscriptionData.toDateKey(billing), item.cycle));
            guard++;
          }
        });
        values.push({ month: `${monthDate.getMonth() + 1}月`, value });
      }
      const max = Math.max(...values.map((item) => item.value), 1);
      return values.map((item) => ({ ...item, height: Math.max(8, Math.round(item.value / max * 100)) }));
    },
    formReminderPreview() {
      if (!this.form.nextBillingDate || !this.form.reminders || !this.form.reminders.length)
        return "未设置提醒";
      const maxDay = Math.max(...this.form.reminders);
      return `${pages_subscription_subscriptionData.formatDate(pages_subscription_subscriptionData.addDays(this.form.nextBillingDate, -maxDay))} ${this.settings.reminderTime}`;
    }
  },
  onLoad() {
    this.initNavigationLayout();
    this.loadLocalData();
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
  },
  methods: {
    formatDate: pages_subscription_subscriptionData.formatDate,
    getStatus: pages_subscription_subscriptionData.getDisplayStatus,
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
    formatMoney(value) {
      if (value === null || value === "" || Number.isNaN(Number(value)))
        return "金额待补充";
      return `¥ ${Number(value).toFixed(2)}`;
    },
    compactAmount(value) {
      const number = Number(value || 0);
      return number >= 1e3 ? `${(number / 1e3).toFixed(1)}k` : Math.round(number);
    },
    statusText(item) {
      return pages_subscription_subscriptionData.STATUS_LABELS[pages_subscription_subscriptionData.getDisplayStatus(item)];
    },
    decorateItem(item) {
      return { ...item, shortDate: pages_subscription_subscriptionData.formatDate(item.nextBillingDate, false), days: pages_subscription_subscriptionData.daysUntil(item.nextBillingDate), displayStatus: this.statusText(item) };
    },
    daysText(item) {
      const days = pages_subscription_subscriptionData.daysUntil(item.nextBillingDate);
      return days < 0 ? `已逾期 ${Math.abs(days)} 天` : days === 0 ? "今天扣费" : `${days} 天后`;
    },
    loadLocalData() {
      const saved = common_vendor.index.getStorageSync(pages_subscription_subscriptionData.STORAGE_KEYS.subscriptions), savedSettings = common_vendor.index.getStorageSync(pages_subscription_subscriptionData.STORAGE_KEYS.settings);
      this.subscriptions = Array.isArray(saved) ? saved : pages_subscription_subscriptionData.createSeedSubscriptions();
      this.settings = savedSettings ? { ...pages_subscription_subscriptionData.createDefaultSettings(), ...savedSettings } : pages_subscription_subscriptionData.createDefaultSettings();
      this.persist();
    },
    persist() {
      common_vendor.index.setStorageSync(pages_subscription_subscriptionData.STORAGE_KEYS.subscriptions, this.subscriptions);
      common_vendor.index.setStorageSync(pages_subscription_subscriptionData.STORAGE_KEYS.settings, this.settings);
    },
    navigateToView(view) {
      if (view === this.activeView)
        return;
      this.viewStack.push(this.activeView);
      this.activeView = view;
      this.scrollToTop();
    },
    goBackView(fallback = "home") {
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
    toggleAmount() {
      this.settings.amountVisible = !this.settings.amountVisible;
      this.persist();
    },
    enableNotification() {
      common_vendor.index.showModal({ title: "开启续费提醒", content: "当前未接入后端，将在本地模拟“通知已开启”状态。接入微信订阅消息后需由用户主动授权。", confirmText: "模拟开启", success: (res) => {
        if (res.confirm)
          this.setNotification(true);
      } });
    },
    setNotification(value) {
      this.settings.notificationEnabled = value;
      this.persist();
      common_vendor.index.showToast({ title: value ? "提醒状态已开启" : "提醒状态已关闭", icon: "none" });
    },
    updateSetting(key, value) {
      this.settings[key] = value;
      this.persist();
    },
    handleReminder(item) {
      if (item.action === "notification")
        this.enableNotification();
      else if (item.action === "pending") {
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
    openDetail(item) {
      this.selectedId = item.id;
      this.navigateToView("detail");
    },
    createEmptyForm(date) {
      return { name: "", plan: "", logo: "订", color: "#16834d", amount: "", currency: this.settings.defaultCurrency, cycle: "每月", nextBillingDate: date || pages_subscription_subscriptionData.addDays(this.todayKey, 7), payment: "微信支付", category: "其他", status: "active", autoRenew: true, reminders: this.settings.defaultReminders.slice(), note: "", cancelGuide: "" };
    },
    openForm(date, item) {
      this.formError = "";
      this.editingId = item ? item.id : null;
      this.form = item ? { ...item, amount: item.amount === null ? "" : String(item.amount), reminders: (item.reminders || []).slice() } : this.createEmptyForm(date);
      this.navigateToView("form");
    },
    applyTemplate(template) {
      Object.assign(this.form, { ...template, amount: String(template.amount), cycle: "每月" });
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
    validateForm() {
      if (!this.form.name)
        return "请输入服务名称";
      if (this.form.name.length > 30)
        return "服务名称不能超过 30 个字符";
      if (!this.form.nextBillingDate || pages_subscription_subscriptionData.daysUntil(this.form.nextBillingDate) < 0)
        return "下次扣费日不能早于今天";
      if (this.form.amount !== "" && (Number.isNaN(Number(this.form.amount)) || Number(this.form.amount) < 0))
        return "金额必须是大于或等于 0 的数字";
      if (!this.form.reminders.length)
        return "请至少选择一个提醒节点";
      return "";
    },
    saveSubscription(force = false) {
      this.formError = this.validateForm();
      if (this.formError) {
        common_vendor.index.showToast({ title: this.formError, icon: "none" });
        return;
      }
      const duplicate = !this.editingId && this.subscriptions.find((item) => item.name === this.form.name && Math.abs(pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) - pages_subscription_subscriptionData.daysUntil(this.form.nextBillingDate)) <= 3);
      if (duplicate && !force) {
        common_vendor.index.showModal({ title: "可能重复录入", content: `已有“${duplicate.name}”在相近日期扣费，仍要继续保存吗？`, confirmText: "继续保存", success: (res) => {
          if (res.confirm)
            this.saveSubscription(true);
        } });
        return;
      }
      const wasEditing = Boolean(this.editingId);
      const payload = { ...this.form, amount: this.form.amount === "" ? null : Number(Number(this.form.amount).toFixed(2)), logo: this.form.logo || this.form.name.slice(0, 2), updatedAt: Date.now() };
      if (this.editingId) {
        const index = this.subscriptions.findIndex((item) => item.id === this.editingId);
        payload.id = this.editingId;
        payload.createdAt = this.subscriptions[index].createdAt;
        this.subscriptions.splice(index, 1, payload);
        this.selectedId = payload.id;
      } else {
        payload.id = Date.now();
        payload.createdAt = Date.now();
        this.subscriptions.push(payload);
        this.selectedId = payload.id;
      }
      this.persist();
      common_vendor.index.vibrateShort({ type: "light" });
      common_vendor.index.showToast({ title: wasEditing ? "修改已保存" : "订阅已添加", icon: "success" });
      if (wasEditing && this.viewStack[this.viewStack.length - 1] === "detail")
        this.viewStack.pop();
      this.activeView = "detail";
      this.editingId = null;
      this.scrollToTop();
    },
    confirmRenewal() {
      const item = this.selectedSubscription;
      if (!item || this.renewalLocked)
        return;
      const currentBillingDate = item.nextBillingDate;
      const nextBillingDate = pages_subscription_subscriptionData.getNextBillingDate(currentBillingDate, item.cycle);
      const content = item.cycle === "一次性" ? `确认 ${pages_subscription_subscriptionData.formatDate(currentBillingDate)} 已完成付款吗？确认后将自动归档。` : `确认 ${pages_subscription_subscriptionData.formatDate(currentBillingDate)} 已完成续费吗？下次扣费日将更新为 ${pages_subscription_subscriptionData.formatDate(nextBillingDate)}。`;
      common_vendor.index.showModal({ title: "确认本次续费", content, confirmText: "确认续费", success: (res) => {
        if (res.confirm)
          this.processSubscription("renewed");
      } });
    },
    processSubscription(action) {
      const item = this.selectedSubscription;
      if (!item)
        return;
      if (action === "renewed") {
        if (this.renewalLocked)
          return common_vendor.index.showToast({ title: "本期续费已经确认", icon: "none" });
        const billingDate = item.nextBillingDate;
        const renewedAt = Date.now();
        item.renewalHistory = (item.renewalHistory || []).concat({ billingDate, amount: item.amount, confirmedAt: renewedAt });
        item.lastRenewedBillingDate = billingDate;
        item.lastRenewedAt = renewedAt;
        item.nextBillingDate = pages_subscription_subscriptionData.getNextBillingDate(billingDate, item.cycle);
        item.status = item.cycle === "一次性" ? "archived" : "active";
        common_vendor.index.showToast({ title: item.cycle === "一次性" ? "已完成并归档" : "本期续费已确认", icon: "success" });
      } else if (action === "later") {
        if (item.status === "pending")
          return;
        item.status = "pending";
        common_vendor.index.showToast({ title: "已加入待处理", icon: "none" });
      }
      item.updatedAt = Date.now();
      this.persist();
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
    handleSubscriptionAction(action) {
      const item = this.selectedSubscription;
      if (!item)
        return;
      if (action === "cancel")
        return this.cancelSubscription();
      if (action === "delete")
        return this.deleteSubscription();
      if (action === "copy") {
        const copy = { ...item, id: Date.now(), name: `${item.name} 副本`, status: "active", renewalHistory: [], lastRenewedAt: null, lastRenewedBillingDate: null, createdAt: Date.now() };
        this.subscriptions.push(copy);
        this.persist();
        return common_vendor.index.showToast({ title: "已复制订阅", icon: "success" });
      }
      if (action === "pause")
        item.status = "paused";
      else if (action === "resume" || action === "restore")
        item.status = "active";
      else if (action === "archive")
        item.status = "archived";
      item.updatedAt = Date.now();
      this.persist();
      common_vendor.index.showToast({ title: { pause: "订阅已暂停", resume: "订阅已恢复", restore: "已恢复为有效订阅", archive: "订阅已归档" }[action], icon: "none" });
    },
    cancelSubscription() {
      const item = this.selectedSubscription;
      const guide = item.cancelGuide ? `

取消路径：${item.cancelGuide}` : "";
      common_vendor.index.showModal({ title: `取消“${item.name}”`, content: `确认已在实际付款渠道关闭自动续费吗？此操作只更新清单状态，不会代替你向服务商取消。${guide}`, confirmText: "已完成取消", confirmColor: "#c5444c", success: (res) => {
        if (res.confirm) {
          item.status = "cancelled";
          item.autoRenew = false;
          item.updatedAt = Date.now();
          this.persist();
          common_vendor.index.showToast({ title: "已标记为取消", icon: "success" });
        }
      } });
    },
    deleteSubscription() {
      const item = this.selectedSubscription;
      common_vendor.index.showModal({ title: `删除“${item.name}”`, content: "删除后仅可通过恢复演示数据找回，确定继续吗？", confirmColor: "#c5444c", success: (res) => {
        if (res.confirm) {
          this.subscriptions = this.subscriptions.filter((row) => row.id !== item.id);
          this.persist();
          this.selectedId = null;
          this.switchTab("all");
          common_vendor.index.showToast({ title: "订阅已删除", icon: "success" });
        }
      } });
    },
    nextReminderText(item) {
      if (!item.reminders || !item.reminders.length)
        return "未设置";
      const days = Math.max(...item.reminders);
      return `${pages_subscription_subscriptionData.formatDate(pages_subscription_subscriptionData.addDays(item.nextBillingDate, -days))} ${this.settings.reminderTime}`;
    },
    openReminderSettings() {
      this.navigateToView("reminder-settings");
    },
    toggleDefaultReminder(value) {
      const list = this.settings.defaultReminders;
      const index = list.indexOf(value);
      if (index >= 0) {
        if (list.length === 1)
          return common_vendor.index.showToast({ title: "至少保留一个提醒节点", icon: "none" });
        list.splice(index, 1);
      } else
        list.push(value);
      list.sort((a, b) => b - a);
      this.persist();
    },
    exportData() {
      const header = "服务名称,套餐,分类,金额,币种,周期,下次扣费日,状态,付款渠道,备注";
      const rows = this.subscriptions.map((item) => [item.name, item.plan || "", item.category, item.amount === null ? "" : item.amount, item.currency, item.cycle, item.nextBillingDate, this.statusText(item), item.payment, item.note || ""].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
      const csv = [header].concat(rows).join("\n");
      common_vendor.index.setClipboardData({ data: csv, success: () => common_vendor.index.showToast({ title: "表格数据已复制", icon: "success" }) });
    },
    showPrivacy() {
      common_vendor.index.showModal({ title: "隐私与数据说明", content: "当前版本只把演示数据保存在本机缓存，不会上传服务端，也不会读取支付账户。接入后端后需要补充正式隐私政策与数据删除机制。", showCancel: false });
    },
    resetDemoData() {
      common_vendor.index.showModal({ title: "恢复演示数据", content: "当前本地修改将被覆盖，确定继续吗？", confirmColor: "#c5444c", success: (res) => {
        if (res.confirm) {
          this.subscriptions = pages_subscription_subscriptionData.createSeedSubscriptions();
          this.settings = pages_subscription_subscriptionData.createDefaultSettings();
          this.persist();
          common_vendor.index.showToast({ title: "演示数据已恢复", icon: "success" });
        }
      } });
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_subscription_row = common_vendor.resolveComponent("subscription-row");
  const _component_brand_logo = common_vendor.resolveComponent("brand-logo");
  (_easycom_uni_icons2 + _component_subscription_row + _component_brand_logo)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.activeView === "home"
  }, $data.activeView === "home" ? common_vendor.e({
    c: $data.navigationBarHeight + "px",
    d: common_vendor.p({
      type: $data.settings.amountVisible ? "eye" : "eye-slash",
      size: "20",
      color: "#ffffff"
    }),
    e: common_vendor.o((...args) => $options.toggleAmount && $options.toggleAmount(...args), "42"),
    f: common_vendor.t($data.settings.amountVisible ? $options.formatMoney($options.next30Total) : "¥ ••••"),
    g: common_vendor.t($options.next30Subscriptions.length),
    h: common_vendor.t($data.settings.amountVisible ? $options.formatMoney($options.monthlyAverage) : "¥•••"),
    i: common_vendor.f($options.trendData.slice(0, 5), (bar, k0, i0) => {
      return {
        a: bar.month,
        b: bar.height + "%"
      };
    }),
    j: !$data.settings.notificationEnabled
  }, !$data.settings.notificationEnabled ? {
    k: common_vendor.p({
      type: "notification",
      size: "20",
      color: "#a86210"
    }),
    l: common_vendor.o((...args) => $options.enableNotification && $options.enableNotification(...args), "c4"),
    m: common_vendor.o((...args) => $options.enableNotification && $options.enableNotification(...args), "c9")
  } : {}, {
    n: common_vendor.t($options.activeSubscriptions.length),
    o: common_vendor.p({
      type: "right",
      size: "14",
      color: "#747b76"
    }),
    p: common_vendor.o(($event) => $options.switchTab("all"), "a6"),
    q: $options.upcoming7.length
  }, $options.upcoming7.length ? {
    r: common_vendor.t($options.upcoming7.length)
  } : {}, {
    s: common_vendor.f($options.upcoming7, (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => $options.openDetail(item), item.id),
        c: "3fa108be-3-" + i0,
        d: common_vendor.p({
          item: $options.decorateItem(item)
        })
      };
    }),
    t: $options.upcoming30Later.length
  }, $options.upcoming30Later.length ? {
    v: common_vendor.t($options.upcoming30Later.length)
  } : {}, {
    w: common_vendor.f($options.upcoming30Later.slice(0, 3), (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => $options.openDetail(item), item.id),
        c: "3fa108be-4-" + i0,
        d: common_vendor.p({
          item: $options.decorateItem(item)
        })
      };
    }),
    x: !$options.next30Subscriptions.length
  }, !$options.next30Subscriptions.length ? {
    y: common_vendor.o(($event) => $options.openForm(), "13")
  } : {}, {
    z: $options.next30Subscriptions.length > 4
  }, $options.next30Subscriptions.length > 4 ? {
    A: common_vendor.t($options.next30Subscriptions.length),
    B: common_vendor.o(($event) => $options.switchTab("all"), "94")
  } : {}, {
    C: common_vendor.t($options.actionableReminders.length),
    D: common_vendor.f($options.actionableReminders, (reminder, k0, i0) => {
      return common_vendor.e({
        a: "3fa108be-5-" + i0,
        b: common_vendor.p({
          type: reminder.icon,
          size: "18",
          color: "#ffffff"
        }),
        c: common_vendor.n(reminder.tone),
        d: common_vendor.t(reminder.title),
        e: common_vendor.t(reminder.desc),
        f: reminder.action !== "none"
      }, reminder.action !== "none" ? {
        g: "3fa108be-6-" + i0,
        h: common_vendor.p({
          type: "right",
          size: "16",
          color: "#a2a7a3"
        })
      } : {}, {
        i: reminder.key,
        j: common_vendor.o(($event) => $options.handleReminder(reminder), reminder.key)
      });
    }),
    E: common_vendor.p({
      type: "plus",
      size: "20",
      color: "#ffffff"
    }),
    F: common_vendor.o(($event) => $options.openForm(), "72")
  }) : $data.activeView === "all" ? common_vendor.e({
    H: $data.navigationBarHeight + "px",
    I: common_vendor.p({
      type: "search",
      size: "19",
      color: "#8c938e"
    }),
    J: $data.searchKeyword,
    K: common_vendor.o(common_vendor.m(($event) => $data.searchKeyword = $event.detail.value, {
      trim: true
    }), "0a"),
    L: $data.searchKeyword
  }, $data.searchKeyword ? {
    M: common_vendor.p({
      type: "clear",
      size: "18",
      color: "#9ca19d"
    }),
    N: common_vendor.o(($event) => $data.searchKeyword = "", "08")
  } : {}, {
    O: common_vendor.f($options.categoryFilters, (filter, k0, i0) => {
      return {
        a: common_vendor.t(filter.name),
        b: common_vendor.t(filter.count),
        c: filter.name,
        d: $data.activeCategory === filter.name ? 1 : "",
        e: common_vendor.o(($event) => $data.activeCategory = filter.name, filter.name)
      };
    }),
    P: common_vendor.f($options.statusFilters, (status, k0, i0) => {
      return {
        a: common_vendor.t(status.label),
        b: status.value,
        c: $data.activeStatus === status.value ? 1 : "",
        d: common_vendor.o(($event) => $data.activeStatus = status.value, status.value)
      };
    }),
    Q: common_vendor.t($options.sortLabel),
    R: common_vendor.t($options.activeStatusLabel),
    S: common_vendor.p({
      type: "right",
      size: "15",
      color: "#89938c"
    }),
    T: common_vendor.o((...args) => $options.chooseSort && $options.chooseSort(...args), "cf"),
    U: $options.visibleSubscriptions.length
  }, $options.visibleSubscriptions.length ? {
    V: common_vendor.f($options.visibleSubscriptions, (item, k0, i0) => {
      return {
        a: "3fa108be-11-" + i0,
        b: common_vendor.p({
          item
        }),
        c: common_vendor.t(item.name),
        d: common_vendor.t($options.statusText(item)),
        e: common_vendor.n($options.getStatus(item)),
        f: common_vendor.t(item.cycle),
        g: common_vendor.t(item.amount === null ? "金额待补充" : $options.formatMoney(item.amount)),
        h: common_vendor.t(item.payment),
        i: common_vendor.t($options.formatDate(item.nextBillingDate)),
        j: common_vendor.t($options.daysText(item)),
        k: "3fa108be-12-" + i0,
        l: item.id,
        m: common_vendor.o(($event) => $options.openDetail(item), item.id)
      };
    }),
    W: common_vendor.p({
      type: "right",
      size: "17",
      color: "#b0b5b1"
    })
  } : common_vendor.e({
    X: common_vendor.p({
      type: $data.subscriptions.length ? "search" : "plus",
      size: "30",
      color: "#4a9a6c"
    }),
    Y: common_vendor.t($data.subscriptions.length ? "没有匹配的订阅" : "还没有添加订阅"),
    Z: common_vendor.t($data.subscriptions.length ? "调整搜索词或筛选条件，也可以新增一条订阅" : "添加第一条订阅后，这里会显示所有续费项目"),
    aa: $data.subscriptions.length
  }, $data.subscriptions.length ? {
    ab: common_vendor.o((...args) => $options.resetFilters && $options.resetFilters(...args), "4c")
  } : {
    ac: common_vendor.o(($event) => $options.openForm(), "a8")
  }), {
    ad: common_vendor.p({
      type: "plus",
      size: "27",
      color: "#ffffff"
    }),
    ae: common_vendor.o(($event) => $options.openForm(), "27")
  }) : $data.activeView === "calendar" ? common_vendor.e({
    ag: $data.navigationBarHeight + "px",
    ah: common_vendor.p({
      type: "left",
      size: "19",
      color: "#5d655f"
    }),
    ai: common_vendor.o(($event) => $options.changeMonth(-1), "a5"),
    aj: common_vendor.t($options.calendarTitle),
    ak: common_vendor.p({
      type: "right",
      size: "19",
      color: "#5d655f"
    }),
    al: common_vendor.o(($event) => $options.changeMonth(1), "e4"),
    am: common_vendor.o((...args) => $options.goToday && $options.goToday(...args), "35"),
    an: common_vendor.f($data.weekdays, (day, k0, i0) => {
      return {
        a: common_vendor.t(day),
        b: day
      };
    }),
    ao: common_vendor.f($options.calendarDays, (day, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(day.day),
        b: day.count
      }, day.count ? {
        c: common_vendor.t(day.count)
      } : {}, {
        d: day.amount
      }, day.amount ? {
        e: common_vendor.t($options.compactAmount(day.amount))
      } : {}, {
        f: day.key,
        g: !day.currentMonth ? 1 : "",
        h: day.key === $data.selectedDate ? 1 : "",
        i: day.key === $options.todayKey ? 1 : "",
        j: common_vendor.o(($event) => $options.selectDate(day.key), day.key)
      });
    }),
    ap: common_vendor.t($options.selectedDateTitle),
    aq: common_vendor.t($options.selectedWeekday),
    ar: common_vendor.t($options.selectedDateSubscriptions.length),
    as: common_vendor.t($options.formatMoney($options.selectedDateTotal)),
    at: $options.selectedDateSubscriptions.length
  }, $options.selectedDateSubscriptions.length ? {
    av: common_vendor.f($options.selectedDateSubscriptions, (item, k0, i0) => {
      return {
        a: "3fa108be-17-" + i0,
        b: common_vendor.p({
          item
        }),
        c: common_vendor.t(item.name),
        d: common_vendor.t(item.cycle),
        e: common_vendor.t(item.payment),
        f: common_vendor.t($options.formatMoney(item.amount)),
        g: item.id,
        h: common_vendor.o(($event) => $options.openDetail(item), item.id)
      };
    })
  } : {
    aw: common_vendor.o(($event) => $options.openForm($data.selectedDate), "a0")
  }) : $data.activeView === "stats" ? {
    ay: $data.navigationBarHeight + "px",
    az: common_vendor.t($options.statsLabel),
    aA: common_vendor.f($data.statPeriods, (period, k0, i0) => {
      return {
        a: common_vendor.t(period.label),
        b: period.value,
        c: $data.statsPeriod === period.value ? 1 : "",
        d: common_vendor.o(($event) => $data.statsPeriod = period.value, period.value)
      };
    }),
    aB: common_vendor.t($options.formatMoney($options.statsTotal)),
    aC: common_vendor.t($options.statsSubscriptionCount),
    aD: common_vendor.t($data.statsPeriod === "year" ? "年度" : $data.statsPeriod === "next" ? "未来 30 天" : "月均"),
    aE: common_vendor.t($data.statsPeriod === "year" ? "年度" : "月均"),
    aF: $options.donutBackground,
    aG: common_vendor.f($options.categoryStats, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t($options.formatMoney(item.value)),
        d: common_vendor.t(item.percent),
        e: item.name
      };
    }),
    aH: common_vendor.f($options.trendData, (bar, k0, i0) => {
      return {
        a: common_vendor.t($options.compactAmount(bar.value)),
        b: bar.height + "%",
        c: common_vendor.t(bar.month),
        d: bar.month
      };
    }),
    aI: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "#177e4b"
    })
  } : $data.activeView === "profile" ? {
    aK: $data.navigationBarHeight + "px",
    aL: common_vendor.t($data.subscriptions.length),
    aM: common_vendor.t($options.formatMoney($options.monthlyAverage)),
    aN: common_vendor.t($data.settings.notificationEnabled ? "已开启" : "未开启"),
    aO: common_vendor.p({
      type: "notification",
      size: "18",
      color: "#177e4b"
    }),
    aP: common_vendor.t($data.settings.notificationEnabled ? "已模拟开启" : "未开启"),
    aQ: $data.settings.notificationEnabled,
    aR: common_vendor.o(($event) => $options.setNotification($event.detail.value), "21"),
    aS: common_vendor.p({
      type: "calendar",
      size: "18",
      color: "#bb6b18"
    }),
    aT: common_vendor.t($data.settings.defaultReminders.join("、")),
    aU: common_vendor.t($data.settings.reminderTime),
    aV: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    aW: common_vendor.o((...args) => $options.openReminderSettings && $options.openReminderSettings(...args), "ec"),
    aX: common_vendor.p({
      type: "email",
      size: "18",
      color: "#3c7fc1"
    }),
    aY: $data.settings.weeklySummary,
    aZ: common_vendor.o(($event) => $options.updateSetting("weeklySummary", $event.detail.value), "9b"),
    ba: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "#6458c9"
    }),
    bb: common_vendor.t($data.settings.defaultCurrency),
    bc: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bd: $data.currencies,
    be: common_vendor.o(($event) => $options.updateSetting("defaultCurrency", $data.currencies[$event.detail.value]), "23"),
    bf: common_vendor.p({
      type: "download",
      size: "18",
      color: "#177e4b"
    }),
    bg: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bh: common_vendor.o((...args) => $options.exportData && $options.exportData(...args), "4a"),
    bi: common_vendor.p({
      type: "locked",
      size: "18",
      color: "#3c7fc1"
    }),
    bj: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bk: common_vendor.o((...args) => $options.showPrivacy && $options.showPrivacy(...args), "d2"),
    bl: common_vendor.p({
      type: "refresh",
      size: "18",
      color: "#cc4b52"
    }),
    bm: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bn: common_vendor.o((...args) => $options.resetDemoData && $options.resetDemoData(...args), "9b")
  } : $data.activeView === "detail" && $options.selectedSubscription ? common_vendor.e({
    bp: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    bq: common_vendor.o(($event) => $options.goBackView("all"), "16"),
    br: common_vendor.p({
      item: $options.selectedSubscription
    }),
    bs: common_vendor.t($options.selectedSubscription.name),
    bt: common_vendor.t($options.selectedSubscription.plan || $options.selectedSubscription.category),
    bv: common_vendor.t($options.statusText($options.selectedSubscription)),
    bw: common_vendor.n($options.getStatus($options.selectedSubscription)),
    bx: common_vendor.t($options.selectedSubscription.amount === null ? "金额待补充" : $options.formatMoney($options.selectedSubscription.amount)),
    by: common_vendor.t($options.formatDate($options.selectedSubscription.nextBillingDate)),
    bz: common_vendor.t($options.daysText($options.selectedSubscription)),
    bA: common_vendor.t($options.selectedSubscription.cycle),
    bB: common_vendor.t($options.selectedSubscription.payment),
    bC: common_vendor.t($options.selectedSubscription.category),
    bD: common_vendor.t($options.selectedSubscription.autoRenew ? "已开启" : "未开启"),
    bE: common_vendor.t($data.settings.notificationEnabled ? "通知可用" : "仅站内提醒"),
    bF: common_vendor.f($options.selectedSubscription.reminders, (day, k0, i0) => {
      return {
        a: common_vendor.t(day === 0 ? "当天" : `提前 ${day} 天`),
        b: day
      };
    }),
    bG: common_vendor.t($options.nextReminderText($options.selectedSubscription)),
    bH: $options.selectedRenewalHistory.length
  }, $options.selectedRenewalHistory.length ? {
    bI: common_vendor.t($options.selectedSubscription.renewalHistory.length),
    bJ: common_vendor.f($options.selectedRenewalHistory, (record, k0, i0) => {
      return {
        a: common_vendor.t($options.formatDate(record.billingDate)),
        b: common_vendor.t($options.formatMoney(record.amount)),
        c: record.confirmedAt
      };
    })
  } : {}, {
    bK: $options.selectedSubscription.note || $options.selectedSubscription.cancelGuide
  }, $options.selectedSubscription.note || $options.selectedSubscription.cancelGuide ? common_vendor.e({
    bL: $options.selectedSubscription.note
  }, $options.selectedSubscription.note ? {
    bM: common_vendor.t($options.selectedSubscription.note)
  } : {}, {
    bN: $options.selectedSubscription.cancelGuide
  }, $options.selectedSubscription.cancelGuide ? {
    bO: common_vendor.t($options.selectedSubscription.cancelGuide)
  } : {}) : {}, {
    bP: !["cancelled", "archived", "paused"].includes($options.selectedSubscription.status)
  }, !["cancelled", "archived", "paused"].includes($options.selectedSubscription.status) ? common_vendor.e({
    bQ: $options.renewalLocked
  }, $options.renewalLocked ? {
    bR: common_vendor.p({
      type: "checkbox-filled",
      size: "24",
      color: "#177e4b"
    }),
    bS: common_vendor.t($options.formatDate($options.selectedSubscription.lastRenewedBillingDate, false)),
    bT: common_vendor.t($options.formatDate($options.selectedSubscription.nextBillingDate, false))
  } : {
    bU: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "#177e4b"
    }),
    bV: common_vendor.o((...args) => $options.confirmRenewal && $options.confirmRenewal(...args), "e5"),
    bW: common_vendor.p({
      type: "calendar",
      size: "20",
      color: $options.selectedSubscription.status === "pending" ? "#8b9690" : "#aa681c"
    }),
    bX: common_vendor.t($options.selectedSubscription.status === "pending" ? "已设为稍后处理" : "稍后处理"),
    bY: $options.selectedSubscription.status === "pending" ? 1 : "",
    bZ: $options.selectedSubscription.status === "pending",
    ca: common_vendor.o(($event) => $options.processSubscription("later"), "c5")
  }, {
    cb: $options.renewalLocked ? 1 : ""
  }) : {}, {
    cc: common_vendor.p({
      type: "more-filled",
      size: "19",
      color: "#177e4b"
    }),
    cd: common_vendor.o((...args) => $options.showMoreActions && $options.showMoreActions(...args), "8e"),
    ce: common_vendor.p({
      type: "compose",
      size: "19",
      color: "#ffffff"
    }),
    cf: common_vendor.o(($event) => $options.openForm(null, $options.selectedSubscription), "70")
  }) : $data.activeView === "form" ? common_vendor.e({
    ch: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    ci: common_vendor.o(($event) => $options.goBackView($data.editingId ? "detail" : "home"), "aa"),
    cj: common_vendor.t($data.editingId ? "编辑订阅" : "新增订阅"),
    ck: !$data.editingId
  }, !$data.editingId ? {
    cl: common_vendor.f($data.serviceTemplates, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.logo),
        b: item.color,
        c: common_vendor.t(item.short),
        d: item.name,
        e: common_vendor.o(($event) => $options.applyTemplate(item), item.name)
      };
    })
  } : {}, {
    cm: $data.form.name,
    cn: common_vendor.o(common_vendor.m(($event) => $data.form.name = $event.detail.value, {
      trim: true
    }), "79"),
    co: $data.form.plan,
    cp: common_vendor.o(common_vendor.m(($event) => $data.form.plan = $event.detail.value, {
      trim: true
    }), "da"),
    cq: common_vendor.t($data.form.category),
    cr: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    cs: $data.categories,
    ct: common_vendor.o(($event) => $data.form.category = $data.categories[$event.detail.value], "0c"),
    cv: common_vendor.f($data.logoColors, (color, k0, i0) => {
      return {
        a: color,
        b: $data.form.color === color ? 1 : "",
        c: color,
        d: common_vendor.o(($event) => $data.form.color = color, color)
      };
    }),
    cw: $data.form.amount,
    cx: common_vendor.o(($event) => $data.form.amount = $event.detail.value, "fa"),
    cy: common_vendor.t($data.form.cycle),
    cz: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    cA: $data.cycles,
    cB: common_vendor.o(($event) => $data.form.cycle = $data.cycles[$event.detail.value], "84"),
    cC: common_vendor.t($data.form.payment),
    cD: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    cE: $data.payments,
    cF: common_vendor.o(($event) => $data.form.payment = $data.payments[$event.detail.value], "cb"),
    cG: common_vendor.t($options.formatDate($data.form.nextBillingDate)),
    cH: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    cI: $options.todayKey,
    cJ: $data.form.nextBillingDate,
    cK: common_vendor.o(($event) => $data.form.nextBillingDate = $event.detail.value, "79"),
    cL: $data.form.autoRenew,
    cM: common_vendor.o(($event) => $data.form.autoRenew = $event.detail.value, "11"),
    cN: common_vendor.f($data.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: $data.form.reminders.includes(option.value)
      }, $data.form.reminders.includes(option.value) ? {
        b: "3fa108be-43-" + i0,
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#177e4b"
        })
      } : {}, {
        d: common_vendor.t(option.label),
        e: option.value,
        f: $data.form.reminders.includes(option.value) ? 1 : "",
        g: common_vendor.o(($event) => $options.toggleReminder(option.value), option.value)
      });
    }),
    cO: common_vendor.t($options.formReminderPreview),
    cP: $data.form.note,
    cQ: common_vendor.o(common_vendor.m(($event) => $data.form.note = $event.detail.value, {
      trim: true
    }), "1c"),
    cR: $data.form.cancelGuide,
    cS: common_vendor.o(common_vendor.m(($event) => $data.form.cancelGuide = $event.detail.value, {
      trim: true
    }), "46"),
    cT: $data.formError
  }, $data.formError ? {
    cU: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "#c5444c"
    }),
    cV: common_vendor.t($data.formError)
  } : {}, {
    cW: common_vendor.p({
      type: "checkmarkempty",
      size: "20",
      color: "#ffffff"
    }),
    cX: common_vendor.t($data.editingId ? "保存修改" : "保存订阅"),
    cY: common_vendor.o((...args) => $options.saveSubscription && $options.saveSubscription(...args), "83")
  }) : $data.activeView === "reminder-settings" ? {
    da: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    db: common_vendor.o(($event) => $options.goBackView("profile"), "b3"),
    dc: common_vendor.p({
      type: "notification-filled",
      size: "24",
      color: "#177e4b"
    }),
    dd: common_vendor.f($data.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(option.label),
        b: common_vendor.t(option.desc),
        c: $data.settings.defaultReminders.includes(option.value)
      }, $data.settings.defaultReminders.includes(option.value) ? {
        d: "3fa108be-48-" + i0,
        e: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#ffffff"
        })
      } : {}, {
        f: $data.settings.defaultReminders.includes(option.value) ? 1 : "",
        g: option.value,
        h: common_vendor.o(($event) => $options.toggleDefaultReminder(option.value), option.value)
      });
    }),
    de: common_vendor.t($data.settings.timezone),
    df: common_vendor.t($data.settings.reminderTime),
    dg: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    dh: $data.settings.reminderTime,
    di: common_vendor.o(($event) => $options.updateSetting("reminderTime", $event.detail.value), "90"),
    dj: common_vendor.o(($event) => $options.goBackView("profile"), "d8")
  } : {}, {
    G: $data.activeView === "all",
    af: $data.activeView === "calendar",
    ax: $data.activeView === "stats",
    aJ: $data.activeView === "profile",
    bo: $data.activeView === "detail" && $options.selectedSubscription,
    cg: $data.activeView === "form",
    cZ: $data.activeView === "reminder-settings",
    dk: `calc(100vh - ${$data.statusBarHeight}px)`,
    dl: $data.scrollTop,
    dm: $data.sortSheetVisible
  }, $data.sortSheetVisible ? {
    dn: common_vendor.p({
      type: "closeempty",
      size: "21",
      color: "#5f6862"
    }),
    dp: common_vendor.o((...args) => $options.closeSortSheet && $options.closeSortSheet(...args), "a9"),
    dq: common_vendor.f($data.sortOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: "3fa108be-51-" + i0,
        b: common_vendor.p({
          type: option.icon,
          size: "20",
          color: $data.sortMode === option.value ? "#177e4b" : "#6f7972"
        }),
        c: common_vendor.t(option.label),
        d: common_vendor.t(option.desc),
        e: $data.sortMode === option.value
      }, $data.sortMode === option.value ? {
        f: "3fa108be-52-" + i0,
        g: common_vendor.p({
          type: "checkmarkempty",
          size: "15",
          color: "#ffffff"
        })
      } : {}, {
        h: $data.sortMode === option.value ? 1 : "",
        i: option.value,
        j: $data.sortMode === option.value ? 1 : "",
        k: common_vendor.o(($event) => $options.selectSort(option.value), option.value)
      });
    }),
    dr: common_vendor.o(() => {
    }, "20"),
    ds: common_vendor.o((...args) => $options.closeSortSheet && $options.closeSortSheet(...args), "50"),
    dt: common_vendor.o(() => {
    }, "bd")
  } : {}, {
    dv: $options.showTabBar
  }, $options.showTabBar ? {
    dw: common_vendor.f($data.tabs, (tab, k0, i0) => {
      return {
        a: "3fa108be-53-" + i0,
        b: common_vendor.p({
          type: $data.activeView === tab.key ? tab.activeIcon : tab.icon,
          size: "23",
          color: $data.activeView === tab.key ? "#16834d" : "#8e9690"
        }),
        c: common_vendor.t(tab.label),
        d: tab.key,
        e: $data.activeView === tab.key ? 1 : "",
        f: common_vendor.o(($event) => $options.switchTab(tab.key), tab.key)
      };
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/index.js.map
