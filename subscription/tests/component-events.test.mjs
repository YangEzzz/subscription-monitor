import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { runInNewContext } from "node:vm";

const componentDirectory = new URL(
  "../components/subscription/",
  import.meta.url,
);
const sourceOf = (name) =>
  readFileSync(new URL(name, componentDirectory), "utf8");

// 模拟小程序同时分发组件自定义事件与冒泡的原生事件。
function tapRow(name, disabled = false) {
  const source = sourceOf(name);
  const expression = source.match(/@tap="([^"]+)"/)[1];
  let calls = 0;
  const parentName =
    name === "SettingsRow.vue"
      ? "SubscriptionProfileView.vue"
      : "SubscriptionHomeView.vue";
  const tagName =
    name === "SettingsRow.vue" ? "settings-row" : "subscription-row";
  const consumer = sourceOf(parentName).match(
    new RegExp(`<${tagName}\\b[\\s\\S]*?/>`),
  )[0];
  const eventName = consumer.match(/@([\w-]+)="/)[1];
  const listeners = { [eventName]: () => calls++ };
  runInNewContext(expression, {
    disabled,
    $emit: (event) => listeners[event]?.(),
  });
  listeners.tap?.();
  return calls;
}

test("one settings row tap invokes its action once despite native bubbling", () => {
  assert.equal(tapRow("SettingsRow.vue"), 1);
  assert.equal(tapRow("SettingsRow.vue", true), 0);
});

test("one subscription row tap opens details once despite native bubbling", () => {
  assert.equal(tapRow("subscription-row.vue"), 1);
});

test("switch changes forward one boolean through a separate business event", () => {
  const script = sourceOf("SettingsRow.vue").match(
    /<script>([\s\S]*?)<\/script>/,
  )[1];
  const component = runInNewContext(
    script.replace("export default", "component ="),
    { component: null },
  );
  const values = [];
  const listeners = { "checked-change": (value) => values.push(value) };
  const context = {
    switchRevision: 0,
    $emit: (event, value) => listeners[event]?.(value),
    $nextTick: (callback) => callback(),
  };
  component.methods.changeSwitch.call(context, { detail: { value: true } });
  listeners.change?.({ detail: { value: true } });
  assert.deepEqual(values, [true]);
  assert.equal(context.switchRevision, 1);
});

test("subscription components never reuse bubbling native event names for business events", () => {
  const nativeEvents = new Set([
    "tap",
    "click",
    "change",
    "input",
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "longpress",
  ]);
  for (const name of readdirSync(componentDirectory).filter((name) =>
    name.endsWith(".vue"),
  )) {
    const declaration = sourceOf(name).match(/\bemits:\s*\[([^\]]*)\]/);
    for (const match of declaration?.[1].matchAll(/["']([^"']+)["']/g) || []) {
      assert.equal(
        nativeEvents.has(match[1]),
        false,
        `${name} emits native ${match[1]}`,
      );
    }
  }
});

test("presentation selector emits one selected value and respects disabled controls", () => {
  const script = sourceOf("UiSelection.vue").match(
    /<script>([\s\S]*?)<\/script>/,
  )[1];
  const component = runInNewContext(
    script.replace("export default", "component ="),
    { component: null },
  );
  const events = [];
  const context = {
    disabled: false,
    idPrefix: "filter",
    scrollTarget: "",
    $emit: (...args) => events.push(args),
  };
  component.methods.choose.call(context, { value: "trial" }, 2);
  assert.deepEqual(events, [["select", "trial"]]);
  context.disabled = true;
  component.methods.choose.call(context, { value: "all" }, 0);
  assert.equal(events.length, 1);
});

test("page header reserves the real WeChat capsule without changing device geometry", () => {
  const script = sourceOf("PageHeader.vue").match(
    /<script>([\s\S]*?)<\/script>/,
  )[1];
  const component = runInNewContext(
    script.replace("export default", "component ="),
    {
      component: null,
      uni: {
        getWindowInfo: () => ({ statusBarHeight: 47, windowWidth: 390 }),
        getMenuButtonBoundingClientRect: () => ({
          top: 51,
          height: 32,
          left: 296,
          width: 87,
        }),
      },
    },
  );
  const context = { top: 6, rowHeight: 44, capsuleSpace: 100 };
  component.mounted.call(context);
  const layout = component.computed.layout.call(context);
  assert.equal(layout.paddingTop, "4px");
  assert.equal(layout.height, "36px");
  assert.equal(layout.paddingRight, "102px");
});
