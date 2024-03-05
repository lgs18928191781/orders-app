<script setup lang="ts">
import { ChevronDownIcon, CheckIcon, PackagePlus } from 'lucide-vue-next'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useNetworkStore } from '@/stores/network'
import { useTokenSelectModal } from '@/hooks/use-token-select-modal'

import { prettySymbol } from '@/lib/formatters'
import swapPairs, { testnetSwapPairs } from '@/data/swap-pairs'

const network = useNetworkStore().network
const usingSwapPairs = network === 'testnet' ? testnetSwapPairs : swapPairs

const { selectPair, selectedPairId, selectedPair } = useSwapPoolPair()
const { openModal } = useTokenSelectModal()
</script>

<template>
  <Listbox
    as="div"
    class="relative inline-block text-left"
    v-model="selectedPairId"
    @update:model-value="selectPair"
  >
    <ListboxButton v-slot="{ open }" as="template">
      <button
        :class="[
          open ? 'bg-black' : 'bg-zinc-900',
          'flex items-center gap-1 rounded-full border border-zinc-700 p-1 px-2 text-base hover:border-black hover:bg-black',
        ]"
      >
        <div class="flex" v-if="selectedPair">
          <img :src="selectedPair.token1Icon" class="h-6 rounded-full" />
          <img :src="selectedPair.token2Icon" class="-ml-2 h-6 rounded-full" />
        </div>
        <div class="mr-1" v-if="selectedPair">
          {{
            prettySymbol(selectedPair.token1Symbol) +
            '-' +
            prettySymbol(selectedPair.token2Symbol)
          }}
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
          v-for="pair in usingSwapPairs"
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
              <img :src="pair.token1Icon" class="h-6 rounded-full" />
              <img :src="pair.token2Icon" class="-ml-2 h-6 rounded-full" />
            </div>

            <div class="text-base font-bold">
              {{
                prettySymbol(pair.token1Symbol) +
                '-' +
                prettySymbol(pair.token2Symbol)
              }}
            </div>

            <CheckIcon
              v-if="selected"
              class="ml-auto h-5 w-5 text-primary"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>

        <!-- add pool button -->
        <ListboxOption v-slot="{ active, selected }">
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
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
