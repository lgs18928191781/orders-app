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
    class="rounded-lg grow flex flex-col primary-panel"
    :selected-index="selectedTab"
    @change="changeTab"
  >
    <TabList class="p-3 rounded-t-lg bg-zinc-800 space-x-4 font-bold">
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected
              ? 'text-primary underline underline-offset-4'
              : 'text-zinc-300',
            'font-bold py-1 px-2 outline-none',
          ]"
        >
          <span>My Open Orders</span>
          <span v-if="openOrdersCount > 0">({{ openOrdersCount }})</span>
        </button>
      </Tab>
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected ? 'text-primary underline' : 'text-zinc-300',
            'font-bold py-1 px-2 outline-none',
          ]"
        >
          My Order History
        </button>
      </Tab>
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected ? 'text-primary underline' : 'text-zinc-300',
            'font-bold py-1 px-2 outline-none',
          ]"
        >
          Market Trades({{ prettySymbol(fromSymbol) }})
        </button>
      </Tab>
    </TabList>

    <TabPanels class="p-3 grow">
      <PanelOpenOrders v-model:open-orders-count="openOrdersCount" />
      <PanelOrderHistory />
      <PanelMarketTrades />
    </TabPanels>
  </TabGroup>
</template>

<style scoped></style>
