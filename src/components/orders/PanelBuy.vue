<script lang="ts" setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import { useSelectOrder } from '@/hooks/use-select-order'

import PanelMarketBuy from '@/components/orders/PanelMarketBuy.vue'
import PanelLimitBuy from '@/components/orders/PanelLimitBuy.vue'
import { ref, watch } from 'vue'

const { selectedOrder } = useSelectOrder()

const modeTab = ref(0)
function changeModeTab(index: number) {
  modeTab.value = index
}
watch(
  () => selectedOrder.value,
  (order) => {
    if (order) {
      if (order.orderType === 1) {
        modeTab.value = 1
      } else {
        modeTab.value = 0
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <TabPanel class="h-full flex flex-col">
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
        <PanelLimitBuy class="flex flex-col justify-between grow" />
        <PanelMarketBuy class="flex flex-col justify-between grow" />
      </TabPanels>
    </TabGroup>
  </TabPanel>
</template>
