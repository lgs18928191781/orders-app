<script lang="ts" setup>
import { Dialog, DialogPanel } from '@headlessui/vue'
import { ChevronRightIcon, XIcon } from 'lucide-vue-next'
import { ref } from 'vue'

import { useModalTokenSelect } from '@/hooks/use-modal-token-select'
import { refDebounced } from '@vueuse/core'
import SwapTokenButton from '@/components/swap/SwapTokenButton.vue'
import { useTradingPair } from '@/hooks/use-trading-pair'

const { isOpen, closeModal } = useModalTokenSelect()
const { selectPair, selectedPair } = useTradingPair()

const props = defineProps<{
  pinnedTokens: string[]
}>()
const emit = defineEmits(['selectToken'])

function selectToken(token: string) {
  emit('selectToken', token)
  closeModal()
}

const keyword = ref('')
const keywordDebounced = refDebounced(keyword, 300)
</script>

<template>
  <div>
    <!-- <button
      class="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-black px-3 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-opacity-80"
    >
      <div class="flex">
        <img :src="selectedPair.fromIcon" class="h-6 rounded-full" />
        <img :src="selectedPair.toIcon" class="-ml-2 h-6 rounded-full" />
      </div>

      <span class="font-bold uppercase"
        >${{ selectedPair.fromSymbol }}-{{ selectedPair.toSymbol }}</span
      >
      <ChevronRightIcon
        :class="['-mr-1 h-5 w-5 transform text-zinc-400 duration-200']"
        aria-hidden="true"
      />
    </button> -->

    <Dialog :open="isOpen" @close="() => {}">
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

            <button @click="closeModal">
              <XIcon class="h-6 w-6" @click="closeModal" />
            </button>
          </div>

          <!-- body -->
          <!-- searchbar -->
          <div class="flex items-center">
            <input
              type="text"
              class="flex-1 rounded-md border-zinc-700 bg-inherit p-2 text-zinc-300"
              placeholder="Search BRC-20 token name"
              v-model="keyword"
            />
          </div>

          <!-- pinned tokens -->
          <div class="mt-4 flex flex-wrap gap-2">
            <SwapTokenButton
              v-for="token in props.pinnedTokens"
              :token="token"
              @click="selectToken(token)"
            ></SwapTokenButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>
