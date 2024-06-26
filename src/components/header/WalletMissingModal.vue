<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { FrownIcon } from 'lucide-vue-next'
import { ref } from 'vue'

import { useConnectionModal } from '@/hooks/use-connection-modal'

const { isWalletMissingModalOpen, closeWalletMissingModal, missingWallet } =
  useConnectionModal()

const goButtonRef = ref<HTMLElement | null>(null)

function goToMissingWallet() {
  close()
  if (missingWallet.value === 'unisat') {
    window.open(
      'https://chrome.google.com/webstore/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo',
      '_blank',
    )
  } else if (missingWallet.value === 'okx') {
    window.open(
      'https://chromewebstore.google.com/detail/mcohilncbfahbmgdjkbpemcciiolgcge',
      '_blank',
    )
  } else if (missingWallet.value === 'metalet') {
    window.open(
      'https://chromewebstore.google.com/detail/metalet/lbjapbcmmceacocpimbpbidpgmlmoaao',
      '_blank',
    )
  }
}
</script>

<template>
  <TransitionRoot as="template" :show="isWalletMissingModalOpen">
    <Dialog
      as="div"
      class="relative z-10"
      @close="closeWalletMissingModal"
      :initial-focus="goButtonRef"
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
              class="relative transform overflow-hidden rounded-lg bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
            >
              <div>
                <div
                  class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100"
                >
                  <FrownIcon
                    class="h-6 w-6 text-amber-500"
                    aria-hidden="true"
                  />
                </div>
                <div class="mt-3 text-center sm:mt-5">
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold leading-6 text-zinc-100"
                  >
                    <span class="capitalize">
                      {{ missingWallet }}
                    </span>
                    wallet not installed
                  </DialogTitle>
                  <div class="mt-2">
                    <DialogDescription
                      class="text-center text-sm text-zinc-500"
                    >
                      Please install
                      <span class="capitalize">{{ missingWallet }}</span> wallet
                      to continue.
                    </DialogDescription>
                  </div>
                </div>
              </div>
              <div class="mt-5 sm:mt-6">
                <button
                  type="button"
                  class="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-orange-950 shadow-sm transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  @click="goToMissingWallet"
                  ref="goButtonRef"
                >
                  Go to

                  <span class="mx-2 capitalize">
                    {{ missingWallet }}
                  </span>
                  wallet
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
