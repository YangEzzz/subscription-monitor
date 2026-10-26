"use strict";
const api_subscriptions = require("../../api/subscriptions.js");
const api_auth = require("../../api/auth.js");
function currentMonth() {
  const date = /* @__PURE__ */ new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(month, offset) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
async function loadSpendingHistory(view, append = false) {
  var _a, _b, _c;
  if (append && (view.loading || !((_a = view.result) == null ? void 0 : _a.meta.hasMore)))
    return;
  const sequence = ++view.requestId;
  const userId = (_b = api_auth.getSession()) == null ? void 0 : _b.user.id;
  const page = append ? view.result.meta.page + 1 : 1;
  view.loading = true;
  view.error = "";
  if (!append)
    view.result = null;
  try {
    const result = await api_subscriptions.subscriptionApi.history(
      view.month,
      view.currency,
      page
    );
    if (sequence !== view.requestId || ((_c = api_auth.getSession()) == null ? void 0 : _c.user.id) !== userId)
      return;
    view.result = append ? { ...result, entries: [...view.result.entries, ...result.entries] } : result;
  } catch (error) {
    if (sequence === view.requestId)
      view.error = error.message || "暂时无法读取支出记录，请重试";
  } finally {
    if (sequence === view.requestId)
      view.loading = false;
  }
}
exports.currentMonth = currentMonth;
exports.loadSpendingHistory = loadSpendingHistory;
exports.shiftMonth = shiftMonth;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/spending-history.js.map
