"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  components: {},
  data() {
    return {
      show: false,
      isOpened: "none",
      options1: [{
        text: "取消置顶"
      }],
      options2: [
        {
          text: "取消",
          style: {
            backgroundColor: "#007aff"
          }
        },
        {
          text: "确认",
          style: {
            backgroundColor: "#F56C6C"
          }
        }
      ],
      swipeList: [
        {
          options: [{
            text: "添加",
            style: {
              backgroundColor: "#F56C6C"
            }
          }],
          id: 0,
          content: "左滑点击添加新增一条数据"
        },
        {
          id: 1,
          options: [
            {
              text: "置顶"
            },
            {
              text: "删除",
              style: {
                backgroundColor: "rgb(255,58,49)"
              }
            }
          ],
          content: "item2"
        },
        {
          id: 2,
          options: [
            {
              text: "置顶"
            },
            {
              text: "标记为已读",
              style: {
                backgroundColor: "rgb(254,156,1)"
              }
            },
            {
              text: "删除",
              style: {
                backgroundColor: "rgb(255,58,49)"
              }
            }
          ],
          content: "item3"
        }
      ]
    };
  },
  onReady() {
    setTimeout(() => {
      this.isOpened = "right";
    }, 1e3);
    common_vendor.index.$on("update", (res) => {
      common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:187", 111);
      this.swipeClick({
        content: {
          text: "添加"
        }
      });
    });
  },
  methods: {
    contentClick() {
      common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:197", "点击内容");
      common_vendor.index.showToast({
        title: "点击内容",
        icon: "none"
      });
    },
    bindClick(e) {
      common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:204", e);
      common_vendor.index.showToast({
        title: `点击了${e.position === "left" ? "左侧" : "右侧"} ${e.content.text}按钮`,
        icon: "none"
      });
    },
    setOpened() {
      if (this.isOpened === "none") {
        this.isOpened = "left";
        return;
      }
      if (this.isOpened === "left") {
        this.isOpened = "right";
        return;
      }
      if (this.isOpened === "right") {
        this.isOpened = "none";
        return;
      }
    },
    change(e) {
      this.isOpened = e;
      common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:226", "返回：", e);
    },
    swipeChange(e, index) {
      common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:229", "返回：", e);
      common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:230", "当前索引：", index);
    },
    swipeClick(e, index) {
      let {
        content
      } = e;
      if (content.text === "删除") {
        common_vendor.index.showModal({
          title: "提示",
          content: "是否删除",
          success: (res) => {
            if (res.confirm) {
              this.swipeList.splice(index, 1);
            } else if (res.cancel) {
              common_vendor.index.__f__("log", "at pages/extUI/swipe-action/swipe-action.vue:244", "用户点击取消");
            }
          }
        });
      } else if (content.text === "添加") {
        if (this.swipeList.length < 10) {
          this.swipeList.push({
            id: (/* @__PURE__ */ new Date()).getTime(),
            options: [
              {
                text: "置顶"
              },
              {
                text: "标记为已读",
                style: {
                  backgroundColor: "rgb(254,156,1)"
                }
              },
              {
                text: "删除",
                style: {
                  backgroundColor: "rgb(255,58,49)"
                }
              }
            ],
            content: "新增" + (/* @__PURE__ */ new Date()).getTime()
          });
          common_vendor.index.showToast({
            title: `添加了一条数据`,
            icon: "none"
          });
        } else {
          common_vendor.index.showToast({
            title: `最多添加十条数据`,
            icon: "none"
          });
        }
      } else {
        common_vendor.index.showToast({
          title: `点击了${e.content.text}按钮`,
          icon: "none"
        });
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_swipe_action_item2 = common_vendor.resolveComponent("uni-swipe-action-item");
  const _easycom_uni_swipe_action2 = common_vendor.resolveComponent("uni-swipe-action");
  (_easycom_uni_card2 + _easycom_uni_section2 + _easycom_uni_swipe_action_item2 + _easycom_uni_swipe_action2)();
}
const _easycom_uni_card = () => "../../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_swipe_action_item = () => "../../../uni_modules/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.js";
const _easycom_uni_swipe_action = () => "../../../uni_modules/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_section + _easycom_uni_swipe_action_item + _easycom_uni_swipe_action)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      ["is-full"]: true,
      ["is-shadow"]: false
    }),
    b: common_vendor.p({
      title: "基本用法",
      type: "line"
    }),
    c: common_vendor.o((...args) => $options.contentClick && $options.contentClick(...args), "52"),
    d: common_vendor.o($options.bindClick, "5d"),
    e: common_vendor.p({
      ["left-options"]: $data.options2,
      threshold: 0,
      ["right-options"]: $data.options1
    }),
    f: common_vendor.o(($event) => $options.bindClick({
      position: "left",
      content: {
        text: "置顶"
      }
    }), "5b"),
    g: common_vendor.o((...args) => $options.contentClick && $options.contentClick(...args), "14"),
    h: common_vendor.o(($event) => $options.bindClick({
      position: "right",
      content: {
        text: "删除"
      }
    }), "95"),
    i: common_vendor.o($options.bindClick, "57"),
    j: common_vendor.o(($event) => $options.bindClick({
      position: "left",
      content: {
        text: "置顶"
      }
    }), "0c"),
    k: common_vendor.o((...args) => $options.contentClick && $options.contentClick(...args), "b3"),
    l: common_vendor.o($options.bindClick, "30"),
    m: common_vendor.p({
      ["right-options"]: $data.options1
    }),
    n: common_vendor.p({
      title: "禁止滑动",
      type: "line"
    }),
    o: common_vendor.p({
      disabled: true
    }),
    p: common_vendor.p({
      title: "使用变量控制开关",
      type: "line"
    }),
    q: common_vendor.t($data.isOpened),
    r: common_vendor.o((...args) => $options.setOpened && $options.setOpened(...args), "4b"),
    s: common_vendor.o($options.change, "84"),
    t: common_vendor.o($options.bindClick, "ff"),
    v: common_vendor.p({
      ["left-options"]: $data.options2,
      ["right-options"]: $data.options2,
      show: $data.isOpened,
      ["auto-close"]: false
    }),
    w: common_vendor.p({
      title: "swipe-action 列表",
      type: "line"
    }),
    x: common_vendor.f($data.swipeList, (item, index, i0) => {
      return {
        a: common_vendor.t(item.content),
        b: item.id,
        c: common_vendor.o(($event) => $options.swipeChange($event, index), item.id),
        d: common_vendor.o(($event) => $options.swipeClick($event, index), item.id),
        e: "79134644-14-" + i0 + ",79134644-13",
        f: common_vendor.p({
          ["right-options"]: item.options
        })
      };
    }),
    y: common_vendor.sr("swipeAction", "79134644-13")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/extUI/swipe-action/swipe-action.js.map
