import { subscriptionApi } from "../../api/subscriptions.js";
import { getSession } from "../../api/auth.js";

export function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month, offset) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function loadSpendingHistory(view, append = false) {
  if (append && (view.loading || !view.result?.meta.hasMore)) return;
  const sequence = ++view.requestId;
  const userId = getSession()?.user.id;
  const page = append ? view.result.meta.page + 1 : 1;
  view.loading = true;
  view.error = "";
  if (!append) view.result = null;
  try {
    const result = await subscriptionApi.history(
      view.month,
      view.currency,
      page,
    );
    if (sequence !== view.requestId || getSession()?.user.id !== userId) return;
    view.result = append
      ? { ...result, entries: [...view.result.entries, ...result.entries] }
      : result;
  } catch (error) {
    if (sequence === view.requestId)
      view.error = error.message || "暂时无法读取支出记录，请重试";
  } finally {
    if (sequence === view.requestId) view.loading = false;
  }
}
