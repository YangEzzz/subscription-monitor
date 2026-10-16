<script setup lang="ts">
import { Inbox, SearchX, CircleAlert, LoaderCircle } from '@lucide/vue';
import { Button } from './ui/button';
defineProps<{ loading?: boolean; error?: string; search?: string }>();
defineEmits<{ retry: []; clear: [] }>();
</script>
<template>
  <div class="async-state" :role="error ? 'alert' : 'status'">
    <component
      :is="
        loading ? LoaderCircle : error ? CircleAlert : search ? SearchX : Inbox
      "
      :size="30"
      :class="{ spinning: loading }"
      aria-hidden="true"
    />
    <strong>{{
      loading
        ? '正在读取数据'
        : error
          ? '暂时无法读取数据'
          : search
            ? '没有匹配的记录'
            : '暂无记录'
    }}</strong>
    <p>
      {{
        loading
          ? '请稍候，正在连接后台。'
          : error ||
            (search
              ? '试试其他关键词，或清除搜索条件。'
              : '记录产生后会在这里显示。')
      }}
    </p>
    <Button v-if="error" variant="outline" @click="$emit('retry')"
      >重新读取</Button
    >
    <Button
      v-else-if="search && !loading"
      variant="outline"
      @click="$emit('clear')"
      >清除搜索</Button
    >
  </div>
</template>
