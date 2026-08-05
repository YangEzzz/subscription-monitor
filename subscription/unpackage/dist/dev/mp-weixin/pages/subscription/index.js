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
      authStatus: "idle",
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
        { name: "腾讯视频 VIP", short: "腾讯视频", plan: "连续包月", logo: "视", icon: "videocam-filled", color: "#19a768", category: "影音娱乐", amount: 25, payment: "微信支付" },
        { name: "网易云音乐黑胶 VIP", short: "网易云", plan: "黑胶 VIP", logo: "音", icon: "headphones", color: "#ef3943", category: "音乐", amount: 15, payment: "微信支付" },
        { name: "iCloud+ 200GB", short: "iCloud", plan: "200GB", logo: "云", icon: "cloud-upload-filled", color: "#3f98ee", category: "云存储", amount: 21, payment: "App Store" },
        { name: "ChatGPT Plus", short: "ChatGPT", plan: "Plus", logo: "AI", icon: "loop", color: "#1f9c70", category: "AI 工具", amount: 145, payment: "信用卡" }
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
    isMember() {
      return this.settings.membership && this.settings.membership.status === "active";
    },
    canCreateSubscription() {
      return this.isMember || this.subscriptions.length < this.subscriptionLimit;
    },
    freeQuotaText() {
      return this.subscriptions.length >= this.subscriptionLimit ? `免费额度已用完 · 共 ${this.subscriptions.length} 条` : `已使用 ${this.subscriptions.length} / ${this.subscriptionLimit} 个免费名额`;
    },
    freeQuotaValue() {
      return this.subscriptions.length > this.subscriptionLimit ? `${this.subscriptions.length} 条（已超额度）` : `${this.subscriptions.length} / ${this.subscriptionLimit}`;
    },
    membershipQuotaPercent() {
      return Math.min(100, this.subscriptions.length / this.subscriptionLimit * 100);
    },
    selectedSubscription() {
      return this.subscriptions.find((item) => item.id === this.selectedId) || null;
    },
    selectedRenewalHistory() {
      return this.selectedSubscription ? (this.selectedSubscription.renewalHistory || []).slice().reverse().slice(0, 3) : [];
    },
    renewalLocked() {
      const item = this.selectedSubscription;
      if (!item || !item.lastRenewedBillingDate)
        return false;
      return item.lastRenewedBillingDate === item.nextBillingDate;
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
      const overdue = this.subscriptions.filter((item) => !["cancelled", "archived", "paused"].includes(item.status) && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) < 0);
      if (overdue.length)
        list.push({ key: "overdue", tone: "danger", icon: "info-filled", title: `${overdue.length} 项订阅已逾期未确认`, desc: "请确认是否已完成续费", action: "overdue" });
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
      return [{ value: "all", label: "全部状态" }, { value: "default", label: "有效订阅" }, { value: "upcoming", label: "即将到期" }, { value: "overdue", label: "逾期未确认" }, { value: "incomplete", label: "金额待补充" }, { value: "paused", label: "已暂停" }, { value: "cancelled", label: "已取消" }, { value: "archived", label: "已归档" }];
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
      else if (this.activeStatus === "overdue")
        list = list.filter((item) => !["cancelled", "archived", "paused"].includes(item.status) && pages_subscription_subscriptionData.daysUntil(item.nextBillingDate) < 0);
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
    this.loginWithWechat();
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
    daysUntil(dateKey) {
      return pages_subscription_subscriptionData.daysUntil(dateKey);
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
    loginWithWechat() {
      this.authStatus = "logging-in";
      common_vendor.index.login({
        provider: "weixin",
        success: (result) => {
          if (!result || !result.code) {
            this.authStatus = "local";
            common_vendor.index.__f__("warn", "at pages/subscription/index.vue:437", "[auth] 微信登录未返回 code，继续使用本地模式");
            return;
          }
          this.authStatus = "authenticated";
          common_vendor.index.__f__("info", "at pages/subscription/index.vue:441", "[auth] uni.login 成功，临时 code:", result.code);
        },
        fail: (error) => {
          this.authStatus = "local";
          common_vendor.index.__f__("warn", "at pages/subscription/index.vue:446", "[auth] 微信登录失败，继续使用本地模式", error);
        }
      });
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
      if (!this.subscribeTemplateIds.length)
        return common_vendor.index.showModal({ title: "暂未配置通知模板", content: "请先在代码中配置微信订阅消息模板 ID，再发起授权。当前不会修改提醒状态。", showCancel: false });
      if (typeof common_vendor.index.requestSubscribeMessage !== "function")
        return common_vendor.index.showModal({ title: "当前平台不支持", content: "请在微信小程序真机或微信开发者工具中发起订阅消息授权。", showCancel: false });
      common_vendor.index.requestSubscribeMessage({
        tmplIds: this.subscribeTemplateIds,
        success: (result) => {
          const statuses = this.subscribeTemplateIds.map((templateId) => ({ templateId, status: result[templateId] || "unknown", updatedAt: Date.now() }));
          const accepted = statuses.some((item) => item.status === "accept");
          this.settings.notificationAuthorization = statuses;
          this.settings.notificationEnabled = accepted;
          this.persist();
          common_vendor.index.showToast({ title: accepted ? "授权成功" : "未获得授权", icon: "none" });
          common_vendor.index.__f__("info", "at pages/subscription/index.vue:468", "[notification] 订阅消息授权结果:", statuses);
        },
        fail: (error) => {
          common_vendor.index.__f__("warn", "at pages/subscription/index.vue:471", "[notification] 订阅消息授权失败:", error);
          common_vendor.index.showToast({ title: "授权未完成", icon: "none" });
        }
      });
    },
    handleNotificationSwitch(value) {
      if (value)
        this.enableNotification();
      else
        this.setNotification(false);
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
      else if (item.action === "overdue") {
        this.activeStatus = "overdue";
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
      if (!item && !this.canCreateSubscription()) {
        this.showMembershipLimit();
        return;
      }
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
      if (this.form.amount === "")
        return "请输入金额";
      if (Number.isNaN(Number(this.form.amount)) || Number(this.form.amount) < 0)
        return "金额必须是大于或等于 0 的数字";
      if (!this.form.nextBillingDate || pages_subscription_subscriptionData.daysUntil(this.form.nextBillingDate) < 0)
        return "下次扣费日不能早于今天";
      if (!this.form.reminders.length)
        return "请至少选择一个提醒节点";
      return "";
    },
    saveSubscription(force = false) {
      if (!this.editingId && !this.canCreateSubscription()) {
        this.showMembershipLimit();
        return;
      }
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
      const isEarly = pages_subscription_subscriptionData.daysUntil(currentBillingDate) > 7;
      const isOneOff = item.cycle === "一次性";
      const content = isOneOff ? `确认 ${pages_subscription_subscriptionData.formatDate(currentBillingDate)} 已完成付款吗？确认后将自动归档。` : isEarly ? `扣费日为 ${pages_subscription_subscriptionData.formatDate(currentBillingDate)}，确认已提前完成续费吗？下次扣费日将更新为 ${pages_subscription_subscriptionData.formatDate(nextBillingDate)}。` : `确认 ${pages_subscription_subscriptionData.formatDate(currentBillingDate)} 已完成续费吗？下次扣费日将更新为 ${pages_subscription_subscriptionData.formatDate(nextBillingDate)}。`;
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
        if (!this.canCreateSubscription()) {
          this.showMembershipLimit();
          return;
        }
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
    activateMembership() {
      common_vendor.index.showModal({ title: "本地模拟开通", content: "当前仅修改本地会员状态，不会产生真实扣款。确定开通吗？", confirmText: "确认开通", success: (res) => {
        if (res.confirm) {
          this.settings.membership = { status: "active", plan: "会员版", startedAt: Date.now() };
          this.persist();
          common_vendor.index.showToast({ title: "会员已开通", icon: "success" });
        }
      } });
    },
    restoreFreePlan() {
      common_vendor.index.showModal({ title: "恢复免费版", content: "恢复后新增订阅将受 5 条额度限制，已有订阅不会被删除。", confirmText: "确认恢复", success: (res) => {
        if (res.confirm) {
          this.settings.membership = { status: "free", plan: "免费版", startedAt: null };
          this.persist();
          common_vendor.index.showToast({ title: "已恢复免费版", icon: "none" });
        }
      } });
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
    a: $data.activeView === "form" ? 1 : "",
    b: $data.statusBarHeight + "px",
    c: $data.activeView === "home"
  }, $data.activeView === "home" ? common_vendor.e({
    d: $data.navigationBarHeight + "px",
    e: common_vendor.p({
      type: $data.settings.amountVisible ? "eye" : "eye-slash",
      size: "20",
      color: "#ffffff"
    }),
    f: common_vendor.o((...args) => $options.toggleAmount && $options.toggleAmount(...args), "46"),
    g: common_vendor.t($data.settings.amountVisible ? $options.formatMoney($options.next30Total) : "¥ ••••"),
    h: common_vendor.t($options.next30Subscriptions.length),
    i: common_vendor.t($data.settings.amountVisible ? $options.formatMoney($options.monthlyAverage) : "¥•••"),
    j: common_vendor.f($options.trendData.slice(0, 5), (bar, k0, i0) => {
      return {
        a: bar.month,
        b: bar.height + "%"
      };
    }),
    k: !$data.settings.notificationEnabled
  }, !$data.settings.notificationEnabled ? {
    l: common_vendor.p({
      type: "notification",
      size: "20",
      color: "#a86210"
    }),
    m: common_vendor.o((...args) => $options.enableNotification && $options.enableNotification(...args), "d0"),
    n: common_vendor.o((...args) => $options.enableNotification && $options.enableNotification(...args), "a9")
  } : {}, {
    o: common_vendor.t($options.activeSubscriptions.length),
    p: common_vendor.p({
      type: "right",
      size: "14",
      color: "#747b76"
    }),
    q: common_vendor.o(($event) => $options.switchTab("all"), "cf"),
    r: $options.upcoming7.length
  }, $options.upcoming7.length ? {
    s: common_vendor.t($options.upcoming7.length)
  } : {}, {
    t: common_vendor.f($options.upcoming7, (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => $options.openDetail(item), item.id),
        c: "3fa108be-3-" + i0,
        d: common_vendor.p({
          item: $options.decorateItem(item)
        })
      };
    }),
    v: $options.upcoming30Later.length
  }, $options.upcoming30Later.length ? {
    w: common_vendor.t($options.upcoming30Later.length)
  } : {}, {
    x: common_vendor.f($options.upcoming30Later.slice(0, 3), (item, k0, i0) => {
      return {
        a: item.id,
        b: common_vendor.o(($event) => $options.openDetail(item), item.id),
        c: "3fa108be-4-" + i0,
        d: common_vendor.p({
          item: $options.decorateItem(item)
        })
      };
    }),
    y: !$options.next30Subscriptions.length
  }, !$options.next30Subscriptions.length ? {
    z: common_vendor.o(($event) => $options.openForm(), "26")
  } : {}, {
    A: $options.next30Subscriptions.length > 4
  }, $options.next30Subscriptions.length > 4 ? {
    B: common_vendor.t($options.next30Subscriptions.length),
    C: common_vendor.o(($event) => $options.switchTab("all"), "b8")
  } : {}, {
    D: common_vendor.t($options.actionableReminders.length),
    E: common_vendor.f($options.actionableReminders, (reminder, k0, i0) => {
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
    F: common_vendor.p({
      type: "plus",
      size: "20",
      color: "#ffffff"
    }),
    G: common_vendor.o(($event) => $options.openForm(), "88")
  }) : $data.activeView === "all" ? common_vendor.e({
    I: $data.navigationBarHeight + "px",
    J: common_vendor.p({
      type: "search",
      size: "19",
      color: "#8c938e"
    }),
    K: $data.searchKeyword,
    L: common_vendor.o(common_vendor.m(($event) => $data.searchKeyword = $event.detail.value, {
      trim: true
    }), "f3"),
    M: $data.searchKeyword
  }, $data.searchKeyword ? {
    N: common_vendor.p({
      type: "clear",
      size: "18",
      color: "#9ca19d"
    }),
    O: common_vendor.o(($event) => $data.searchKeyword = "", "2b")
  } : {}, {
    P: common_vendor.f($options.categoryFilters, (filter, k0, i0) => {
      return {
        a: common_vendor.t(filter.name),
        b: common_vendor.t(filter.count),
        c: filter.name,
        d: $data.activeCategory === filter.name ? 1 : "",
        e: common_vendor.o(($event) => $data.activeCategory = filter.name, filter.name)
      };
    }),
    Q: common_vendor.f($options.statusFilters, (status, k0, i0) => {
      return {
        a: common_vendor.t(status.label),
        b: status.value,
        c: $data.activeStatus === status.value ? 1 : "",
        d: common_vendor.o(($event) => $data.activeStatus = status.value, status.value)
      };
    }),
    R: common_vendor.t($options.sortLabel),
    S: common_vendor.t($options.activeStatusLabel),
    T: common_vendor.p({
      type: "right",
      size: "15",
      color: "#89938c"
    }),
    U: common_vendor.o((...args) => $options.chooseSort && $options.chooseSort(...args), "5f"),
    V: $options.visibleSubscriptions.length
  }, $options.visibleSubscriptions.length ? {
    W: common_vendor.f($options.visibleSubscriptions, (item, k0, i0) => {
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
    X: common_vendor.p({
      type: "right",
      size: "17",
      color: "#b0b5b1"
    })
  } : common_vendor.e({
    Y: common_vendor.p({
      type: $data.subscriptions.length ? "search" : "plus",
      size: "30",
      color: "#4a9a6c"
    }),
    Z: common_vendor.t($data.subscriptions.length ? "没有匹配的订阅" : "还没有添加订阅"),
    aa: common_vendor.t($data.subscriptions.length ? "调整搜索词或筛选条件，也可以新增一条订阅" : "添加第一条订阅后，这里会显示所有续费项目"),
    ab: $data.subscriptions.length
  }, $data.subscriptions.length ? {
    ac: common_vendor.o((...args) => $options.resetFilters && $options.resetFilters(...args), "6d")
  } : {
    ad: common_vendor.o(($event) => $options.openForm(), "ab")
  }), {
    ae: common_vendor.p({
      type: "plus",
      size: "27",
      color: "#ffffff"
    }),
    af: common_vendor.o(($event) => $options.openForm(), "ee")
  }) : $data.activeView === "calendar" ? common_vendor.e({
    ah: $data.navigationBarHeight + "px",
    ai: common_vendor.p({
      type: "left",
      size: "19",
      color: "#5d655f"
    }),
    aj: common_vendor.o(($event) => $options.changeMonth(-1), "52"),
    ak: common_vendor.t($options.calendarTitle),
    al: common_vendor.p({
      type: "right",
      size: "19",
      color: "#5d655f"
    }),
    am: common_vendor.o(($event) => $options.changeMonth(1), "1c"),
    an: common_vendor.o((...args) => $options.goToday && $options.goToday(...args), "4b"),
    ao: common_vendor.f($data.weekdays, (day, k0, i0) => {
      return {
        a: common_vendor.t(day),
        b: day
      };
    }),
    ap: common_vendor.f($options.calendarDays, (day, k0, i0) => {
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
    aq: common_vendor.t($options.selectedDateTitle),
    ar: common_vendor.t($options.selectedWeekday),
    as: common_vendor.t($options.selectedDateSubscriptions.length),
    at: common_vendor.t($options.formatMoney($options.selectedDateTotal)),
    av: $options.selectedDateSubscriptions.length
  }, $options.selectedDateSubscriptions.length ? {
    aw: common_vendor.f($options.selectedDateSubscriptions, (item, k0, i0) => {
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
    ax: common_vendor.o(($event) => $options.openForm($data.selectedDate), "8b")
  }) : $data.activeView === "stats" ? {
    az: $data.navigationBarHeight + "px",
    aA: common_vendor.t($options.statsLabel),
    aB: common_vendor.f($data.statPeriods, (period, k0, i0) => {
      return {
        a: common_vendor.t(period.label),
        b: period.value,
        c: $data.statsPeriod === period.value ? 1 : "",
        d: common_vendor.o(($event) => $data.statsPeriod = period.value, period.value)
      };
    }),
    aC: common_vendor.t($options.formatMoney($options.statsTotal)),
    aD: common_vendor.t($options.statsSubscriptionCount),
    aE: common_vendor.t($data.statsPeriod === "year" ? "年度" : $data.statsPeriod === "next" ? "未来 30 天" : "月均"),
    aF: common_vendor.t($data.statsPeriod === "year" ? "年度" : "月均"),
    aG: $options.donutBackground,
    aH: common_vendor.f($options.categoryStats, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.name),
        c: common_vendor.t($options.formatMoney(item.value)),
        d: common_vendor.t(item.percent),
        e: item.name
      };
    }),
    aI: common_vendor.f($options.trendData, (bar, k0, i0) => {
      return {
        a: common_vendor.t($options.compactAmount(bar.value)),
        b: bar.height + "%",
        c: common_vendor.t(bar.month),
        d: bar.month
      };
    }),
    aJ: common_vendor.p({
      type: "info-filled",
      size: "20",
      color: "#177e4b"
    })
  } : $data.activeView === "profile" ? common_vendor.e({
    aL: $data.navigationBarHeight + "px",
    aM: common_vendor.t($data.subscriptions.length),
    aN: common_vendor.t($options.formatMoney($options.monthlyAverage)),
    aO: common_vendor.t($data.settings.notificationEnabled ? "已开启" : "未开启"),
    aP: common_vendor.p({
      type: $options.isMember ? "checkbox-filled" : "vip-filled",
      size: "22",
      color: "#ffffff"
    }),
    aQ: common_vendor.t($options.isMember ? "会员权益" : "升级会员"),
    aR: common_vendor.t($options.isMember ? "会员已开启" : "开通会员"),
    aS: common_vendor.t($options.isMember ? "无限新增订阅 · 本地模拟会员" : "解锁无限订阅，重要支出更从容"),
    aT: common_vendor.p({
      type: "right",
      size: "18",
      color: $options.isMember ? "#3c7c5a" : "#9b6a28"
    }),
    aU: !$options.isMember
  }, !$options.isMember ? {
    aV: common_vendor.t($options.freeQuotaText),
    aW: $options.membershipQuotaPercent + "%",
    aX: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    aY: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    }),
    aZ: common_vendor.p({
      type: "checkmarkempty",
      size: "13",
      color: "#8b641f"
    })
  } : {}, {
    ba: $options.isMember ? 1 : "",
    bb: common_vendor.o((...args) => $options.openMembership && $options.openMembership(...args), "f3"),
    bc: common_vendor.p({
      type: "notification",
      size: "18",
      color: "#177e4b"
    }),
    bd: common_vendor.t($data.settings.notificationEnabled ? "授权状态已保存" : "未开启"),
    be: $data.settings.notificationEnabled,
    bf: common_vendor.o(($event) => $options.handleNotificationSwitch($event.detail.value), "ba"),
    bg: common_vendor.p({
      type: "calendar",
      size: "18",
      color: "#bb6b18"
    }),
    bh: common_vendor.t($data.settings.defaultReminders.join("、")),
    bi: common_vendor.t($data.settings.reminderTime),
    bj: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bk: common_vendor.o((...args) => $options.openReminderSettings && $options.openReminderSettings(...args), "0b"),
    bl: common_vendor.p({
      type: "email",
      size: "18",
      color: "#3c7fc1"
    }),
    bm: $data.settings.weeklySummary,
    bn: common_vendor.o(($event) => $options.updateSetting("weeklySummary", $event.detail.value), "d6"),
    bo: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "#6458c9"
    }),
    bp: common_vendor.t($data.settings.defaultCurrency),
    bq: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    br: $data.currencies,
    bs: common_vendor.o(($event) => $options.updateSetting("defaultCurrency", $data.currencies[$event.detail.value]), "74"),
    bt: common_vendor.p({
      type: "download",
      size: "18",
      color: "#177e4b"
    }),
    bv: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bw: common_vendor.o((...args) => $options.exportData && $options.exportData(...args), "e1"),
    bx: common_vendor.p({
      type: "locked",
      size: "18",
      color: "#3c7fc1"
    }),
    by: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bz: common_vendor.o((...args) => $options.showPrivacy && $options.showPrivacy(...args), "d2"),
    bA: common_vendor.p({
      type: "refresh",
      size: "18",
      color: "#cc4b52"
    }),
    bB: common_vendor.p({
      type: "right",
      size: "17",
      color: "#aab0ac"
    }),
    bC: common_vendor.o((...args) => $options.resetDemoData && $options.resetDemoData(...args), "20")
  }) : $data.activeView === "membership" ? common_vendor.e({
    bE: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    bF: common_vendor.o(($event) => $options.goBackView("profile"), "8b"),
    bG: common_vendor.p({
      type: $options.isMember ? "checkbox-filled" : "vip-filled",
      size: "36",
      color: "#e6a526"
    }),
    bH: common_vendor.t($options.isMember ? "✦ 会员已激活" : "✦ 升级会员"),
    bI: common_vendor.t($options.isMember ? "无限订阅已解锁" : "解锁无限订阅"),
    bJ: common_vendor.t($options.isMember ? "感谢使用，所有会员权益均已开放" : "不再受 5 条免费额度限制，尽情记录"),
    bK: common_vendor.p({
      type: "list",
      size: "22",
      color: "#c87f1a"
    }),
    bL: common_vendor.p({
      type: "notification-filled",
      size: "22",
      color: "#c87f1a"
    }),
    bM: common_vendor.p({
      type: "bars",
      size: "22",
      color: "#c87f1a"
    }),
    bN: $options.isMember ? 1 : "",
    bO: !$options.isMember
  }, !$options.isMember ? {
    bP: common_vendor.p({
      type: "vip-filled",
      size: "24",
      color: "#fff"
    }),
    bQ: common_vendor.p({
      type: "right",
      size: "18",
      color: "rgba(255,255,255,.7)"
    }),
    bR: common_vendor.o((...args) => $options.activateMembership && $options.activateMembership(...args), "a9")
  } : {}, {
    bS: common_vendor.p({
      type: "list",
      size: "20",
      color: "#b8720f"
    }),
    bT: common_vendor.p({
      type: "notification-filled",
      size: "20",
      color: "#16834d"
    }),
    bU: common_vendor.p({
      type: "bars",
      size: "20",
      color: "#16834d"
    }),
    bV: common_vendor.p({
      type: "locked",
      size: "20",
      color: "#16834d"
    }),
    bW: common_vendor.p({
      type: $options.isMember ? "vip-filled" : "person",
      size: "22",
      color: $options.isMember ? "#b8720f" : "#16834d"
    }),
    bX: $options.isMember ? 1 : "",
    bY: common_vendor.t($options.isMember ? "会员版" : "免费版"),
    bZ: common_vendor.t($options.isMember ? "全部权益已开放" : "基础功能可用"),
    ca: $options.isMember ? 1 : "",
    cb: common_vendor.p({
      type: "compose",
      size: "22",
      color: "#16834d"
    }),
    cc: common_vendor.t($options.isMember ? "无限" : $options.freeQuotaValue),
    cd: common_vendor.t($options.isMember ? "不受数量限制" : "5 条免费上限"),
    ce: $options.isMember
  }, $options.isMember ? {
    cf: common_vendor.o((...args) => $options.restoreFreePlan && $options.restoreFreePlan(...args), "25")
  } : {}, {
    cg: common_vendor.p({
      type: "locked",
      size: "18",
      color: "#16834d"
    }),
    ch: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "#16834d"
    }),
    ci: common_vendor.p({
      type: "refresh",
      size: "18",
      color: "#16834d"
    })
  }) : $data.activeView === "detail" && $options.selectedSubscription ? common_vendor.e({
    ck: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    cl: common_vendor.o(($event) => $options.goBackView("all"), "14"),
    cm: common_vendor.p({
      item: $options.selectedSubscription
    }),
    cn: common_vendor.t($options.selectedSubscription.name),
    co: common_vendor.t($options.selectedSubscription.plan || $options.selectedSubscription.category),
    cp: common_vendor.t($options.statusText($options.selectedSubscription)),
    cq: common_vendor.n($options.getStatus($options.selectedSubscription)),
    cr: common_vendor.t($options.selectedSubscription.amount === null ? "金额待补充" : $options.formatMoney($options.selectedSubscription.amount)),
    cs: common_vendor.t($options.formatDate($options.selectedSubscription.nextBillingDate)),
    ct: common_vendor.t($options.daysText($options.selectedSubscription)),
    cv: common_vendor.t($options.selectedSubscription.cycle),
    cw: common_vendor.t($options.selectedSubscription.payment),
    cx: common_vendor.t($options.selectedSubscription.category),
    cy: common_vendor.t($options.selectedSubscription.autoRenew ? "已开启" : "未开启"),
    cz: common_vendor.t($data.settings.notificationEnabled ? "通知可用" : "仅站内提醒"),
    cA: common_vendor.f($options.selectedSubscription.reminders, (day, k0, i0) => {
      return {
        a: common_vendor.t(day === 0 ? "当天" : `提前 ${day} 天`),
        b: day
      };
    }),
    cB: common_vendor.t($options.nextReminderText($options.selectedSubscription)),
    cC: $options.selectedRenewalHistory.length
  }, $options.selectedRenewalHistory.length ? {
    cD: common_vendor.t($options.selectedSubscription.renewalHistory.length),
    cE: common_vendor.f($options.selectedRenewalHistory, (record, k0, i0) => {
      return {
        a: common_vendor.t($options.formatDate(record.billingDate)),
        b: common_vendor.t($options.formatMoney(record.amount)),
        c: record.confirmedAt
      };
    })
  } : {}, {
    cF: $options.selectedSubscription.note || $options.selectedSubscription.cancelGuide
  }, $options.selectedSubscription.note || $options.selectedSubscription.cancelGuide ? common_vendor.e({
    cG: $options.selectedSubscription.note
  }, $options.selectedSubscription.note ? {
    cH: common_vendor.t($options.selectedSubscription.note)
  } : {}, {
    cI: $options.selectedSubscription.cancelGuide
  }, $options.selectedSubscription.cancelGuide ? {
    cJ: common_vendor.t($options.selectedSubscription.cancelGuide)
  } : {}) : {}, {
    cK: !["cancelled", "archived", "paused"].includes($options.selectedSubscription.status)
  }, !["cancelled", "archived", "paused"].includes($options.selectedSubscription.status) ? common_vendor.e({
    cL: $options.renewalLocked
  }, $options.renewalLocked ? {
    cM: common_vendor.p({
      type: "checkbox-filled",
      size: "24",
      color: "#177e4b"
    }),
    cN: common_vendor.t($options.formatDate($options.selectedSubscription.lastRenewedBillingDate, false)),
    cO: common_vendor.t($options.formatDate($options.selectedSubscription.nextBillingDate, false))
  } : $options.daysUntil($options.selectedSubscription.nextBillingDate) > 7 ? {
    cQ: common_vendor.p({
      type: "calendar",
      size: "20",
      color: "#8a9590"
    }),
    cR: common_vendor.t($options.daysUntil($options.selectedSubscription.nextBillingDate)),
    cS: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "#8a9590"
    }),
    cT: common_vendor.o((...args) => $options.confirmRenewal && $options.confirmRenewal(...args), "5e")
  } : {
    cU: common_vendor.t($options.daysUntil($options.selectedSubscription.nextBillingDate) === 0 ? "今天扣费" : $options.daysUntil($options.selectedSubscription.nextBillingDate) > 0 ? `${$options.daysUntil($options.selectedSubscription.nextBillingDate)} 天后扣费` : `已逾期 ${Math.abs($options.daysUntil($options.selectedSubscription.nextBillingDate))} 天未确认`),
    cV: common_vendor.p({
      type: "checkbox-filled",
      size: "20",
      color: "#177e4b"
    }),
    cW: common_vendor.o((...args) => $options.confirmRenewal && $options.confirmRenewal(...args), "22")
  }, {
    cP: $options.daysUntil($options.selectedSubscription.nextBillingDate) > 7,
    cX: $options.renewalLocked ? 1 : ""
  }) : {}, {
    cY: common_vendor.p({
      type: "more-filled",
      size: "19",
      color: "#177e4b"
    }),
    cZ: common_vendor.o((...args) => $options.showMoreActions && $options.showMoreActions(...args), "ad"),
    da: common_vendor.p({
      type: "compose",
      size: "19",
      color: "#ffffff"
    }),
    db: common_vendor.o(($event) => $options.openForm(null, $options.selectedSubscription), "ae")
  }) : $data.activeView === "form" ? common_vendor.e({
    dd: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    de: common_vendor.o(($event) => $options.goBackView($data.editingId ? "detail" : "home"), "32"),
    df: common_vendor.t($data.editingId ? "编辑订阅" : "新增订阅"),
    dg: !$data.editingId
  }, !$data.editingId ? {
    dh: common_vendor.f($data.serviceTemplates, (item, k0, i0) => {
      return {
        a: "3fa108be-61-" + i0,
        b: common_vendor.p({
          type: item.icon,
          size: "26",
          color: "#ffffff"
        }),
        c: item.color,
        d: common_vendor.t(item.short),
        e: item.name,
        f: common_vendor.o(($event) => $options.applyTemplate(item), item.name)
      };
    })
  } : {}, {
    di: $data.form.name,
    dj: common_vendor.o(common_vendor.m(($event) => $data.form.name = $event.detail.value, {
      trim: true
    }), "23"),
    dk: $data.form.plan,
    dl: common_vendor.o(common_vendor.m(($event) => $data.form.plan = $event.detail.value, {
      trim: true
    }), "72"),
    dm: common_vendor.t($data.form.category),
    dn: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    dp: $data.categories,
    dq: common_vendor.o(($event) => $data.form.category = $data.categories[$event.detail.value], "83"),
    dr: common_vendor.f($data.logoColors, (color, k0, i0) => {
      return {
        a: color,
        b: `选择品牌色 ${color}`,
        c: $data.form.color === color ? 1 : "",
        d: color,
        e: common_vendor.o(($event) => $data.form.color = color, color)
      };
    }),
    ds: $data.form.amount,
    dt: common_vendor.o(($event) => $data.form.amount = $event.detail.value, "f4"),
    dv: common_vendor.t($data.form.cycle),
    dw: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    dx: $data.cycles,
    dy: common_vendor.o(($event) => $data.form.cycle = $data.cycles[$event.detail.value], "fb"),
    dz: common_vendor.t($data.form.payment),
    dA: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    dB: $data.payments,
    dC: common_vendor.o(($event) => $data.form.payment = $data.payments[$event.detail.value], "4a"),
    dD: common_vendor.t($options.formatDate($data.form.nextBillingDate)),
    dE: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    dF: $options.todayKey,
    dG: $data.form.nextBillingDate,
    dH: common_vendor.o(($event) => $data.form.nextBillingDate = $event.detail.value, "02"),
    dI: $data.form.autoRenew,
    dJ: common_vendor.o(($event) => $data.form.autoRenew = $event.detail.value, "3d"),
    dK: common_vendor.f($data.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: $data.form.reminders.includes(option.value)
      }, $data.form.reminders.includes(option.value) ? {
        b: "3fa108be-66-" + i0,
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "12",
          color: "#177e4b"
        })
      } : {}, {
        d: common_vendor.t(option.label),
        e: option.value,
        f: $data.form.reminders.includes(option.value) ? 1 : "",
        g: common_vendor.o(($event) => $options.toggleReminder(option.value), option.value)
      });
    }),
    dL: common_vendor.p({
      type: "notification",
      size: "14",
      color: "#3c9a68"
    }),
    dM: common_vendor.t($options.formReminderPreview),
    dN: $data.form.note,
    dO: common_vendor.o(common_vendor.m(($event) => $data.form.note = $event.detail.value, {
      trim: true
    }), "2f"),
    dP: $data.form.cancelGuide,
    dQ: common_vendor.o(common_vendor.m(($event) => $data.form.cancelGuide = $event.detail.value, {
      trim: true
    }), "2a"),
    dR: $data.formError
  }, $data.formError ? {
    dS: common_vendor.p({
      type: "info-filled",
      size: "18",
      color: "#c5444c"
    }),
    dT: common_vendor.t($data.formError)
  } : {}, {
    dU: common_vendor.p({
      type: "checkmarkempty",
      size: "20",
      color: "#ffffff"
    }),
    dV: common_vendor.t($data.editingId ? "保存修改" : "保存订阅"),
    dW: common_vendor.o((...args) => $options.saveSubscription && $options.saveSubscription(...args), "c0")
  }) : $data.activeView === "reminder-settings" ? {
    dY: common_vendor.p({
      type: "left",
      size: "24",
      color: "#202622"
    }),
    dZ: common_vendor.o(($event) => $options.goBackView("profile"), "7a"),
    ea: common_vendor.p({
      type: "notification-filled",
      size: "24",
      color: "#177e4b"
    }),
    eb: common_vendor.f($data.reminderOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(option.label),
        b: common_vendor.t(option.desc),
        c: $data.settings.defaultReminders.includes(option.value)
      }, $data.settings.defaultReminders.includes(option.value) ? {
        d: "3fa108be-72-" + i0,
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
    ec: common_vendor.t($data.settings.timezone),
    ed: common_vendor.t($data.settings.reminderTime),
    ee: common_vendor.p({
      type: "right",
      size: "16",
      color: "#a2a7a3"
    }),
    ef: $data.settings.reminderTime,
    eg: common_vendor.o(($event) => $options.updateSetting("reminderTime", $event.detail.value), "52"),
    eh: common_vendor.o(($event) => $options.goBackView("profile"), "ef")
  } : {}, {
    H: $data.activeView === "all",
    ag: $data.activeView === "calendar",
    ay: $data.activeView === "stats",
    aK: $data.activeView === "profile",
    bD: $data.activeView === "membership",
    cj: $data.activeView === "detail" && $options.selectedSubscription,
    dc: $data.activeView === "form",
    dX: $data.activeView === "reminder-settings",
    ei: `calc(100vh - ${$data.statusBarHeight}px)`,
    ej: $data.scrollTop,
    ek: $data.sortSheetVisible
  }, $data.sortSheetVisible ? {
    el: common_vendor.p({
      type: "closeempty",
      size: "21",
      color: "#5f6862"
    }),
    em: common_vendor.o((...args) => $options.closeSortSheet && $options.closeSortSheet(...args), "18"),
    en: common_vendor.f($data.sortOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: "3fa108be-75-" + i0,
        b: common_vendor.p({
          type: option.icon,
          size: "20",
          color: $data.sortMode === option.value ? "#177e4b" : "#6f7972"
        }),
        c: common_vendor.t(option.label),
        d: common_vendor.t(option.desc),
        e: $data.sortMode === option.value
      }, $data.sortMode === option.value ? {
        f: "3fa108be-76-" + i0,
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
    eo: common_vendor.o(() => {
    }, "25"),
    ep: common_vendor.o((...args) => $options.closeSortSheet && $options.closeSortSheet(...args), "e0"),
    eq: common_vendor.o(() => {
    }, "01")
  } : {}, {
    er: $options.showTabBar
  }, $options.showTabBar ? {
    es: common_vendor.f($data.tabs, (tab, k0, i0) => {
      return {
        a: "3fa108be-77-" + i0,
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
