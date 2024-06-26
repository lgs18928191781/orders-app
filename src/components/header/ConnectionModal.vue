<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import { isMobile, isOKApp, getOkxLink } from '@/lib/helpers'

import UnisatIcon from '@/assets/unisat-icon.png?url'
import OkxIcon from '@/assets/okx-icon.png?url'
import MetaletIcon from '@/assets/metalet-icon.png?url'

const { isConnectionModalOpen, closeConnectionModal, setMissingWallet } =
  useConnectionModal()

const firstButtonRef = ref<HTMLElement | null>(null)

const connectionStore = useConnectionStore()
const credentialsStore = useCredentialsStore()
async function connectToUnisat() {
  if (!window.unisat) {
    setMissingWallet('unisat')
    return
  }

  const connection = await connectionStore.connect('unisat')
  if (connection.status === 'connected') {
    await credentialsStore.login()
    closeConnectionModal()
  }
}

async function connectToOkx() {
  if (isMobile() && !isOKApp()) {
    const encodedUrl = getOkxLink()
    window.location.href = encodedUrl
  } else {
    if (!window.okxwallet) {
      setMissingWallet('okx')
      return
    }

    const connection = await connectionStore.connect('okx')
    if (connection.status === 'connected') {
      await credentialsStore.login()
      closeConnectionModal()
    }
  }
}

async function connectToMetalet() {
  if (!window.metaidwallet) {
    setMissingWallet('metalet')
    return
  }

  const connection = await connectionStore.connect('metalet').catch((err) => {
    ElMessage.warning({
      message: err.message,
      type: 'warning',
    })
  })
  if (connection?.status === 'connected') {
    await credentialsStore.login()
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
              class="relative z-50 transform overflow-hidden rounded-lg bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:px-8 sm:py-6"
            >
              <div class="my-4 text-left">
                <DialogTitle
                  class="text-xl font-semibold leading-6 text-zinc-100"
                >
                  Connect Wallet
                </DialogTitle>

                <!-- wallet buttons -->
                <div
                  class="mt-8 grid grid-cols-2 gap-4 text-base lg:grid-cols-3"
                >
                  <button
                    class="flex flex-col items-center justify-center gap-2 rounded-lg border border-zinc-500/50 bg-zinc-800 py-4 font-medium text-zinc-100 transition hover:border-primary/30 hover:bg-primary hover:text-orange-950 hover:shadow-md hover:shadow-primary/30 lg:w-36"
                    @click="connectToOkx"
                  >
                    <img class="h-12 rounded" :src="OkxIcon" alt="Metamask" />
                    <span class="">OKX</span>
                  </button>

                  <button
                    class="flex flex-col items-center justify-center gap-2 rounded-lg border border-zinc-500/50 bg-zinc-800 py-4 font-medium text-zinc-100 transition hover:border-primary/30 hover:bg-primary hover:text-orange-950 hover:shadow-md hover:shadow-primary/30 lg:w-36"
                    @click="connectToUnisat"
                    ref="firstButtonRef"
                    v-if="!isMobile()"
                  >
                    <img
                      class="h-12 rounded"
                      :src="UnisatIcon"
                      alt="Metamask"
                    />
                    <span class="">Unisat</span>
                  </button>

                  <button
                    class="flex flex-col items-center justify-center gap-2 rounded-lg border border-zinc-500/50 bg-zinc-800 py-4 font-medium text-zinc-100 transition enabled:hover:border-primary/30 enabled:hover:bg-primary enabled:hover:text-orange-950 enabled:hover:shadow-md enabled:hover:shadow-primary/30 disabled:opacity-30 lg:w-36"
                    @click="connectToMetalet"
                    v-if="!isMobile()"
                  >
                    <img
                      class="h-12 rounded"
                      :src="MetaletIcon"
                      alt="Metamask"
                    />
                    <span class="">Metalet</span>
                  </button>
                </div>

                <!-- footer -->
                <div class="mt-16 space-y-1 text-xs text-zinc-500">
                  <p>By connecting wallet,</p>
                  <p class="">
                    <span>you agree to Orders.Exchange's</span>
                    <a
                      href="https://orders-exchange.gitbook.io/orders/risks-and-disclaimer/risks-and-disclaimer"
                      target="_blank"
                      class="underline hover:text-primary"
                    >
                      Terms of Service
                    </a>
                    .
                  </p>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
