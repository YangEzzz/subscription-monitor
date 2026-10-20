// Read-only view adapters. Never write these values into a subscription payload.
import {
  parseDate,
  toDateKey,
  daysUntil,
} from "../../pages/subscription/subscription-data.js";

export function dueTone(date) {
  const days = daysUntil(date);
  return days < 0 ? "overdue" : days <= 7 ? "hot" : days <= 14 ? "mid" : "far";
}

export function logoPaint(color) {
  if (!/^#[\da-f]{6}$/i.test(color || "")) return {};
  const shade = (factor) =>
    "#" +
    color
      .slice(1)
      .match(/../g)
      .map((part) =>
        Math.min(255, Math.round(parseInt(part, 16) * factor))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  return {
    background: `linear-gradient(160deg, ${shade(1.12)}, ${shade(0.82)})`,
    "--service-color": color,
  };
}

export function cycleProgress(subscription, today = toDateKey(new Date())) {
  const months = { 每月: 1, 每季度: 3, 每半年: 6, 每年: 12 };
  const end = parseDate(subscription.nextBillingDate);
  if (!Number.isFinite(end.getTime())) return null;
  const start = new Date(end);
  if (subscription.cycle === "每周") start.setDate(start.getDate() - 7);
  else if (months[subscription.cycle]) {
    start.setDate(1);
    start.setMonth(start.getMonth() - months[subscription.cycle]);
    const lastDay = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
    ).getDate();
    start.setDate(Math.min(subscription.anchorDay || end.getDate(), lastDay));
  } else return null;
  const span = end - start;
  if (span <= 0) return null;
  return {
    start: toDateKey(start),
    end: subscription.nextBillingDate,
    percent: Math.max(
      0,
      Math.min(100, ((parseDate(today) - start) / span) * 100),
    ),
  };
}
