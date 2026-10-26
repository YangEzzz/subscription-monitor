import { ExchangeRatesService } from './exchange-rates.service';

describe('ExchangeRatesService', () => {
  afterEach(() => jest.restoreAllMocks());
  const rows = () =>
    ['USD', 'HKD', 'JPY'].map((quote, index) => ({
      base: 'CNY',
      quote,
      rate: [0.14, 1.1, 20][index],
      date: new Date().toISOString().slice(0, 10),
    }));

  it('shares concurrent requests and caches validated dated rates', async () => {
    const request = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rows()),
      } as Response);
    const service = new ExchangeRatesService();
    const [a, b] = await Promise.all([service.snapshot(), service.snapshot()]);
    expect(a).toEqual(b);
    expect(a.rates).toEqual({ CNY: 1, USD: 0.14, HKD: 1.1, JPY: 20 });
    await service.snapshot();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each(['missing', 'negative', 'stale', 'failure'])(
    'rejects %s rates and permits a retry',
    async (mode) => {
      const data = rows();
      if (mode === 'missing') data.pop();
      if (mode === 'negative') data[0].rate = -1;
      if (mode === 'stale') data[0].date = '2000-01-01';
      const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: mode !== 'failure',
        json: () => Promise.resolve(data),
      } as Response);
      const service = new ExchangeRatesService();
      await expect(service.snapshot()).rejects.toThrow('汇率暂不可用');
      request.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rows()),
      } as Response);
      await expect(service.snapshot()).resolves.toHaveProperty('rates.CNY', 1);
    },
  );
});
