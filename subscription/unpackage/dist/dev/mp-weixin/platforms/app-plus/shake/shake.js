"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      img: "https://web-assets.dcloud.net.cn/unidoc/zh/1.jpg",
      show: false,
      isOpened: false,
      index: 1
    };
  },
  computed: {
    pageIndex() {
      if (this.index === 1) {
        return "shake-1";
      } else if (this.index === 2) {
        return "shake-2";
      } else if (this.index === 3) {
        return "shake-3";
      } else if (this.index === 4) {
        return "shake-4";
      } else {
        return "shake-1";
      }
    }
  },
  onLoad: function() {
    this.music = common_vendor.index.createInnerAudioContext();
    this.music.src = "https://web-assets.dcloud.net.cn/unidoc/zh/shake.wav";
    let t = null;
    common_vendor.index.onAccelerometerChange((res) => {
      if (Math.abs(res.x) + Math.abs(res.y) + Math.abs(res.z) > 20 && !this.show && this.isOpened) {
        this.music.play();
        setTimeout(() => {
          this.index++;
          if (this.index > 4) {
            this.index = 1;
          }
          this.img = "https://web-ext-storage.dcloud.net.cn/hello-uni-app/" + this.pageIndex + ".jpg";
        }, 2e3);
        this.show = true;
        if (t) {
          clearTimeout(t);
        }
        t = setTimeout(() => {
          t = null;
          this.show = false;
        }, 600);
      }
    });
  },
  onShow() {
    this.isOpened = true;
  },
  onUnload() {
    this.show = false;
    this.isOpened = false;
    common_vendor.index.stopAccelerometer();
    this.music.destroy();
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.n($data.show ? "up" : ""),
    b: common_vendor.n($data.show ? "down" : ""),
    c: "url(" + $data.img + ")"
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/platforms/app-plus/shake/shake.js.map
