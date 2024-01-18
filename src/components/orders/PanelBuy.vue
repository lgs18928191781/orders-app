<script lang="ts" setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import PanelMarketBuy from '@/components/orders/PanelMarketBuy.vue'
import PanelLimitBuy from '@/components/orders/PanelLimitBuy.vue'
</script>

<template>
  <TabPanel class="h-full flex flex-col">
    <TabGroup :default-index="0" as="template">
      <TabList class="text-base flex gap-2 -ml-2 pb-2">
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              selected ? 'text-primary underline' : 'text-zinc-300',
              'font-bold py-1 px-2 outline-none',
            ]"
          >
            Limit
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              selected ? 'text-primary underline' : 'text-zinc-300',
              'font-bold py-1 px-2 outline-none',
            ]"
          >
            Market
          </button>
        </Tab>
      </TabList>

      <TabPanels as="template">
        <PanelLimitBuy class="flex flex-col justify-between grow" />
        <PanelMarketBuy class="flex flex-col justify-between grow" />
      </TabPanels>
    </TabGroup>
  </TabPanel>
</template>
