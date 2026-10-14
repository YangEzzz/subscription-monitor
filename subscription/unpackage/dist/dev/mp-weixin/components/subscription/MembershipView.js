"use strict";
const common_vendor = require("../../common/vendor.js");
const SettingsRow = () => "./SettingsRow.js";
const AsyncStateView = () => "./AsyncStateView.js";
const _sfc_main = {
  name: "MembershipView",
  components: { SettingsRow, AsyncStateView },
  emits: [
    "back",
    "purchase",
    "pay",
    "simulate",
    "refresh",
    "select-order",
    "refund"
  ],
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
    channelText(channel) {
      return {
        virtual: "虚拟支付",
        wechat: "微信支付（历史）",
        simulation: "模拟支付"
      }[channel] || channel;
    },
    price(amount) {
      return "¥" + (Number(amount) / 100).toFixed(2);
    },
    statusText(status, channel) {
      if (["virtual", "wechat"].includes(channel))
        return {
          pending: "待支付",
          paid: "已支付",
          cancelled: "已关闭",
          failed: "支付失败",
          refunded: "已退款"
        }[status] || status;
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  return common_vendor.e({
    a: common_vendor.p({
      type: "left",
      size: "24",
      color: "#172a22"
    }),
    b: $props.busy,
    c: common_vendor.o(($event) => _ctx.$emit("back"), "59"),
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
    l: common_vendor.t(((_a = $props.membership.product) == null ? void 0 : _a.notice) || "会员购买暂未开放。"),
    m: ((_b = $props.membership.product) == null ? void 0 : _b.channel) === "virtual"
  }, ((_c = $props.membership.product) == null ? void 0 : _c.channel) === "virtual" ? {} : {}, {
    n: common_vendor.t($props.isMember ? "已开通永久会员" : $props.busy ? "正在处理订单…" : ((_d = $props.membership.product) == null ? void 0 : _d.available) ? $props.membership.product.channel === "virtual" ? `微信支付 ${$options.price($props.membership.product.amount)} 开通` : "创建模拟支付订单" : "会员购买暂未开放"),
    o: $props.isMember || $props.busy || $props.loading || !!$props.error || !((_e = $props.membership.product) == null ? void 0 : _e.available),
    p: $props.busy ? "true" : "false",
    q: common_vendor.o(($event) => _ctx.$emit("purchase"), "5f"),
    r: $props.error
  }, $props.error ? {
    s: common_vendor.o(($event) => _ctx.$emit("refresh"), "90"),
    t: common_vendor.p({
      title: "订单或权益需要重新确认",
      description: $props.error,
      ["action-label"]: "刷新订单与权益",
      busy: $props.busy || $props.loading
    })
  } : $props.loading ? {
    w: common_vendor.p({
      tone: "loading",
      title: "正在读取订单与权益",
      description: "订单状态以服务器记录为准"
    })
  } : {}, {
    v: $props.loading,
    x: $props.message
  }, $props.message ? {
    y: common_vendor.t($props.message)
  } : {}, {
    z: $props.order
  }, $props.order ? common_vendor.e({
    A: common_vendor.t($props.order.status === "pending" ? $props.order.channel === "virtual" ? "待支付订单" : $props.order.channel === "simulation" ? "模拟收银台" : "历史订单详情" : "订单详情"),
    B: common_vendor.t($props.order.productName),
    C: common_vendor.t($options.price($props.order.amount)),
    D: common_vendor.t($props.order.id),
    E: common_vendor.t($options.statusText($props.order.status, $props.order.channel)),
    F: common_vendor.t($options.channelText($props.order.channel)),
    G: $props.order.status === "pending" && $props.order.channel === "simulation" && ((_f = $props.membership.product) == null ? void 0 : _f.channel) !== "virtual"
  }, $props.order.status === "pending" && $props.order.channel === "simulation" && ((_g = $props.membership.product) == null ? void 0 : _g.channel) !== "virtual" ? {
    H: common_vendor.t($props.busy ? "正在处理…" : "模拟支付成功"),
    I: $props.busy || $props.loading || !!$props.error || !((_h = $props.membership.product) == null ? void 0 : _h.available),
    J: common_vendor.o(($event) => _ctx.$emit("simulate", "success"), "fd"),
    K: $props.busy || $props.loading || !!$props.error || !((_i = $props.membership.product) == null ? void 0 : _i.available),
    L: common_vendor.o(($event) => _ctx.$emit("simulate", "cancel"), "5d"),
    M: $props.busy || $props.loading || !!$props.error || !((_j = $props.membership.product) == null ? void 0 : _j.available),
    N: common_vendor.o(($event) => _ctx.$emit("simulate", "failure"), "24")
  } : {}, {
    O: $props.order.status === "pending" && $props.order.channel === "virtual"
  }, $props.order.status === "pending" && $props.order.channel === "virtual" ? {
    P: common_vendor.t($props.busy ? "正在确认订单…" : "继续微信支付"),
    Q: $props.busy || $props.loading || !!$props.error || !((_k = $props.membership.product) == null ? void 0 : _k.available) || ((_l = $props.membership.product) == null ? void 0 : _l.channel) !== "virtual",
    R: $props.busy ? "true" : "false",
    S: common_vendor.o(($event) => _ctx.$emit("pay"), "47")
  } : {}) : {}, {
    T: $props.order && $props.order.status === "paid" && $props.order.channel === "simulation" && ((_m = $props.membership.product) == null ? void 0 : _m.channel) !== "virtual"
  }, $props.order && $props.order.status === "paid" && $props.order.channel === "simulation" && ((_n = $props.membership.product) == null ? void 0 : _n.channel) !== "virtual" ? common_vendor.e({
    U: !$data.refundConfirm
  }, !$data.refundConfirm ? {
    V: $props.busy || $props.loading || !!$props.error || !((_o = $props.membership.product) == null ? void 0 : _o.available),
    W: common_vendor.o(($event) => $data.refundConfirm = true, "27")
  } : {
    X: $props.busy || $props.loading || !!$props.error || !((_p = $props.membership.product) == null ? void 0 : _p.available),
    Y: common_vendor.o(($event) => {
      _ctx.$emit("refund");
      $data.refundConfirm = false;
    }, "a5"),
    Z: $props.busy,
    aa: common_vendor.o(($event) => $data.refundConfirm = false, "13")
  }) : {}, {
    ab: common_vendor.t($props.loading ? "读取中…" : "刷新订单与权益"),
    ac: $props.busy || $props.loading,
    ad: common_vendor.o(($event) => _ctx.$emit("refresh"), "25"),
    ae: !$props.orders.length && !$props.loading
  }, !$props.orders.length && !$props.loading ? {} : {
    af: common_vendor.f($props.orders, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.productName),
        b: common_vendor.t($options.price(item.amount)),
        c: common_vendor.t($options.statusText(item.status, item.channel)),
        d: common_vendor.t(item.id),
        e: common_vendor.t($options.dateText(item.createdAt)),
        f: common_vendor.t($options.channelText(item.channel)),
        g: common_vendor.t(item.status === "pending" && item.channel === "virtual" ? " · 点击查看" : ""),
        h: item.id,
        i: common_vendor.o(($event) => _ctx.$emit("select-order", item), item.id)
      };
    }),
    ag: $props.busy || $props.loading
  }, {
    ah: common_vendor.t(((_q = $props.membership.product) == null ? void 0 : _q.channel) === "virtual" ? "支付与会员权益以服务器确认结果为准。" : "模拟支付不会产生实际扣款。"),
    ai: common_vendor.t($props.subscriptionLimit ?? 5)
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7124b7df"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/MembershipView.js.map
