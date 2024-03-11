<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'
import { XIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { getBrc20s } from '@/queries/orders-api'

import { useTokenSelectModal } from '@/hooks/use-token-select-modal'

const { isOpen, closeModal } = useTokenSelectModal()
const router = useRouter()
const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()

const { data: myBrc20s } = useQuery({
  queryKey: [
    'myBrc20s',
    {
      address: connectionStore.getAddress,
      network: networkStore.network,
    },
  ],
  queryFn: () =>
    getBrc20s({
      address: connectionStore.getAddress,
      network: networkStore.network,
    }),

  enabled: computed(() => !!connectionStore.getAddress),
})

function selectToken(token: string) {
  router.push(`/swap-pools/btc-${token}/add`)
  closeModal()
}
</script>

<template>
  <Teleport to="body">
    <Dialog :open="isOpen" @close="() => {}">
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur"
        aria-hidden="true"
      ></div>

      <div
        class="fixed inset-0 z-[60] flex w-screen items-center justify-center p-4"
      >
        <DialogPanel
          class="z-[70] max-w-lg rounded-xl bg-zinc-800 p-4 text-zinc-300 lg:min-h-48 lg:min-w-96"
        >
          <div class="flex items-center justify-between pb-4">
            <span>Select a token</span>

            <button>
              <XIcon class="h-6 w-6" @click="closeModal" />
            </button>
          </div>

          <!-- body -->
          <div
            v-if="myBrc20s && myBrc20s.length"
            v-for="brc20 in myBrc20s"
            :key="brc20.token"
            class="-mx-4 flex cursor-pointer items-center justify-between px-4 py-4 transition-all hover:bg-black"
            @click="selectToken(brc20.token)"
          >
            <div class="uppercase text-primary">${{ brc20.token }}</div>

            <div class="flex items-center gap-1 text-xs">
              <div class="text-primary">
                {{ brc20.transferBalance || 0 }}
              </div>
              <div class="">+</div>
              <div class="">
                {{ brc20.availableBalance || 0 }}
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </Teleport>
</template>
