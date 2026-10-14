<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui';
import { X } from '@lucide/vue';
import { watch } from 'vue';
const props = defineProps<{
  open: boolean;
  title: string;
  description: string;
  drawer?: boolean;
}>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
let opener: HTMLElement | undefined;
watch(
  () => props.open,
  (value) => {
    if (value)
      opener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : undefined;
  },
  { flush: 'sync' },
);
function restoreFocus(event: Event) {
  event.preventDefault();
  if (opener?.isConnected) opener.focus();
}
</script>
<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent
        class="dialog-content"
        :class="{ 'nav-drawer': drawer }"
        @close-auto-focus="restoreFocus"
      >
        <div class="dialog-heading">
          <div>
            <DialogTitle class="dialog-title">{{ title }}</DialogTitle
            ><DialogDescription class="muted">{{
              description
            }}</DialogDescription>
          </div>
          <DialogClose class="icon-button" aria-label="关闭窗口"
            ><X :size="18"
          /></DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
