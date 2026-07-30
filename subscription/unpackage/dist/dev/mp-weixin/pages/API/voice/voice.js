"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_util = require("../../../common/util.js");
const common_assets = require("../../../common/assets.js");
var playTimeInterval = null;
var recordTimeInterval = null;
var recorderManager = null;
var music = null;
const _sfc_main = {
  data() {
    return {
      title: "start/stopRecord、play/stopVoice",
      recording: false,
      //录音中
      playing: false,
      //播放中
      hasRecord: false,
      //是否有了一个
      tempFilePath: "",
      recordTime: 0,
      playTime: 0,
      formatedRecordTime: "00:00:00",
      //录音的总时间
      formatedPlayTime: "00:00:00"
      //播放录音的当前时间
    };
  },
  onUnload: function() {
    this.end();
  },
  onLoad: function() {
    music = common_vendor.index.createInnerAudioContext();
    music.onEnded(() => {
      clearInterval(playTimeInterval);
      var playTime = 0;
      common_vendor.index.__f__("log", "at pages/API/voice/voice.vue:91", "play voice finished");
      this.playing = false;
      this.formatedPlayTime = common_util.formatTime(playTime);
      this.playTime = playTime;
    });
    recorderManager = common_vendor.index.getRecorderManager();
    recorderManager.onStart(() => {
      common_vendor.index.__f__("log", "at pages/API/voice/voice.vue:98", "recorder start");
      this.recording = true;
      recordTimeInterval = setInterval(() => {
        this.recordTime += 1;
        this.formatedRecordTime = common_util.formatTime(this.recordTime);
      }, 1e3);
    });
    recorderManager.onStop((res) => {
      common_vendor.index.__f__("log", "at pages/API/voice/voice.vue:107", "on stop");
      music.src = res.tempFilePath;
      this.hasRecord = true;
      this.recording = false;
    });
    recorderManager.onError(() => {
      common_vendor.index.__f__("log", "at pages/API/voice/voice.vue:114", "recorder onError");
    });
  },
  methods: {
    async startRecord() {
      recorderManager.start({
        format: "mp3"
      });
    },
    stopRecord() {
      recorderManager.stop();
      clearInterval(recordTimeInterval);
    },
    playVoice() {
      common_vendor.index.__f__("log", "at pages/API/voice/voice.vue:136", "play voice");
      this.playing = true;
      playTimeInterval = setInterval(() => {
        this.playTime += 1;
        this.formatedPlayTime = common_util.formatTime(this.playTime);
      }, 1e3);
      music.play();
    },
    stopVoice() {
      clearInterval(playTimeInterval);
      this.playing = false;
      this.formatedPlayTime = common_util.formatTime(0);
      this.playTime = 0;
      music.stop();
    },
    end() {
      music.stop();
      recorderManager.stop();
      clearInterval(recordTimeInterval);
      clearInterval(playTimeInterval);
      this.recording = false, this.playing = false, this.hasRecord = false;
      this.playTime = 0, this.recordTime = 0;
      this.formatedRecordTime = "00:00:00", this.formatedRecordTime = "00:00:00";
    },
    clear() {
      this.end();
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
  return common_vendor.e({
    a: common_vendor.p({
      title: $data.title
    }),
    b: !$data.recording && !$data.playing && !$data.hasRecord
  }, !$data.recording && !$data.playing && !$data.hasRecord ? {
    c: common_vendor.t($data.formatedRecordTime),
    d: common_assets._imports_0$7,
    e: common_vendor.o((...args) => $options.startRecord && $options.startRecord(...args), "71")
  } : {}, {
    f: $data.recording === true
  }, $data.recording === true ? {
    g: common_vendor.t($data.formatedRecordTime),
    h: common_vendor.o((...args) => $options.stopRecord && $options.stopRecord(...args), "66")
  } : {}, {
    i: $data.hasRecord === true && $data.playing === false
  }, $data.hasRecord === true && $data.playing === false ? {
    j: common_vendor.t($data.formatedPlayTime),
    k: common_vendor.t($data.formatedRecordTime),
    l: common_assets._imports_2$1,
    m: common_vendor.o((...args) => $options.playVoice && $options.playVoice(...args), "68"),
    n: common_assets._imports_2,
    o: common_vendor.o((...args) => $options.clear && $options.clear(...args), "96")
  } : {}, {
    p: $data.hasRecord === true && $data.playing === true
  }, $data.hasRecord === true && $data.playing === true ? {
    q: common_vendor.t($data.formatedPlayTime),
    r: common_vendor.t($data.formatedRecordTime),
    s: common_assets._imports_0$6,
    t: common_vendor.o((...args) => $options.stopVoice && $options.stopVoice(...args), "e6"),
    v: common_assets._imports_2,
    w: common_vendor.o((...args) => $options.clear && $options.clear(...args), "e5")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/API/voice/voice.js.map
