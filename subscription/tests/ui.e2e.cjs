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
          amount: [28, 18, 15, 68, 0, 298][i],
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
    await expect(
      page.getByRole("button", { name: "新增订阅", exact: true }),
    ).toHaveCount(1);
    await expect(page.locator(".home-tasks")).toHaveCount(0);
    await expect(
      page.getByText("开启微信续费通知", { exact: true }),
    ).toHaveCount(0);
    const subscriptions = await realFetch(api + "/subscriptions", {
      headers: { Authorization: "Bearer " + session.accessToken },
    }).then((response) => response.json());
    const taskId = subscriptions.data[0].id;
    const setTaskStatus = async (status) => {
      const response = await realFetch(api + "/subscriptions/" + taskId, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + session.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      assert.equal(response.status, 200);
    };
    await setTaskStatus("pending");
    await page.reload();
    await expect(page.locator(".home-tasks .setting-row")).toHaveCount(1);
    await expect(page.locator(".home-tasks .setting-title")).toHaveText(
      "1 项等待稍后处理",
    );
    await page.locator(".home-tasks .setting-row").click();
    await expect(page.locator(".list-page")).toBeVisible();
    await expect(page.locator(".rd-subscriptions .srow")).toHaveCount(1);
    await setTaskStatus("active");
    await page.reload();
    await expect(page.locator(".home-tasks")).toHaveCount(0);
    await expect(page.locator(".renewal-row")).toHaveCount(4); // 3 within week + up to 3 later
    await page.screenshot({
      path: resolve(__dirname, "../.preview/redesign-home-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({
      path: resolve(__dirname, "../.preview/redesign-home-desktop.png"),
      fullPage: true,
    });

    const shot = async (name) => {
      await page.waitForTimeout(550);
      await expect(
        page.locator(".uni-toast:visible, .uni-sample-toast:visible"),
      ).toHaveCount(0);
      return page.screenshot({
        path: resolve(__dirname, "../.preview/redesign-" + name + ".png"),
        fullPage: true,
      });
    };
    const tab = async (label) => {
      if (await page.locator(".navbar-back").count())
        await page.locator(".navbar-back").click();
      if (label === "统计") {
        await page.locator(".dock-tab").filter({ hasText: "首页" }).click();
        await page.locator(".rd-stat-link").click();
      } else await page.locator(".dock-tab").filter({ hasText: label }).click();
    };
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
    await page.locator(".rd-eye").click();
    await expect(page.locator(".display-amount")).toHaveText("••••");
    await page.locator(".rd-eye").click();
    await tab("订阅");
    await expect(page.locator(".rd-subscriptions .srow")).toHaveCount(4);
    await noOverflow();
    await shot("list-320");
    await expect(page.locator(".amount.todo")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await shot("list-mobile");
    await page.locator(".dock-add").click();
    await expect(page.locator(".form-page")).toBeVisible();
    await page.getByRole("button", { name: "返回", exact: true }).click();
    await expect(page.locator(".list-page")).toBeVisible();
    await page
      .locator(".selection-chips .selection-option")
      .filter({ hasText: "云存储" })
      .click();
    await expect(page.locator(".rd-subscriptions .srow")).toHaveCount(1);
    await expect(
      page.locator(".selection-chips .selection-active"),
    ).toHaveAttribute("aria-selected", "true");
    await page
      .locator(".selection-tabs .selection-option")
      .filter({ hasText: "全部状态" })
      .click();
    await expect(page.locator(".rd-subscriptions .srow")).toHaveCount(1);
    await page
      .locator(".selection-chips .selection-option")
      .filter({ hasText: "全部" })
      .click();
    await expect(page.locator(".rd-subscriptions .srow")).toHaveCount(4);
    await page
      .locator(".selection-tabs .selection-option")
      .filter({ hasText: "有效订阅" })
      .click();
    await page.locator(".rd-sort").click();
    await page
      .locator(".sort-option")
      .filter({ hasText: "按金额从高到低" })
      .click();
    await expect(page.locator(".renewal-name").first()).toHaveText(
      "团队效率工具 · 一个较长的服务名称",
    );
    await page.locator(".rd-sort").click();
    await page
      .locator(".sort-option")
      .filter({ hasText: "按扣费日期" })
      .click();
    await page.setViewportSize({ width: 320, height: 740 });
    await page.locator(".search input").fill("不存在的订阅");
    await expect(page.locator(".empty-title")).toHaveText("没有匹配的订阅");
    await page.locator(".search-clear").click();
    await expect(page.locator(".rd-subscriptions .srow")).toHaveCount(4);
    await page.locator(".rd-sort").click();
    await expect(page.locator(".sort-sheet")).toBeVisible();
    await shot("sort-320");
    await page.keyboard.press("Escape");
    await expect(page.locator(".sort-sheet")).toBeHidden();
    await page.locator(".rd-subscriptions .srow").first().click();
    await expect(page.locator(".detail-name")).toHaveText("家庭影音订阅");
    await noOverflow();
    await shot("detail-320");
    await page.locator(".edit-button").click();
    await expect(page.locator(".form-page")).toBeVisible();
    await shot("form-320");
    await expect(page.locator(".page-scroll .form-actionbar")).toHaveCount(0);
    const formBar = page.locator(".form-actionbar");
    const barBeforeScroll = await formBar.boundingBox();
    assert.ok(
      Math.abs(
        barBeforeScroll.y + barBeforeScroll.height - page.viewportSize().height,
      ) < 2,
    );
    const scrollFormTo = async (value) =>
      page.locator(".page-scroll").evaluate((root, value) => {
        const scrollable = [...root.querySelectorAll("*")].find(
          (node) =>
            node.scrollHeight > node.clientHeight &&
            ["auto", "scroll"].includes(getComputedStyle(node).overflowY),
        );
        if (!scrollable) throw new Error("form scroll container was not found");
        scrollable.scrollTop =
          value === "bottom" ? scrollable.scrollHeight : value;
        return scrollable.scrollTop;
      }, value);
    assert.ok((await scrollFormTo(500)) > 200);
    const barAfterScroll = await formBar.boundingBox();
    assert.ok(Math.abs(barBeforeScroll.y - barAfterScroll.y) < 2);
    await shot("form-save-scrolled-320");
    await scrollFormTo("bottom");
    const finalField = await page
      .locator(".supplement-form-section .textarea-row")
      .last()
      .boundingBox();
    assert.ok(
      finalField.y + finalField.height <= barAfterScroll.y + 2,
      "the save bar must not cover the final form field",
    );
    await scrollFormTo(0);
    await noOverflow();
    const name = page.locator(".form-input input").first();
    await expect(name).toHaveValue("家庭影音订阅");
    await expect(name).toHaveAttribute("aria-label", "服务名称，必填");
    await name.fill("未保存的修改");
    await page.locator(".navbar-back").click();
    await page
      .getByText("继续编辑", { exact: true })
      .filter({ visible: true })
      .click();
    await expect(name).toHaveValue("未保存的修改");
    await page.locator(".navbar-back").click();
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
    await page.locator(".navbar-back").click();
    await expect(page.locator(".list-page")).toBeVisible();
    await tab("日历");
    await expect(page.locator(".rd-calendar-card")).toBeVisible();
    await noOverflow();
    await shot("calendar-320");
    await page.locator(".rd-month-arrow").last().click();
    await page.locator(".rd-today").click();
    await tab("统计");
    await page.getByRole("tab", { name: "支出估算", exact: true }).click();
    await expect(page.locator(".rd-stats-hero")).toBeVisible();
    await noOverflow();
    await shot("stats-320");
    await page
      .locator(".selection-segmented .selection-option")
      .filter({ hasText: "年度" })
      .click();
    await expect(page.locator(".rd-eyebrow")).toHaveText("年度预计支出");
    await page.locator(".rd-currency").click();
    await expect(page.locator("uni-picker-view")).toBeVisible();
    await page
      .getByText("取消", { exact: true })
      .filter({ visible: true })
      .click();
    await tab("我的");
    await expect(page.locator(".profile-head")).toBeVisible();
    await page.getByText("导出订阅数据", { exact: true }).click();
    await expect(page.locator(".uni-modal__bd")).toContainText(
      "不含回收站记录",
    );
    const exportedFile = page.waitForEvent("download");
    await page
      .getByText("导出表格", { exact: true })
      .filter({ visible: true })
      .click();
    const downloaded = await exportedFile;
    assert.match(
      downloaded.suggestedFilename(),
      /^续订清单-\d{4}-\d{2}-\d{2}\.xlsx$/,
    );
    const workbookBytes = await readFile(await downloaded.path());
    assert.equal(workbookBytes.subarray(0, 2).toString(), "PK");
    await downloaded.saveAs(
      resolve(__dirname, "../.preview/export-ui-verified.xlsx"),
    );
    for (const label of ["减少动态效果", "重新加载数据", "隐私与数据说明"]) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
    await page.getByText("关于续订清单", { exact: true }).click();
    await expect(page.locator(".about-page")).toBeVisible();
    await page.getByText("隐私与数据说明", { exact: true }).click();
    await expect(page.locator(".uni-modal__bd")).toContainText("微信登录");
    await page
      .getByText("确定", { exact: true })
      .filter({ visible: true })
      .click();
    await page.locator(".navbar-back").click();
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
    await page.locator(".navbar-back").click();
    await expect(page.locator(".profile-page")).toBeVisible();
    await shot("profile-mobile");
    await tab("日历");
    await noOverflow();
    await shot("calendar-mobile");
    await page
      .locator(".rd-calendar-day")
      .filter({ has: page.locator(".rd-calendar-marks") })
      .first()
      .click();
    await expect(page.locator(".rd-calendar-detail .srow")).toHaveCount(1);
    await page.locator(".rd-calendar-detail .srow").click();
    await expect(page.locator(".detail-page")).toBeVisible();
    await noOverflow();
    await shot("detail-mobile");
    await page.locator(".navbar-back").click();
    await tab("统计");
    await noOverflow();
    await shot("stats-mobile");
    await page
      .locator(".selection-segmented .selection-option")
      .filter({ hasText: "未来30天" })
      .click();
    await expect(page.locator(".rd-donut-title")).toHaveText("未来30天");
    await tab("我的");
    await page.setViewportSize({ width: 320, height: 740 });
    await tab("首页");
    await page.locator(".dock-add").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".form-page")).toBeVisible();
    await page.locator(".save-button").click();
    await expect(page.locator(".form-error")).toBeVisible();
    await page.locator(".form-input input").first().fill("界面验收订阅");
    await page.locator(".save-button").click();
    await expect(page.locator(".form-error")).toHaveText("请输入订阅金额");
    await expect(page.locator(".form-page")).toBeVisible();
    await page.locator(".money-input input").first().fill("12.50");
    await page.locator(".save-button").click();
    await expect(page.locator(".detail-name")).toHaveText("界面验收订阅");
    await page.locator(".manage-button").click();
    await page.getByText("删除订阅", { exact: true }).click();
    await page
      .getByText("确认删除", { exact: true })
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
    await page.locator(".page-scroll").evaluate((element) => {
      element.__vueParentComponent.emit("refresherrefresh");
    });
    await expect(page.locator(".async-state")).toBeVisible();
    offline = false;
    await context.setOffline(false);
    await page.locator(".state-action").first().click();
    await expect(page.locator(".async-state")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".app-shell")).toHaveClass(/reduce-motion/);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(".app-shell")).not.toHaveClass(/reduce-motion/);
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
      await page.locator(".rd-subscriptions .srow").first().click();
      await page.locator(".edit-button").click();
      await noOverflow();
      await page.locator(".navbar-back").click();
      await page.locator(".navbar-back").click();
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
    await page.locator(".navbar-back").click();
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
    await expect(page.locator(".empty-state")).toContainText(
      "未来 30 天暂无扣费",
    );
    await expect(
      page.getByRole("button", { name: "新增订阅", exact: true }),
    ).toHaveCount(1);
    await expect(page.locator(".rd-home-add")).toHaveCount(0);
    const homeEmptyState = page.locator(".home-page .empty-state");
    await expect(homeEmptyState).toHaveCSS("border-top-width", "0px");
    await expect(homeEmptyState).toHaveCSS("border-radius", "0px");
    await expect(homeEmptyState).toHaveCSS("margin-top", "0px");
    await noOverflow();
    await shot("home-empty");
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
