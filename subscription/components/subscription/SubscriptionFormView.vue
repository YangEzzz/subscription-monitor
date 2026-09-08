<template>
  <view class="page form-page subscription-form-page">
    <view class="detail-titlebar"
      ><button
        role="button"
        tabindex="0"
        class="icon-button plain"
        aria-label="返回"
        @tap.stop="$emit('back')"
      >
        <uni-icons type="left" size="24" color="#202622" /></button
      ><text class="page-title">{{ editingId ? "编辑订阅" : "新增订阅" }}</text
      ><view class="icon-spacer"></view
    ></view>
    <view v-if="!editingId" class="template-section"
      ><view class="form-section-head"
        ><text>常用模板</text><text>快速填充</text></view
      ><scroll-view scroll-x :show-scrollbar="false" class="template-scroll"
        ><view class="template-row"
          ><button
            role="button"
            tabindex="0"
            v-for="item in serviceTemplates"
            :key="item.name"
            class="template-chip"
            @tap="$emit('apply-template', item)"
          >
            <view class="template-logo" :style="{ background: item.color }"
              ><uni-icons :type="item.icon" size="26" color="#ffffff" /></view
            ><text>{{ item.short }}</text>
          </button></view
        ></scroll-view
      ></view
    >
    <view class="form-section"
      ><text class="form-section-title">基本信息</text
      ><view class="form-card"
        ><label class="form-row"
          ><text class="form-label required">服务名称</text
          ><input
            v-model.trim="form.name"
            aria-label="服务名称，必填"
            aria-describedby="subscription-form-error"
            maxlength="30"
            class="form-input"
            placeholder="例如：腾讯视频 VIP"
            placeholder-class="placeholder" /></label
        ><label class="form-row"
          ><text class="form-label">套餐名称</text
          ><input
            v-model.trim="form.plan"
            maxlength="30"
            class="form-input"
            placeholder="选填"
            placeholder-class="placeholder" /></label
        ><picker
          :range="categories"
          @change="$emit('category-change', categories[$event.detail.value])"
          ><view class="form-row"
            ><text class="form-label required">分类</text
            ><view class="form-value"
              ><text>{{ form.category }}</text
              ><uni-icons
                type="right"
                size="16"
                color="#a2a7a3" /></view></view></picker
        ><view class="form-row brand-color-row"
          ><text class="form-label">品牌标识</text
          ><view class="color-options"
            ><button
              role="button"
              tabindex="0"
              v-for="color in logoColors"
              :key="color"
              :aria-label="`选择品牌色 ${color}`"
              :class="{ selected: form.color === color }"
              :style="{ background: color }"
              @tap="form.color = color"
            ></button></view></view></view
    ></view>
    <view class="form-section"
      ><text class="form-section-title">扣费信息</text
      ><view class="form-card"
        ><label class="form-row"
          ><view
            ><text class="form-label">金额</text
            ><text class="form-hint">可稍后补充</text></view
          ><view class="money-input"
            ><picker
              :range="currencies"
              :value="currencies.indexOf(form.currency)"
              @change="
                $emit('currency-change', currencies[$event.detail.value])
              "
              ><text class="currency-code">{{ form.currency }}</text></picker
            ><input
              v-model="form.amount"
              aria-label="订阅金额"
              type="digit"
              placeholder="选填"
              placeholder-class="placeholder" /></view></label
        ><picker
          :range="cycles"
          @change="$emit('change-cycle', cycles[$event.detail.value])"
          ><view class="form-row"
            ><text class="form-label required">计费周期</text
            ><view class="form-value"
              ><text>{{ cycleText(form) }}</text
              ><uni-icons
                type="right"
                size="16"
                color="#a2a7a3" /></view></view></picker
        ><view v-if="form.cycle === '自定义天数'" class="form-row"
          ><view
            ><text class="form-label required">周期天数</text
            ><text class="form-hint">1–365 个自然日</text></view
          ><view class="money-input"
            ><input
              v-model="form.cycleValue"
              aria-label="周期天数"
              type="number"
              placeholder="输入天数"
              placeholder-class="placeholder" /></view></view
        ><picker
          :range="payments"
          @change="$emit('payment-change', payments[$event.detail.value])"
          ><view class="form-row"
            ><text class="form-label">付款渠道</text
            ><view class="form-value"
              ><text>{{ form.payment }}</text
              ><uni-icons
                type="right"
                size="16"
                color="#a2a7a3" /></view></view></picker
        ><picker
          mode="date"
          :start="todayKey"
          :value="form.nextBillingDate"
          @change="$emit('billing-date-change', $event.detail.value)"
          ><view class="form-row"
            ><text class="form-label required"
              >下次{{ form.autoRenew ? "扣费" : "到期" }}日</text
            ><view class="form-value"
              ><text>{{ formatDate(form.nextBillingDate) }}</text
              ><uni-icons
                type="right"
                size="16"
                color="#a2a7a3" /></view></view></picker
        ><view class="form-row auto-renew-row"
          ><view
            ><text class="form-label">自动续费</text
            ><text class="form-hint">{{
              form.autoRenew ? "按预计扣费提醒" : "仅作为普通到期待办"
            }}</text></view
          ><switch
            :checked="form.autoRenew"
            color="#16834d"
            @change="$emit('auto-renew-change', $event.detail.value)" /></view
        ><view class="form-row auto-renew-row"
          ><view
            ><text class="form-label">试用期</text
            ><text class="form-hint">{{
              form.trial ? "试用期内显示试用中" : "非试用订阅"
            }}</text></view
          ><switch
            :checked="form.trial"
            color="#16834d"
            @change="$emit('set-trial', $event.detail.value)" /></view
        ><picker
          v-if="form.trial"
          mode="date"
          :start="todayKey"
          :value="form.trialEndDate"
          @change="$emit('trial-date-change', $event.detail.value)"
          ><view class="form-row"
            ><view
              ><text class="form-label required">试用截止日</text
              ><text class="form-hint">到期后按上方扣费日处理</text></view
            ><view class="form-value"
              ><text>{{
                form.trialEndDate ? formatDate(form.trialEndDate) : "请选择"
              }}</text
              ><uni-icons
                type="right"
                size="16"
                color="#a2a7a3" /></view></view></picker></view
    ></view>
    <view class="form-section reminder-form-section"
      ><view class="form-section-head"
        ><text class="form-section-title no-margin">提醒节点</text
        ><text>可多选</text></view
      ><view class="reminder-options"
        ><button
          role="button"
          tabindex="0"
          v-for="option in reminderOptions"
          :key="option.value"
          :class="{ selected: form.reminders.includes(option.value) }"
          @tap="$emit('toggle-reminder', option.value)"
        >
          <uni-icons
            v-if="form.reminders.includes(option.value)"
            type="checkmarkempty"
            size="12"
            color="#177e4b"
          />{{ option.label }}
        </button></view
      ><view class="form-preview"
        ><uni-icons type="notification" size="14" color="#3c9a68" /><text
          >预计最近提醒：{{ formReminderPreview }}</text
        ></view
      ></view
    >
    <view class="form-section supplement-form-section"
      ><text class="form-section-title">补充信息</text
      ><view class="form-card"
        ><label class="form-row textarea-row"
          ><text class="form-label">备注</text
          ><textarea
            class="resize-none"
            v-model.trim="form.note"
            aria-label="备注"
            maxlength="500"
            placeholder="记录使用人、账号尾号等非敏感信息"
            placeholder-class="placeholder"
          /></label
        ><label class="form-row textarea-row no-border"
          ><text class="form-label">取消路径</text
          ><textarea
            class="resize-none"
            v-model.trim="form.cancelGuide"
            aria-label="取消路径"
            maxlength="300"
            placeholder="例如：微信支付 > 自动续费管理"
            placeholder-class="placeholder"
          /></label></view
    ></view>
    <view
      v-if="formError"
      class="form-error"
      id="subscription-form-error"
      role="alert"
      ><uni-icons type="info-filled" size="18" color="#c5444c" /><text>{{
        formError
      }}</text></view
    >
    <button
      role="button"
      tabindex="0"
      class="primary-button save-button"
      @tap="$emit('save')"
    >
      <uni-icons type="checkmarkempty" size="20" color="#ffffff" />{{
        editingId ? "保存修改" : "保存订阅"
      }}
    </button>
  </view>
</template>

<script>
export default {
  name: "SubscriptionFormView",
  emits: [
    "back",
    "apply-template",
    "category-change",
    "currency-change",
    "change-cycle",
    "payment-change",
    "billing-date-change",
    "auto-renew-change",
    "set-trial",
    "trial-date-change",
    "toggle-reminder",
    "save",
  ],
  props: {
    editingId: { type: [String, Number], default: null },
    form: { type: Object, required: true },
    serviceTemplates: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
    currencies: { type: Array, default: () => [] },
    cycles: { type: Array, default: () => [] },
    payments: { type: Array, default: () => [] },
    logoColors: { type: Array, default: () => [] },
    reminderOptions: { type: Array, default: () => [] },
    formError: { type: String, default: "" },
    todayKey: { type: String, required: true },
    formReminderPreview: { type: String, default: "未设置提醒" },
    formatDate: { type: Function, required: true },
    cycleText: { type: Function, required: true },
  },
};
</script>
