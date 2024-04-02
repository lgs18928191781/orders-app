<template>
    <TransitionRoot :show="isOpen" as="template" enter="duration-300 ease" enter-from="opacity-0" enter-to="opacity-100"
        leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <Dialog class="relative z-30" as="div" @close="closeModal">

            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
                leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" @click="closeModal" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto text-zinc-300">
                <div class="flex mt-32 justify-center p-4 text-center">
                    <TransitionChild as="template" enter="ease-out duration-500 transform"
                        enter-from="opacity-0 -translate-y-40 sm:scale-95"
                        enter-to="opacity-100 -translate-y-0 sm:scale-100" leave="ease-in duration-200"
                        leave-from="opacity-100 sm:scale-100" leave-to="opacity-0 sm:scale-95">
                        <DialogPanel
                            class="relative transform overflow-hidden rounded-xl bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-[0_0px_10px_rgba(255,255,255,0.3)] transition-all w-[460px] sm:p-7">

                            <div class="flex flex-col items-center justify-center">
                                <div
                                    class="mt-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#ffa02a] p-7">
                                    <img :src="shape" alt="" />
                                </div>
                                <div class="mt-5 text-2xl text-[#ffa02a]">
                                    <span>Success</span>
                                </div>
                            </div>
                            <div class="item-center mb-7 mt-16 flex justify-center">
                                <button @click="closeModal" :class="[
        'text-base',
        'w-5/6',
        'rounded-xl',
        'py-3',
        'flex',
        'item-center',
        'justify-center',
        'font-bold',
        'bg-primary'
    ]">
                                    <!-- <Loader2Icon  class="mr-1.5 h-5 animate-spin" /> -->
                                    <span class="text-[#181614]">OK</span>
                                </button>


                            </div>

                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>
<script setup lang="ts">
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
} from '@headlessui/vue'
import shape from '@/assets/shape.svg?url'
const { isOpen } = defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
})
const emit = defineEmits(["handleSuccessVisible"]);
function closeModal() {
    emit("handleSuccessVisible", false);
}
</script>