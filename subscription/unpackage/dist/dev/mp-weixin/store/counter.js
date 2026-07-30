"use strict";
const common_vendor = require("../common/vendor.js");
const useCounterStore = common_vendor.defineStore("counter", {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    }
  }
});
exports.useCounterStore = useCounterStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/counter.js.map
