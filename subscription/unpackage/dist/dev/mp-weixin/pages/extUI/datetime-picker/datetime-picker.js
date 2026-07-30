"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      dateString: this.getDateTime(/* @__PURE__ */ new Date()),
      datetimeString: this.getDateTime(/* @__PURE__ */ new Date()),
      dateTimestamp: Date.now(),
      dateInstance: /* @__PURE__ */ new Date(),
      dateRange: [this.getDate(Date.now() - 5 * 24 * 36e5), this.getDate(Date.now() + 5 * 24 * 36e5)],
      datetimeRange: [this.getDateTime(Date.now() - 5 * 24 * 36e5), this.getDateTime(Date.now() + 5 * 24 * 36e5)],
      start: Date.now() - 10 * 24 * 36e5,
      end: Date.now() + 10 * 24 * 36e5
    };
  },
  watch: {
    datetimeString() {
      common_vendor.index.__f__("log", "at pages/extUI/datetime-picker/datetime-picker.vue:65", "日期时间单选:", this.datetimeString);
    },
    dateRange() {
      common_vendor.index.__f__("log", "at pages/extUI/datetime-picker/datetime-picker.vue:68", "日期范围选:", this.dateRange);
    },
    datetimeRange() {
      common_vendor.index.__f__("log", "at pages/extUI/datetime-picker/datetime-picker.vue:71", "日期时间范围选:", this.datetimeRange);
    }
  },
  methods: {
    change(e) {
      common_vendor.index.__f__("log", "at pages/extUI/datetime-picker/datetime-picker.vue:76", "----change事件:", e);
    },
    maskClick(e) {
      common_vendor.index.__f__("log", "at pages/extUI/datetime-picker/datetime-picker.vue:79", "----maskClick事件:", e);
    },
    getDateTime(date) {
      return `${this.getDate(date)} ${this.getTime(date)}`;
    },
    getDate(date) {
      date = new Date(date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${this.addZero(month)}-${this.addZero(day)}`;
    },
    getTime(date) {
      date = new Date(date);
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();
      return this.hideSecond ? `${this.addZero(hour)}:${this.addZero(minute)}` : `${this.addZero(hour)}:${this.addZero(minute)}:${this.addZero(second)}`;
    },
    addZero(num) {
      if (num < 10) {
        num = `0${num}`;
      }
      return num;
    }
  }
};
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_datetime_picker2 = common_vendor.resolveComponent("uni-datetime-picker");
  (_easycom_uni_card2 + _easycom_uni_section2 + _easycom_uni_datetime_picker2)();
}
const _easycom_uni_card = () => "../../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_datetime_picker = () => "../../../uni_modules/uni-datetime-picker/components/uni-datetime-picker/uni-datetime-picker.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_section + _easycom_uni_datetime_picker)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      ["is-shadow"]: false,
      ["is-full"]: true
    }),
    b: common_vendor.p({
      title: "日期用法：" + $data.dateString,
      type: "line"
    }),
    c: common_vendor.o($options.maskClick, "04"),
    d: common_vendor.o(($event) => $data.dateString = $event, "74"),
    e: common_vendor.p({
      type: "date",
      ["clear-icon"]: false,
      modelValue: $data.dateString
    }),
    f: common_vendor.p({
      title: "日期时间用法：" + $data.datetimeString,
      type: "line"
    }),
    g: common_vendor.o($options.change, "1e"),
    h: common_vendor.o(($event) => $data.datetimeString = $event, "66"),
    i: common_vendor.p({
      type: "datetime",
      start: $data.start,
      end: $data.end,
      modelValue: $data.datetimeString
    }),
    j: common_vendor.p({
      title: "日期范围用法：[" + $data.dateRange + "]",
      type: "line"
    }),
    k: common_vendor.o($options.maskClick, "e8"),
    l: common_vendor.o(($event) => $data.dateRange = $event, "00"),
    m: common_vendor.p({
      type: "daterange",
      modelValue: $data.dateRange
    }),
    n: common_vendor.p({
      title: "日期时间范围用法：[" + $data.datetimeRange + "]",
      type: "line"
    }),
    o: common_vendor.o(($event) => $data.datetimeRange = $event, "16"),
    p: common_vendor.p({
      type: "datetimerange",
      rangeSeparator: "至",
      modelValue: $data.datetimeRange
    }),
    q: common_vendor.p({
      title: "时间戳用法：" + $data.dateTimestamp,
      type: "line"
    }),
    r: common_vendor.o($options.change, "67"),
    s: common_vendor.o(($event) => $data.dateTimestamp = $event, "ef"),
    t: common_vendor.p({
      returnType: "timestamp",
      modelValue: $data.dateTimestamp
    }),
    v: common_vendor.p({
      title: "date 对象用法：" + $data.dateInstance,
      type: "line"
    }),
    w: common_vendor.o($options.change, "f8"),
    x: common_vendor.o(($event) => $data.dateInstance = $event, "19"),
    y: common_vendor.p({
      type: "datetime",
      returnType: "date",
      modelValue: $data.dateInstance
    }),
    z: common_vendor.p({
      title: "插槽用法：" + $data.dateString,
      type: "line"
    }),
    A: common_vendor.o(($event) => $data.dateString = $event, "ae"),
    B: common_vendor.p({
      modelValue: $data.dateString
    }),
    C: common_vendor.p({
      title: "无边框用法：" + $data.dateString,
      type: "line"
    }),
    D: common_vendor.o(($event) => $data.dateString = $event, "91"),
    E: common_vendor.p({
      border: false,
      modelValue: $data.dateString
    }),
    F: common_vendor.p({
      title: "隐藏清除按钮用法：" + $data.dateString,
      type: "line"
    }),
    G: common_vendor.o(($event) => $data.dateString = $event, "79"),
    H: common_vendor.p({
      clearIcon: false,
      modelValue: $data.dateString
    }),
    I: common_vendor.p({
      title: "disabled用法：" + $data.dateString,
      type: "line"
    }),
    J: common_vendor.o(($event) => $data.dateString = $event, "8c"),
    K: common_vendor.p({
      disabled: true,
      modelValue: $data.dateString
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/extUI/datetime-picker/datetime-picker.js.map
