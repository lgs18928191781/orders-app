<script lang="ts" setup>
import { ref, watch } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import { useSelectOrder } from '@/hooks/use-select-order'

import PanelMarketSell from '@/components/orders/PanelMarketSell.vue'
import PanelLimitSell from '@/components/orders/PanelLimitSell.vue'

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
        modeTab.value = 0
      } else {
        modeTab.value = 1
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <TabPanel class="flex h-full flex-col">
    <TabGroup as="template" :selected-index="modeTab" @change="changeModeTab">
      <TabList class="-ml-2 flex gap-2 pb-2 text-base">
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              selected ? 'text-primary underline' : 'text-zinc-300',
              'px-2 py-1 font-bold outline-none',
            ]"
          >
            Limit
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              selected ? 'text-primary underline' : 'text-zinc-300',
              'px-2 py-1 font-bold outline-none',
            ]"
          >
            Market
          </button>
        </Tab>
      </TabList>

      <TabPanels as="template">
        <PanelLimitSell class="flex grow flex-col justify-between" />
        <PanelMarketSell class="flex grow flex-col justify-between" />
      </TabPanels>
    </TabGroup>
  </TabPanel>
</template>
