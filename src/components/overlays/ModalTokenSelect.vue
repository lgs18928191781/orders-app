<script lang="ts" setup>
import { Dialog, DialogPanel } from '@headlessui/vue'
import {
  ChevronDownIcon,
  FrownIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useQuery } from '@tanstack/vue-query'

import { useModalTokenSelect } from '@/hooks/use-modal-token-select'
import { getSwapTokensQuery } from '@/queries/swap/swap-tokens.query'

import { prettySymbol } from '@/lib/formatters'
import { useSwapPool } from '@/hooks/use-swap-pool'

const { isOpen, closeModal, openModal } = useModalTokenSelect()
const { pairStr, token1, token2 } = useSwapPool()

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
const inputKeyword = ref<HTMLInputElement | null>(null)

const { data: tokens, isLoading: isLoadingTokens } = useQuery(
  getSwapTokensQuery(
    { keyword: keywordDebounced },
    computed(() => isOpen.value),
  ),
)
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 p-1 px-2 text-base hover:border-black hover:bg-black"
    @click="openModal"
    v-bind="$attrs"
  >
    <div class="flex" v-if="pairStr">
      <TokenIcon :token="token1" class="size-6 rounded-full" v-if="token1" />
      <TokenIcon
        :token="token2"
        class="-ml-2 size-6 rounded-full"
        v-if="token2"
      />
    </div>
    <div class="mr-1" v-if="pairStr">
      {{ prettySymbol(token1) + '-' + prettySymbol(token2) }}
    </div>
    <div v-else class="pl-2 text-base text-primary">Select token</div>
    <ChevronDownIcon class="h-5 w-5" />
  </button>

  <div>
    <Dialog :open="isOpen" @close="() => {}" :initial-focus="inputKeyword">
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur"
        aria-hidden="true"
      ></div>

      <div
        class="fixed inset-0 z-[60] flex w-screen items-center justify-center p-4"
      >
        <DialogPanel
          class="z-[70] min-w-full rounded-xl bg-zinc-800 p-4 text-zinc-300 shadow-highlight lg:min-h-48 lg:min-w-[24rem]"
        >
          <div class="flex items-center justify-between pb-4">
            <span>Select a token</span>

            <button @click="closeModal">
              <XIcon
                class="h-6 w-6 duration-300 hover:rotate-90 hover:text-primary"
                @click="closeModal"
              />
            </button>
          </div>

          <!-- body -->
          <!-- searchbar -->
          <div class="relative flex items-center gap-4">
            <input
              type="text"
              class="flex-1 rounded-xl border-0 bg-zinc-950 p-2 text-zinc-300"
              placeholder="Enter BRC-20 token name"
              ref="inputKeyword"
              v-model="keyword"
            />
            <SearchIcon class="absolute right-0 size-6 pr-2 text-zinc-500" />
          </div>

          <!-- pinned tokens -->
          <div class="mt-4">
            <h6 class="text-sm text-zinc-500">Popular BRC-20s</h6>
            <div class="mt-2 flex flex-wrap gap-2">
              <SwapTokenButton
                v-for="token in props.pinnedTokens"
                :token="token"
                @click="selectToken(token)"
              ></SwapTokenButton>
            </div>
          </div>

          <!-- divider -->
          <div class="-mx-4 mt-4 border-b border-zinc-700 px-4"></div>

          <!-- token list -->
          <div class="mt-4">
            <div class="py-8" v-if="isLoadingTokens">
              <LoaderCircleIcon class="mx-auto size-6 animate-spin" />
            </div>

            <div class="py-8" v-else-if="tokens && !tokens.length">
              <FrownIcon class="mx-auto size-10 text-zinc-500" />
              <div class="mt-2 text-center text-zinc-500">No results.</div>
            </div>

            <div
              v-for="token in tokens"
              :key="token.ticker"
              class="group -mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-900"
              @click="selectToken(token.ticker)"
            >
              <TokenIcon :token="token.ticker" class="size-8" />
              <h4 class="text-sm group-hover:text-primary">
                {{ prettySymbol(token.ticker) }}
              </h4>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>
