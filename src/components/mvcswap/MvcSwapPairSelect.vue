<template>
  <Listbox as="div" class="relative inline-block text-left" v-model="curPair">
    <ListboxButton>
      <button
        :class="[
          'bg-zinc-900',
          'flex items-center gap-1 rounded-full border border-zinc-700 p-1 px-2 text-base hover:border-black hover:bg-black',
        ]"
      >
        <div class="flex" v-if="curPair">
          <MVCSwapIcon :token="curPair.token1" />
          <MVCSwapIcon :token="curPair.token2" />
        </div>
        <div class="mr-1" v-if="curPair">
          {{ (curPair.pairName||'').toUpperCase() }}
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
        <ListboxOption v-for="pair in pairs" :key="pair.swapID" :value="pair">
          <button
            :class="[
              'flex w-max min-w-full items-center gap-2 rounded p-4 text-sm hover:bg-primary/70',
              curPair.swapID === pair.swapID ? 'bg-primary/70' : 'bg-black',

            ]"
            @click="setCurPair(pair)"
          >
            <div class="flex">
              <MVCSwapIcon :token="pair.token1" />
              <MVCSwapIcon :token="pair.token2" />
            </div>

            <div class="text-base font-bold">
              {{ (pair.pairName||'').toUpperCase() }}
            </div>

            <CheckIcon
              v-if="curPair.swapID === pair.swapID"
              class="ml-auto h-5 w-5 text-primary"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
<script setup lang="ts">
import { ChevronDownIcon, CheckIcon, PackagePlus } from 'lucide-vue-next'
import { computed, inject, watchEffect } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { useMVCSwapStore } from '@/stores/mvcswap'
import { storeToRefs } from 'pinia'
const store = useMVCSwapStore()
const { setCurPair } = store

const { pairs, curPair } = storeToRefs(store)
</script>
