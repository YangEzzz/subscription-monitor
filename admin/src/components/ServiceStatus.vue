<script setup lang="ts">
import { Database, BellRing, Clock3 } from '@lucide/vue';
import type { Overview } from '../lib/data';
import Badge from './StatusBadge.vue';
defineProps<{ overview?: Overview }>();
</script>
<template>
  <ul class="service-status">
    <li>
      <span><Database :size="17" />数据存储</span
      ><Badge
        :tone="overview?.persistence === 'prisma' ? 'success' : 'neutral'"
        >{{
          !overview
            ? '尚未读取'
            : overview.persistence === 'prisma'
              ? 'PostgreSQL'
              : '内存存储'
        }}</Badge
      >
    </li>
    <li>
      <span><BellRing :size="17" />微信通知</span
      ><Badge
        :tone="overview?.notificationsConfigured ? 'success' : 'warning'"
        >{{
          !overview
            ? '尚未读取'
            : overview.notificationsConfigured
              ? '已配置'
              : '未配置'
        }}</Badge
      >
    </li>
    <li>
      <span><Clock3 :size="17" />定时任务</span
      ><Badge :tone="overview?.schedulerEnabled ? 'success' : 'neutral'">{{
        !overview ? '尚未读取' : overview.schedulerEnabled ? '已开启' : '已关闭'
      }}</Badge>
    </li>
  </ul>
</template>
