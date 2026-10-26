import { SubscriptionRecord } from './subscription';

const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// Use the recorded billing date and amount; current price/status never rewrites spending.
export function spendingHistory(
  records: SubscriptionRecord[],
  month: string,
  currency: string,
  page = 1,
) {
  const events = records
    .filter((record) => !record.isDemo)
    .flatMap((record) =>
      record.renewalHistory.map((event) => ({
        id: event.id,
        subscriptionId: record.id,
        name: record.name,
        category: record.category,
        deleted: Boolean(record.deletedAt),
        billingDate: event.previousNextBillingDate,
        confirmedAt: event.renewedAt,
        amount: event.amount,
        currency: event.currency,
      })),
    );
  const monthly = events.filter(
    (event) => event.billingDate.slice(0, 7) === month,
  );
  const selected = monthly.filter((event) => event.currency === currency);
  const known = selected.filter((event) => event.amount !== null);
  const totals = new Map<
    string,
    { currency: string; total: number; count: number; unknownCount: number }
  >();
  for (const event of monthly) {
    const group = totals.get(event.currency) ?? {
      currency: event.currency,
      total: 0,
      count: 0,
      unknownCount: 0,
    };
    group.count++;
    if (event.amount === null) group.unknownCount++;
    else group.total = money(group.total + event.amount);
    totals.set(event.currency, group);
  }
  const total = money(known.reduce((sum, event) => sum + event.amount!, 0));
  const categories = new Map<string, number>();
  for (const event of known)
    categories.set(
      event.category,
      (categories.get(event.category) ?? 0) + event.amount!,
    );
  const trend: Array<{
    month: string;
    value: number;
    count: number;
    knownCount: number;
  }> = [];
  const [year, monthNumber] = month.split('-').map(Number);
  for (let offset = -5; offset <= 0; offset++) {
    const key = new Date(Date.UTC(year, monthNumber - 1 + offset, 1))
      .toISOString()
      .slice(0, 7);
    const entries = events.filter(
      (event) =>
        event.currency === currency && event.billingDate.slice(0, 7) === key,
    );
    trend.push({
      month: key,
      value: money(
        entries.reduce((sum, event) => sum + (event.amount ?? 0), 0),
      ),
      count: entries.length,
      knownCount: entries.filter((event) => event.amount !== null).length,
    });
  }
  selected.sort(
    (a, b) =>
      b.billingDate.localeCompare(a.billingDate) ||
      b.confirmedAt.localeCompare(a.confirmedAt) ||
      a.id.localeCompare(b.id),
  );
  const limit = 20;
  return {
    month,
    currency,
    total,
    count: selected.length,
    unknownCount: selected.length - known.length,
    totalsByCurrency: [...totals.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency),
    ),
    currencies: [
      ...new Set([currency, ...events.map((event) => event.currency)]),
    ].sort(),
    categoryStats: [...categories]
      .map(([category, value]) => ({
        category,
        value: money(value),
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value),
    trend,
    entries: selected.slice((page - 1) * limit, page * limit),
    meta: {
      page,
      limit,
      total: selected.length,
      hasMore: page * limit < selected.length,
    },
  };
}
