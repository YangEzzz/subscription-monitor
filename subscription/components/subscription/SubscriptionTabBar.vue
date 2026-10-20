<template>
  <view class="dock-wrap">
    <view class="dock-fade"></view>
    <view class="renewal-dock" role="tablist" aria-label="主导航">
      <view
        class="dock-indicator motion"
        :class="{
          'dock-crossing': crossing,
          'dock-moving': moving,
          'dock-no-transition': !ready,
        }"
        :style="{ transform: 'translateX(' + left + 'px)' }"
        ><view class="dock-indicator-fill"></view
      ></view>
      <template v-for="(tab, index) in navigationTabs" :key="tab.key">
        <view v-if="index === 2" class="dock-add-slot">
          <button
            role="button"
            tabindex="0"
            class="dock-add pressable"
            :class="{ 'dock-add-pop': adding }"
            aria-label="新增订阅"
            hover-class="is-pressed"
            @tap="create"
          >
            <view class="dock-halo motion"></view
            ><view class="dock-ripple motion"></view>
            <view class="dock-plus motion"
              ><view class="dock-plus-h"></view><view class="dock-plus-v"></view
            ></view></button
          ><text class="dock-add-label">新增</text>
        </view>
        <button
          class="dock-tab pressable"
          :class="{ 'dock-tab-active': activeView === tab.key }"
          role="tab"
          tabindex="0"
          :aria-selected="activeView === tab.key"
          :aria-label="tab.label"
          hover-class="is-pressed"
          @tap="$emit('switch', tab.key)"
        >
          <view class="dock-icon motion"
            ><view class="dock-icon-outline"
              ><uni-icons
                :type="tab.icon"
                size="24"
                color="var(--ink-3)" /></view
            ><view class="dock-icon-filled"
              ><uni-icons
                :type="tab.activeIcon"
                size="24"
                color="var(--blue)" /></view
          ></view>
          <text class="dock-tab-label">{{ tab.label }}</text>
        </button>
      </template>
    </view>
  </view>
</template>

<script>
export default {
  name: "SubscriptionTabBar",
  emits: ["switch", "create"],
  props: {
    tabs: { type: Array, default: () => [] },
    activeView: { type: String, default: "home" },
  },
  data() {
    return {
      left: 0,
      ready: false,
      crossing: false,
      moving: false,
      adding: false,
      motionTimer: null,
      addTimer: null,
      resizeHandler: null,
    };
  },
  computed: {
    navigationTabs() {
      return this.tabs.filter((tab) => tab.key !== "stats");
    },
  },
  watch: {
    activeView(next, previous) {
      this.crossing = this.position(next) < 2 !== this.position(previous) < 2;
      this.moving = false;
      this.$nextTick(() => {
        this.measure();
        this.moving = true;
        clearTimeout(this.motionTimer);
        this.motionTimer = setTimeout(() => {
          this.moving = false;
        }, 480);
      });
    },
  },
  mounted() {
    this.$nextTick(() => this.measure());
    this.resizeHandler = () => this.measure();
    uni.onWindowResize?.(this.resizeHandler);
  },
  beforeUnmount() {
    clearTimeout(this.motionTimer);
    clearTimeout(this.addTimer);
    if (this.resizeHandler) uni.offWindowResize?.(this.resizeHandler);
  },
  methods: {
    position(key) {
      return this.navigationTabs.findIndex((tab) => tab.key === key);
    },
    measure() {
      const query = uni.createSelectorQuery().in(this);
      query.select(".renewal-dock").boundingClientRect();
      query.selectAll(".dock-tab").boundingClientRect();
      query.exec((result) => {
        const dock = result?.[0],
          tab = result?.[1]?.[this.position(this.activeView)];
        if (!dock || !tab) return;
        this.left =
          tab.left - dock.left + (tab.width - (58 * dock.width) / 366) / 2;
        this.$nextTick(() => {
          this.ready = true;
        });
      });
    },
    create() {
      this.adding = true;
      clearTimeout(this.addTimer);
      this.addTimer = setTimeout(() => {
        this.adding = false;
      }, 520);
      this.$emit("create");
    },
  },
};
</script>
