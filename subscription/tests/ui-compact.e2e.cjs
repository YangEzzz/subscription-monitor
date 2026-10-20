const { createRequire } = require("node:module");
const { createServer } = require("node:http");
const { readFile } = require("node:fs/promises");
const { resolve, extname, sep } = require("node:path");
const assert = require("node:assert/strict");
const backend = createRequire(resolve(__dirname, "../../backend/package.json"));
const {
  chromium,
  expect,
} = require("../../admin/node_modules/@playwright/test");
process.env.NODE_ENV = "test";
process.env.PERSISTENCE_DRIVER = "memory";
process.env.WECHAT_APP_ID = "wx-ui-test";
process.env.WECHAT_APP_SECRET = "ui-test-only";
process.env.AUTH_TOKEN_SECRET = "ui-test-session-secret-at-least-32-bytes";
process.env.WECHAT_PAY_ENABLED = "false";
process.env.WECHAT_VIRTUAL_PAY_ENABLED = "false";
process.env.LOCAL_ADMIN_ENABLED = "false";
backend("reflect-metadata");
const { NestFactory } = backend("@nestjs/core");
const { ValidationPipe, VersioningType } = backend("@nestjs/common");
const { AppModule } = backend("./dist/app.module.js");
const validation = backend("./dist/utils/validation-options.js").default;
const realFetch = global.fetch;
global.fetch = (url, options) =>
  String(url).startsWith("https://api.weixin.qq.com")
    ? Promise.resolve(
        new Response(
          JSON.stringify({
            openid:
              new URL(String(url)).searchParams.get("js_code") ||
              "ui-test-only",
            session_key: "not-a-production-session",
          }),
        ),
      )
    : realFetch(url, options);
(async () => {
  let app, server, browser;
  const errors = [];
  let failReads = false;
  let offline = false;
  try {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validation));
    await app.listen(0, "127.0.0.1");
    const api = (await app.getUrl()) + "/api/v1";
    const session = await realFetch(api + "/auth/wechat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "ui-test-only" }),
    }).then((r) => r.json());
    assert.ok(session.accessToken);
    const day = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    for (const [i, name] of [
      "家庭影音订阅",
      "云端文件备份",
      "音乐会员",
      "团队效率工具 · 一个较长的服务名称",
    ].entries()) {
      const r = await realFetch(api + "/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.accessToken,
        },
        body: JSON.stringify({
          name,
          logo: name.slice(0, 2),
          amount: i === 2 ? null : [28, 18, 15, 68, 0, 298][i],
          category: [
            "video",
            "cloud",
            "music",
            "productivity",
            "reading",
            "productivity",
          ][i],
          cycle: i === 5 ? "yearly" : "monthly",
          currency: i === 3 ? "USD" : "CNY",
          payment: "wechat",
          nextBillingDate: day([1, 3, 6, 12, 17, 25][i]),
          reminders: [7, 3, 1],
          autoRenew: true,
          color: [
            "#315acb",
            "#448aaa",
            "#c55d65",
            "#6b65a0",
            "#b58338",
            "#315acb",
          ][i],
        }),
      });
      assert.equal(r.status, 201, await r.text());
    }
    const root = resolve(__dirname, "../.preview/redesign-h5");
    server = createServer(async (req, res) => {
      let file = resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (!file.startsWith(root + sep) && file !== root) {
        res.writeHead(403).end();
        return;
      }
      let data;
      try {
        data = await readFile(file);
      } catch {
        file = resolve(root, "index.html");
        data = await readFile(file);
      }
      res.setHeader(
        "Content-Type",
        {
          ".js": "application/javascript",
          ".css": "text/css",
          ".html": "text/html",
          ".ttf": "font/ttf",
          ".png": "image/png",
        }[extname(file)] || "application/octet-stream",
      );
      res.end(data);
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = "http://127.0.0.1:" + server.address().port;
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(
      (session) =>
        !localStorage.getItem("renewal_wechat_session_v1") &&
        localStorage.setItem(
          "renewal_wechat_session_v1",
          JSON.stringify({ type: "object", data: session }),
        ),
      session,
    );
    await context.route("**/api/v1/**", async (route) => {
      if (offline) return route.abort("internetdisconnected");
      if (failReads && route.request().method() === "GET")
        return route.fulfill({
          status: 503,
          json: { code: "INTERNAL_SERVER_ERROR" },
        });
      const source = new URL(route.request().url());
      const response = await route.fetch({
        url: api + source.pathname.replace("/api/v1", "") + source.search,
      });
      await route.fulfill({ response });
    });
    await context.route("https://**/*", (route) =>
      route.request().url().includes("/api/v1/")
        ? route.fallback()
        : route.abort(),
    );
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);

    await expect(page.locator(".home-page")).toBeVisible();
    const height = async (selector) =>
      (await page.locator(selector).first().boundingBox()).height;
    const shot = async (name) => {
      await page.waitForTimeout(550);
      await page.screenshot({
        path: resolve(
          __dirname,
          "../.preview/redesign-compact-" + name + ".png",
        ),
      });
    };
    assert.ok((await height(".rd-stat-link .rd-compact-face")) <= 32);
    assert.ok((await height(".rd-eye .rd-compact-face")) <= 32);
    assert.ok((await height(".rd-eye")) >= 44);
    const head = await page
      .locator(".home-page .sec-head")
      .first()
      .boundingBox();
    const all = await page.locator(".link-pill").boundingBox();
    assert.ok(
      head.x + head.width - all.x - all.width < 30,
      "All entry must align right",
    );
    await shot("home");
    await page.locator(".rd-stat-link").click();
    await expect(page.locator(".stats-page")).toBeVisible();
    await expect(page.locator(".dock-tab")).toHaveCount(0);
    await expect(page.locator(".display-amount")).toHaveText("¥46.00");
    await page
      .locator(".selection-segmented .selection-option")
      .filter({ hasText: "年度" })
      .click();
    await expect(page.locator(".display-amount")).toHaveText("¥552.00");
    await page
      .locator(".selection-segmented .selection-option")
      .filter({ hasText: "未来30天" })
      .click();
    await expect(page.locator(".display-amount")).toHaveText("¥46.00");
    await page.locator(".rd-currency").click();
    fsDebug = await page
      .locator("uni-picker-view")
      .evaluate((el) => el.outerHTML);
    require("node:fs").writeFileSync(
      resolve(__dirname, "../.preview/redesign-picker-dom.txt"),
      fsDebug,
    );
    await page
      .getByText("USD", { exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByText("完成", { exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.locator(".rd-currency")).toContainText("USD");
    await expect(page.locator(".display-amount")).toHaveText("$68.00");
    await page.locator(".navbar-back").click();
    await expect(page.locator(".home-page")).toBeVisible();
    await page.locator(".dock-tab").filter({ hasText: "日历" }).click();
    await page
      .locator(".rd-calendar-day")
      .filter({ has: page.locator(".rd-calendar-marks") })
      .first()
      .click();
    await expect(page.locator(".rd-calendar-detail .srow")).toHaveCount(1);
    assert.ok((await height(".rd-month-arrow")) >= 44);
    assert.ok((await height(".rd-today .rd-compact-face")) <= 34);
    await shot("calendar");
    await page.locator(".rd-today").click();
    await page
      .getByRole("button", { name: "添加到这一天", exact: true })
      .click();
    await expect(page.locator(".form-page")).toBeVisible();
    await expect(
      page.locator(".form-row").filter({ hasText: "下次扣费日" }),
    ).toContainText(
      new Date().getFullYear() +
        "年" +
        (new Date().getMonth() + 1) +
        "月" +
        new Date().getDate() +
        "日",
    );
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const box of await page.locator(".reminder-options button").all())
        assert.ok((await box.boundingBox()).height <= 45);
      assert.ok((await height(".amount-input")) <= 45);
      assert.equal(
        await page
          .locator(".reminder-options")
          .evaluate(
            (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
          ),
        3,
      );
      assert.ok(
        await page
          .locator(".form-page")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        "form overflow",
      );
      await page.locator(".reminder-options").scrollIntoViewIfNeeded();
      await shot("form-" + width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "返回", exact: true }).click();
    await page.locator(".dock-tab").filter({ hasText: "订阅" }).click();
    await page.locator(".srow").filter({ hasText: "团队效率工具" }).click();
    await expect(page.locator(".process-button.early")).toBeVisible();
    assert.ok((await height(".process-button.early")) <= 45);
    assert.equal(
      await page
        .locator(".process-button.early")
        .evaluate((el) => getComputedStyle(el).flexDirection),
      "row",
    );
    await page.locator(".process-button.early").scrollIntoViewIfNeeded();
    await shot("detail-early");
    await page.locator(".navbar-back").click();
    await page.locator(".dock-tab").filter({ hasText: "我的" }).click();
    await page.locator(".setrow").filter({ hasText: "默认币种" }).click();
    await page
      .getByText("USD", { exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByText("完成", { exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.locator(".setting-value")).toHaveText("USD");
    await page
      .locator(".setrow")
      .filter({ hasText: "减少动态效果" })
      .locator("uni-switch")
      .click();
    await expect(page.locator(".app-shell")).toHaveClass(/reduce-motion/);
    await page.locator(".dock-tab").filter({ hasText: "首页" }).click();
    assert.equal(
      await page
        .locator(".dock-halo")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.locator(".dock-tab").filter({ hasText: "订阅" }).click();
    await page
      .locator(".selection-tabs .selection-option")
      .filter({ hasText: "有效订阅" })
      .focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".selection-tabs .selection-active")).toHaveText(
      "试用中",
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        stage:
          "compact controls, alignment, 320/390 layouts and original interactions passed",
        errors,
      }),
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((r) => server.close(r));
    if (app) await app.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
