// Browser regression for opening the standalone HTML over file://.
// Requires Playwright with a Chromium browser available on the machine.
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function main() {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: `record-${i}`,
    name: `测试订阅 ${i}`,
    userId: 'test-user',
    amount: i === 0 ? null : 10,
    currency: 'CNY',
    status: 'active',
    nextBillingDate: '2026-10-01',
    createdAt: '2026-09-30T00:00:00Z',
  }));
  const requests = [];
  let disconnected = false;
  const server = createServer((req, res) => {
    requests.push({
      url: req.url,
      origin: req.headers.origin,
      key: req.headers['x-local-admin-token'],
      method: req.method,
    });
    res.setHeader('Access-Control-Allow-Origin', 'null');
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.writeHead(204).end();
      return;
    }
    if (disconnected) {
      res.destroy();
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/admin/overview') {
      res.end(
        JSON.stringify({
          users: 1,
          subscriptions: 25,
          notifications: 0,
          failedNotifications: 0,
          persistence: 'prisma',
        }),
      );
    } else if (url.pathname === '/admin/data') {
      const search = url.searchParams.get('search') || '';
      const data =
        url.searchParams.get('section') === 'subscriptions'
          ? rows.filter((row) => row.name.includes(search))
          : [];
      const page = Number(url.searchParams.get('page'));
      res.end(
        JSON.stringify({
          total: data.length,
          items: data.slice((page - 1) * 20, page * 20),
        }),
      );
    } else {
      res.writeHead(404).end('{}');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: process.env.ADMIN_BROWSER_CHANNEL || 'msedge',
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const defaultRequests = [];
    await page.route(
      'https://subscription.yangezzz.top/admin/**',
      async (route) => {
        defaultRequests.push(route.request());
        const overview = route.request().url().includes('/overview');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': 'null' },
          body: JSON.stringify(
            overview
              ? {
                  users: 1,
                  subscriptions: 25,
                  notifications: 0,
                  failedNotifications: 0,
                  persistence: 'prisma',
                }
              : { total: 25, items: rows.slice(0, 20) },
          ),
        });
      },
    );
    await page.goto(
      pathToFileURL(resolve(__dirname, '../public/admin.html')).href,
    );
    await page.waitForFunction(
      () =>
        document.getElementById('message').textContent === '已读取最新数据。',
    );
    assert.equal(defaultRequests.length, 2);
    assert.ok(
      defaultRequests.every((r) => !r.headers()['x-local-admin-token']),
    );
    assert.equal(await page.locator('#accesskey').count(), 0);
    assert.equal(
      await page.locator('#address').inputValue(),
      'https://subscription.yangezzz.top/admin/',
    );
    await page.locator('#address').fill('invalid-address');
    await page.locator('#connect').press('Enter');
    assert.match(await page.locator('#connectionerror').textContent(), /HTTPS/);
    await page
      .locator('#address')
      .fill(`http://127.0.0.1:${server.address().port}/admin/`);
    await page.locator('#connect').click();
    await page.waitForFunction(
      () => document.getElementById('subscriptions').textContent === '25',
    );
    assert.equal(await page.locator('#tbody tr').count(), 20);
    await page.locator('#next').click();
    await page.waitForFunction(
      () => document.querySelectorAll('#tbody tr').length === 5,
    );
    await page.locator('#search').fill('无匹配');
    await page.locator('#searchform button[type=submit]').click();
    await page.waitForFunction(() =>
      document.getElementById('tbody').textContent.includes('没有匹配'),
    );
    await page.locator('#clear').click();
    await page.waitForFunction(
      () => document.querySelectorAll('#tbody tr').length === 20,
    );
    await page.locator('#section').selectOption('notifications');
    await page.waitForFunction(() =>
      document.getElementById('tbody').textContent.includes('暂无记录'),
    );
    disconnected = true;
    await page.locator('#refresh').click();
    await page.waitForFunction(() =>
      document.getElementById('message').textContent.includes('无法连接后台'),
    );
    disconnected = false;
    await page.locator('#refresh').click();
    await page.waitForFunction(
      () =>
        document.getElementById('message').textContent === '已读取最新数据。',
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: resolve(
        __dirname,
        '../../subscription/.preview/admin-file-mobile.png',
      ),
      fullPage: true,
    });
    assert.equal(await page.evaluate(() => location.search), '');
    assert.deepEqual(errors, []);
    assert.ok(
      requests
        .filter((r) => r.method === 'GET')
        .every((r) => r.origin === 'null'),
    );
    assert.ok(
      requests
        .filter((r) => r.method === 'GET')
        .every((r) => r.key === undefined),
    );
    console.log(
      'PASS: file:// connection, CORS, proxy path, automatic loading without a key, address validation, paging, search/clear, empty, disconnect/recovery, 390px layout',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
