import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface ExchangeRateSnapshot {
  base: string;
  rates: Record<string, number>;
  date: string;
  source: string;
}

const DAY_MS = 86400000;

@Injectable()
export class ExchangeRatesService {
  private cached?: { value: ExchangeRateSnapshot; fetchedAt: number };
  private pending?: Promise<ExchangeRateSnapshot>;

  async snapshot(): Promise<ExchangeRateSnapshot> {
    if (
      this.cached &&
      Date.now() - this.cached.fetchedAt < 6 * 3600000 &&
      Date.now() - Date.parse(this.cached.value.date) < 7 * DAY_MS
    ) {
      return this.cached.value;
    }
    if (!this.pending) {
      this.pending = this.load().finally(() => {
        this.pending = undefined;
      });
    }
    return this.pending;
  }

  private async load(): Promise<ExchangeRateSnapshot> {
    try {
      const response = await fetch(
        'https://api.frankfurter.dev/v2/rates?base=CNY&quotes=USD,HKD,JPY',
        {
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) throw new Error('Exchange rate request failed');
      const rows: unknown = await response.json();
      if (!Array.isArray(rows)) throw new Error('Invalid exchange rates');
      const rates: Record<string, number> = { CNY: 1 };
      const dates: string[] = [];
      for (const row of rows as Array<Record<string, unknown>>) {
        if (
          row.base !== 'CNY' ||
          !['USD', 'HKD', 'JPY'].includes(String(row.quote))
        )
          continue;
        const date = String(row.date);
        const age = Date.now() - Date.parse(date);
        if (
          typeof row.rate !== 'number' ||
          !Number.isFinite(row.rate) ||
          row.rate <= 0 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(age) ||
          age < -DAY_MS ||
          age > 7 * DAY_MS
        ) {
          throw new Error('Invalid or outdated exchange rate');
        }
        rates[String(row.quote)] = row.rate;
        dates.push(date);
      }
      if (!['USD', 'HKD', 'JPY'].every((code) => rates[code]))
        throw new Error('Missing exchange rate');
      const value = {
        base: 'CNY',
        rates,
        date: dates.sort()[0],
        source: 'Frankfurter',
      };
      this.cached = { value, fetchedAt: Date.now() };
      return value;
    } catch {
      throw new ServiceUnavailableException('汇率暂不可用，请稍后刷新重试');
    }
  }
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  snapshot: ExchangeRateSnapshot | null,
): number {
  if (from === to || amount === 0) return amount;
  const source = snapshot?.rates[from];
  const target = snapshot?.rates[to];
  if (!source || !target)
    throw new ServiceUnavailableException('缺少币种汇率，暂时无法汇总');
  return (amount / source) * target;
}
