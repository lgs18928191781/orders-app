<template>
  <TransitionRoot as="template" :show="isConnectionMetaletModal">
    <Dialog as="div" class="relative z-10" @close="() => {}">
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

      <div class="fixed inset-0 z-10 m-auto w-5/12 overflow-y-auto">
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
                  class="text-base font-semibold leading-6 text-zinc-100"
                >
                  <span class="text-primary"
                    >To utilize the Orders Bridge function, please connect with
                    Metalet Wallet</span
                  >
                </DialogTitle>
              </div>
              <div class="mt-6 flex items-center justify-center text-lg">
                <button
                  @click="cancelLogin"
                  type="button"
                  class="item-center mr-10 flex justify-center rounded-xl bg-zinc-700 px-3 py-2 font-bold hover:bg-zinc-500"
                >
                  Cancel
                </button>
                <button
                  @click="trggleMetaletLogin"
                  type="button"
                  class="item-center flex justify-center rounded-xl bg-zinc-700 px-3 py-2 font-bold transition hover:bg-primary hover:text-orange-950"
                >
                  <Loader2Icon
                    v-if="confrimLogin"
                    class="mr-1.5 animate-spin"
                  />
                  <span>Login</span>
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
import { useCheckMetaletLoginModal } from '@/hooks/use-check-metalet-modal'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { ref } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'
const router = useRouter()
const confrimLogin = ref(false)
const { isConnectionMetaletModal, closeConnectionModal } =
  useCheckMetaletLoginModal()
const connectionStore = useConnectionStore()
async function trggleMetaletLogin() {
  confrimLogin.value = true
  try {
    if (!connectionStore.connected) {
      await connectionStore.connect('metalet')
      closeConnectionModal()
    } else if (
      connectionStore.connected &&
      connectionStore.last.wallet !== 'metalet'
    ) {
      connectionStore.disconnect()
      await connectionStore.connect('metalet')
      closeConnectionModal()
      window.location.reload()
    }
    confrimLogin.value = false
  } catch (error) {
    confrimLogin.value = false
  }
}

function cancelLogin() {
  closeConnectionModal()
  router.push('/')
}
</script>
