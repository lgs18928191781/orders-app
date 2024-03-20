<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TabGroup, TabList, Tab, TabPanels } from '@headlessui/vue'

import { prettySymbol } from '@/lib/formatters'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { useConnectionStore } from '@/stores/connection'

import PanelOpenOrders from '@/components/orders/history/PanelOpenOrders.vue'
import PanelOrderHistory from '@/components/orders/history/PanelOrderHistory.vue'
import PanelMarketTrades from '@/components/orders/history/PanelMarketTrades.vue'

const connectionStore = useConnectionStore()

const openOrdersCount = ref(0)
const { fromSymbol } = useTradingPair()

const selectedTab = ref(0)
function changeTab(index: number) {
  selectedTab.value = index
}

onMounted(() => {
  if (!connectionStore.connected) {
    changeTab(2)
  } else {
    changeTab(0)
  }
})
</script>

<template>
  <TabGroup
    as="div"
    class="primary-panel flex grow flex-col rounded-lg bg-green-300"
    :selected-index="selectedTab"
    @change="changeTab"
  >
    <TabList class="space-x-4 rounded-t-md bg-zinc-800 p-3 font-bold">
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected
              ? 'text-primary underline underline-offset-4'
              : 'text-zinc-300',
            'px-2 py-1 font-bold outline-none',
          ]"
        >
          <span>My Open Orders</span>
          <span v-if="openOrdersCount > 0">({{ openOrdersCount }})</span>
        </button>
      </Tab>
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected
              ? 'text-primary underline underline-offset-4'
              : 'text-zinc-300',
            'px-2 py-1 font-bold outline-none',
          ]"
        >
          My Order History
        </button>
      </Tab>
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected
              ? 'text-primary underline underline-offset-4'
              : 'text-zinc-300',
            'px-2 py-1 font-bold outline-none',
          ]"
        >
          Market Trades({{ prettySymbol(fromSymbol) }})
        </button>
      </Tab>
    </TabList>

    <TabPanels class="h-[50vh] p-3 lg:h-[30vh]">
      <PanelOpenOrders v-model:open-orders-count="openOrdersCount" />
      <PanelOrderHistory />
      <PanelMarketTrades />
    </TabPanels>
  </TabGroup>
</template>

<style scoped></style>
