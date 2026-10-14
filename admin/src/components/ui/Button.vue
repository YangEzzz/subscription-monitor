<script setup lang="ts">
import { cva } from 'class-variance-authority';
import type { HTMLAttributes } from 'vue';
import { cn } from '../../lib/utils';
const emit = defineEmits<{ click: [event: MouseEvent] }>();

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'icon';
    class?: HTMLAttributes['class'];
    type?: 'button' | 'submit' | 'reset';
  }>(),
  { variant: 'default', size: 'default', type: 'button' },
);
const variants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
        outline:
          'border border-input bg-card text-foreground hover:bg-accent active:bg-muted',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-foreground active:bg-muted',
      },
      size: { default: 'h-10 px-4', sm: 'h-9 px-3', icon: 'size-10' },
    },
  },
);
</script>

<template>
  <button
    :type="props.type"
    :class="cn(variants({ variant, size }), props.class)"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
