<script lang="ts" setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import PanelMarketSell from '@/components/orders/PanelMarketSell.vue'
</script>

<template>
  <TabPanel class="flex flex-col justify-between h-full">
    <TabGroup :default-index="1">
      <TabList class="text-base flex gap-2 -ml-2">
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              selected ? 'text-primary underline' : 'text-zinc-300',
              'font-bold py-1 px-2',
            ]"
          >
            Limit
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              selected ? 'text-primary underline' : 'text-zinc-300',
              'font-bold py-1 px-2',
            ]"
          >
            Market
          </button>
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel>Content 1</TabPanel>
        <PanelMarketSell />
      </TabPanels>
    </TabGroup>
  </TabPanel>
</template>
