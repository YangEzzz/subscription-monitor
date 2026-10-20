import test from "node:test";
import assert from "node:assert/strict";
import {
  cycleProgress,
  logoPaint,
  dueTone,
} from "../components/subscription/subscription-presentation.js";
import { addDays, toDateKey } from "../pages/subscription/subscription-data.js";

test("progress respects billing anchor through short months and leap years without mutating records", () => {
  const record = Object.freeze({
    cycle: "每月",
    nextBillingDate: "2028-02-29",
    anchorDay: 31,
  });
  const result = cycleProgress(record, "2028-02-15");
  assert.equal(result.start, "2028-01-31");
  assert.equal(result.end, "2028-02-29");
  assert.ok(Math.abs(result.percent - (15 / 29) * 100) < 0.001);
  assert.equal(
    cycleProgress(
      { cycle: "每年", nextBillingDate: "2029-02-28", anchorDay: 29 },
      "2028-03-01",
    ).start,
    "2028-02-29",
  );
});

test("progress supports standard cycles, clamps at boundaries and hides unsupported cycles", () => {
  for (const [cycle, expected] of [
    ["每周", "2026-10-14"],
    ["每季度", "2026-07-21"],
    ["每半年", "2026-04-21"],
    ["每年", "2025-10-21"],
  ]) {
    const item = { cycle, nextBillingDate: "2026-10-21" };
    assert.equal(cycleProgress(item, "2026-10-20").start, expected);
    assert.equal(cycleProgress(item, "2024-01-01").percent, 0);
    assert.equal(cycleProgress(item, "2030-01-01").percent, 100);
  }
  for (const cycle of ["自定义天数", "一次性", "未知"])
    assert.equal(cycleProgress({ cycle, nextBillingDate: "2026-10-21" }), null);
});

test("countdown colors preserve 7/14 day boundaries independently of business status", () => {
  const today = toDateKey(new Date());
  for (const [days, tone] of [
    [-1, "overdue"],
    [0, "hot"],
    [7, "hot"],
    [8, "mid"],
    [14, "mid"],
    [15, "far"],
  ])
    assert.equal(dueTone(addDays(today, days)), tone);
});

test("brand gradient is derived from the real color and handles missing values", () => {
  assert.equal(
    logoPaint("#ffffff").background,
    "linear-gradient(160deg, #ffffff, #d1d1d1)",
  );
  assert.equal(logoPaint("#16834d")["--service-color"], "#16834d");
  assert.deepEqual(logoPaint(null), {});
});
