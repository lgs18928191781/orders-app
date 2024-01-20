<script lang="ts" setup>
import { ref, watch } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import { useSelectOrder } from '@/hooks/use-select-order'

import PanelMarketSell from '@/components/orders/PanelMarketSell.vue'
import PanelLimitSell from '@/components/orders/PanelLimitSell.vue'

const { selectedOrderType } = useSelectOrder()

const modeTab = ref(0)
function changeModeTab(index: number) {
  modeTab.value = index
}
watch(
  () => selectedOrderType.value,
  (value) => {
    if (value === 'bid') {
      modeTab.value = 1
    } else {
      modeTab.value = 0
    }
  }
)
</script>

<template>
  <TabPanel class="flex flex-col h-full">
    <TabGroup as="template" :selected-index="modeTab" @change="changeModeTab">
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
        <PanelLimitSell class="flex flex-col justify-between grow" />
        <PanelMarketSell class="flex flex-col justify-between grow" />
      </TabPanels>
    </TabGroup>
  </TabPanel>
</template>
