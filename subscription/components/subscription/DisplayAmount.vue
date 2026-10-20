<template>
  <view
    class="display-amount num"
    :class="{ 'display-amount-compact': !parts }"
    :aria-label="value"
  >
    <view :key="value" class="display-amount-value motion">
      <template v-if="parts"
        ><text class="display-currency">{{ parts[1] }}</text
        ><text class="display-integer">{{ parts[2] }}</text
        ><text class="display-decimal">{{ parts[3] }}</text></template
      >
      <text v-else>{{ value }}</text>
    </view>
  </view>
</template>
<script>
export default {
  name: "DisplayAmount",
  props: { value: { type: String, required: true } },
  computed: {
    parts() {
      return this.value.match(/^([^\d]*)(\d+)(\.\d+)?$/);
    },
  },
};
</script>
