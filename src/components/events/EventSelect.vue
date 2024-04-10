<script setup lang="ts">
import { ChevronDownIcon, CheckIcon } from 'lucide-vue-next'
import { computed, defineModel } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import events from '@/data/events'

const sortByLatest = (a: any, b: any) => {
  if (a.id > b.id) {
    return -1
  }
  if (a.id < b.id) {
    return 1
  }
  return 0
}
const eventsSorted = [...events].sort(sortByLatest)

const eventSymbol = defineModel('eventSymbol', {
  required: true,
  type: String,
  default: events[events.length - 1].symbol,
})
const selectedEvent = computed(() => {
  const selected = events.find(
    (e) => e.symbol.toUpperCase() === eventSymbol.value.toUpperCase(),
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
    :model-value="eventSymbol"
    @update:model-value="$emit('update:eventSymbol', $event)"
  >
    <ListboxButton v-slot="{ open }" as="template">
      <button
        :class="[
          open ? 'bg-zinc-700' : 'bg-zinc-900',
          'flex  items-center gap-1 rounded-full border border-zinc-700 p-2 px-4 text-xl hover:bg-zinc-700',
        ]"
      >
        <span v-if="selectedEvent"> {{ selectedEvent.id }}. </span>
        <div class="mr-1" v-if="selectedEvent">
          {{ selectedEvent.title }}
        </div>
        <div v-else class="pl-2 text-base text-primary">Select Event</div>
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
        class="nicer-scrollbar absolute left-0 z-10 mt-2 max-h-[40vh] origin-top-left divide-y divide-zinc-800 overflow-auto rounded-md border border-primary/10 bg-zinc-900 shadow shadow-primary/30 ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="(event, index) in eventsSorted"
          :key="event.id"
          :value="event.symbol"
        >
          <button
            :class="[
              'flex w-max min-w-full items-center gap-2 rounded p-4 text-sm',
              active && 'bg-black',
            ]"
          >
            <div class="text-base text-zinc-500">
              {{ eventsSorted.length - index }}.
            </div>

            <div class="text-base font-bold">
              {{ event.title }}
              <span
                v-if="event.latest === true"
                class="mr-4 rounded bg-red-500/20 px-2 py-1 text-xs text-red-500"
              >
                LIVE
              </span>
            </div>

            <CheckIcon
              v-if="selected"
              class="ml-auto h-5 w-5 text-primary"
              aria-hidden="true"
            />
          </button>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
