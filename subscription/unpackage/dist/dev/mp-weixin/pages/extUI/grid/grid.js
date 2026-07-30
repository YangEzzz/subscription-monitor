"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const _sfc_main = {
  components: {},
  data() {
    return {
      dynamicList: [],
      list: [
        {
          url: "/static/c1.png",
          text: "Grid 1",
          badge: "0",
          type: "primary"
        },
        {
          url: "/static/c2.png",
          text: "Grid 2",
          badge: "1",
          type: "success"
        },
        {
          url: "/static/c3.png",
          text: "Grid 3",
          badge: "99",
          type: "warning"
        },
        {
          url: "/static/c4.png",
          text: "Grid 4",
          badge: "2",
          type: "error"
        },
        {
          url: "/static/c5.png",
          text: "Grid 5"
        },
        {
          url: "/static/c6.png",
          text: "Grid 6"
        },
        {
          url: "/static/c7.png",
          text: "Grid 7"
        },
        {
          url: "/static/c8.png",
          text: "Grid 8"
        },
        {
          url: "/static/c9.png",
          text: "Grid 9"
        }
      ]
    };
  },
  methods: {
    change(e) {
      let {
        index
      } = e.detail;
      this.list[index].badge && this.list[index].badge++;
      common_vendor.index.showToast({
        title: `点击第${index + 1}个宫格`,
        icon: "none"
      });
    },
    add() {
      if (this.dynamicList.length < 9) {
        this.dynamicList.push({
          url: `/static/c${this.dynamicList.length + 1}.png`,
          text: `Grid ${this.dynamicList.length + 1}`,
          color: this.dynamicList.length % 2 === 0 ? "#f5f5f5" : "#fff"
        });
      } else {
        common_vendor.index.showToast({
          title: "最多添加9个",
          icon: "none"
        });
      }
    },
    del() {
      this.dynamicList.splice(this.dynamicList.length - 1, 1);
    }
  }
};
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_grid_item2 = common_vendor.resolveComponent("uni-grid-item");
  const _easycom_uni_grid2 = common_vendor.resolveComponent("uni-grid");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_badge2 = common_vendor.resolveComponent("uni-badge");
  (_easycom_uni_card2 + _easycom_uni_icons2 + _easycom_uni_grid_item2 + _easycom_uni_grid2 + _easycom_uni_section2 + _easycom_uni_badge2)();
}
const _easycom_uni_card = () => "../../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_icons = () => "../../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_grid_item = () => "../../../uni_modules/uni-grid/components/uni-grid-item/uni-grid-item.js";
const _easycom_uni_grid = () => "../../../uni_modules/uni-grid/components/uni-grid/uni-grid.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_badge = () => "../../../uni_modules/uni-badge/components/uni-badge/uni-badge.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_icons + _easycom_uni_grid_item + _easycom_uni_grid + _easycom_uni_section + _easycom_uni_badge)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      ["is-full"]: true,
      ["is-shadow"]: false
    }),
    b: common_vendor.f(4, (item, index, i0) => {
      return {
        a: "27ba6f3a-4-" + i0 + "," + ("27ba6f3a-3-" + i0),
        b: index,
        c: "27ba6f3a-3-" + i0 + ",27ba6f3a-2",
        d: common_vendor.p({
          index
        })
      };
    }),
    c: common_vendor.p({
      type: "image",
      size: 30,
      color: "#777"
    }),
    d: common_vendor.o($options.change, "47"),
    e: common_vendor.p({
      column: 4,
      highlight: true
    }),
    f: common_vendor.p({
      title: "基础样式",
      type: "line",
      padding: true
    }),
    g: common_vendor.f(8, (item, index, i0) => {
      return {
        a: "27ba6f3a-8-" + i0 + "," + ("27ba6f3a-7-" + i0),
        b: index,
        c: "27ba6f3a-7-" + i0 + ",27ba6f3a-6",
        d: common_vendor.p({
          index
        })
      };
    }),
    h: common_vendor.p({
      type: "image",
      size: 30,
      color: "#777"
    }),
    i: common_vendor.o($options.change, "dd"),
    j: common_vendor.p({
      column: 4,
      highlight: true
    }),
    k: common_vendor.p({
      title: "自定义列数",
      type: "line",
      padding: true
    }),
    l: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: item.url,
        b: common_vendor.t(item.text),
        c: index,
        d: "27ba6f3a-11-" + i0 + ",27ba6f3a-10",
        e: common_vendor.p({
          index
        })
      };
    }),
    m: common_vendor.o($options.change, "5e"),
    n: common_vendor.p({
      column: 3,
      highlight: true
    }),
    o: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: item.url,
        b: common_vendor.t(item.text),
        c: index,
        d: "27ba6f3a-13-" + i0 + ",27ba6f3a-12",
        e: common_vendor.p({
          index
        })
      };
    }),
    p: common_vendor.o($options.change, "da"),
    q: common_vendor.p({
      column: 3,
      highlight: true
    }),
    r: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: item.url,
        b: common_vendor.t(item.text),
        c: index,
        d: "27ba6f3a-15-" + i0 + ",27ba6f3a-14",
        e: common_vendor.p({
          index
        })
      };
    }),
    s: common_vendor.o($options.change, "94"),
    t: common_vendor.p({
      column: 3,
      highlight: true
    }),
    v: common_vendor.p({
      title: "滑动视图",
      type: "line",
      padding: true
    }),
    w: common_vendor.f($data.dynamicList, (item, index, i0) => {
      return {
        a: item.url,
        b: common_vendor.t(item.text),
        c: item.color,
        d: index,
        e: "27ba6f3a-18-" + i0 + ",27ba6f3a-17",
        f: common_vendor.p({
          index
        })
      };
    }),
    x: common_vendor.o($options.change, "02"),
    y: common_vendor.p({
      column: 3,
      highlight: true
    }),
    z: common_vendor.o((...args) => $options.add && $options.add(...args), "ac"),
    A: $data.dynamicList.length !== 0
  }, $data.dynamicList.length !== 0 ? {
    B: common_vendor.o((...args) => $options.del && $options.del(...args), "c3")
  } : {}, {
    C: common_vendor.p({
      title: "动态加载",
      type: "line",
      padding: true
    }),
    D: common_vendor.f($data.list, (item, index, i0) => {
      return common_vendor.e({
        a: item.url,
        b: common_vendor.t(item.text),
        c: item.badge
      }, item.badge ? {
        d: "27ba6f3a-22-" + i0 + "," + ("27ba6f3a-21-" + i0),
        e: common_vendor.p({
          text: item.badge,
          type: item.type
        })
      } : {}, {
        f: index,
        g: "27ba6f3a-21-" + i0 + ",27ba6f3a-20",
        h: common_vendor.p({
          index
        })
      });
    }),
    E: common_vendor.o($options.change, "ba"),
    F: common_vendor.p({
      column: 3,
      ["show-border"]: false,
      square: false
    }),
    G: common_vendor.p({
      title: "无边框带角标（3列）",
      type: "line",
      padding: true
    }),
    H: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: item.url,
        b: common_vendor.t(item.text),
        c: index,
        d: "27ba6f3a-25-" + i0 + ",27ba6f3a-24",
        e: common_vendor.p({
          index
        })
      };
    }),
    I: common_vendor.o($options.change, "ba"),
    J: common_vendor.p({
      column: 3,
      square: false,
      highlight: false
    }),
    K: common_vendor.p({
      title: "矩形宫格（3列）",
      type: "line",
      padding: true
    }),
    L: common_assets._imports_0$9,
    M: common_vendor.p({
      index: 0
    }),
    N: common_assets._imports_1$1,
    O: common_vendor.p({
      index: 1
    }),
    P: common_assets._imports_2$2,
    Q: common_vendor.p({
      index: 2
    }),
    R: common_assets._imports_3,
    S: common_vendor.p({
      index: 3
    }),
    T: common_vendor.o($options.change, "fa"),
    U: common_vendor.p({
      column: 4,
      ["border-color"]: "#03a9f4"
    }),
    V: common_vendor.p({
      title: "边框颜色（4列 无文字）",
      type: "line",
      padding: true
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/extUI/grid/grid.js.map
