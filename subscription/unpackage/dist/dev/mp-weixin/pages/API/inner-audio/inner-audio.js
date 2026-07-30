"use strict";
const common_vendor = require("../../../common/vendor.js");
const audioUrl = "https://web-ext-storage.dcloud.net.cn/uni-app/ForElise.mp3";
const _sfc_main = {
  data() {
    return {
      title: "innerAudioContext",
      isPlaying: false,
      isPlayEnd: false,
      currentTime: 0,
      duration: 100
    };
  },
  computed: {
    position() {
      return this.isPlayEnd ? 0 : this.currentTime;
    },
    playImage() {
      return this.isPlaying ? "/static/pause.png" : "/static/play.png";
    }
  },
  onLoad() {
    this._isChanging = false;
    this._audioContext = null;
    this.createAudio();
  },
  onUnload() {
    if (this._audioContext != null && this.isPlaying) {
      this.stop();
    }
  },
  methods: {
    createAudio() {
      var innerAudioContext = this._audioContext = common_vendor.index.createInnerAudioContext();
      innerAudioContext.autoplay = false;
      innerAudioContext.src = audioUrl;
      innerAudioContext.onPlay(() => {
        common_vendor.index.__f__("log", "at pages/API/inner-audio/inner-audio.vue:52", "开始播放");
      });
      innerAudioContext.onTimeUpdate((e) => {
        if (this._isChanging === true) {
          return;
        }
        this.currentTime = innerAudioContext.currentTime || 0;
        this.duration = innerAudioContext.duration || 0;
      });
      innerAudioContext.onEnded(() => {
        this.currentTime = 0;
        this.isPlaying = false;
        this.isPlayEnd = true;
      });
      innerAudioContext.onError((res) => {
        this.isPlaying = false;
        common_vendor.index.__f__("log", "at pages/API/inner-audio/inner-audio.vue:68", res.errMsg);
        common_vendor.index.__f__("log", "at pages/API/inner-audio/inner-audio.vue:69", res.errCode);
      });
      return innerAudioContext;
    },
    onchanging() {
      this._isChanging = true;
    },
    onchange(e) {
      common_vendor.index.__f__("log", "at pages/API/inner-audio/inner-audio.vue:77", e.detail.value);
      common_vendor.index.__f__("log", "at pages/API/inner-audio/inner-audio.vue:78", typeof e.detail.value);
      this._audioContext.seek(e.detail.value);
      this._isChanging = false;
    },
    play() {
      if (this.isPlaying) {
        this.pause();
        return;
      }
      this.isPlaying = true;
      this._audioContext.play();
      this.isPlayEnd = false;
    },
    pause() {
      this._audioContext.pause();
      this.isPlaying = false;
    },
    stop() {
      this._audioContext.stop();
      this.isPlaying = false;
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
      title: "audio"
    }),
    b: $options.position,
    c: $data.duration,
    d: common_vendor.o((...args) => $options.onchanging && $options.onchanging(...args), "79"),
    e: common_vendor.o((...args) => $options.onchange && $options.onchange(...args), "09"),
    f: $options.playImage,
    g: common_vendor.o((...args) => $options.play && $options.play(...args), "91")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/API/inner-audio/inner-audio.js.map
