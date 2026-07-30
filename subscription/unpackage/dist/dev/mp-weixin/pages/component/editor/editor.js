"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      readOnly: false,
      formats: {}
    };
  },
  onLoad() {
    common_vendor.index.loadFontFace({
      family: "Pacifico",
      source: 'url("/static/font/Pacifico-Regular.ttf")',
      success() {
        common_vendor.index.__f__("log", "at pages/component/editor/editor.vue:101", "success load font");
      },
      fail() {
        common_vendor.index.__f__("log", "at pages/component/editor/editor.vue:104", "fail load font load");
      }
    });
  },
  methods: {
    readOnlyChange() {
      this.readOnly = !this.readOnly;
    },
    getCon() {
      this.editorCtx.getContents({
        success: (res) => {
          common_vendor.index.__f__("log", "at pages/component/editor/editor.vue:116", "文本详情：", res);
        },
        fail: (err) => {
        }
      });
    },
    onEditorReady() {
      common_vendor.index.createSelectorQuery().select("#editor").context((res) => {
        this.editorCtx = res.context;
      }).exec();
    },
    undo() {
      this.editorCtx.undo();
    },
    redo() {
      this.editorCtx.redo();
    },
    format(e) {
      let {
        name,
        value
      } = e.target.dataset;
      if (!name)
        return;
      this.editorCtx.format(name, value);
    },
    onStatusChange(e) {
      const formats = e.detail;
      this.formats = formats;
    },
    insertDivider() {
      this.editorCtx.insertDivider({
        success: function() {
          common_vendor.index.__f__("log", "at pages/component/editor/editor.vue:156", "insert divider success");
        }
      });
    },
    clear() {
      common_vendor.index.showModal({
        title: "清空编辑器",
        content: "确定清空编辑器全部内容？",
        success: (res) => {
          if (res.confirm) {
            this.editorCtx.clear({
              success: function(res2) {
                common_vendor.index.__f__("log", "at pages/component/editor/editor.vue:168", "clear success");
              }
            });
          }
        }
      });
    },
    removeFormat() {
      this.editorCtx.removeFormat();
    },
    insertDate() {
      const date = /* @__PURE__ */ new Date();
      const formatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      this.editorCtx.insertText({
        text: formatDate
      });
    },
    insertImage() {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          this.editorCtx.insertImage({
            src: res.tempFilePaths[0],
            alt: "图像",
            success: function() {
              common_vendor.index.__f__("log", "at pages/component/editor/editor.vue:193", "insert image success");
            }
          });
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.n($data.formats.bold ? "ql-active" : ""),
    b: common_vendor.n($data.formats.italic ? "ql-active" : ""),
    c: common_vendor.n($data.formats.underline ? "ql-active" : ""),
    d: common_vendor.n($data.formats.strike ? "ql-active" : ""),
    e: common_vendor.n($data.formats.align === "left" ? "ql-active" : ""),
    f: common_vendor.n($data.formats.align === "center" ? "ql-active" : ""),
    g: common_vendor.n($data.formats.align === "right" ? "ql-active" : ""),
    h: common_vendor.n($data.formats.align === "justify" ? "ql-active" : ""),
    i: common_vendor.n($data.formats.lineHeight ? "ql-active" : ""),
    j: common_vendor.n($data.formats.letterSpacing ? "ql-active" : ""),
    k: common_vendor.n($data.formats.marginTop ? "ql-active" : ""),
    l: common_vendor.n($data.formats.marginBottom ? "ql-active" : ""),
    m: common_vendor.o((...args) => $options.removeFormat && $options.removeFormat(...args), "9b"),
    n: common_vendor.n($data.formats.fontFamily ? "ql-active" : ""),
    o: common_vendor.n($data.formats.fontSize === "24px" ? "ql-active" : ""),
    p: common_vendor.n($data.formats.color === "#0000ff" ? "ql-active" : ""),
    q: common_vendor.n($data.formats.backgroundColor === "#00ff00" ? "ql-active" : ""),
    r: common_vendor.o((...args) => $options.insertDate && $options.insertDate(...args), "20"),
    s: common_vendor.n($data.formats.list === "ordered" ? "ql-active" : ""),
    t: common_vendor.n($data.formats.list === "bullet" ? "ql-active" : ""),
    v: common_vendor.o((...args) => $options.undo && $options.undo(...args), "e5"),
    w: common_vendor.o((...args) => $options.redo && $options.redo(...args), "c4"),
    x: common_vendor.o((...args) => $options.insertDivider && $options.insertDivider(...args), "92"),
    y: common_vendor.o((...args) => $options.insertImage && $options.insertImage(...args), "8d"),
    z: common_vendor.n($data.formats.header === 1 ? "ql-active" : ""),
    A: common_vendor.n($data.formats.script === "sub" ? "ql-active" : ""),
    B: common_vendor.n($data.formats.script === "super" ? "ql-active" : ""),
    C: common_vendor.o((...args) => $options.clear && $options.clear(...args), "93"),
    D: common_vendor.n($data.formats.direction === "rtl" ? "ql-active" : ""),
    E: common_vendor.o((...args) => $options.format && $options.format(...args), "02"),
    F: common_vendor.o((...args) => $options.onStatusChange && $options.onStatusChange(...args), "72"),
    G: $data.readOnly,
    H: common_vendor.o((...args) => $options.onEditorReady && $options.onEditorReady(...args), "79"),
    I: common_vendor.o((...args) => $options.getCon && $options.getCon(...args), "e2")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/component/editor/editor.js.map
