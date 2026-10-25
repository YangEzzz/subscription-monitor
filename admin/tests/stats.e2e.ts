import { test, expect, type Page } from '@playwright/test';
function fixture(range: number) {
  const end = Date.parse('2026-10-24T00:00:00Z');
  return {
    rangeDays: range,
    excludeTest: true,
    undatedRefunds: { count: 0, amountCny: 0 },
    timezone: 'Asia/Shanghai',
    from: new Date(end - (range - 1) * 86400000).toISOString().slice(0, 10),
    to: '2026-10-24',
    generatedAt: '2026-10-24T01:00:00Z',
    trackingSince: null,
    summary: {
      newUsers: 13,
      activeUsers: null,
      newSubscriptions: 4,
      paidUsers: 1,
      paidOrders: 1,
      paidAmountCny: 9.9,
      refundAmountCny: 0,
      netAmountCny: 9.9,
      refundOrders: 0,
      convertedUsers: 1,
      conversionRate: 1 / 13,
    },
    activity: { dau: null, wau: null, mau: null },
    retention: { d1: null, d7: null, d30: null },
    cohorts: [{ date: '2026-10-24', users: 2, d1: null, d7: null, d30: null }],
    days: Array.from({ length: range }, (_, i) => ({
      date: new Date(end - (range - i - 1) * 86400000)
        .toISOString()
        .slice(0, 10),
      newUsers: i === range - 1 ? 2 : 0,
      activeUsers: null,
      newSubscriptions: 0,
      paidUsers: 0,
      paidOrders: 0,
      paidAmountCny: 0,
      refundAmountCny: 0,
      netAmountCny: 0,
      refundOrders: 0,
    })),
  };
}
async function setup(page: Page) {
  await page.route('**/session', (r) =>
    r.fulfill({
      json: { configured: true, authenticated: true, username: 'admin' },
    }),
  );
  await page.route('**/overview?**', (r) =>
    r.fulfill({
      json: {
        users: 13,
        subscriptions: 4,
        activeMembers: 1,
        paidAmountCny: 9.9,
        refundAmountCny: 0,
        netAmountCny: 9.9,
        paymentIssues: 0,
        notifications: 0,
        failedNotifications: 0,
      },
    }),
  );
  await page.route('**/stats?**', (r) =>
    r.fulfill({
      json: fixture(
        Number(new URL(r.request().url()).searchParams.get('days')),
      ),
    }),
  );
}
test('switching ranges discards slow stale responses and keeps dark charts readable', async ({
  page,
}) => {
  await setup(page);
  let oldRequested = false;
  await page.route('**/stats?**', async (route) => {
    const n = Number(new URL(route.request().url()).searchParams.get('days'));
    if (n === 30) {
      oldRequested = true;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    await route.fulfill({ json: fixture(n) }).catch(() => {});
  });
  await page.goto('/?view=analytics&days=30');
  await expect.poll(() => oldRequested).toBe(true);
  await page.getByRole('button', { name: '近 7 天', exact: true }).click();
  await expect(page.getByText('2026-10-18 — 2026-10-24')).toBeVisible();
  await page.waitForTimeout(750);
  await expect(page.getByText('2026-10-18 — 2026-10-24')).toBeVisible();
  await page.getByRole('button', { name: /深色/ }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: '.runtime/stats-dark.png', fullPage: true });
});
test('analytics supports ranges, keyboard charts, missing history, daily details and browser back', async ({
  page,
}) => {
  await setup(page);
  let lists = 0;
  page.on('request', (r) => {
    if (r.url().includes('/data?')) lists++;
  });
  await page.goto('/?view=analytics&days=30');
  await expect(
    page.getByRole('heading', { name: '数据统计', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '支付金额明细', exact: true }),
  ).toHaveText('¥ 9.90');
  const chart = page.getByRole('group', { name: /新增账号趋势图/ });
  await chart.focus();
  await page.keyboard.press('End');
  await expect(chart.getByText('2026-10-24', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '活跃用户', exact: true }).click();
  await expect(page.getByText('尚无活跃采集记录')).toBeVisible();
  await page.getByRole('button', { name: '近 7 天', exact: true }).click();
  await expect(page).toHaveURL(/days=7/);
  await expect(page.getByText('2026-10-18 — 2026-10-24')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: '近 30 天' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByText('每日数据明细（30 天）', { exact: true }).click();
  await expect(page.getByRole('table').last().locator('tbody tr')).toHaveCount(
    30,
  );
  expect(lists).toBe(0);
});
test('analytics retries failures and discards malformed responses', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/stats?**', (r) =>
    r.fulfill({ status: 500, json: { message: '统计暂时不可用' } }),
  );
  await page.goto('/?view=analytics');
  await expect(
    page.getByRole('alert').filter({ hasText: '暂时无法读取数据' }),
  ).toBeVisible();
  await page.route('**/stats?**', (r) =>
    r.fulfill({ json: { rangeDays: 30, days: [] } }),
  );
  await page.getByRole('button', { name: '重新读取', exact: true }).click();
  await expect(
    page.getByText('统计响应格式不正确，请重新读取。'),
  ).toBeVisible();
  await page.route('**/stats?**', (r) => r.fulfill({ json: fixture(30) }));
  await page.getByRole('button', { name: '重新读取', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '增长与使用趋势' }),
  ).toBeVisible();
});
test('analytics expires admin sessions on unauthorized responses', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/stats?**', (r) =>
    r.fulfill({ status: 401, json: { message: '请登录' } }),
  );
  await page.goto('/?view=analytics');
  await expect(page.getByLabel('密码', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '增长与使用趋势' }),
  ).toHaveCount(0);
});
for (const width of [390, 768, 1440])
  test(`analytics layout at ${width}px`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/?view=analytics');
    await expect(
      page.getByRole('heading', { name: '增长与使用趋势' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.runtime/stats-${width}.png`,
      fullPage: true,
    });
  });
