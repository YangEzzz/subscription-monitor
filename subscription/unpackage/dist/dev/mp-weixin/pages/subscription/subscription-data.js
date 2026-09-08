"use strict";
const CATEGORY_COLORS = {
  "影音娱乐": "#e74a52",
  "音乐": "#ef6c52",
  "云存储": "#3f91ed",
  "AI 工具": "#1f9c70",
  "效率工具": "#6658d9",
  "阅读": "#c17d2f",
  "其他": "#73817a"
};
const STATUS_LABELS = {
  active: "正常",
  upcoming: "即将到期",
  trial: "试用中",
  pending: "待处理",
  paused: "已暂停",
  cancelled: "已取消",
  archived: "已归档"
};
const CURRENCY_SYMBOLS = {
  CNY: "¥",
  USD: "$",
  HKD: "HK$",
  JPY: "JP¥"
};
function pad(value) {
  return String(value).padStart(2, "0");
}
function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function parseDate(dateKey) {
  const values = String(dateKey).split("-").map(Number);
  return new Date(values[0], values[1] - 1, values[2], 12, 0, 0);
}
function addDays(dateKey, days) {
  const date = typeof dateKey === "string" ? parseDate(dateKey) : new Date(dateKey);
  date.setDate(date.getDate() + Number(days));
  return toDateKey(date);
}
function formatDate(dateKey, withYear = true) {
  const date = parseDate(dateKey);
  return withYear ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日` : `${date.getMonth() + 1}月${date.getDate()}日`;
}
function daysUntil(dateKey) {
  const today = parseDate(toDateKey(/* @__PURE__ */ new Date()));
  return Math.ceil((parseDate(dateKey) - today) / 864e5);
}
function getDisplayStatus(item) {
  if (["paused", "cancelled", "archived"].includes(item.status))
    return item.status;
  if (item.status === "pending")
    return "pending";
  if (item.trialEndDate && daysUntil(item.trialEndDate) >= 0)
    return "trial";
  const days = daysUntil(item.nextBillingDate);
  if (days < 0)
    return "pending";
  if (days <= Math.max(...item.reminders || [3]))
    return "upcoming";
  return "active";
}
function getCycleMonths(cycle) {
  return { "每周": 0.2301, "每月": 1, "每季度": 3, "每半年": 6, "每年": 12, "一次性": 0 }[cycle] || 1;
}
function getMonthlyEquivalent(item) {
  if (item.amount === null || item.amount === "" || item.status === "cancelled" || item.status === "paused" || item.status === "archived")
    return 0;
  const months = item.cycle === "自定义天数" ? Number(item.cycleValue || 0) / 30.4375 : getCycleMonths(item.cycle);
  if (!months)
    return 0;
  return Number(item.amount) / months;
}
function createDefaultSettings() {
  return {
    amountVisible: true,
    notificationEnabled: false,
    notificationAuthorization: [],
    weeklySummary: true,
    defaultCurrency: "CNY",
    defaultReminders: [7, 3, 1],
    reminderTime: "09:00",
    timezone: "Asia/Shanghai",
    membership: {
      status: "free",
      plan: "免费版",
      startedAt: null
    }
  };
}
exports.CATEGORY_COLORS = CATEGORY_COLORS;
exports.CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;
exports.STATUS_LABELS = STATUS_LABELS;
exports.addDays = addDays;
exports.createDefaultSettings = createDefaultSettings;
exports.daysUntil = daysUntil;
exports.formatDate = formatDate;
exports.getDisplayStatus = getDisplayStatus;
exports.getMonthlyEquivalent = getMonthlyEquivalent;
exports.parseDate = parseDate;
exports.toDateKey = toDateKey;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/subscription/subscription-data.js.map
