<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { ref } from 'vue'

import UnisatIcon from '@/assets/unisat-icon.png?url'
import OkxIcon from '@/assets/okx-icon.png?url'
import MetaletIcon from '@/assets/metalet-icon.png?url'
import { useConnectionStore } from '@/stores/connection'
import { IS_DEV } from '@/data/constants'
import { useConnectionModal } from '@/hooks/use-connection-modal'

const { isConnectionModalOpen, closeConnectionModal, setMissingWallet } =
  useConnectionModal()

const firstButtonRef = ref<HTMLElement | null>(null)

const connectionStore = useConnectionStore()
async function connectToUnisat() {
  if (!window.unisat) {
    setMissingWallet('unisat')
    return
  }

  const connection = await connectionStore.connect('unisat')
  if (connection.status === 'connected') {
    closeConnectionModal()
  }
}

async function connectToOkx() {
  if (!window.okxwallet) {
    setMissingWallet('okx')
    return
  }

  const connection = await connectionStore.connect('okx')
  if (connection.status === 'connected') {
    closeConnectionModal()
  }
}
</script>

<template>
  <TransitionRoot as="template" :show="isConnectionModalOpen">
    <Dialog
      as="div"
      class="relative z-10"
      @close="closeConnectionModal"
      :initial-focus="firstButtonRef"
    >
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

      <div class="fixed inset-0 z-10 overflow-y-auto">
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
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:px-8 sm:py-6 z-50"
            >
              <div class="text-left my-4">
                <DialogTitle
                  class="text-xl font-semibold leading-6 text-zinc-100"
                >
                  Connect Wallet
                </DialogTitle>

                <!-- wallet buttons -->
                <div class="grid grid-cols-3 gap-4 mt-8 text-base">
                  <button
                    class="flex flex-col gap-2 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 font-medium transition w-36 py-4 border border-zinc-500/50 hover:shadow-md hover:shadow-orange-300/30 hover:border-orange-300/30 hover:bg-orange-300 hover:text-orange-950"
                    ref="firstButtonRef"
                    @click="connectToOkx"
                  >
                    <img class="h-12 rounded" :src="OkxIcon" alt="Metamask" />
                    <span class="">OKX</span>
                  </button>

                  <button
                    class="flex flex-col gap-2 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 font-medium transition w-36 py-4 border border-zinc-500/50 hover:shadow-md hover:shadow-orange-300/30 hover:border-orange-300/30 hover:bg-orange-300 hover:text-orange-950"
                    @click="connectToUnisat"
                  >
                    <img
                      class="h-12 rounded"
                      :src="UnisatIcon"
                      alt="Metamask"
                    />
                    <span class="">Unisat</span>
                  </button>

                  <div class="relative">
                    <button
                      class="flex flex-col gap-2 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 font-medium transition w-36 py-4 border border-zinc-500/50 enabled:hover:shadow-md enabled:hover:shadow-orange-300/30 enabled:hover:border-orange-300/30 enabled:hover:bg-orange-300 enabled:hover:text-orange-950 disabled:opacity-30"
                      @click="closeConnectionModal"
                      :disabled="!IS_DEV"
                    >
                      <img
                        class="h-12 rounded"
                        :src="MetaletIcon"
                        alt="Metamask"
                      />
                      <span class="">Metalet</span>
                    </button>
                    <span
                      class="absolute top-0 right-0 text-xs text-red-400 bg-red-400/30 rounded-md font-medium px-1.5 py-0.5 translate-x-4 -translate-y-2 rotate-3"
                    >
                      Coming Soon!
                    </span>
                  </div>
                </div>

                <!-- footer -->
                <div class="mt-16 text-xs text-zinc-500 space-y-1">
                  <p>By connecting wallet,</p>
                  <p>you agree to Orders.Exchange's Terms of Service.</p>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
