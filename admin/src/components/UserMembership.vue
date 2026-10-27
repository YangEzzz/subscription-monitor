<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  adminPost,
  getJson,
  defaultAddress,
  AdminUnauthorizedError,
  format,
  type Row,
} from '../lib/data';

const props = defineProps<{ user: Row }>();
const emit = defineEmits<{ changed: []; unauthorized: [] }>();
type State = {
  membership: {
    status: string;
    plan: string;
    source?: string;
    startedAt?: string | null;
    sourceOrderId?: string | null;
  } | null;
  grant: { note: string; operator: string; createdAt: string } | null;
  revocation?: { note: string; operator: string; createdAt: string } | null;
  canGrant: boolean;
  canRevoke?: boolean;
};
const state = ref<State>(),
  note = ref(''),
  busy = ref(false),
  error = ref(''),
  editing = ref<'' | 'grant' | 'revoke'>(''),
  uncertain = ref(false),
  success = ref('');
const controller = new AbortController();
const path = `users/${encodeURIComponent(String(props.user.id))}/membership`;
const hasMembership = computed(
  () => state.value?.membership?.status === 'active',
);
let expectedMembership: State['membership'] = null;
function beginEdit(action: 'grant' | 'revoke') {
  editing.value = action;
  expectedMembership = state.value?.membership
    ? { ...state.value.membership }
    : null;
  note.value = '';
  error.value = '';
  success.value = '';
}
const active = computed(
  () =>
    state.value?.membership?.status === 'active' &&
    state.value.membership.plan === 'member' &&
    state.value.membership.source !== 'simulation',
);
function failure(e: unknown) {
  if (controller.signal.aborted) return;
  if (e instanceof AdminUnauthorizedError) emit('unauthorized');
  else error.value = e instanceof Error ? e.message : '会员状态读取失败';
}
async function load() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const result = await getJson<State>(
      defaultAddress(),
      path,
      controller.signal,
    );
    if (controller.signal.aborted) return;
    state.value = result;
    uncertain.value = false;
    editing.value = '';
  } catch (e) {
    failure(e);
  } finally {
    busy.value = false;
  }
}
async function save() {
  const revoking = editing.value === 'revoke';
  if (
    !editing.value ||
    busy.value ||
    uncertain.value ||
    (revoking
      ? !hasMembership.value || !state.value?.canRevoke
      : active.value || !state.value?.canGrant)
  )
    return;
  if (note.value.trim().length < 2 || note.value.trim().length > 200) {
    error.value = `请填写 2–200 字的${revoking ? '取消' : '赠送'}原因。`;
    document.getElementById('membership-grant-note')?.focus();
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const result = await adminPost<State>(
      defaultAddress(),
      revoking ? `${path}/revoke` : path,
      { note: note.value.trim(), ...(revoking ? { expectedMembership } : {}) },
      controller.signal,
    );
    if (controller.signal.aborted) return;
    state.value = result;
    editing.value = '';
    success.value = revoking
      ? '会员资格已取消，已恢复免费版；已有订阅保留。'
      : '会员已开通，用户刷新会员状态后即可使用。';
    emit('changed');
  } catch (e) {
    uncertain.value = true;
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
    class="user-membership"
    aria-labelledby="user-membership-label"
    :aria-busy="busy"
  >
    <h3 id="user-membership-label">会员管理</h3>
    <p v-if="state">
      {{
        active
          ? '已开通永久会员'
          : state.membership?.source === 'simulation'
            ? '当前为模拟权益，可赠送正式永久会员。'
            : '当前为免费用户'
      }}
    </p>
    <p v-if="state?.membership?.source === 'admin' && state.grant">
      后台赠送 · {{ state.grant.operator }} ·
      {{ format('createdAt', state.grant.createdAt) }}<br />原因：{{
        state.grant.note
      }}
    </p>
    <p v-if="state?.membership?.source === 'admin_revoked' && state.revocation">
      后台取消资格 · {{ state.revocation.operator }} ·
      {{ format('createdAt', state.revocation.createdAt) }}<br />原因：{{
        state.revocation.note
      }}
    </p>
    <p v-if="state && !state.canGrant && !state.canRevoke">
      当前环境未开放会员管理。
    </p>
    <p v-if="success" role="status">{{ success }}</p>
    <p v-if="error" id="membership-grant-error" role="alert">{{ error }}</p>
    <p v-if="uncertain">提交结果尚未确认，请先刷新会员状态核对结果。</p>
    <Button
      v-if="!state || error || uncertain"
      variant="outline"
      :disabled="busy"
      @click="load"
      >{{ busy ? '读取中…' : '刷新会员状态' }}</Button
    >
    <form v-if="editing" novalidate @submit.prevent="save">
      <p v-if="editing === 'revoke'">
        将取消用户
        {{ user.id }} 的会员资格并恢复免费版。已有订阅及历史记录保留，超过免费版
        10 条额度时无法新增；取消资格不会自动退款，付费订单退款请另行办理。
      </p>
      <p v-else>
        将为用户 {{ user.id }} 免费开通永久会员，订阅数量不限，不产生支付订单。
      </p>
      <label for="membership-grant-note">{{
        editing === 'revoke' ? '取消原因' : '赠送原因'
      }}</label>
      <Input
        id="membership-grant-note"
        v-model="note"
        :disabled="busy"
        maxlength="200"
        :placeholder="
          editing === 'revoke'
            ? '请填写取消会员资格的原因'
            : '例如：活动奖励、客服补偿'
        "
        :aria-invalid="!!error"
        :aria-describedby="error ? 'membership-grant-error' : undefined"
      />
      <div class="membership-actions">
        <Button
          type="button"
          variant="outline"
          :disabled="busy"
          @click="editing = ''"
          >取消</Button
        >
        <Button
          type="submit"
          :variant="editing === 'revoke' ? 'destructive' : 'default'"
          :disabled="busy || uncertain"
          >{{
            busy
              ? '处理中…'
              : editing === 'revoke'
                ? '确认取消会员资格'
                : '确认赠送永久会员'
          }}</Button
        >
      </div>
    </form>
    <Button
      v-if="!editing && state?.canGrant && !active"
      variant="outline"
      :disabled="busy || uncertain"
      @click="beginEdit('grant')"
      >赠送永久会员</Button
    >
    <Button
      v-if="!editing && state?.canRevoke && hasMembership"
      variant="outline"
      :disabled="busy || uncertain"
      @click="beginEdit('revoke')"
      >取消会员资格</Button
    >
  </section>
</template>

<style scoped>
.user-membership {
  border-top: 1px solid var(--border);
  padding-top: 20px;
  margin-top: 20px;
  font-size: 13px;
  line-height: 1.7;
  display: grid;
  gap: 12px;
}
.user-membership h3 {
  font-weight: 600;
}
.user-membership p {
  color: var(--muted-foreground);
  overflow-wrap: anywhere;
}
.user-membership form {
  display: grid;
  gap: 12px;
}
.membership-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.user-membership > button {
  justify-self: start;
}
</style>
