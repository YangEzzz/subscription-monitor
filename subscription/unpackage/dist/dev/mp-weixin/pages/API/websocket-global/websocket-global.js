"use strict";
const common_vendor = require("../../../common/vendor.js");
let platform = common_vendor.index.getSystemInfoSync().platform;
const _sfc_main = {
  data() {
    return {
      connected: false,
      connecting: false,
      msg: false,
      roomId: ""
    };
  },
  computed: {
    showMsg() {
      if (this.connected) {
        if (this.msg) {
          return "收到消息：" + this.msg;
        } else {
          return "等待接收消息";
        }
      } else {
        return "尚未连接";
      }
    }
  },
  onUnload() {
    common_vendor.index.closeSocket();
    common_vendor.index.hideLoading();
  },
  methods: {
    connect() {
      if (this.connected || this.connecting) {
        common_vendor.index.showModal({
          content: "正在连接或者已经连接，请勿重复连接",
          showCancel: false
        });
        return false;
      }
      this.connecting = true;
      common_vendor.index.showLoading({
        title: "连接中..."
      });
      common_vendor.index.connectSocket({
        url: "wss://echo.websocket.org",
        data() {
          return {
            msg: "Hello"
          };
        },
        header: {
          "content-type": "application/json"
        },
        method: "GET",
        success(res) {
        },
        fail(err) {
        }
      });
      common_vendor.index.onSocketOpen((res) => {
        this.connecting = false;
        this.connected = true;
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          icon: "none",
          title: "连接成功"
        });
        common_vendor.index.__f__("log", "at pages/API/websocket-global/websocket-global.vue:87", "onOpen", res);
      });
      common_vendor.index.onSocketError((err) => {
        this.connecting = false;
        this.connected = false;
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({
          content: "连接失败，可能是websocket服务不可用，请稍后再试",
          showCancel: false
        });
        common_vendor.index.__f__("log", "at pages/API/websocket-global/websocket-global.vue:97", "onError", err);
      });
      common_vendor.index.onSocketMessage((res) => {
        this.msg = res.data;
        common_vendor.index.__f__("log", "at pages/API/websocket-global/websocket-global.vue:101", "onMessage", res);
      });
      common_vendor.index.onSocketClose((res) => {
        this.connected = false;
        this.startRecive = false;
        this.msg = false;
        common_vendor.index.__f__("log", "at pages/API/websocket-global/websocket-global.vue:107", "onClose", res);
      });
    },
    send() {
      common_vendor.index.sendSocketMessage({
        data: "from " + platform + " : " + parseInt(Math.random() * 1e4).toString(),
        success(res) {
          common_vendor.index.__f__("log", "at pages/API/websocket-global/websocket-global.vue:114", res);
        },
        fail(err) {
          common_vendor.index.__f__("log", "at pages/API/websocket-global/websocket-global.vue:117", err);
        }
      });
    },
    close() {
      common_vendor.index.closeSocket();
    }
  }
};
if (!Array) {
  const _easycom_page_head2 = common_vendor.resolveComponent("page-head");
  _easycom_page_head2();
}
const _easycom_page_head = () => "../../../components/page-head/page-head.js";
if (!Math) {
  _easycom_page_head();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      title: "websocket通讯示例"
    }),
    b: common_vendor.t($options.showMsg),
    c: common_vendor.o((...args) => $options.connect && $options.connect(...args), "28"),
    d: $data.connected,
    e: common_vendor.o((...args) => $options.send && $options.send(...args), "24"),
    f: common_vendor.o((...args) => $options.close && $options.close(...args), "99")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/API/websocket-global/websocket-global.js.map
