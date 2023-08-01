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
  defaultPair,
  selectedPoolPairKey,
} from '@/data/trading-pairs'
import { cn } from '@/lib/helpers'
import { inject } from 'vue'

const router = useRouter()
const selectedPair = inject(selectedPoolPairKey, defaultPair)

const choosePair = (pairId: number) => {
  const pair = tradingPairs.find((pair) => pair.id === pairId)
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
        class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-black px-3 py-2 text-sm font-semibold text-orange-300 shadow-sm hover:bg-opacity-80 transition-all"
        v-slot="{ open }"
      >
        <div class="flex">
          <img :src="selectedPair.fromIcon" class="h-6 rounded-full" />
          <img :src="selectedPair.toIcon" class="-ml-2 h-6 rounded-full" />
        </div>

        <span class="font-bold uppercase"
          >{{ selectedPair.fromSymbol }}-{{ selectedPair.toSymbol }}</span
        >
        <ChevronRightIcon
          :class="[
            'h-5 w-5 text-zinc-400 transform duration-200',
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
        class="absolute left-0 z-10 mt-2 origin-top rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden w-full"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="pair in tradingPairs"
          :key="pair.id"
          :value="pair.id"
        >
          <button
            :class="
              cn(
                'flex items-center justify-between p-4 text-sm w-full',
                active && 'bg-black'
              )
            "
          >
            <div class="flex items-center">
              <div class="flex">
                <img :src="pair.fromIcon" class="h-6 rounded-full" />
                <img :src="pair.toIcon" class="-ml-2 h-6 rounded-full" />
              </div>

              <span
                :class="
                  cn('font-bold ml-2 uppercase', selected && 'text-orange-300')
                "
              >
                {{ pair.fromSymbol }}-{{ pair.toSymbol }}
              </span>
            </div>

            <CheckIcon
              v-if="selected"
              class="h-5 w-5 text-orange-300 ml-4"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>