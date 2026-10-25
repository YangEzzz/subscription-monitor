import { test, expect, type Page } from '@playwright/test';
async function setup(page: Page) {
  let marked = false;
  await page.route('**/session', (r) =>
    r.fulfill({
      json: { configured: true, authenticated: true, username: 'admin' },
    }),
  );
  const day = {
    date: '2026-10-25',
    newUsers: 26,
    activeUsers: 2,
    newSubscriptions: 3,
    paidUsers: 0,
    paidOrders: 0,
    paidAmountCny: 0,
    refundOrders: 1,
    refundAmountCny: 9.9,
    netAmountCny: -9.9,
  };
  await page.route('**/overview?**', (r) =>
    r.fulfill({
      json: {
        users: 26,
        subscriptions: 3,
        activeMembers: 1,
        paidAmountCny: 19.8,
        refundAmountCny: 9.9,
        netAmountCny: 9.9,
        paymentIssues: 0,
        notifications: 0,
        failedNotifications: 0,
        today: day,
      },
    }),
  );
  await page.route('**/stats?**', (r) => {
    const q = new URL(r.request().url()).searchParams,
      n = Number(q.get('days') || 30),
      excludeTest = q.get('excludeTest') !== 'false';
    const days = Array.from({ length: n }, (_, i) => ({
      ...day,
      date: new Date(
        Date.parse('2026-10-25T00:00:00Z') - (n - i - 1) * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      newUsers: i === n - 1 ? (excludeTest ? 26 : 27) : 0,
      paidAmountCny: i === n - 2 ? 19.8 : 0,
      refundAmountCny: i === n - 1 ? 9.9 : 0,
      netAmountCny: i === n - 1 ? -9.9 : i === n - 2 ? 19.8 : 0,
    }));
    return r.fulfill({
      json: {
        rangeDays: n,
        excludeTest,
        timezone: 'Asia/Shanghai',
        from: days[0].date,
        to: day.date,
        generatedAt: '2026-10-25T01:00:00Z',
        trackingSince: '2026-10-01T01:00:00Z',
        undatedRefunds: { count: 1, amountCny: 2 },
        days,
        cohorts: [],
        activity: { dau: 2, wau: 5, mau: 9 },
        retention: { d1: null, d7: null, d30: null },
        summary: {
          newUsers: excludeTest ? 26 : 27,
          activeUsers: 5,
          newSubscriptions: 3,
          paidUsers: 1,
          paidOrders: 2,
          paidAmountCny: 19.8,
          refundOrders: 1,
          refundAmountCny: 9.9,
          netAmountCny: 9.9,
          convertedUsers: 1,
          conversionRate: 1 / 26,
        },
      },
    });
  });
  await page.route('**/data?**', (r) =>
    r.fulfill({
      json: {
        items: [
          {
            id: 'user-1',
            isTest: marked,
            plan: 'free',
            subscriptions: 0,
            notificationEnabled: false,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    }),
  );
  await page.route('**/users/**/test-flag', (r) => {
    if (r.request().method() === 'POST')
      marked = r.request().postDataJSON().isTest;
    return r.fulfill({
      json: {
        isTest: marked,
        canEdit: true,
        testNote: marked ? '开发测试' : '普通使用',
        testUpdatedBy: 'admin',
        testUpdatedAt: null,
      },
    });
  });
  await page.route('**/stats/details?**', (r) => {
    const q = new URL(r.request().url()).searchParams,
      metric = q.get('metric'),
      p = Number(q.get('page') || 1),
      search = q.get('search') || '';
    const rows =
      metric === 'newUsers'
        ? Array.from({ length: 26 }, (_, i) => ({
            id: 'user-' + String(i + 1).padStart(2, '0'),
            isTest: false,
            createdAt: '2026-10-25T00:00:00Z',
          })).filter((row) => row.id.includes(search))
        : [
            {
              id: 'refund:r',
              userId: 'user-1',
              kind: '退款',
              amount: -9.9,
              occurredAt: '2026-10-25T01:00:00Z',
            },
          ];
    return r.fulfill({
      json: {
        items: rows.slice((p - 1) * 20, p * 20),
        total: rows.length,
        page: p,
        pageSize: 20,
        columns:
          metric === 'newUsers'
            ? [
                { key: 'id', label: '用户 ID' },
                { key: 'isTest', label: '账号类型' },
              ]
            : [
                { key: 'id', label: '记录' },
                { key: 'amount', label: '金额（元）' },
              ],
        ...(metric === 'newUsers' ? {} : { totalAmountCny: -9.9 }),
      },
    });
  });
}
test('today drilldown preserves date and audience through pagination and search', async ({
  page,
}) => {
  await setup(page);
  const requests: URL[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/stats/details?')) requests.push(new URL(r.url()));
  });
  await page.goto('/');
  await page
    .getByRole('button', { name: '今日新增账号明细', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: '新增账号明细' });
  await expect(dialog.locator('tbody tr')).toHaveCount(20);
  await dialog.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(dialog.locator('tbody tr')).toHaveCount(6);
  await dialog.getByRole('textbox', { name: '搜索统计明细' }).fill('user-26');
  await dialog.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(dialog.locator('tbody tr')).toHaveCount(1);
  expect(
    requests.every(
      (u) =>
        u.searchParams.get('from') === '2026-10-25' &&
        u.searchParams.get('to') === '2026-10-25' &&
        u.searchParams.get('excludeTest') === 'true',
    ),
  ).toBe(true);
  await page.screenshot({
    path: '.runtime/statistics-drilldown.png',
    fullPage: true,
  });
});
test('financial breakdown supports negative net and passes the selected scope to detail', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/?view=analytics&days=7');
  await expect(
    page.getByText('缺少可靠退款日期', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '已排除测试账号', exact: true })
    .click();
  await expect(page).toHaveURL(/excludeTest=false/);
  await page.getByRole('button', { name: '收支净额', exact: true }).click();
  const chart = page.getByRole('group', { name: /收支净额趋势图/ });
  await chart.focus();
  await page.keyboard.press('End');
  await expect(chart).toContainText('-9.9');
  const request = page.waitForRequest((r) =>
    r.url().includes('/stats/details?'),
  );
  await page.keyboard.press('Enter');
  const url = new URL((await request).url());
  expect(url.searchParams.get('excludeTest')).toBe('false');
  expect(url.searchParams.get('from')).toBe('2026-10-25');
  await expect(
    page.getByRole('dialog', { name: '收支净额明细' }),
  ).toContainText('-¥9.90');
  await page.keyboard.press('Escape');
  await expect(chart).toContainText('2026-10-25');
  await page.screenshot({
    path: '.runtime/statistics-finances.png',
    fullPage: true,
  });
});
test('account marking requires a reason and refreshes the user classification', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/?view=users');
  await page.locator('tbody tr').first().getByRole('button').click();
  await page
    .getByRole('button', { name: '标记为测试账号', exact: true })
    .click();
  await page
    .getByRole('button', { name: '确认标记测试账号', exact: true })
    .click();
  await expect(page.getByText('请填写至少 2 个字的标记原因。')).toBeVisible();
  await page.getByLabel('标记为测试账号的原因').fill('开发测试');
  const request = page.waitForRequest(
    (r) => r.method() === 'POST' && r.url().includes('/test-flag'),
  );
  await page
    .getByRole('button', { name: '确认标记测试账号', exact: true })
    .click();
  expect((await request).postDataJSON()).toEqual({
    isTest: true,
    note: '开发测试',
  });
  await expect(page.getByText('测试账号，默认不计入运营统计。')).toBeVisible();
  await page.getByRole('button', { name: '关闭详情', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('测试账号');
});
test('drilldown handles errors and expires authorization without showing stale records', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/stats/details?**', (r) =>
    r.fulfill({ status: 500, json: { message: '不可用' } }),
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: '今日新增账号明细', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: '重新读取' }),
  ).toBeVisible();
  await page.route('**/stats/details?**', (r) =>
    r.fulfill({ status: 401, json: { message: '失效' } }),
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '重新读取' })
    .click();
  await expect(page.getByLabel('密码', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
