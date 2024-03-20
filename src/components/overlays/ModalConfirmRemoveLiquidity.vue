<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogDescription,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { HelpCircleIcon } from 'lucide-vue-next'

import { useModalConfirmRemoveLiquidity } from '@/hooks/use-modal-confirm-remove-liquidity'

const { isOpen, closeModal } = useModalConfirmRemoveLiquidity()

const emit = defineEmits(['confirm'])

const onConfirm = () => {
  emit('confirm')
  closeModal()
}
</script>

<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog @close="closeModal" class="relative z-[110]" as="div">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all"
        ></div>
      </TransitionChild>

      <div class="fixed inset-0 z-[110] overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="rounded-lg bg-zinc-800 p-8">
              <HelpCircleIcon class="mx-auto h-16 w-16 text-primary" />
              <DialogDescription class="mt-4 text-lg text-zinc-300">
                Are you sure to remove liquidity?
              </DialogDescription>

              <div class="mt-4 flex justify-center gap-4">
                <button @click="closeModal" class="btn">Cancel</button>
                <button @click="onConfirm" class="btn">OK</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.btn {
  @apply w-24 rounded-md bg-zinc-700 py-2 text-zinc-300 hover:bg-zinc-600;
}
</style>
