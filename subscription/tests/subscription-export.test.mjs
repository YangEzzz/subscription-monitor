import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import {
  createSubscriptionWorkbook,
  previewWechatWorkbook,
} from "../pages/subscription/subscription-export.js";
import {
  createSubscriptionPageState,
  subscriptionMethods,
} from "../pages/subscription/subscription-page-logic.js";

const formatting = {
  cycleText: (item) => item.cycle,
  statusText: () => "正常",
};
const records = [
  {
    name: "视频 & 音乐 <VIP>",
    plan: "001套餐",
    category: "娱乐",
    amount: "19.90",
    currency: "CNY",
    cycle: "每月",
    nextBillingDate: "2026-11-01",
    payment: "微信支付",
    note: '=1+1\n含逗号,"引号"与表情😀\u0000',
  },
  { name: "免费服务", amount: 0, currency: "USD" },
  { name: "历史未知金额", amount: null },
  { name: "回收站订阅", amount: 99, deletedAt: "2026-10-01" },
];

test("exports a real XLSX with numeric amounts, literal user text, Chinese and no deleted records", () => {
  const bytes = createSubscriptionWorkbook(records, formatting);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  const parts = unzipSync(bytes);
  const sheet = strFromU8(parts["xl/worksheets/sheet1.xml"]);
  assert.match(
    strFromU8(parts["[Content_Types].xml"]),
    /spreadsheetml.sheet.main/,
  );
  assert.match(strFromU8(parts["xl/workbook.xml"]), /name="订阅清单"/);
  assert.match(sheet, /视频 &amp; 音乐 &lt;VIP&gt;/);
  assert.match(sheet, /001套餐/);
  assert.match(sheet, /<c r="D2" s="2"><v>19.9<\/v><\/c>/);
  assert.match(sheet, /<c r="D3" s="2"><v>0<\/v><\/c>/);
  assert.match(sheet, /<c r="D4" s="0" t="inlineStr">/);
  assert.match(sheet, /=1\+1\n含逗号,&quot;引号&quot;与表情😀/);
  assert.doesNotMatch(sheet, /<f[ >]|回收站订阅|\u0000/);
  assert.match(sheet, /<autoFilter ref="A1:J4"/);
  assert.match(sheet, /state="frozen"/);
  assert.deepEqual(records[0].amount, "19.90");
});

function nativeRuntime(overrides = {}) {
  const calls = [];
  return {
    calls,
    userPath: "/user",
    fileName: "续订清单-2026-10-26.xlsx",
    fs: {
      writeFile: (options) => {
        calls.push(["write", options]);
        options.success({});
      },
    },
    openDocument: (options) => {
      calls.push(["open", options]);
      options.success({});
    },
    showModal: (options) => {
      calls.push(["modal", options]);
      options.success({ confirm: true });
    },
    shareFile: (options) => {
      calls.push(["share", options]);
      options.success({});
    },
    ...overrides,
  };
}

test("writes an exact ArrayBuffer and opens XLSX with the document share menu", async () => {
  const runtime = nativeRuntime();
  await previewWechatWorkbook(
    new Uint8Array([9, 1, 2, 8]).subarray(1, 3),
    runtime,
  );
  assert.deepEqual(
    runtime.calls.map((call) => call[0]),
    ["write", "open"],
  );
  assert.deepEqual([...new Uint8Array(runtime.calls[0][1].data)], [1, 2]);
  assert.equal(runtime.calls[1][1].fileType, "xlsx");
  assert.equal(runtime.calls[1][1].showMenu, true);
});

test("preview failure offers sharing only after explicit confirmation", async () => {
  const runtime = nativeRuntime({
    openDocument: (options) => options.fail({ errMsg: "not supported" }),
  });
  await previewWechatWorkbook(new Uint8Array([1]), runtime);
  assert.deepEqual(
    runtime.calls.map((call) => call[0]),
    ["write", "modal", "share"],
  );
  assert.equal(runtime.calls[2][1].fileName, "续订清单-2026-10-26.xlsx");
  runtime.calls.length = 0;
  runtime.showModal = (options) => options.success({ confirm: false });
  await previewWechatWorkbook(new Uint8Array([1]), runtime);
  assert.deepEqual(
    runtime.calls.map((call) => call[0]),
    ["write"],
  );
});

test("file write failure is reported without opening or sharing a missing file", async () => {
  const runtime = nativeRuntime({
    fs: { writeFile: (options) => options.fail({ errMsg: "storage full" }) },
  });
  await assert.rejects(previewWechatWorkbook(new Uint8Array([1]), runtime));
  assert.equal(runtime.calls.length, 0);
});

test("cancelled file sharing does not become an export error; real failures do", async () => {
  const runtime = nativeRuntime({
    openDocument: (options) => options.fail({}),
    shareFile: (options) =>
      options.fail({ errMsg: "shareFileMessage:fail cancel" }),
  });
  await previewWechatWorkbook(new Uint8Array([1]), runtime);
  runtime.shareFile = (options) =>
    options.fail({ errMsg: "permission denied" });
  await assert.rejects(
    previewWechatWorkbook(new Uint8Array([1]), runtime),
    /文件发送失败/,
  );
});

test("unsupported sharing gives an honest preview error and never attempts to share", async () => {
  const runtime = nativeRuntime({
    openDocument: (options) => options.fail({}),
    shareFile: null,
  });
  await previewWechatWorkbook(new Uint8Array([1]), runtime);
  assert.equal(runtime.calls[1][1].showCancel, false);
  assert.match(runtime.calls[1][1].content, /更新微信/);
});

test("export confirmation prevents duplicate taps, resets on cancel and skips empty data", () => {
  const previous = globalThis.uni;
  try {
    const page = {
      ...createSubscriptionPageState(),
      liveSubscriptions: records.slice(0, 1),
    };
    let modal,
      calls = 0;
    globalThis.uni = {
      showModal: (options) => {
        modal = options;
        calls++;
      },
      showToast: () => calls++,
    };
    subscriptionMethods.exportData.call(page);
    subscriptionMethods.exportData.call(page);
    assert.equal(calls, 1);
    assert.equal(page.exportBusy, true);
    modal.success({ confirm: false });
    assert.equal(page.exportBusy, false);
    page.liveSubscriptions = [];
    subscriptionMethods.exportData.call(page);
    assert.equal(page.exportBusy, false);
    assert.equal(calls, 2);
  } finally {
    globalThis.uni = previous;
  }
});
