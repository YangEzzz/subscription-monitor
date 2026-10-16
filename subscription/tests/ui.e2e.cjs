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
    const root = resolve(__dirname, "../.preview/timebook-h5");
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
    await expect(page.locator(".renewal-row")).toHaveCount(4); // 3 within week + up to 3 later
    await page.screenshot({
      path: resolve(__dirname, "../.preview/timebook-home-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({
      path: resolve(__dirname, "../.preview/timebook-home-desktop.png"),
      fullPage: true,
    });

    const shot = async (name) => {
      await expect(
        page.locator(".uni-toast:visible, .uni-sample-toast:visible"),
      ).toHaveCount(0);
      return page.screenshot({
        path: resolve(__dirname, "../.preview/timebook-" + name + ".png"),
        fullPage: true,
      });
    };
    const tab = async (label) =>
      page.locator(".tab-item").filter({ hasText: label }).click();
    const noOverflow = async () =>
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "document overflow",
      );
    await noOverflow();
    await page.setViewportSize({ width: 320, height: 740 });
    await noOverflow();
    await shot("home-320");
    await page.locator(".summary-eye").click();
    await expect(page.locator(".summary-amount")).toHaveText("••••");
    await page.locator(".summary-eye").click();
    await tab("订阅");
    await expect(page.locator(".list-item")).toHaveCount(4);
    await noOverflow();
    await shot("list-320");
    await expect(page.locator(".list-price.amount-missing")).toHaveText(
      "金额待补充",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await shot("list-mobile");
    await page.locator(".collection-add").click();
    await expect(page.locator(".form-page")).toBeVisible();
    await page.getByRole("button", { name: "返回", exact: true }).click();
    await expect(page.locator(".list-page")).toBeVisible();
    await page.locator(".filter-pill").filter({ hasText: "云存储" }).click();
    await expect(page.locator(".list-item")).toHaveCount(1);
    await expect(page.locator(".filter-pill.active")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator(".status-pill").filter({ hasText: "全部状态" }).click();
    await expect(page.locator(".list-item")).toHaveCount(1);
    await page.locator(".filter-pill").filter({ hasText: "全部" }).click();
    await expect(page.locator(".list-item")).toHaveCount(4);
    await page.locator(".status-pill").filter({ hasText: "有效订阅" }).click();
    await page.locator(".sort-summary").click();
    await page
      .locator(".sort-option")
      .filter({ hasText: "按金额从高到低" })
      .click();
    await expect(page.locator(".list-name").first()).toHaveText(
      "团队效率工具 · 一个较长的服务名称",
    );
    await page.locator(".sort-summary").click();
    await page
      .locator(".sort-option")
      .filter({ hasText: "按扣费日期" })
      .click();
    await page.setViewportSize({ width: 320, height: 740 });
    await page.locator(".search-box input").fill("不存在的订阅");
    await expect(page.locator(".empty-title")).toHaveText("没有匹配的订阅");
    await page.locator(".clear-search").click();
    await expect(page.locator(".list-item")).toHaveCount(4);
    await page.locator(".sort-summary").click();
    await expect(page.locator(".sort-sheet")).toBeVisible();
    await shot("sort-320");
    await page.keyboard.press("Escape");
    await expect(page.locator(".sort-sheet")).toBeHidden();
    await page.locator(".list-item").first().click();
    await expect(page.locator(".detail-name")).toHaveText("家庭影音订阅");
    await noOverflow();
    await shot("detail-320");
    await page.locator(".edit-button").click();
    await expect(page.locator(".form-page")).toBeVisible();
    await shot("form-320");
    await noOverflow();
    const name = page.locator(".form-input input").first();
    await expect(name).toHaveValue("家庭影音订阅");
    await expect(name).toHaveAttribute("aria-label", "服务名称，必填");
    await name.fill("未保存的修改");
    await page.locator(".detail-titlebar .icon-button").click();
    await page
      .getByText("继续编辑", { exact: true })
      .filter({ visible: true })
      .click();
    await expect(name).toHaveValue("未保存的修改");
    await page.locator(".detail-titlebar .icon-button").click();
    await page
      .getByText("放弃修改", { exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.locator(".detail-name")).toHaveText("家庭影音订阅");
    await page.locator(".edit-button").click();
    await name.fill("家庭影音订阅（已整理）");
    await page.locator(".save-button").click();
    await expect(page.locator(".detail-name")).toHaveText(
      "家庭影音订阅（已整理）",
    );
    await page.locator(".process-button.success").click();
    await page.getByText("确认完成", { exact: true }).click();
    await expect(page.locator(".renewal-result")).toContainText(
      "本期续费已确认",
    );
    await page.locator(".undo-button").click();
    await page.getByText("确认撤销", { exact: true }).click();
    await expect(page.locator(".process-button.success")).toBeVisible();
    await page.locator(".detail-titlebar .icon-button").click();
    await expect(page.locator(".list-page")).toBeVisible();
    await tab("日历");
    await expect(page.locator(".calendar-card")).toBeVisible();
    await noOverflow();
    await shot("calendar-320");
    await page.locator(".month-arrow").last().click();
    await page.locator(".today-button").click();
    await tab("统计");
    await expect(page.locator(".stats-summary")).toBeVisible();
    await noOverflow();
    await shot("stats-320");
    await page
      .locator(".stats-period-switch uni-button")
      .filter({ hasText: "年度" })
      .click();
    await expect(page.locator(".stats-label")).toHaveText("年度预计支出");
    await page.locator(".currency-filter").click();
    await expect(page.locator("uni-picker-view")).toBeVisible();
    await page
      .getByText("取消", { exact: true })
      .filter({ visible: true })
      .click();
    await tab("我的");
    await expect(page.locator(".profile-head")).toBeVisible();
    await noOverflow();
    await shot("profile-320");
    await page.getByText("默认提醒规则", { exact: true }).click();
    await expect(page.locator(".reminder-settings-page")).toBeVisible();
    await noOverflow();
    await shot("reminders-320");
    const checkedBefore = await page.locator(".check-box.checked").count();
    await page
      .locator(".reminder-check-row")
      .filter({ hasText: "提前 14 天" })
      .click();
    await expect(page.locator(".check-box.checked")).toHaveCount(
      checkedBefore + 1,
    );
    await page
      .locator(".reminder-check-row")
      .filter({ hasText: "提前 14 天" })
      .click();
    await expect(page.locator(".check-box.checked")).toHaveCount(checkedBefore);
    await page.locator(".save-button").click();
    await expect(page.locator(".profile-page")).toBeVisible();
    await page.locator(".membership-entry").click();
    await expect(page.locator(".membership-page")).toBeVisible();
    await noOverflow();
    await shot("membership-320");
    await expect(page.locator(".membership-primary").first()).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await shot("membership-mobile");
    await page.locator(".detail-titlebar .icon-button").click();
    await expect(page.locator(".profile-page")).toBeVisible();
    await shot("profile-mobile");
    await tab("日历");
    await noOverflow();
    await shot("calendar-mobile");
    await page
      .locator(".date-cell")
      .filter({ has: page.locator(".event-count") })
      .first()
      .click();
    await expect(page.locator(".calendar-subscription")).toHaveCount(1);
    await page.locator(".calendar-subscription").click();
    await expect(page.locator(".detail-page")).toBeVisible();
    await noOverflow();
    await shot("detail-mobile");
    await page.locator(".detail-titlebar .icon-button").click();
    await tab("统计");
    await noOverflow();
    await shot("stats-mobile");
    await page
      .locator('.stats-period-switch [role="button"]')
      .filter({ hasText: "未来30天" })
      .click();
    await expect(page.locator(".donut-value")).toHaveText("未来30天");
    await tab("我的");
    await page.setViewportSize({ width: 320, height: 740 });
    await tab("首页");
    await page.locator(".quick-add").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".form-page")).toBeVisible();
    await page.locator(".save-button").click();
    await expect(page.locator(".form-error")).toBeVisible();
    await page.locator(".form-input input").first().fill("界面验收订阅");
    await page.locator(".money-input input").first().fill("12.50");
    await page.locator(".save-button").click();
    await expect(page.locator(".detail-name")).toHaveText("界面验收订阅");
    await page.locator(".manage-button").click();
    await page.getByText("删除订阅", { exact: true }).click();
    await page
      .getByText("移入回收站", { exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.locator(".list-page")).toBeVisible();
    failReads = true;
    await page.reload();
    await expect(page.locator(".async-state")).toBeVisible();
    await expect(page.locator(".state-description")).toContainText(
      "服务暂时不可用",
    );
    await shot("error-320");
    failReads = false;
    await page.locator(".state-action").first().click();
    await expect(page.locator(".home-page")).toBeVisible();
    offline = true;
    await context.setOffline(true);
    await tab("我的");
    await page.getByText("重新加载数据", { exact: true }).click();
    await expect(page.locator(".async-state")).toBeVisible();
    offline = false;
    await context.setOffline(false);
    await page.locator(".state-action").first().click();
    await expect(page.locator(".async-state")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await tab("首页");
    await shot("home-desktop");
    await noOverflow();
    for (const width of [760, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow();
      await tab("订阅");
      await noOverflow();
      await page.locator(".list-item").first().click();
      await page.locator(".edit-button").click();
      await noOverflow();
      await page.locator(".detail-titlebar .icon-button").click();
      await page.locator(".detail-titlebar .icon-button").click();
      await tab("统计");
      await noOverflow();
      await tab("首页");
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await tab("日历");
    await noOverflow();
    await shot("calendar-desktop");
    await tab("统计");
    await noOverflow();
    await shot("stats-desktop");
    await tab("我的");
    await noOverflow();
    await shot("profile-desktop");
    await page.locator(".membership-entry").click();
    await noOverflow();
    await shot("membership-desktop");
    await page.locator(".detail-titlebar .icon-button").click();
    const emptySession = await realFetch(api + "/auth/wechat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "ui-empty-account" }),
    }).then((r) => r.json());
    await page.evaluate(
      (session) =>
        localStorage.setItem(
          "renewal_wechat_session_v1",
          JSON.stringify({ type: "object", data: session }),
        ),
      emptySession,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator(".empty-compact")).toContainText(
      "未来 30 天暂无扣费",
    );
    await tab("订阅");
    await expect(page.locator(".empty-title")).toHaveText("还没有添加订阅");
    await shot("empty");
    await page.locator(".empty-action").click();
    await expect(page.locator(".form-page")).toBeVisible();
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({ stage: "personal UI workflows passed", errors }),
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
