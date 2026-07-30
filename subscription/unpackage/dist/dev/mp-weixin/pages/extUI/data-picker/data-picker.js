"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      nation: "汉族",
      address: "110101",
      // map: {
      //   text: "label",
      //   value: "value"
      // },
      classValue: "1-2",
      classDataTree: [
        {
          text: "一年级",
          value: "1-0",
          children: [
            {
              text: "1.1班",
              value: "1-1"
            },
            {
              text: "1.2班",
              value: "1-2"
            }
          ]
        },
        {
          text: "二年级",
          value: "2-0",
          children: [
            {
              text: "2.1班",
              value: "2-1"
            },
            {
              text: "2.2班",
              value: "2-2"
            }
          ]
        },
        {
          text: "三年级",
          value: "3-0",
          disable: true
        }
      ]
    };
  },
  methods: {
    onnodeclick(e) {
      common_vendor.index.__f__("log", "at pages/extUI/data-picker/data-picker.nvue:111", "nodeclick", e);
    },
    onpopupopened(e) {
      common_vendor.index.__f__("log", "at pages/extUI/data-picker/data-picker.nvue:114", "onpopupopened");
    },
    onpopupclosed(e) {
      common_vendor.index.__f__("log", "at pages/extUI/data-picker/data-picker.nvue:117", "onpopupclosed");
    },
    onchange(e) {
      common_vendor.index.__f__("log", "at pages/extUI/data-picker/data-picker.nvue:120", "onchange", e.detail.value);
    }
  }
};
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_data_picker2 = common_vendor.resolveComponent("uni-data-picker");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  (_easycom_uni_card2 + _easycom_uni_data_picker2 + _easycom_uni_section2)();
}
const _easycom_uni_card = () => "../../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_data_picker = () => "../../../uni_modules/uni-data-picker/components/uni-data-picker/uni-data-picker.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_data_picker + _easycom_uni_section)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      ["is-full"]: true,
      ["is-shadow"]: false
    }),
    b: common_vendor.o($options.onchange, "91"),
    c: common_vendor.o($options.onnodeclick, "6b"),
    d: common_vendor.o($options.onpopupopened, "8a"),
    e: common_vendor.o($options.onpopupclosed, "86"),
    f: common_vendor.o(($event) => $data.classValue = $event, "32"),
    g: common_vendor.p({
      placeholder: "请选择班级",
      ["popup-title"]: "请选择",
      localdata: $data.classDataTree,
      modelValue: $data.classValue
    }),
    h: common_vendor.p({
      title: "本地数据",
      type: "line"
    }),
    i: common_vendor.w(({
      data,
      error,
      options
    }, s0, i0) => {
      return common_vendor.e({
        a: error
      }, error ? {
        b: common_vendor.t(error)
      } : data.length ? {
        d: common_vendor.f(data, (item, index, i1) => {
          return {
            a: common_vendor.t(item.text),
            b: index
          };
        })
      } : {}, {
        c: data.length,
        e: i0,
        f: s0
      });
    }, {
      name: "d",
      path: "i",
      vueId: "7c95b454-4,7c95b454-3"
    }),
    j: common_vendor.o(($event) => $data.classValue = $event, "2e"),
    k: common_vendor.p({
      title: "请选择",
      localdata: $data.classDataTree,
      modelValue: $data.classValue
    }),
    l: common_vendor.p({
      title: "自定义插槽",
      type: "line"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/extUI/data-picker/data-picker.js.map
