<script setup lang="ts">
import { ChevronDownIcon, CheckIcon } from 'lucide-vue-next'
import { computed, defineModel, withDefaults } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import assets from '@/data/assets'
import { prettySymbol } from '@/lib/formatters'

defineProps({
  useAssets: {
    default: assets,
  },
})

const assetSymbol = defineModel('assetSymbol', { required: true, type: String })
const selectedAsset = computed(() => {
  const selected = assets.find(
    (a) => a.symbol.toUpperCase() === assetSymbol.value.toUpperCase()
  )
  if (!selected) {
    return null
  }

  return selected
})
</script>

<template>
  <Listbox
    as="div"
    class="relative inline-block text-left"
    :model-value="assetSymbol"
    @update:model-value="$emit('update:assetSymbol', $event)"
  >
    <ListboxButton v-slot="{ open }" as="template">
      <button
        :class="[
          open ? 'bg-zinc-700' : 'bg-zinc-900',
          'rounded-full  p-1 px-2 text-xl flex items-center gap-1 border border-zinc-700 hover:bg-zinc-700',
        ]"
      >
        <img
          :src="selectedAsset.icon"
          class="size-6 rounded-full"
          v-if="selectedAsset"
        />
        <div class="mr-1" v-if="selectedAsset">
          {{ prettySymbol(selectedAsset.symbol) }}
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
        class="absolute right-0 z-10 mt-2 origin-top-left rounded-md bg-zinc-900 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-auto max-h-[25vh] nicer-scrollbar w-48 divide-y divide-zinc-800 border border-primary/10 shadow shadow-primary/30"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="asset in useAssets"
          :key="asset.symbol"
          :value="asset.symbol"
        >
          <button
            :class="[
              'flex items-center p-4 text-sm w-max min-w-full gap-2 rounded',
              active && 'bg-black',
            ]"
          >
            <img :src="asset.icon" class="h-6 rounded-full" />

            <div class="text-base font-bold">
              {{ prettySymbol(asset.symbol) }}
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
