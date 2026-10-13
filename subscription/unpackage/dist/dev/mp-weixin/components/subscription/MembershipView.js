"use strict";
const common_vendor = require("../../common/vendor.js");
const SettingsRow = () => "./SettingsRow.js";
const AsyncStateView = () => "./AsyncStateView.js";
const _sfc_main = {
  name: "MembershipView",
  components: { SettingsRow, AsyncStateView },
  emits: ["back", "purchase", "simulate", "refresh", "select-order", "refund"],
  data() {
    return { refundConfirm: false };
  },
  watch: {
    "order.id"() {
      this.refundConfirm = false;
    }
  },
  props: {
    isMember: { type: Boolean, default: false },
    freeQuotaValue: { type: String, default: "" },
    subscriptionLimit: { type: Number, default: null },
    membership: { type: Object, default: () => ({}) },
    orders: { type: Array, default: () => [] },
    order: { type: Object, default: null },
    busy: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    error: { type: String, default: "" },
    message: { type: String, default: "" }
  },
  methods: {
    price(amount) {
      return "¥" + (Number(amount) / 100).toFixed(2);
    },
    statusText(status) {
      return {
        pending: "待模拟支付",
        paid: "模拟成功",
        cancelled: "已取消",
        failed: "模拟失败",
        refunded: "已撤销测试权益"
      }[status] || status;
    },
    dateText(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime()))
        return "—";
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date);
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_settings_row = common_vendor.resolveComponent("settings-row");
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  (_easycom_uni_icons2 + _component_settings_row + _component_async_state_view)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d, _e, _f, _g;
  return common_vendor.e({
    a: common_vendor.p({
      type: "left",
      size: "24",
      color: "#172a22"
    }),
    b: $props.busy,
    c: common_vendor.o(($event) => _ctx.$emit("back"), "55"),
    d: common_vendor.t($props.isMember ? "永久会员" : "免费版"),
    e: common_vendor.t($props.isMember ? "所有订阅，一处管理" : "给每一笔续费留个位置"),
    f: common_vendor.t($props.isMember ? "订阅数量不限，权益跟随你的微信账号。" : "当前已使用 " + $props.freeQuotaValue + " 条订阅额度。"),
    g: $props.isMember && $props.membership.source === "simulation"
  }, $props.isMember && $props.membership.source === "simulation" ? {} : {}, {
    h: common_vendor.p({
      icon: "list",
      title: "不限数量的订阅",
      description: "一次开通，无到期日，也不会自动续费"
    }),
    i: common_vendor.p({
      icon: "cloud-upload",
      title: "跟随微信账号",
      description: "换手机或重新登录，仍可读取会员权益"
    }),
    j: common_vendor.p({
      icon: "notification",
      title: "保留所有基础功能",
      description: "免费版同样支持已授权提醒、统计和导出"
    }),
    k: common_vendor.t($props.membership.product ? $options.price($props.membership.product.amount) : "—"),
    l: common_vendor.t($props.isMember ? "已开通永久会员" : $props.busy ? "正在处理订单…" : ((_a = $props.membership.product) == null ? void 0 : _a.available) ? "创建模拟支付订单" : "模拟支付暂未开放"),
    m: $props.isMember || $props.busy || $props.loading || !!$props.error || !((_b = $props.membership.product) == null ? void 0 : _b.available),
    n: $props.busy ? "true" : "false",
    o: common_vendor.o(($event) => _ctx.$emit("purchase"), "94"),
    p: $props.error
  }, $props.error ? {
    q: common_vendor.o(($event) => _ctx.$emit("refresh"), "84"),
    r: common_vendor.p({
      title: "订单或权益需要重新确认",
      description: $props.error,
      ["action-label"]: "刷新订单与权益",
      busy: $props.busy || $props.loading
    })
  } : $props.loading ? {
    t: common_vendor.p({
      tone: "loading",
      title: "正在读取订单与权益",
      description: "订单状态以服务器记录为准"
    })
  } : {}, {
    s: $props.loading,
    v: common_vendor.t($props.message),
    w: $props.order
  }, $props.order ? common_vendor.e({
    x: common_vendor.t($props.order.status === "pending" ? "模拟收银台" : "订单详情"),
    y: common_vendor.t($props.order.productName),
    z: common_vendor.t($options.price($props.order.amount)),
    A: common_vendor.t($props.order.id),
    B: common_vendor.t($options.statusText($props.order.status)),
    C: $props.order.status === "pending"
  }, $props.order.status === "pending" ? {
    D: common_vendor.t($props.busy ? "正在处理…" : "模拟支付成功"),
    E: $props.busy || $props.loading || !!$props.error || !((_c = $props.membership.product) == null ? void 0 : _c.available),
    F: common_vendor.o(($event) => _ctx.$emit("simulate", "success"), "fa"),
    G: $props.busy || $props.loading || !!$props.error || !((_d = $props.membership.product) == null ? void 0 : _d.available),
    H: common_vendor.o(($event) => _ctx.$emit("simulate", "cancel"), "97"),
    I: $props.busy || $props.loading || !!$props.error || !((_e = $props.membership.product) == null ? void 0 : _e.available),
    J: common_vendor.o(($event) => _ctx.$emit("simulate", "failure"), "06")
  } : {}) : {}, {
    K: $props.order && $props.order.status === "paid"
  }, $props.order && $props.order.status === "paid" ? common_vendor.e({
    L: !$data.refundConfirm
  }, !$data.refundConfirm ? {
    M: $props.busy || $props.loading || !!$props.error || !((_f = $props.membership.product) == null ? void 0 : _f.available),
    N: common_vendor.o(($event) => $data.refundConfirm = true, "00")
  } : {
    O: $props.busy || $props.loading || !!$props.error || !((_g = $props.membership.product) == null ? void 0 : _g.available),
    P: common_vendor.o(($event) => {
      _ctx.$emit("refund");
      $data.refundConfirm = false;
    }, "f1"),
    Q: $props.busy,
    R: common_vendor.o(($event) => $data.refundConfirm = false, "d5")
  }) : {}, {
    S: common_vendor.t($props.loading ? "读取中…" : "刷新订单与权益"),
    T: $props.busy || $props.loading,
    U: common_vendor.o(($event) => _ctx.$emit("refresh"), "1a"),
    V: !$props.orders.length && !$props.loading
  }, !$props.orders.length && !$props.loading ? {} : {
    W: common_vendor.f($props.orders, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.productName),
        b: common_vendor.t($options.price(item.amount)),
        c: common_vendor.t($options.statusText(item.status)),
        d: common_vendor.t(item.id),
        e: common_vendor.t($options.dateText(item.createdAt)),
        f: common_vendor.t(item.status === "pending" ? " · 点击继续" : ""),
        g: item.id,
        h: common_vendor.o(($event) => _ctx.$emit("select-order", item), item.id)
      };
    }),
    X: $props.busy || $props.loading
  }, {
    Y: common_vendor.t($props.subscriptionLimit ?? 5)
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7124b7df"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/MembershipView.js.map
