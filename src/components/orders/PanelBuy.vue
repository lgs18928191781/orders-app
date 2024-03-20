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
        <PanelLimitBuy class="flex grow flex-col justify-between" />
        <PanelMarketBuy class="flex grow flex-col justify-between" />
      </TabPanels>
    </TabGroup>
  </TabPanel>
</template>
