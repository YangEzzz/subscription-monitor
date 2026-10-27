"use strict";
const common_vendor = require("../../common/vendor.js");
const UiSkeleton = () => "./UiSkeleton.js";
const PageHeader = () => "./PageHeader.js";
const AsyncStateView = () => "./AsyncStateView.js";
const _sfc_main = {
  name: "MembershipView",
  components: { AsyncStateView, PageHeader, UiSkeleton },
  emits: [
    "back",
    "purchase",
    "pay",
    "simulate",
    "refresh",
    "select-order",
    "refund",
    "resume-create"
  ],
  data() {
    return { refundConfirm: false, showOrders: false, openQuestion: -1 };
  },
  watch: {
    "order.id"() {
      this.refundConfirm = false;
    }
  },
  props: {
    quotaPrompt: { type: Boolean, default: false },
    resumeCreate: { type: Boolean, default: false },
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
  computed: {
    quotaPercent() {
      var _a;
      return this.subscriptionLimit ? Math.min(
        100,
        (((_a = this.membership.quota) == null ? void 0 : _a.used) || 0) / this.subscriptionLimit * 100
      ) : 0;
    },
    canResume() {
      var _a;
      return !this.loading && !this.busy && !this.error && (this.isMember || (((_a = this.membership.quota) == null ? void 0 : _a.remaining) || 0) > 0);
    },
    questions() {
      return [
        {
          title: "免费版与永久会员有什么区别？",
          answer: `免费版最多保存 ${this.subscriptionLimit ?? 10} 条订阅，永久会员不限数量。提醒、支出统计和导出在免费版同样可用，提醒需完成授权。删除订阅可释放免费额度，历史账单保留。`
        },
        {
          title: "会自动续费或再次扣款吗？",
          answer: "不会。永久会员为一次性购买，没有到期日，也不会自动续费或周期扣款。"
        },
        {
          title: "更换手机后，会员还在吗？",
          answer: "在。使用同一微信账号重新登录，即可读取会员权益，无需再次购买。"
        },
        {
          title: "支付后权益没有更新怎么办？",
          answer: "展开「我的订单」，点击「刷新订单与权益」重新查询。请先确认现有订单的结果，再继续操作。"
        }
      ];
    }
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
      if (amount == null || !Number.isFinite(Number(amount)))
        return "—";
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
  const _component_page_header = common_vendor.resolveComponent("page-header");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_async_state_view = common_vendor.resolveComponent("async-state-view");
  (_component_page_header + _easycom_uni_icons2 + _component_async_state_view)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E;
  return common_vendor.e({
    a: common_vendor.o(($event) => _ctx.$emit("back"), "6d"),
    b: common_vendor.p({
      title: $props.quotaPrompt ? "订阅额度" : "会员中心",
      secondary: true,
      disabled: $props.busy
    }),
    c: $props.quotaPrompt && !$props.isMember
  }, $props.quotaPrompt && !$props.isMember ? {
    d: common_vendor.t($props.loading ? "确认中" : $props.error ? "状态待确认" : (((_a = $props.membership.quota) == null ? void 0 : _a.remaining) || 0) > 0 ? "已有可用位置" : "免费额度已用完"),
    e: common_vendor.t($props.subscriptionLimit ?? 10),
    f: common_vendor.t($props.loading || $props.error ? "—" : ((_b = $props.membership.quota) == null ? void 0 : _b.used) ?? "—"),
    g: common_vendor.t($props.subscriptionLimit ?? "—"),
    h: $options.quotaPercent + "%"
  } : {}, {
    i: $props.quotaPrompt && $props.resumeCreate && $options.canResume
  }, $props.quotaPrompt && $props.resumeCreate && $options.canResume ? {
    j: common_vendor.o(($event) => _ctx.$emit("resume-create"), "ba")
  } : {}, {
    k: !$props.quotaPrompt || $props.isMember
  }, !$props.quotaPrompt || $props.isMember ? common_vendor.e({
    l: common_vendor.t($props.loading ? "读取中" : $props.error ? "状态待确认" : $props.isMember ? "权益已生效" : "未开通"),
    m: common_vendor.t($props.isMember ? "很高兴，有你同行" : "给每一份订阅，留个位置"),
    n: common_vendor.t("永久会员"),
    o: common_vendor.t($props.isMember ? "不限订阅数量，陪你从容管理每一次续费。" : "解锁无限订阅，让喜欢的服务都有迹可循。"),
    p: common_vendor.p({
      type: "vip-filled",
      size: "52",
      color: "var(--member-gold)"
    }),
    q: common_vendor.t($props.loading ? "正在读取会员权益…" : $props.error ? "请刷新以确认最新权益" : $props.isMember ? "有效期：永久" : "订阅用量：" + ($props.freeQuotaValue || "待确认") + " 条"),
    r: common_vendor.t($props.isMember ? "无需续费" : "升级后数量不限"),
    s: $props.isMember ? 1 : "",
    t: !$props.isMember ? 1 : "",
    v: $props.isMember && $props.membership.source === "simulation"
  }, $props.isMember && $props.membership.source === "simulation" ? {} : {}, {
    w: common_vendor.p({
      type: "list",
      size: "26",
      color: "var(--violet)"
    }),
    x: common_vendor.p({
      type: "medal",
      size: "25",
      color: "var(--gold)"
    }),
    y: common_vendor.p({
      type: "cloud-upload",
      size: "25",
      color: "var(--blue)"
    }),
    z: common_vendor.p({
      type: "checkmarkempty",
      size: "17",
      color: "var(--blue)"
    })
  }) : {}, {
    A: common_vendor.t($props.isMember ? "你的会员方案" : $props.quotaPrompt ? "一次开通，订阅数量不限" : "一份开通，长久陪伴"),
    B: common_vendor.t($props.membership.product ? $options.price($props.membership.product.amount) : "—"),
    C: common_vendor.t($props.isMember ? "已开通 · 好好享受订阅自由" : $props.busy ? "正在处理订单…" : $props.loading ? "正在读取开通信息…" : $props.error ? "请刷新后开通" : ((_c = $props.membership.product) == null ? void 0 : _c.available) ? $props.membership.product.channel === "virtual" ? `${$options.price($props.membership.product.amount)} · 开通永久会员` : "体验模拟开通（不扣款）" : "会员购买暂未开放"),
    D: $props.isMember ? 1 : "",
    E: $props.isMember || $props.busy || $props.loading || !!$props.error || !((_d = $props.membership.product) == null ? void 0 : _d.available),
    F: $props.isMember || $props.busy || $props.loading || !!$props.error || !((_e = $props.membership.product) == null ? void 0 : _e.available),
    G: $props.busy ? "true" : "false",
    H: common_vendor.o(($event) => _ctx.$emit("purchase"), "5c"),
    I: common_vendor.t($props.isMember ? "权益已绑定当前微信账号，无需重复购买。" : !((_f = $props.membership.product) == null ? void 0 : _f.available) ? "当前暂未开放购买，免费功能可正常使用。" : ((_g = $props.membership.product) == null ? void 0 : _g.notice) || "开通结果以订单与会员权益查询为准。"),
    J: !$props.isMember && ((_h = $props.membership.product) == null ? void 0 : _h.available) && ((_i = $props.membership.product) == null ? void 0 : _i.channel) === "virtual" && !((_j = $props.membership.product) == null ? void 0 : _j.iosEnabled)
  }, !$props.isMember && ((_k = $props.membership.product) == null ? void 0 : _k.available) && ((_l = $props.membership.product) == null ? void 0 : _l.channel) === "virtual" && !((_m = $props.membership.product) == null ? void 0 : _m.iosEnabled) ? {} : {}, {
    K: $props.quotaPrompt && !$props.isMember
  }, $props.quotaPrompt && !$props.isMember ? {
    L: $props.busy,
    M: common_vendor.o(($event) => _ctx.$emit("back"), "bf")
  } : {}, {
    N: $props.error
  }, $props.error ? {
    O: common_vendor.o(($event) => _ctx.$emit("refresh"), "bc"),
    P: common_vendor.p({
      title: "订单或权益需要重新确认",
      description: $props.error,
      ["action-label"]: "刷新订单与权益",
      busy: $props.busy || $props.loading
    })
  } : $props.loading ? {
    R: common_vendor.p({
      tone: "loading",
      title: "正在读取订单与权益",
      description: "订单状态以服务器记录为准"
    })
  } : {}, {
    Q: $props.loading,
    S: $props.message
  }, $props.message ? {
    T: common_vendor.t($props.message)
  } : {}, {
    U: $props.order
  }, $props.order ? common_vendor.e({
    V: common_vendor.t($props.order.status === "pending" ? $props.order.channel === "virtual" ? "待支付订单" : $props.order.channel === "simulation" ? "模拟收银台" : "历史订单详情" : "订单详情"),
    W: common_vendor.t($props.order.productName),
    X: common_vendor.t($options.price($props.order.amount)),
    Y: common_vendor.t($props.order.id),
    Z: common_vendor.t($options.statusText($props.order.status, $props.order.channel)),
    aa: common_vendor.t($options.channelText($props.order.channel)),
    ab: $props.order.status === "pending" && $props.order.channel === "simulation" && ((_n = $props.membership.product) == null ? void 0 : _n.channel) !== "virtual"
  }, $props.order.status === "pending" && $props.order.channel === "simulation" && ((_o = $props.membership.product) == null ? void 0 : _o.channel) !== "virtual" ? {
    ac: common_vendor.t($props.busy ? "正在处理…" : "模拟支付成功"),
    ad: $props.busy || $props.loading || !!$props.error || !((_p = $props.membership.product) == null ? void 0 : _p.available),
    ae: $props.busy || $props.loading || !!$props.error || !((_q = $props.membership.product) == null ? void 0 : _q.available),
    af: common_vendor.o(($event) => _ctx.$emit("simulate", "success"), "14"),
    ag: $props.busy || $props.loading || !!$props.error || !((_r = $props.membership.product) == null ? void 0 : _r.available),
    ah: $props.busy || $props.loading || !!$props.error || !((_s = $props.membership.product) == null ? void 0 : _s.available),
    ai: common_vendor.o(($event) => _ctx.$emit("simulate", "cancel"), "a6"),
    aj: $props.busy || $props.loading || !!$props.error || !((_t = $props.membership.product) == null ? void 0 : _t.available),
    ak: $props.busy || $props.loading || !!$props.error || !((_u = $props.membership.product) == null ? void 0 : _u.available),
    al: common_vendor.o(($event) => _ctx.$emit("simulate", "failure"), "ca")
  } : {}, {
    am: $props.order.status === "pending" && $props.order.channel === "virtual"
  }, $props.order.status === "pending" && $props.order.channel === "virtual" ? {
    an: common_vendor.t($props.busy ? "正在确认订单…" : "继续微信支付"),
    ao: $props.busy || $props.loading || !!$props.error || !((_v = $props.membership.product) == null ? void 0 : _v.available) || ((_w = $props.membership.product) == null ? void 0 : _w.channel) !== "virtual",
    ap: $props.busy || $props.loading || !!$props.error || !((_x = $props.membership.product) == null ? void 0 : _x.available) || ((_y = $props.membership.product) == null ? void 0 : _y.channel) !== "virtual",
    aq: $props.busy ? "true" : "false",
    ar: common_vendor.o(($event) => _ctx.$emit("pay"), "5c")
  } : {}) : {}, {
    as: $props.order && $props.order.status === "paid" && $props.order.channel === "simulation" && ((_z = $props.membership.product) == null ? void 0 : _z.channel) !== "virtual"
  }, $props.order && $props.order.status === "paid" && $props.order.channel === "simulation" && ((_A = $props.membership.product) == null ? void 0 : _A.channel) !== "virtual" ? common_vendor.e({
    at: !$data.refundConfirm
  }, !$data.refundConfirm ? {
    av: $props.busy || $props.loading || !!$props.error || !((_B = $props.membership.product) == null ? void 0 : _B.available),
    aw: $props.busy || $props.loading || !!$props.error || !((_C = $props.membership.product) == null ? void 0 : _C.available),
    ax: common_vendor.o(($event) => $data.refundConfirm = true, "3c")
  } : {
    ay: $props.busy || $props.loading || !!$props.error || !((_D = $props.membership.product) == null ? void 0 : _D.available),
    az: $props.busy || $props.loading || !!$props.error || !((_E = $props.membership.product) == null ? void 0 : _E.available),
    aA: common_vendor.o(($event) => {
      _ctx.$emit("refund");
      $data.refundConfirm = false;
    }, "54"),
    aB: $props.busy,
    aC: $props.busy,
    aD: common_vendor.o(($event) => $data.refundConfirm = false, "59")
  }) : {}, {
    aE: common_vendor.p({
      type: "wallet",
      size: "21",
      color: "var(--violet)"
    }),
    aF: common_vendor.p({
      type: $data.showOrders ? "up" : "right",
      size: "17",
      color: "var(--ink-3)"
    }),
    aG: $props.busy,
    aH: $props.busy,
    aI: $data.showOrders,
    aJ: common_vendor.o(($event) => $data.showOrders = !$data.showOrders, "3d"),
    aK: $data.showOrders
  }, $data.showOrders ? common_vendor.e({
    aL: common_vendor.t($props.loading ? "读取中…" : "刷新订单与权益"),
    aM: $props.busy || $props.loading,
    aN: $props.busy || $props.loading,
    aO: common_vendor.o(($event) => _ctx.$emit("refresh"), "8d"),
    aP: !$props.orders.length && !$props.loading
  }, !$props.orders.length && !$props.loading ? {} : {
    aQ: common_vendor.f($props.orders, (item, k0, i0) => {
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
    aR: $props.busy || $props.loading,
    aS: $props.busy || $props.loading
  }) : {}, {
    aT: common_vendor.f($options.questions, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.title),
        b: "7124b7df-10-" + i0,
        c: common_vendor.p({
          type: $data.openQuestion === index ? "minus" : "plus",
          size: "18",
          color: "var(--ink-3)"
        }),
        d: $data.openQuestion === index,
        e: common_vendor.o(($event) => $data.openQuestion = $data.openQuestion === index ? -1 : index, item.title),
        f: $data.openQuestion === index
      }, $data.openQuestion === index ? {
        g: common_vendor.t(item.answer)
      } : {}, {
        h: item.title
      });
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7124b7df"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/subscription/MembershipView.js.map
