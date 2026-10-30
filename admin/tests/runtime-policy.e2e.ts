import { test, expect } from '@playwright/test';
test('runtime policy saves, validates, recovers from failure and fits narrow screens', async ({
  page,
}) => {
  let policy = { membershipEnabled: false, freeSubscriptionLimit: 10 };
  let writes = 0,
    fail = false;
  await page.route('**/session', (r) =>
    r.fulfill({
      json: { configured: true, authenticated: true, username: 'admin' },
    }),
  );
  await page.route('**/overview?**', (r) =>
    r.fulfill({ json: { users: 0, subscriptions: 0 } }),
  );
  await page.route('**/data?**', (r) =>
    r.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 20 } }),
  );
  await page.route('**/runtime-policy', async (r) => {
    if (r.request().method() === 'POST') {
      writes++;
      if (fail)
        return r.fulfill({
          status: 500,
          json: { message: '保存失败，请重试' },
        });
      policy = r.request().postDataJSON();
    }
    return r.fulfill({ json: policy });
  });
  await page.goto('/');
  await expect(page.getByLabel('免费用户订阅数量上限')).toHaveValue('10');
  await page.getByLabel('免费用户订阅数量上限').fill('0');
  await page.getByRole('button', { name: '保存配置' }).click();
  await expect(
    page.getByText('请填写 1–100000 的整数订阅上限', { exact: true }),
  ).toBeVisible();
  expect(writes).toBe(0);
  await page.getByLabel('免费用户订阅数量上限').fill('15');
  await page.getByLabel('开放会员功能').check();
  await page.getByRole('button', { name: '保存配置' }).click();
  await expect(
    page.getByText('已保存，用户下次请求即按新配置生效。'),
  ).toBeVisible();
  expect(policy).toMatchObject({
    membershipEnabled: true,
    freeSubscriptionLimit: 15,
  });
  fail = true;
  await page.getByLabel('免费用户订阅数量上限').fill('20');
  await page.getByRole('button', { name: '保存配置' }).click();
  await expect(
    page.getByText('保存失败，请重试', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('免费用户订阅数量上限')).toHaveValue('20');
  fail = false;
  await page.getByRole('button', { name: '保存配置' }).click();
  await expect(
    page.getByText('已保存，用户下次请求即按新配置生效。'),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: '保存配置' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'docs/runtime-policy-mobile.png',
    fullPage: true,
  });
});
