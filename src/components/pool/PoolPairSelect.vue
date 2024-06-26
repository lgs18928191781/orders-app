<script lang="ts" setup>
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { CheckIcon, ChevronRightIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import tradingPairs, {
  defaultPoolPair,
  selectedPoolPairKey,
} from '@/data/trading-pairs'
import { inject } from 'vue'

const router = useRouter()

const poolablePairs = tradingPairs.filter((pair) => pair.hasPool)
const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)

const choosePair = (pairId: number) => {
  const pair = poolablePairs.find((pair) => pair.id === pairId)
  if (pair) {
    const pairSymbol = `${pair.fromSymbol}-${pair.toSymbol}`
    router.push({
      path: `/pool/${pairSymbol}`,
    })
  }
}
</script>

<template>
  <Listbox
    as="div"
    class="relative text-left"
    :model-value="selectedPair.id"
    @update:model-value="choosePair"
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
            'h-5 w-5 transform text-zinc-400 duration-200',
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
        class="absolute left-0 z-10 mt-2 w-full origin-top overflow-auto rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="pair in poolablePairs"
          :key="pair.id"
          :value="pair.id"
        >
          <button
            :class="[
              'flex w-full items-center justify-between p-4 text-sm',
              active && 'bg-black',
            ]"
          >
            <div class="flex items-center">
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
                <span
                  class="absolute inline-flex -translate-x-4 -translate-y-2 rotate-6 items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium text-red-500"
                  v-if="pair.hasEvent"
                >
                  EVENT!🔥
                </span>
              </div>
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
