"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      type: "center",
      msgType: "success",
      messageText: "这是一条成功提示",
      value: ""
    };
  },
  onReady() {
  },
  methods: {
    change(e) {
      common_vendor.index.__f__("log", "at pages/extUI/popup/popup.vue:107", "当前模式：" + e.type + ",状态：" + e.show);
    },
    toggle(type) {
      this.type = type;
      this.$refs.popup.open(type);
    },
    messageToggle(type) {
      this.msgType = type;
      this.messageText = `这是一条${type}消息提示`;
      this.$refs.message.open();
    },
    dialogToggle(type) {
      this.msgType = type;
      this.$refs.alertDialog.open();
    },
    dialogConfirm() {
      common_vendor.index.__f__("log", "at pages/extUI/popup/popup.vue:124", "点击确认");
      this.messageText = `点击确认了 ${this.msgType} 窗口`;
      this.$refs.message.open();
    },
    inputDialogToggle() {
      this.$refs.inputDialog.open();
    },
    dialogClose() {
      common_vendor.index.__f__("log", "at pages/extUI/popup/popup.vue:132", "点击关闭");
    },
    dialogInputConfirm(val) {
      common_vendor.index.showLoading({
        title: "3秒后会关闭"
      });
      setTimeout(() => {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("log", "at pages/extUI/popup/popup.vue:141", val);
        this.value = val;
        this.$refs.inputDialog.close();
      }, 3e3);
    },
    shareToggle() {
      this.$refs.share.open();
    }
  }
};
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  const _easycom_uni_popup_message2 = common_vendor.resolveComponent("uni-popup-message");
  const _easycom_uni_popup_dialog2 = common_vendor.resolveComponent("uni-popup-dialog");
  const _easycom_uni_popup_share2 = common_vendor.resolveComponent("uni-popup-share");
  (_easycom_uni_card2 + _easycom_uni_section2 + _easycom_uni_popup2 + _easycom_uni_popup_message2 + _easycom_uni_popup_dialog2 + _easycom_uni_popup_share2)();
}
const _easycom_uni_card = () => "../../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_popup = () => "../../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
const _easycom_uni_popup_message = () => "../../../uni_modules/uni-popup/components/uni-popup-message/uni-popup-message.js";
const _easycom_uni_popup_dialog = () => "../../../uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.js";
const _easycom_uni_popup_share = () => "../../../uni_modules/uni-popup/components/uni-popup-share/uni-popup-share.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_section + _easycom_uni_popup + _easycom_uni_popup_message + _easycom_uni_popup_dialog + _easycom_uni_popup_share)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      ["is-full"]: true,
      ["is-shadow"]: false
    }),
    b: common_vendor.o(($event) => $options.toggle("top"), "28"),
    c: common_vendor.o(($event) => $options.toggle("bottom"), "72"),
    d: common_vendor.o(($event) => $options.toggle("center"), "f9"),
    e: common_vendor.o(($event) => $options.toggle("left"), "d2"),
    f: common_vendor.o(($event) => $options.toggle("right"), "37"),
    g: common_vendor.p({
      title: "基本示例",
      type: "line"
    }),
    h: common_vendor.o(($event) => $options.messageToggle("success"), "1a"),
    i: common_vendor.o(($event) => $options.messageToggle("error"), "1b"),
    j: common_vendor.o(($event) => $options.messageToggle("warn"), "5f"),
    k: common_vendor.o(($event) => $options.messageToggle("info"), "65"),
    l: common_vendor.p({
      title: "提示消息",
      type: "line"
    }),
    m: common_vendor.o(($event) => $options.dialogToggle("success"), "f9"),
    n: common_vendor.o(($event) => $options.dialogToggle("error"), "ed"),
    o: common_vendor.o(($event) => $options.dialogToggle("warn"), "d0"),
    p: common_vendor.o(($event) => $options.dialogToggle("info"), "97"),
    q: common_vendor.p({
      title: "对话框示例",
      type: "line"
    }),
    r: common_vendor.t($data.value),
    s: common_vendor.o((...args) => $options.inputDialogToggle && $options.inputDialogToggle(...args), "7e"),
    t: common_vendor.p({
      title: "输入框示例",
      type: "line",
      padding: true
    }),
    v: common_vendor.o((...args) => $options.shareToggle && $options.shareToggle(...args), "69"),
    w: common_vendor.p({
      title: "底部分享示例",
      type: "line",
      padding: true
    }),
    x: $data.type === "left" || $data.type === "right" ? 1 : "",
    y: common_vendor.sr("popup", "1881ad84-6"),
    z: common_vendor.o($options.change, "17"),
    A: common_vendor.p({
      ["background-color"]: "#fff"
    }),
    B: common_vendor.p({
      type: $data.msgType,
      message: $data.messageText,
      duration: 2e3
    }),
    C: common_vendor.sr("message", "1881ad84-7"),
    D: common_vendor.p({
      type: "message"
    }),
    E: common_vendor.o($options.dialogConfirm, "c5"),
    F: common_vendor.o($options.dialogClose, "cc"),
    G: common_vendor.p({
      type: $data.msgType,
      cancelText: "关闭",
      confirmText: "同意",
      title: "通知",
      content: "欢迎使用 uni-popup!"
    }),
    H: common_vendor.sr("alertDialog", "1881ad84-9"),
    I: common_vendor.p({
      type: "dialog"
    }),
    J: common_vendor.sr("inputClose", "1881ad84-12,1881ad84-11"),
    K: common_vendor.o($options.dialogInputConfirm, "f4"),
    L: common_vendor.p({
      mode: "input",
      title: "输入内容",
      value: "对话框预置提示内容!",
      placeholder: "请输入内容"
    }),
    M: common_vendor.sr("inputDialog", "1881ad84-11"),
    N: common_vendor.p({
      type: "dialog"
    }),
    O: common_vendor.sr("share", "1881ad84-13"),
    P: common_vendor.p({
      type: "share",
      safeArea: true,
      backgroundColor: "#fff"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/extUI/popup/popup.js.map
