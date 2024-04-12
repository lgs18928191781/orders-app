<script setup lang="ts">
import { ChevronDownIcon, CheckIcon, PackagePlus } from 'lucide-vue-next'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { useQuery } from '@tanstack/vue-query'

import { useModalTokenSelect } from '@/hooks/use-modal-token-select'

import { useNetworkStore } from '@/stores/network'

import { prettySymbol } from '@/lib/formatters'
import { getPoolsQuery } from '@/queries/swap/pools.query'
import { useSwapPool } from '@/hooks/use-swap-pool'
import { computed } from 'vue'
import { livenetSwapTokens, testnetSwapTokens } from '@/data/pinned-tokens'

const network = useNetworkStore().network

const { data: poolPairs } = useQuery(getPoolsQuery({ network }))

const { pairStr, selectPair, token1, token2, token1Icon, token2Icon } =
  useSwapPool()
const { openModal } = useModalTokenSelect()

const networkStore = useNetworkStore()

const pinnedTokens = computed(() => {
  if (networkStore.isTestnet) return testnetSwapTokens

  return livenetSwapTokens
})
</script>

<template>
  <Listbox
    as="div"
    class="relative inline-block text-left"
    :default-value="pairStr"
    @update:model-value="selectPair"
  >
    <ModalTokenSelect
      :pinned-tokens="pinnedTokens"
      @select-token="(token: string) => $router.push(`/swap/btc-${token}`)"
    />
    <ListboxButton v-slot="{ open }" as="template">
      <button
        :class="[
          open ? 'bg-black' : 'bg-zinc-900',
          'flex items-center gap-1 rounded-full border border-zinc-700 p-1 px-2 text-base hover:border-black hover:bg-black',
        ]"
      >
        <div class="flex" v-if="pairStr">
          <TokenIcon
            :token="token1"
            class="size-6 rounded-full"
            v-if="token1"
          />
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
    </ListboxButton>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <ListboxOptions
        class="nicer-scrollbar absolute right-0 z-50 mt-2 max-h-[40vh] w-56 origin-top-right divide-y divide-zinc-900 overflow-auto rounded-md bg-black shadow-lg shadow-primary/10 ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="pair in poolPairs"
          :key="pair.id"
          :value="pair.id"
        >
          <button
            :class="[
              'flex w-max min-w-full items-center gap-2 rounded p-4 text-sm',
              active ? 'bg-primary/70' : 'bg-black',
            ]"
          >
            <div class="flex">
              <TokenIcon
                :token="pair.token1"
                class="size-6 rounded-full"
                v-if="pair.token1"
              />
              <TokenIcon
                :token="pair.token2"
                class="-ml-2 size-6 rounded-full"
                v-if="pair.token2"
              />
            </div>

            <div class="text-base font-bold">
              {{ prettySymbol(pair.token1) + '-' + prettySymbol(pair.token2) }}
            </div>

            <CheckIcon
              v-if="selected"
              class="ml-auto h-5 w-5 text-primary"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>

        <!-- add pool button -->
        <!-- <ListboxOption v-slot="{ active, selected }">
          <button
            :class="[
              'flex w-max min-w-full items-center gap-2 rounded p-4 text-sm',
              active ? 'bg-primary/70' : 'bg-black',
            ]"
            @click="openModal"
          >
            <PackagePlus class="h-6 w-6 text-primary" />

            <div class="text-base font-bold">Create Pool</div>
          </button>
        </ListboxOption> -->
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
