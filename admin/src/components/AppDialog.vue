<script setup lang="ts">
import { watch } from 'vue';
import { X } from '@lucide/vue';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from './ui/sheet';

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
  <Sheet v-if="drawer" :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="left"
      class="app-sheet"
      :show-close-button="false"
      @close-auto-focus="restoreFocus"
    >
      <SheetHeader class="dialog-heading p-0">
        <div>
          <SheetTitle class="dialog-title">{{ title }}</SheetTitle
          ><SheetDescription class="muted">{{ description }}</SheetDescription>
        </div>
        <SheetClose as-child
          ><Button variant="ghost" size="icon" aria-label="关闭窗口"
            ><X :size="18" /></Button
        ></SheetClose>
      </SheetHeader>
      <slot />
    </SheetContent>
  </Sheet>
  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="dialog-content"
      :show-close-button="false"
      @close-auto-focus="restoreFocus"
    >
      <DialogHeader class="dialog-heading">
        <div>
          <DialogTitle class="dialog-title">{{ title }}</DialogTitle
          ><DialogDescription class="muted">{{
            description
          }}</DialogDescription>
        </div>
        <DialogClose as-child
          ><Button variant="ghost" size="icon" aria-label="关闭窗口"
            ><X :size="18" /></Button
        ></DialogClose>
      </DialogHeader>
      <slot />
    </DialogContent>
  </Dialog>
</template>
