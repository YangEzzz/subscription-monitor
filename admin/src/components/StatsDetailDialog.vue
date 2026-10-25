<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import AppDialog from './AppDialog.vue';
import AsyncState from './AsyncState.vue';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './ui/table';
import {
  getJson,
  defaultAddress,
  AdminUnauthorizedError,
  format,
  type Row,
} from '../lib/data';
import { statsDetailTitle, type StatsSelection } from '../lib/stats';
const props = defineProps<{ open: boolean; selection?: StatsSelection }>();
const emit = defineEmits<{ 'update:open': [boolean]; unauthorized: [] }>();
type Detail = {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
  columns: { key: string; label: string }[];
  totalAmountCny?: number;
};
const data = ref<Detail>(),
  busy = ref(false),
  error = ref(''),
  page = ref(1),
  search = ref(''),
  draft = ref('');
let controller: AbortController | undefined,
  generation = 0;
const maxPage = computed(() =>
  Math.max(1, Math.ceil((data.value?.total || 0) / 20)),
);
const title = computed(() =>
  props.selection
    ? statsDetailTitle(props.selection.metric) + '明细'
    : '统计明细',
);
async function load() {
  controller?.abort();
  if (!props.open || !props.selection) return;
  controller = new AbortController();
  const id = ++generation;
  data.value = undefined;
  busy.value = true;
  error.value = '';
  try {
    const q = new URLSearchParams(
      Object.entries({
        ...props.selection,
        page: page.value,
        search: search.value,
      }).map(([key, value]) => [key, String(value)]),
    );
    const result = await getJson<Detail>(
      defaultAddress(),
      `stats/details?${q}`,
      controller.signal,
    );
    if (id !== generation) return;
    if (
      !result ||
      !Array.isArray(result.items) ||
      !Array.isArray(result.columns) ||
      !Number.isInteger(result.total) ||
      result.pageSize !== 20
    )
      throw Error('统计明细格式不正确，请重试。');
    if (page.value > Math.max(1, Math.ceil(result.total / 20))) {
      page.value = Math.max(1, Math.ceil(result.total / 20));
      return;
    }
    data.value = result;
  } catch (e) {
    if (id !== generation) return;
    if (e instanceof AdminUnauthorizedError) emit('unauthorized');
    else error.value = e instanceof Error ? e.message : '明细读取失败。';
  } finally {
    if (id === generation) busy.value = false;
  }
}
watch(
  () => [props.open, props.selection] as const,
  () => {
    controller?.abort();
    generation++;
    data.value = undefined;
    page.value = 1;
    search.value = '';
    draft.value = '';
    if (props.open) void load();
  },
);
watch([page, search], () => {
  if (props.open) void load();
});
onBeforeUnmount(() => {
  generation++;
  controller?.abort();
});
function submitSearch() {
  search.value = draft.value.trim().slice(0, 128);
  page.value = 1;
}
function display(key: string, value: unknown, row: Row) {
  if ((key === 'confirmedAt' || key === 'occurredAt') && !value)
    return '日期未知';
  if (key === 'isTest') return value ? '测试账号' : '普通账号';
  if (key === 'status') return format(key, value, row, 'membershipOrders');
  if (key === 'amount') return format(key, value, { currency: 'CNY' });
  return format(key, value, row);
}
</script>
<template>
  <AppDialog
    :open="open"
    :title="title"
    :description="
      selection
        ? `${selection.from} — ${selection.to} · 北京时间 · ${selection.excludeTest ? '排除测试账号' : '包含测试账号'}${selection.includeUndated ? ' · 包含日期未知的退款' : ''}`
        : '查看统计对应的记录'
    "
    @update:open="emit('update:open', $event)"
  >
    <form class="stats-detail-search" novalidate @submit.prevent="submitSearch">
      <label for="stats-detail-search" class="sr-only">搜索统计明细</label
      ><Input
        id="stats-detail-search"
        v-model="draft"
        placeholder="搜索账号、订单或名称"
        :maxlength="128"
      /><Button type="submit" variant="outline" :disabled="busy">搜索</Button
      ><Button
        v-if="search"
        type="button"
        variant="ghost"
        @click="
          draft = '';
          search = '';
          page = 1;
        "
        >清空</Button
      >
    </form>
    <p v-if="data" class="stats-detail-total">
      共 {{ data.total }} 条<span v-if="data.totalAmountCny !== undefined">
        · 合计
        {{ format('amount', data.totalAmountCny, { currency: 'CNY' }) }}</span
      >
    </p>
    <AsyncState
      v-if="!data || !data.items.length"
      :loading="busy"
      :error="error"
      :search="search"
      @retry="load"
      @clear="
        search = '';
        draft = '';
        page = 1;
      "
    />
    <Table v-else tabindex="0" :aria-label="title + '，可横向滚动'"
      ><TableHeader
        ><TableRow
          ><TableHead v-for="c in data.columns" :key="c.key">{{
            c.label
          }}</TableHead></TableRow
        ></TableHeader
      ><TableBody
        ><TableRow v-for="(row, i) in data.items" :key="String(row.id || i)"
          ><TableCell
            v-for="c in data.columns"
            :key="c.key"
            :class="{
              'stats-detail-id': ['id', 'userId', 'orderId'].includes(c.key),
            }"
            >{{ display(c.key, row[c.key], row) }}</TableCell
          ></TableRow
        ></TableBody
      ></Table
    >
    <div class="stats-detail-footer">
      <span>第 {{ page }} / {{ maxPage }} 页</span
      ><Button variant="outline" :disabled="busy || page <= 1" @click="page--"
        >上一页</Button
      ><Button
        variant="outline"
        :disabled="busy || page >= maxPage"
        @click="page++"
        >下一页</Button
      ><Button variant="outline" @click="emit('update:open', false)"
        >关闭</Button
      >
    </div>
  </AppDialog>
</template>
<style scoped>
.stats-detail-search {
  display: flex;
  gap: 8px;
  margin: 18px 0;
}
.stats-detail-search input {
  min-width: 0;
}
.stats-detail-total {
  color: var(--muted-foreground);
  font-size: 12px;
  margin-bottom: 14px;
}
.stats-detail-id {
  max-width: 240px;
  overflow-wrap: anywhere;
  white-space: normal;
  font-family: monospace;
  font-size: 11px;
}
.stats-detail-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.stats-detail-footer > span {
  margin-right: auto;
  font-size: 12px;
  color: var(--muted-foreground);
}
</style>
