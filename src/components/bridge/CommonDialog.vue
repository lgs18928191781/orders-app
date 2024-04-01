<template>
  <TransitionRoot
    :show="isOpen"
    as="template"
    enter="duration-300 ease"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="duration-200 ease-in"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >
    <Dialog class="relative z-30" as="div" @close="() => {}">
      <!-- Modal背景 -->
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
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
          @click="closeModal"
        />
      </TransitionChild>
      <!-- Modal內容 -->
      <div class="fixed inset-0 overflow-y-auto text-zinc-300">
        <div class="mt-32 flex justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-500 transform"
            enter-from="opacity-0 -translate-y-40 sm:scale-95"
            enter-to="opacity-100 -translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 sm:scale-100"
            leave-to="opacity-0 sm:scale-95"
          >
            <DialogPanel
              class="relative w-[515px] transform overflow-hidden rounded-xl bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-[0_0px_10px_rgba(255,255,255,0.3)] transition-all sm:p-7"
            >
              <DialogTitle
                as="h3"
                class="flex items-center justify-between text-2xl font-semibold leading-6 text-gray-300 text-zinc-100"
              >
                <slot name="title"></slot>
                <div
                  class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-neutral-500"
                  @click="closeModal"
                >
                  <X :size="20" class="text-zinc-800"></X>
                </div>
              </DialogTitle>
              <div>
                <slot name="content"></slot>
              </div>
              <div>
                <slot name="btns"></slot>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'

const { isOpen } = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['handleCommonVisible'])
function closeModal() {
  emit('handleCommonVisible', false)
}
</script>
