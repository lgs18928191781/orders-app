<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'
import { XIcon } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { getBrc20s } from '@/queries/orders-api'

import { useModalTokenSelect } from '@/hooks/use-modal-token-select'
import { refDebounced } from '@vueuse/core'

const { isOpen, closeModal } = useModalTokenSelect()
const router = useRouter()

function selectToken(token: string) {
  router.push(`/swap-pools/btc-${token}/add`)
  closeModal()
}

const keyword = ref('')
const keywordDebounced = refDebounced(keyword, 300)
</script>

<template>
  <Dialog :open="true" @close="() => {}">
    <div
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur"
      aria-hidden="true"
    ></div>

    <div
      class="fixed inset-0 z-[60] flex w-screen items-center justify-center p-4"
    >
      <DialogPanel
        class="z-[70] max-w-lg rounded-xl bg-zinc-800 p-4 text-zinc-300 shadow-highlight lg:min-h-48 lg:min-w-96"
      >
        <div class="flex items-center justify-between pb-4">
          <span>Select a token</span>

          <button>
            <XIcon class="h-6 w-6" @click="closeModal" />
          </button>
        </div>

        <!-- body -->
        <!-- searchbar -->
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="flex-1 rounded-md border-zinc-700 bg-inherit p-2 text-zinc-300"
            placeholder="Search BRC-20 token name"
            v-model="keyword"
          />
        </div>

        <!--  -->
      </DialogPanel>
    </div>
  </Dialog>
</template>
