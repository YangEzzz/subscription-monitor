<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  adminPost,
  getJson,
  defaultAddress,
  AdminUnauthorizedError,
  type Row,
} from '../lib/data';
const props = defineProps<{ user: Row }>();
const emit = defineEmits<{ changed: []; unauthorized: [] }>();
type Flag = {
  isTest: boolean;
  testNote: string | null;
  testUpdatedBy: string | null;
  testUpdatedAt: string | null;
  canEdit?: boolean;
};
const flag = ref<Flag>(),
  note = ref(''),
  busy = ref(false),
  error = ref(''),
  editing = ref(false);
const controller = new AbortController(),
  path = `users/${encodeURIComponent(String(props.user.id))}/test-flag`;
function failure(e: unknown) {
  if (controller.signal.aborted) return;
  if (e instanceof AdminUnauthorizedError) emit('unauthorized');
  else error.value = e instanceof Error ? e.message : '标记读取失败';
}
async function load() {
  busy.value = true;
  error.value = '';
  try {
    flag.value = await getJson<Flag>(defaultAddress(), path, controller.signal);
  } catch (e) {
    failure(e);
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!flag.value || busy.value) return;
  if (note.value.trim().length < 2) {
    error.value = '请填写至少 2 个字的标记原因。';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    flag.value = {
      ...(await adminPost<Flag>(
        defaultAddress(),
        path,
        { isTest: !flag.value.isTest, note: note.value.trim() },
        controller.signal,
      )),
      canEdit: true,
    };
    editing.value = false;
    emit('changed');
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
    class="user-test-flag"
    aria-labelledby="test-account-label"
    :aria-busy="busy"
  >
    <h3 id="test-account-label">账号类型</h3>
    <p v-if="flag">
      {{
        flag.isTest
          ? '测试账号，默认不计入运营统计。'
          : '普通账号，计入运营统计。'
      }}
    </p>
    <p v-if="flag?.testNote">
      上次标记：{{ flag.testNote }} · {{ flag.testUpdatedBy }}
    </p>
    <p v-if="flag && !flag.canEdit">
      当前环境未开放账号分类修改。
    </p>
    <p v-if="error" role="alert">
      {{ error }}
      <Button variant="outline" size="sm" :disabled="busy" @click="load"
        >重新读取</Button
      >
    </p>
    <p v-if="!flag && busy" role="status">正在读取账号标记…</p>
    <form v-if="editing && flag?.canEdit" novalidate @submit.prevent="save">
      <label for="test-account-note"
        >{{ flag.isTest ? '恢复普通账号' : '标记为测试账号' }}的原因</label
      ><Input
        id="test-account-note"
        v-model="note"
        :maxlength="200"
        placeholder="说明账号用途，便于之后核查"
      />
      <div>
        <Button
          type="button"
          variant="outline"
          :disabled="busy"
          @click="editing = false"
          >取消</Button
        ><Button type="submit" :disabled="busy"
          >确认{{ flag.isTest ? '恢复普通账号' : '标记测试账号' }}</Button
        >
      </div>
    </form>
    <Button
      v-else-if="flag?.canEdit"
      variant="outline"
      :disabled="busy"
      @click="
        editing = true;
        note = '';
      "
      >{{ flag.isTest ? '恢复为普通账号' : '标记为测试账号' }}</Button
    >
  </section>
</template>
<style scoped>
.user-test-flag {
  border-top: 1px solid var(--border);
  padding-top: 20px;
  margin-top: 20px;
  font-size: 13px;
  line-height: 1.7;
  display: grid;
  gap: 12px;
}
.user-test-flag h3 {
  font-weight: 600;
}
.user-test-flag p {
  color: var(--muted-foreground);
  overflow-wrap: anywhere;
}
.user-test-flag form {
  display: grid;
  gap: 12px;
}
.user-test-flag form > div {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.user-test-flag > button {
  justify-self: start;
}
</style>
