<script setup lang="ts">
import { ChevronDownIcon, CheckIcon } from 'lucide-vue-next'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import swapPairs from '@/data/swap-pairs'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { prettySymbol } from '@/lib/formatters'

const { selectPair, selectedPairId, selectedPair } = useSwapPoolPair()
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
          'rounded-full  p-1 px-2 flex items-center gap-1 border border-zinc-700 hover:bg-black text-base hover:border-black',
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
        <div v-else class="text-base pl-2 text-primary">Select token</div>
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
        class="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-black shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-auto max-h-[40vh] nicer-scrollbar w-56 divide-y divide-zinc-900 shadow-primary/10"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="pair in swapPairs"
          :key="pair.id"
          :value="pair.id"
        >
          <button
            :class="[
              'flex items-center p-4 text-sm w-max min-w-full gap-2 rounded',
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
              class="h-5 w-5 text-primary ml-auto"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
