<script setup lang="ts">
import { Badge } from './ui/badge';

withDefaults(
  defineProps<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' }>(),
  { tone: 'neutral' },
);
</script>
<template>
  <Badge variant="outline" class="badge" :class="`badge-${tone}`"
    ><slot
  /></Badge>
</template>
