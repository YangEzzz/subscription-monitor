<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  getJson,
  adminPost,
  defaultAddress,
  AdminUnauthorizedError,
} from '../lib/data';
const emit = defineEmits<{ unauthorized: [] }>();
type Policy = { membershipEnabled: boolean; freeSubscriptionLimit: number };
const policy = ref<Policy>();
const busy = ref(false),
  error = ref(''),
  success = ref('');
const controller = new AbortController();
function failure(e: unknown) {
  if (controller.signal.aborted) return;
  if (e instanceof AdminUnauthorizedError) emit('unauthorized');
  else error.value = e instanceof Error ? e.message : '配置读取失败，请重试';
}
async function load() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    policy.value = await getJson<Policy>(
      defaultAddress(),
      'runtime-policy',
      controller.signal,
    );
  } catch (e) {
    failure(e);
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!policy.value || busy.value) return;
  const limit = Number(policy.value.freeSubscriptionLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
    error.value = '请填写 1–100000 的整数订阅上限';
    document.getElementById('free-limit')?.focus();
    return;
  }
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    policy.value = await adminPost<Policy>(
      defaultAddress(),
      'runtime-policy',
      { ...policy.value, freeSubscriptionLimit: limit },
      controller.signal,
    );
    success.value = '已保存，用户下次请求即按新配置生效。';
  } catch (e) {
    failure(e);
  } finally {
    busy.value = false;
  }
}
onMounted(load);
onBeforeUnmount(() => controller.abort());
</script>
<template>
  <section
    class="policy-panel"
    aria-labelledby="policy-title"
    :aria-busy="busy"
  >
    <h2 id="policy-title" class="overview-section-title">会员与订阅额度</h2>
    <p>关闭会员后隐藏会员入口，所有账号使用下方上限；开启后恢复会员权益。</p>
    <form v-if="policy" novalidate @submit.prevent="save">
      <label class="policy-toggle"
        ><input
          v-model="policy.membershipEnabled"
          type="checkbox"
          :disabled="busy"
        />开放会员功能</label
      >
      <label for="free-limit">免费用户订阅数量上限</label>
      <Input
        id="free-limit"
        v-model="policy.freeSubscriptionLimit"
        type="number"
        min="1"
        max="100000"
        step="1"
        required
        :disabled="busy"
        aria-describedby="policy-help policy-error"
        :aria-invalid="!!error"
      />
      <p id="policy-help">
        会员关闭时适用于所有用户。降低上限会保留已有订阅，仅限制新增及恢复。
      </p>
      <Button type="submit" :disabled="busy">{{
        busy ? '处理中…' : '保存配置'
      }}</Button>
    </form>
    <p v-if="error" id="policy-error" role="alert">{{ error }}</p>
    <p v-if="success" role="status">{{ success }}</p>
    <Button
      v-if="!policy || error"
      variant="outline"
      :disabled="busy"
      @click="load"
      >{{ busy ? '读取中…' : '重新读取配置' }}</Button
    >
  </section>
</template>
<style scoped>
.policy-panel {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
  margin-bottom: 24px;
}
.policy-panel form {
  display: grid;
  gap: 12px;
  max-width: 480px;
  margin-top: 16px;
}
.policy-panel p {
  color: var(--muted-foreground);
  font-size: 14px;
  line-height: 1.6;
}
.policy-toggle {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 44px;
}
.policy-toggle input {
  width: 18px;
  height: 18px;
}
</style>
