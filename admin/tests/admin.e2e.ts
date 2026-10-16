import { test, expect, type Page } from '@playwright/test';

const subscriptions = Array.from({ length: 26 }, (_, index) => ({
  id: `sub-${index}`,
  name:
    index === 0
      ? '家庭影音订阅 · 长名称用于核对详情中的完整展示'
      : `订阅 ${index}`,
  userId: `wx-user-${index}`,
  amount: index === 1 ? null : 9.9,
  currency: index === 2 ? 'USD' : 'CNY',
  nextBillingDate: '2026-10-20',
  status: index === 3 ? 'paused' : 'active',
  deletedAt: index === 4 ? '2026-10-01T00:00:00Z' : null,
}));
const overview = {
  users: 26,
  subscriptions: 25,
  notifications: 4,
  failedNotifications: 2,
  persistence: 'prisma',
  notificationsConfigured: true,
  schedulerEnabled: false,
};
async function mockApi(page: Page) {
  await page.route('**/overview', (route) => route.fulfill({ json: overview }));
  await page.route('**/data?**', (route) => {
    const url = new URL(route.request().url());
    const section = url.searchParams.get('section');
    const search = url.searchParams.get('search') || '';
    const page = Number(url.searchParams.get('page'));
    const rows =
      section === 'subscriptions'
        ? subscriptions
        : section === 'users'
          ? subscriptions.map((row) => ({
              id: row.userId,
              subscriptions: 1,
              plan: 'free',
              notificationEnabled: true,
              createdAt: null,
              lastAccessIp:
                row.id === 'sub-0'
                  ? '2001:db8:1234:5678:abcd:ef01:2345:6789'
                  : null,
              lastAccessAt: row.id === 'sub-0' ? '2026-10-16T02:30:00Z' : null,
            }))
          : section === 'membershipOrders'
            ? [
                {
                  id: 'order-1',
                  productName: '永久会员',
                  userId: 'wx-user-0',
                  amount: 9.9,
                  currency: 'CNY',
                  status: 'paid',
                  channel: 'simulation',
                  paidAt: '2026-10-01T00:00:00Z',
                  createdAt: '2026-10-01T00:00:00Z',
                },
              ]
            : [];
    const filtered = rows.filter((row) =>
      Object.values(row).some((value) => String(value).includes(search)),
    );
    return route.fulfill({
      json: {
        items: filtered.slice((page - 1) * 20, page * 20),
        total: filtered.length,
        page,
        pageSize: 20,
      },
    });
  });
}
test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('页面使用官方 shadcn-vue 组件，搜索和详情均由生成的组件承载', async ({
  page,
}) => {
  await page.goto('/?view=users');
  await expect(page.locator('[data-slot="card"]')).toBeVisible();
  await expect(page.locator('[data-slot="input"]')).toBeVisible();
  await expect(page.locator('[data-slot="table"]')).toBeVisible();
  await expect(page.locator('[data-slot="badge"]').first()).toBeVisible();
  await page.locator('tbody tr').first().getByRole('button').click();
  await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  await page.getByRole('button', { name: '关闭窗口', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '打开导航菜单' }).click();
  await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('用户列表显示访问 IP 和北京时间，旧记录为空，窄屏详情保留完整 IPv6', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=users');
  await expect(
    page.getByRole('columnheader', { name: '最近访问 IP' }),
  ).toBeVisible();
  const first = page.locator('tbody tr').first();
  await expect(first).toContainText('2001:db8:1234:5678:abcd:ef01:2345:6789');
  await expect(first).toContainText('10:30');
  await expect(page.locator('tbody tr').nth(1)).toContainText('—');
  await first.getByRole('button', { name: /查看.*详情/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('最近访问 IP');
  await expect(dialog).toContainText('2001:db8:1234:5678:abcd:ef01:2345:6789');
  await page.screenshot({
    path: 'test-results/user-access-mobile.png',
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('打包页面在后台 CSP 下工作，真实口径与主题保持一致', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: '数据概览', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.metric-value').nth(1)).toHaveText('25');
  await expect(page.getByText('PostgreSQL', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '切换深色主题' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  expect(errors).toEqual([]);
  await page.screenshot({
    path: 'test-results/overview-desktop.png',
    fullPage: true,
  });
});
test('服务器分页、搜索、清除、用户跳转和浏览器返回', async ({ page }) => {
  await page.goto('/?view=subscriptions');
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole('searchbox').fill('missing');
  await expect(page.getByText('没有匹配的记录', { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/page=2/);
  await page
    .getByRole('button', { name: '清除搜索', exact: true })
    .first()
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('link', { name: 'wx-user-0', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '用户列表', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: '订阅记录', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(20);
});
test('详情完整字段、键盘关闭与焦点恢复，模拟金额不重复转换', async ({
  page,
}) => {
  await page.goto('/?view=membershipOrders');
  await expect(page.getByText('模拟成功', { exact: true })).toBeVisible();
  const trigger = page.getByRole('button', { name: /查看永久会员详情/ });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('order-1', { exact: true })).toBeVisible();
  await expect(dialog.getByText('¥9.90', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test('独立列表错误恢复，刷新失败保留并标记旧数据', async ({ page }) => {
  await page.route('**/data?**', (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto('/?view=users');
  await expect(page.getByText('暂时无法读取数据')).toBeVisible();
  await page.unroute('**/data?**');
  await mockApi(page);
  await page.getByRole('button', { name: '重新读取', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.route('**/data?**', (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.getByRole('button', { name: '刷新数据' }).click();
  await expect(page.locator('.panel-error')).toContainText(
    '当前显示上次读取的数据',
  );
  await expect(page.locator('tbody tr')).toHaveCount(20);
});
test('取消过期搜索请求，中文合成期间不发起查询', async ({ page }) => {
  const queries: string[] = [];
  await page.route('**/data?**', async (route) => {
    const search =
      new URL(route.request().url()).searchParams.get('search') || '';
    queries.push(search);
    if (search === 'old')
      await new Promise((resolve) => setTimeout(resolve, 800));
    await route
      .fulfill({
        json: {
          items: search === 'new' ? [subscriptions[0]] : [],
          total: search === 'new' ? 1 : 0,
          page: 1,
          pageSize: 20,
        },
      })
      .catch(() => {});
  });
  await page.goto('/?view=subscriptions');
  const input = page.getByRole('searchbox');
  await input.fill('old');
  await expect.poll(() => queries.includes('old')).toBe(true);
  await input.fill('new');
  await expect(page.locator('tbody')).toContainText(subscriptions[0].name);
  await expect(page.locator('.table-meta')).toContainText('搜索：new');
  await input.dispatchEvent('compositionstart');
  await input.fill('中文');
  await page.waitForTimeout(400);
  expect(queries).not.toContain('中文');
  await input.dispatchEvent('compositionend');
  await expect.poll(() => queries.includes('中文')).toBe(true);
});
test('窄屏导航、模态焦点与表格横向滚动，无页面溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '打开导航菜单' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: '订阅记录' })
    .click();
  await expect(
    page.getByRole('heading', { name: '订阅记录', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const scroll = page.locator('[data-slot="table-container"]');
  expect(
    await scroll.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/subscriptions-mobile.png',
    fullPage: true,
  });
});
test('部署配置的同源接口可查询并检查连接', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.metric-value').first()).toHaveText('26');
  await page.getByRole('link', { name: '连接设置', exact: true }).click();
  await expect(page.locator('.address-box')).toHaveText(
    'http://127.0.0.1:4174/api/',
  );
  await page.getByRole('button', { name: '检查连接' }).click();
  await expect(page.locator('.connection-result')).toContainText('连接成功');
});

test('未知视图恢复概览，畸形列表响应展示错误而非虚构空态', async ({ page }) => {
  await page.goto('/?view=constructor');
  await expect(
    page.getByRole('heading', { name: '数据概览', level: 1 }),
  ).toBeVisible();
  await page.route('**/data?**', (route) => route.fulfill({ json: null }));
  await page.getByRole('link', { name: '用户列表', exact: true }).click();
  await expect(page.getByText('暂时无法读取数据')).toBeVisible();
  await expect(
    page.getByText('列表响应格式不正确，请检查管理接口地址。', { exact: true }),
  ).toBeVisible();
});

test('支持域名子目录部署，资源与 API 前缀保持一致', async ({ page }) => {
  await page.goto('/admin/?view=connection');
  await expect(
    page.getByRole('heading', { name: '连接设置', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('.address-box')).toHaveText(
    'http://127.0.0.1:4174/admin/api/',
  );
  await expect(page.locator('.connection-result')).toContainText('连接成功');
  await page.getByRole('link', { name: '用户列表', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await expect(page).toHaveURL(/\/admin\/\?view=users$/);
});
