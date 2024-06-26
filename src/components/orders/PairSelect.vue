<script lang="ts" setup>
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ChevronRightIcon, CheckIcon } from 'lucide-vue-next'

import tradingPairs from '@/data/trading-pairs'
import { useTradingPair } from '@/hooks/use-trading-pair'
const sortedTradingPairs = tradingPairs.sort((a, b) => {
  // sorted by id
  return a.id > b.id ? 1 : -1
})

const { selectPair, selectedPair } = useTradingPair()
</script>

<template>
  <Listbox
    as="div"
    class="relative inline-block text-left"
    :model-value="selectedPair.id"
    @update:model-value="selectPair"
  >
    <div>
      <ListboxButton
        class="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-black px-3 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-opacity-80"
        v-slot="{ open }"
      >
        <div class="flex">
          <img :src="selectedPair.fromIcon" class="h-6 rounded-full" />
          <img :src="selectedPair.toIcon" class="-ml-2 h-6 rounded-full" />
        </div>

        <span class="font-bold uppercase"
          >${{ selectedPair.fromSymbol }}-{{ selectedPair.toSymbol }}</span
        >
        <ChevronRightIcon
          :class="[
            '-mr-1 h-5 w-5 transform text-zinc-400 duration-200',
            open && 'rotate-90',
          ]"
          aria-hidden="true"
        />
      </ListboxButton>
    </div>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <ListboxOptions
        class="nicer-scrollbar absolute left-0 z-10 mt-2 max-h-[75vh] origin-top-left overflow-auto rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="pair in sortedTradingPairs"
          :key="pair.id"
          :value="pair.id"
        >
          <button
            :class="[
              'flex w-max min-w-full items-center p-4 text-sm',
              active && 'bg-black',
            ]"
          >
            <div class="flex">
              <img :src="pair.fromIcon" class="h-6 rounded-full" />
              <img :src="pair.toIcon" class="-ml-2 h-6 rounded-full" />
            </div>

            <div class="relative">
              <span
                :class="[
                  'ml-2 font-bold uppercase',
                  selected && 'text-primary',
                ]"
              >
                ${{ pair.fromSymbol }}-{{ pair.toSymbol }}
              </span>
              <span
                class="absolute inline-flex -translate-x-1 -translate-y-2 rotate-3 items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-red-500"
                v-if="pair.isNew"
              >
                New!
              </span>
            </div>

            <CheckIcon
              v-if="selected"
              class="ml-4 h-5 w-5 text-primary"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
