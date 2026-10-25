import { test, expect, type Page } from '@playwright/test';
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
        today: {
          date: '2026-10-25',
          newUsers: 2,
          activeUsers: 3,
          newSubscriptions: 4,
          paidUsers: 1,
          paidOrders: 1,
          paidAmountCny: 9.9,
          refundAmountCny: 0,
          netAmountCny: 9.9,
        },
      },
    }),
  );
  await page.route('**/data?**', (r) =>
    r.fulfill({
      json: {
        items: [
          {
            id: 'mo-test',
            userId: 'alice',
            productName: '永久会员',
            amount: 9.9,
            currency: 'CNY',
            channel: 'virtual',
            status: 'paid',
            createdAt: '2026-10-24T01:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    }),
  );
}
const base = {
  eligible: true,
  amount: 990,
  currency: 'CNY',
  refund: null,
  reason: '可以全额退款',
};
const refund = {
  refundId: 'rf-test',
  amount: 990,
  status: 'processing',
  reason: '用户主动申请退款',
  operator: 'admin',
  createdAt: '2026-10-25T01:00:00Z',
  updatedAt: '2026-10-25T01:00:00Z',
  errorCode: null,
};
test('an uncertain submission requires rereading the original record before another action', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/refunds/**', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: base })
      : route.fulfill({ status: 502, json: { message: '提交结果暂未确认' } }),
  );
  await page.goto('/?view=membershipOrders');
  await page.locator('tbody tr').first().getByRole('button').click();
  await page.getByLabel('退款原因', { exact: true }).fill('用户申请退款');
  await page.getByRole('button', { name: '核对并退款' }).click();
  await page
    .getByRole('button', { name: '确认退款 ¥9.90', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: '确认退款 ¥9.90', exact: true }),
  ).toHaveCount(0);
  await page.route('**/refunds/**', (r) =>
    r.fulfill({
      json: {
        ...base,
        eligible: false,
        refund: { ...refund, status: 'unknown' },
      },
    }),
  );
  await page.getByRole('button', { name: '重新读取退款状态' }).click();
  await expect(
    page.getByText('结果待核实 · ¥9.90', { exact: true }),
  ).toBeVisible();
});
test('today is distinct from cumulative counts and technical decorations are removed', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/');
  const today = page.locator('.today-summary');
  await expect(today.getByText('2026-10-25', { exact: true })).toBeVisible();
  await expect(today.getByText('¥ 9.90', { exact: true })).toBeVisible();
  await expect(today.locator('.today-values>div').first()).toContainText('2');
  for (const text of [
    '只读',
    '只读工作台',
    '已连接后台',
    '服务运行检查',
    '定时任务',
    '微信通知已配置',
  ])
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: '累计概况', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: '.runtime/overview-today.png',
    fullPage: true,
  });
});
test('refund requires an explicit review, records processing and synchronizes only after confirmation', async ({
  page,
}) => {
  await setup(page);
  let submitted = 0,
    checked = 0,
    payload: any;
  await page.route('**/refunds/**', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: base });
    if (route.request().url().endsWith('/check')) {
      checked++;
      return route.fulfill({ json: { ...refund, status: 'succeeded' } });
    }
    submitted++;
    payload = route.request().postDataJSON();
    return route.fulfill({ json: refund });
  });
  await page.goto('/?view=membershipOrders');
  await page.locator('tbody tr').first().getByRole('button').click();
  await page.getByRole('button', { name: '核对并退款', exact: true }).click();
  await expect(page.getByText('请填写至少 2 个字的退款原因。')).toBeVisible();
  expect(submitted).toBe(0);
  await page.getByLabel('退款原因', { exact: true }).fill('用户主动申请退款');
  await page.getByRole('button', { name: '核对并退款', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '确认向原付款账户退款 ¥9.90？' }),
  ).toBeVisible();
  expect(submitted).toBe(0);
  await page.screenshot({ path: '.runtime/refund-review.png', fullPage: true });
  await page
    .getByRole('button', { name: '确认退款 ¥9.90', exact: true })
    .click();
  await expect(
    page.getByText('平台处理中 · ¥9.90', { exact: true }),
  ).toBeVisible();
  expect(submitted).toBe(1);
  expect(payload).toEqual({
    reason: '用户主动申请退款',
    reasonCode: '3',
    amount: 990,
    confirmOrderId: 'mo-test',
  });
  await page.getByRole('button', { name: '查询退款进度', exact: true }).click();
  await expect(
    page.getByText('退款完成 · ¥9.90', { exact: true }),
  ).toBeVisible();
  expect(checked).toBe(1);
});
test('unknown refund is retained and iOS guidance never offers a submit action', async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/refunds/**', (r) =>
    r.fulfill({
      json: {
        ...base,
        eligible: false,
        refund: { ...refund, status: 'unknown' },
      },
    }),
  );
  await page.goto('/?view=membershipOrders');
  await page.locator('tbody tr').first().getByRole('button').click();
  await expect(
    page.getByText('结果待核实 · ¥9.90', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '核对并退款' })).toHaveCount(0);
  await page.screenshot({
    path: '.runtime/refund-unknown-mobile.png',
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await page.route('**/refunds/**', (r) =>
    r.fulfill({
      json: {
        ...base,
        eligible: false,
        reason: 'iOS 订单由用户向 Apple 申请退款，本后台不能主动退款。',
      },
    }),
  );
  await page.locator('tbody tr').first().getByRole('button').click();
  await expect(
    page.getByText('iOS 订单由用户向 Apple 申请退款，本后台不能主动退款。'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '核对并退款' })).toHaveCount(0);
});
test('refund read failures retry and unauthorized writes expire the session', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/refunds/**', (r) =>
    r.fulfill({ status: 500, json: { message: '不可用' } }),
  );
  await page.goto('/?view=membershipOrders');
  await page.locator('tbody tr').first().getByRole('button').click();
  await expect(
    page.getByRole('button', { name: '重新读取退款状态' }),
  ).toBeVisible();
  await page.route('**/refunds/**', (r) => r.fulfill({ json: base }));
  await page.getByRole('button', { name: '重新读取退款状态' }).click();
  await page.getByLabel('退款原因', { exact: true }).fill('用户申请退款');
  await page.getByRole('button', { name: '核对并退款' }).click();
  await page.route('**/refunds/**', (r) =>
    r.fulfill({ status: 401, json: { message: '登录失效' } }),
  );
  await page
    .getByRole('button', { name: '确认退款 ¥9.90', exact: true })
    .click();
  await expect(page.getByLabel('密码', { exact: true })).toBeVisible();
});
