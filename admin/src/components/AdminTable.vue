<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import {
  sections,
  format,
  tone,
  displayId,
  type Section,
  type Row,
} from '../lib/data';
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

defineProps<{
  section: Section;
  items?: Row[];
  loading: boolean;
  error?: string;
  search?: string;
}>();
defineEmits<{
  detail: [row: Row];
  user: [id: string];
  subscriptions: [id: string];
  retry: [];
  clear: [];
}>();
</script>
<template>
  <Table
    data-admin-table
    tabindex="0"
    :aria-label="`${sections[section].label}，可横向滚动`"
    :aria-busy="loading"
  >
    <TableCaption class="sr-only">
      {{ sections[section].label }}，每页 20 条
    </TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead
          v-for="column in sections[section].columns"
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
        <TableCell :colspan="sections[section].columns.length + 1">
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
          v-for="column in sections[section].columns"
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
          <div
            v-else-if="section === 'users' && column.key === 'id'"
            class="account-cell"
            :title="String(row.id)"
          >
            <span class="account-avatar" aria-hidden="true">{{
              String(row.id).replace(/^wx_/, '').slice(0, 2).toUpperCase()
            }}</span>
            <span class="account-id">{{ displayId(row.id) }}</span>
          </div>
          <a
            v-else-if="
              section === 'users' &&
              column.key === 'subscriptions' &&
              Number(row.subscriptions) > 0
            "
            :href="`?view=subscriptions&userId=${encodeURIComponent(String(row.id))}`"
            class="subscription-link"
            :aria-label="`查看${String(row.id)}的订阅`"
            @click.prevent="$emit('subscriptions', String(row.id))"
            >{{ row.subscriptions }} <span>条订阅</span
            ><ArrowUpRight :size="12"
          /></a>
          <a
            v-else-if="column.key === 'userId'"
            :href="`?view=users&search=${encodeURIComponent(String(row.userId))}`"
            class="id-link"
            :title="String(row.userId)"
            :aria-label="String(row.userId)"
            @click.prevent="$emit('user', String(row.userId))"
            >{{ displayId(row.userId) }}</a
          >
          <Badge
            v-else-if="
              [
                'issue',
                'action',
                'status',
                'plan',
                'notificationEnabled',
                'isTest',
              ].includes(column.key)
            "
            :tone="
              column.key === 'isTest'
                ? row.isTest
                  ? 'warning'
                  : 'neutral'
                : tone(row[column.key])
            "
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
                'clientIp',
                'peerIp',
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
