import { test, expect, type Page } from '@playwright/test';

const subscriptions = Array.from({ length: 26 }, (_, index) => ({
  id: `sub-${index}`,
  name:
    index === 0
      ? '家庭影音订阅 · 长名称用于核对详情中的完整展示'
      : `订阅 ${index}`,
  userId: 'wx-user-0',
  amount: index === 1 ? null : 9.9,
  currency: index === 2 ? 'USD' : 'CNY',
  nextBillingDate: '2026-10-20',
  status: index === 3 ? 'paused' : 'active',
  deletedAt: index === 4 ? '2026-10-01T00:00:00Z' : null,
}));
const overview = {
  activeMembers: 3,
  paidAmountCny: 19.8,
  refundAmountCny: 0,
  netAmountCny: 19.8,
  paymentIssues: 2,
  snapshotAt: '2026-10-24T00:00:00Z',
  users: 26,
  subscriptions: 25,
  notifications: 4,
  failedNotifications: 2,
  persistence: 'prisma',
  notificationsConfigured: true,
  schedulerEnabled: false,
  today: {
    date: '2026-10-25',
    newUsers: 2,
    activeUsers: 3,
    paidOrders: 1,
    paidUsers: 1,
    newSubscriptions: 4,
    paidAmountCny: 9.9,
    refundAmountCny: 0,
    netAmountCny: 9.9,
  },
};
async function mockApi(page: Page) {
  await page.route('**/users/**/membership', (r) =>
    r.fulfill({ json: { membership: null, grant: null, canGrant: false } }),
  );
  await page.route('**/users/**/test-flag', (r) =>
    r.fulfill({
      json: {
        isTest: false,
        testNote: null,
        testUpdatedBy: null,
        testUpdatedAt: null,
        canEdit: false,
      },
    }),
  );
  await page.route('**/refunds/**', (route) =>
    route.fulfill({
      json: {
        eligible: false,
        amount: 990,
        currency: 'CNY',
        refund: null,
        reason: '模拟订单没有实际扣款，不办理退款。',
      },
    }),
  );
  await page.route('**/session', (route) =>
    route.fulfill({
      json: { configured: true, authenticated: true, username: 'admin' },
    }),
  );
  await page.route('**/overview?**', (route) =>
    route.fulfill({ json: overview }),
  );
  await page.route('**/data?**', (route) => {
    const url = new URL(route.request().url());
    const section = url.searchParams.get('section');
    const search = url.searchParams.get('search') || '';
    const page = Number(url.searchParams.get('page'));
    const rows =
      section === 'subscriptions'
        ? subscriptions.filter(
            (row) => row.userId === url.searchParams.get('userId'),
          )
        : section === 'users'
          ? subscriptions.map((row, index) => ({
              id: `wx-user-${index}`,
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
test('后台赠送会员核对用户、保留失败原因并刷新确认，窄屏可操作', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let granted = false;
  let submissions = 0;
  await page.route('**/users/**/membership', async (route) => {
    if (route.request().method() === 'POST') {
      submissions++;
      expect(route.request().postDataJSON()).toEqual({ note: '活动奖励' });
      granted = true;
      // A lost response after commit must be resolved by reading, not resubmitting.
      await route.fulfill({
        status: 503,
        json: { message: '网络中断，请刷新核对' },
      });
      return;
    }
    await route.fulfill({
      json: {
        membership: granted
          ? { status: 'active', plan: 'member', source: 'admin' }
          : null,
        grant: granted
          ? {
              note: '活动奖励',
              operator: 'admin',
              createdAt: '2026-10-27T02:00:00Z',
            }
          : null,
        canGrant: true,
      },
    });
  });
  await page.goto('/?view=users');
  await page
    .locator('tbody tr')
    .first()
    .getByRole('button', { name: /查看.*详情/ })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: '赠送永久会员', exact: true })
    .click();
  await expect(dialog).toContainText('将为用户 wx-user-0 免费开通永久会员');
  await dialog.getByRole('button', { name: '确认赠送永久会员' }).click();
  await expect(dialog.getByRole('alert')).toContainText('2–200');
  await dialog.getByLabel('赠送原因').fill('活动奖励');
  await dialog.getByRole('button', { name: '确认赠送永久会员' }).click();
  await expect(dialog.getByRole('alert')).toContainText('网络中断');
  await expect(dialog.getByLabel('赠送原因')).toHaveValue('活动奖励');
  await expect(
    dialog.getByRole('button', { name: '确认赠送永久会员' }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: '刷新会员状态' }).click();
  await expect(dialog).toContainText('已开通永久会员');
  await expect(dialog).toContainText('后台赠送 · admin');
  expect(submissions).toBe(1);
  await expect(
    dialog.getByRole('button', { name: '赠送永久会员', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/membership-grant-mobile.png',
    fullPage: true,
  });
});

test('后台赠送成功后刷新列表且阻止重复开通', async ({ page }) => {
  let granted = false;
  let submissions = 0;
  await page.route('**/users/**/membership', async (route) => {
    if (route.request().method() === 'POST') {
      granted = true;
      submissions++;
    }
    await route.fulfill({
      json: {
        membership: granted
          ? { status: 'active', plan: 'member', source: 'admin' }
          : null,
        grant: granted
          ? {
              note: '活动奖励',
              operator: 'admin',
              createdAt: '2026-10-27T02:00:00Z',
            }
          : null,
        canGrant: true,
      },
    });
  });
  await page.goto('/?view=users');
  await page
    .locator('tbody tr')
    .first()
    .getByRole('button', { name: /查看.*详情/ })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: '赠送永久会员', exact: true })
    .click();
  await dialog.getByLabel('赠送原因').fill('活动奖励');
  await dialog.getByRole('button', { name: '确认赠送永久会员' }).click();
  await expect(dialog.getByRole('status')).toContainText('会员已开通');
  await expect(dialog).toContainText('已开通永久会员');
  expect(submissions).toBe(1);
  await page.screenshot({
    path: 'test-results/membership-grant-desktop.png',
    fullPage: true,
  });
});

for (const width of [390, 1440]) {
  test(`后台取消会员资格确认与结果核对 ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const original = {
      userId: 'wx-user-0',
      status: 'active',
      plan: 'member',
      source: 'virtual',
      sourceOrderId: 'paid-order',
      startedAt: '2026-10-01T00:00:00.000Z',
    };
    let revoked = false;
    let submissions = 0;
    const state = () => ({
      membership: revoked
        ? {
            ...original,
            status: 'free',
            plan: 'free',
            source: 'admin_revoked',
            startedAt: null,
          }
        : original,
      grant: null,
      revocation: revoked
        ? {
            operator: 'admin',
            note: '违规取消',
            createdAt: '2026-10-27T03:00:00Z',
          }
        : null,
      canGrant: true,
      canRevoke: true,
    });
    await page.route('**/users/**/membership', (route) =>
      route.fulfill({ json: state() }),
    );
    await page.route('**/users/**/membership/revoke', async (route) => {
      submissions++;
      expect(route.request().postDataJSON()).toEqual({
        note: '违规取消',
        expectedMembership: original,
      });
      revoked = true;
      await route.fulfill(
        width === 390
          ? { status: 503, json: { message: '提交响应中断' } }
          : { json: state() },
      );
    });
    await page.goto('/?view=users');
    await page
      .locator('tbody tr')
      .first()
      .getByRole('button', { name: /查看.*详情/ })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('button', { name: '取消会员资格', exact: true })
      .click();
    expect(submissions).toBe(0);
    await expect(dialog).toContainText('取消资格不会自动退款');
    await expect(dialog).toContainText('已有订阅及历史记录保留');
    await expect(dialog).toContainText('wx-user-0');
    await dialog.getByRole('button', { name: '确认取消会员资格' }).click();
    await expect(dialog.getByRole('alert')).toContainText('取消原因');
    await dialog.getByLabel('取消原因').fill('违规取消');
    await page.screenshot({
      path: `test-results/membership-revoke-confirm-${width}.png`,
    });
    await dialog.getByRole('button', { name: '确认取消会员资格' }).click();
    if (width === 390) {
      await expect(dialog.getByRole('alert')).toContainText('提交响应中断');
      await expect(dialog.getByLabel('取消原因')).toHaveValue('违规取消');
      await expect(
        dialog.getByRole('button', { name: '确认取消会员资格' }),
      ).toBeDisabled();
      await dialog.getByRole('button', { name: '刷新会员状态' }).click();
    } else
      await expect(dialog.getByRole('status')).toContainText('会员资格已取消');
    await expect(dialog).toContainText('当前为免费用户');
    await expect(dialog).toContainText('后台取消资格 · admin');
    await expect(
      dialog.getByRole('button', { name: '取消会员资格', exact: true }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole('button', { name: '赠送永久会员', exact: true }),
    ).toBeVisible();
    expect(submissions).toBe(1);
    await page.screenshot({
      path: `test-results/membership-revoke-result-${width}.png`,
    });
  });
}

test('会员取消入口遵循只读环境限制，写入401退出会话', async ({ page }) => {
  let writable = false;
  await page.route('**/users/**/membership', (route) =>
    route.fulfill({
      json: {
        membership: {
          status: 'active',
          plan: 'member',
          source: 'admin',
          startedAt: null,
          sourceOrderId: null,
        },
        canGrant: writable,
        canRevoke: writable,
        grant: null,
      },
    }),
  );
  await page.route('**/users/**/membership/revoke', (route) =>
    route.fulfill({ status: 401, json: { message: '会话已过期' } }),
  );
  await page.goto('/?view=users');
  await page
    .locator('tbody tr')
    .first()
    .getByRole('button', { name: /查看.*详情/ })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    '当前环境未开放会员管理',
  );
  await expect(
    page.getByRole('button', { name: '取消会员资格', exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  writable = true;
  await page
    .locator('tbody tr')
    .first()
    .getByRole('button', { name: /查看.*详情/ })
    .click();
  await page.getByRole('button', { name: '取消会员资格', exact: true }).click();
  await page.getByLabel('取消原因').fill('资格调整');
  await page.getByRole('button', { name: '确认取消会员资格' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('管理员账号')).toBeVisible();
});

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
  await expect(page.locator('.metric-value').nth(1)).toHaveText('3');
  await expect(page.getByText('PostgreSQL', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '今天' })).toBeVisible();
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
  await page.goto('/?view=subscriptions&userId=wx-user-0');
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
  await page.getByRole('button', { name: '返回用户列表', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '用户列表', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: '用户订阅', exact: true, level: 1 }),
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
  await page.goto('/?view=subscriptions&userId=wx-user-0');
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
    .getByRole('link', { name: '用户列表', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.locator('tbody tr').first().getByRole('button').click();
  await page
    .getByRole('button', { name: '查看该用户的订阅', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: '用户订阅', exact: true, level: 1 }),
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
test('移除连接设置后旧链接回到概览并可刷新服务状态', async ({ page }) => {
  await page.goto('/?view=connection');
  await expect(
    page.getByRole('heading', { name: '数据概览', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '连接设置', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '服务运行检查' })).toHaveCount(
    0,
  );
  await expect(page.locator('.metric-value').first()).toHaveText('26');
  const response = page.waitForResponse((r) =>
    new URL(r.url()).pathname.endsWith('/api/overview'),
  );
  await page.getByRole('button', { name: '刷新数据', exact: true }).click();
  await response;
  await expect(page.locator('.metric-value').first()).toHaveText('26');
  await page.screenshot({
    path: 'test-results/overview-without-settings.png',
    fullPage: true,
  });
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
  await page.goto('/admin/');
  await expect(
    page.getByRole('heading', { name: '数据概览', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('.metric-value').first()).toHaveText('26');
  await page.getByRole('link', { name: '用户列表', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await expect(page).toHaveURL(/\/admin\/\?view=users$/);
});

test('操作日志支持详情、搜索、分页和关联用户，窄屏保留完整记录', async ({
  page,
}) => {
  await page.route('**/data?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('section') !== 'authEvents')
      return route.fallback();
    const search = url.searchParams.get('search') || '';
    const number = Number(url.searchParams.get('page') || 1);
    const rows = Array.from({ length: 21 }, (_, index) => ({
      id: `event-${index}`,
      userId: `wx-user-${index}`,
      action: index === 0 ? 'register' : 'login',
      appId: 'wx-test-app',
      clientIp: '2001:db8:1234:5678:abcd:ef01:2345:6789',
      peerIp: '172.18.0.1',
      requestId: `request-${index}`,
      createdAt: '2026-10-24T01:02:03.000Z',
    })).filter((row) => row.userId.includes(search));
    await route.fulfill({
      json: {
        items: rows.slice((number - 1) * 20, number * 20),
        total: rows.length,
        page: number,
        pageSize: 20,
      },
    });
  });
  await page.goto('/?view=authEvents');
  await expect(
    page.getByRole('heading', { name: '操作日志', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr').first()).toContainText('注册');
  await expect(page.locator('tbody tr').first()).toContainText('09:02:03');
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('wx-user-20');
  await page.getByPlaceholder('搜索用户 ID', { exact: true }).fill('wx-user-0');
  await page.getByPlaceholder('搜索用户 ID', { exact: true }).press('Enter');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('wx-user-0');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator('tbody tr')
    .getByRole('button', { name: /查看.*详情/ })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('wx-test-app');
  await expect(dialog).toContainText('request-0');
  await expect(dialog).toContainText('2001:db8:1234:5678:abcd:ef01:2345:6789');
  await page.screenshot({
    path: 'test-results/auth-events-mobile.png',
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await page
    .locator('tbody tr')
    .getByRole('link', { name: 'wx-user-0', exact: true })
    .click();
  await expect(page).toHaveURL(/view=users.*search=wx-user-0/);
  await page
    .locator('tbody tr')
    .getByRole('button', { name: /查看.*详情/ })
    .click();
  await page.getByRole('button', { name: '查看操作日志', exact: true }).click();
  await expect(page).toHaveURL(/view=authEvents.*search=wx-user-0/);
});

test('操作日志空状态与接口失败有明确提示和重试', async ({ page }) => {
  let fail = false;
  await page.route('**/data?**', (route) => {
    if (
      new URL(route.request().url()).searchParams.get('section') !==
      'authEvents'
    )
      return route.fallback();
    return fail
      ? route.fulfill({ status: 500, json: { message: '日志读取失败' } })
      : route.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 20 } });
  });
  await page.goto('/?view=authEvents');
  await expect(page.getByText('暂无记录', { exact: true })).toBeVisible();
  await expect(page.getByText(/仅记录启用后的注册与登录/)).toBeVisible();
  fail = true;
  await page.reload();
  await expect(
    page.getByText('暂时无法读取数据', { exact: true }),
  ).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: '重新读取', exact: true }).click();
  await expect(page.getByText('暂无记录', { exact: true })).toBeVisible();
});

test('概览不显示跨用户订阅明细，也不请求订阅列表', async ({ page }) => {
  const listRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/api/data'))
      listRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('.metric-value').first()).toHaveText('26');
  await expect(page.getByRole('heading', { name: '订阅速览' })).toHaveCount(0);
  await expect(page.locator('table')).toHaveCount(0);
  const refreshed = page.waitForResponse((r) =>
    new URL(r.url()).pathname.endsWith('/api/overview'),
  );
  await page.getByRole('button', { name: '刷新数据', exact: true }).click();
  await refreshed;
  expect(listRequests).toEqual([]);
  await page.screenshot({
    path: 'test-results/overview-management-only.png',
    fullPage: true,
  });
  await page.getByRole('link', { name: '用户列表', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
});

test('订阅只从用户详情进入，清空搜索和刷新保留用户范围', async ({ page }) => {
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.searchParams.get('section') === 'subscriptions') requests.push(url);
  });
  await page.goto('/?view=users');
  await expect(
    page.getByRole('link', { name: '订阅记录', exact: true }),
  ).toHaveCount(0);
  await page.locator('tbody tr').first().getByRole('button').click();
  await page
    .getByRole('button', { name: '查看该用户的订阅', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: '用户订阅', level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveURL(/userId=wx-user-0/);
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.getByRole('searchbox').fill('missing');
  await expect(page.getByText('没有匹配的记录', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: '清除搜索', exact: true })
    .first()
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: '刷新数据', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  expect(requests.length).toBeGreaterThan(2);
  expect(
    requests.every((url) => url.searchParams.get('userId') === 'wx-user-0'),
  ).toBe(true);
  await page.getByRole('button', { name: '返回用户列表', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '用户列表', level: 1 }),
  ).toBeVisible();
  await page.goto('/?view=subscriptions');
  await expect(
    page.getByRole('heading', { name: '用户列表', level: 1 }),
  ).toBeVisible();
});

test('用户列表订阅数量直达所属账号，浅深色和窄屏保持可用', async ({ page }) => {
  await page.goto('/?view=users');
  await page
    .locator('tbody tr')
    .first()
    .getByRole('link', { name: '查看wx-user-0的订阅', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: '用户订阅', level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveURL(/userId=wx-user-0/);
  await expect(
    page.getByRole('columnheader', { name: '所属用户', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: '切换深色主题' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('通知历史按用户查看，概览仅进入失败排查队列', async ({ page }) => {
  const requests: URL[] = [];
  await page.route('**/data?**', (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('section') !== 'notifications')
      return route.fallback();
    requests.push(url);
    let rows = [
      {
        id: 'notice-1',
        userId: 'wx-user-0',
        status: 'sent',
        subscriptionName: '成功记录',
      },
      {
        id: 'notice-2',
        userId: 'wx-user-0',
        status: 'failed',
        subscriptionName: '失败记录',
      },
      {
        id: 'notice-3',
        userId: 'wx-user-01',
        status: 'unknown',
        subscriptionName: '待核实记录',
      },
    ];
    const owner = url.searchParams.get('userId');
    if (owner) rows = rows.filter((row) => row.userId === owner);
    if (url.searchParams.get('failedOnly') === 'true')
      rows = rows.filter((row) => ['failed', 'unknown'].includes(row.status));
    const search = url.searchParams.get('search') || '';
    rows = rows.filter((row) => row.subscriptionName.includes(search));
    return route.fulfill({
      json: { items: rows, total: rows.length, page: 1, pageSize: 20 },
    });
  });
  await page.goto('/?view=users');
  await expect(
    page.getByRole('link', { name: '通知记录', exact: true }),
  ).toHaveCount(0);
  await page.locator('tbody tr').first().getByRole('button').click();
  await page
    .getByRole('button', { name: '查看该用户的通知', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: '用户通知', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('searchbox').fill('missing');
  await expect(page.getByText('没有匹配的记录', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: '清除搜索', exact: true })
    .first()
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  expect(
    requests.every((url) => url.searchParams.get('userId') === 'wx-user-0'),
  ).toBe(true);
  await page.reload();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: '排查失败通知', exact: true }),
  ).toHaveCount(0);
  await page.goto('/?view=notifications');
  await expect(
    page.getByRole('heading', { name: '通知排查', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody')).not.toContainText('成功记录');
  expect(requests.at(-1)?.searchParams.get('failedOnly')).toBe('true');
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: '数据概览', level: 1 }),
  ).toBeVisible();
});

test('管理员登录后加载数据，退出清除界面，会话过期回到登录', async ({
  page,
}) => {
  let loggedIn = false;
  await page.route('**/session', (route) =>
    route.fulfill({
      json: {
        configured: true,
        authenticated: loggedIn,
        username: loggedIn ? 'admin' : null,
      },
    }),
  );
  await page.route('**/login', async (route) => {
    const body = route.request().postDataJSON();
    if (body.password !== 'correct-password')
      return route.fulfill({
        status: 401,
        json: { message: '账号或密码不正确。' },
      });
    loggedIn = true;
    return route.fulfill({ json: { authenticated: true, username: 'admin' } });
  });
  await page.route('**/logout', (route) => {
    loggedIn = false;
    return route.fulfill({ json: { authenticated: false } });
  });
  await page.goto('/?view=users');
  await expect(
    page.getByRole('heading', { name: '登录管理后台' }),
  ).toBeVisible();
  await expect(page.locator('tbody')).toHaveCount(0);
  await page.getByLabel('密码', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(
    page.getByText('账号或密码不正确。', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('密码', { exact: true }).fill('correct-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '用户列表', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '登录管理后台' }),
  ).toBeVisible();
  await expect(page.locator('tbody')).toHaveCount(0);
  await page.getByLabel('密码', { exact: true }).fill('correct-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.route('**/overview?**', (route) =>
    route.fulfill({ status: 401, json: { message: '会话已失效' } }),
  );
  await page.getByRole('button', { name: '刷新数据', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '登录管理后台' }),
  ).toBeVisible();
  await expect(page.locator('tbody')).toHaveCount(0);
});

test('支付核对显示问题与证据，概览金额只标人民币有效支付', async ({ page }) => {
  await page.route('**/data?**', (route) => {
    if (
      new URL(route.request().url()).searchParams.get('section') !==
      'billingIssues'
    )
      return route.fallback();
    return route.fulfill({
      json: {
        items: [
          {
            id: 'paid-order',
            userId: 'wx-user-0',
            issue: 'rights_missing',
            productName: '永久会员',
            amount: 9.9,
            currency: 'CNY',
            channel: 'virtual',
            status: 'paid',
            transactionId: 'platform-id',
            paidAt: '2026-10-24T00:00:00Z',
            memberStatus: 'free',
            paymentRequestedAt: '2026-10-23T23:59:00Z',
            deliveryConfirmedAt: null,
            createdAt: '2026-10-23T23:59:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
  });
  await page.goto('/');
  await expect(
    page.getByText('按付款记录 · 包含后来退款的订单', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.metric-value').nth(2)).toContainText('19.80');
  await page.getByRole('link', { name: '支付与权益核对', exact: true }).click();
  await expect(
    page.getByText('已支付，权益未开通', { exact: true }),
  ).toBeVisible();
  await page.locator('tbody tr').getByRole('button').click();
  await expect(page.getByRole('dialog')).toContainText('平台交易号');
  await expect(page.getByRole('dialog')).toContainText('platform-id');
  await expect(page.getByRole('dialog')).toContainText('当前会员状态');
});
