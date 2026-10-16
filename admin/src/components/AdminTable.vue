<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import { computed } from 'vue';
import { sections, format, tone, type Section, type Row } from '../lib/data';
import Badge from './StatusBadge.vue';
import { Button } from './ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './ui/table';
import AsyncState from './AsyncState.vue';

const props = defineProps<{
  section: Section;
  items?: Row[];
  loading: boolean;
  error?: string;
  search?: string;
  compact?: boolean;
}>();
defineEmits<{ detail: [row: Row]; user: [id: string]; retry: []; clear: [] }>();
const columns = computed(() =>
  props.compact
    ? sections[props.section].columns.filter((column) =>
        ['name', 'amount', 'nextBillingDate', 'status'].includes(column.key),
      )
    : sections[props.section].columns,
);
</script>
<template>
  <Table
    data-admin-table
    tabindex="0"
    :aria-label="`${sections[section].label}，可横向滚动`"
    :aria-busy="loading"
  >
    <TableCaption class="sr-only">
      {{ sections[section].label
      }}{{ compact ? '，列表前 5 条' : '，每页 20 条' }}
    </TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead
          v-for="column in columns"
          :key="column.key"
          scope="col"
          :class="{ 'align-right': column.key === 'amount' }"
        >
          {{ column.label }}
        </TableHead>
        <TableHead scope="col" class="align-right">详情</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-if="!items?.length">
        <TableCell :colspan="columns.length + 1">
          <AsyncState
            :loading="loading"
            :error="error"
            :search="search"
            @retry="$emit('retry')"
            @clear="$emit('clear')"
          />
        </TableCell>
      </TableRow>
      <TableRow
        v-for="(row, index) in items"
        :key="String(row.id || row.userId || index)"
        :class="{ 'row-deleted': row.deletedAt }"
      >
        <TableCell
          v-for="column in columns"
          :key="column.key"
          :class="{
            'align-right numeric': column.key === 'amount',
            'id-cell': column.key === 'userId' || column.key === 'id',
          }"
        >
          <div
            v-if="
              column.key === 'name' ||
              column.key === 'productName' ||
              column.key === 'subscriptionName'
            "
            class="name-cell"
          >
            <span class="service-avatar" aria-hidden="true">{{
              String(row[column.key] || '订').slice(0, 1)
            }}</span
            ><span
              ><strong>{{
                format(column.key, row[column.key], row, section)
              }}</strong
              ><small v-if="row.deletedAt">已删除记录</small></span
            >
          </div>
          <a
            v-else-if="column.key === 'userId'"
            :href="`?view=users&search=${encodeURIComponent(String(row.userId))}`"
            class="id-link"
            @click.prevent="$emit('user', String(row.userId))"
            >{{ row.userId }}</a
          >
          <Badge
            v-else-if="
              ['status', 'plan', 'notificationEnabled'].includes(column.key)
            "
            :tone="tone(row[column.key])"
            >{{ format(column.key, row[column.key], row, section) }}</Badge
          >
          <span
            v-else
            :class="{
              numeric: [
                'nextBillingDate',
                'billingDate',
                'attempts',
                'subscriptions',
                'lastAccessIp',
                'lastAccessAt',
              ].includes(column.key),
              muted: column.key.endsWith('At'),
            }"
            >{{ format(column.key, row[column.key], row, section) }}</span
          >
        </TableCell>
        <TableCell class="align-right">
          <Button
            size="icon"
            variant="ghost"
            :aria-label="`查看${String(row.name || row.productName || row.subscriptionName || row.id || row.userId)}详情`"
            @click="$emit('detail', row)"
            ><ArrowUpRight
          /></Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
