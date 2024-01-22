<script setup lang="ts">
import { ref } from 'vue'
import { TabGroup, TabList, Tab, TabPanels } from '@headlessui/vue'

import { prettySymbol } from '@/lib/formatters'
import { useTradingPair } from '@/hooks/use-trading-pair'

import PanelOpenOrders from '@/components/orders/history/PanelOpenOrders.vue'
import PanelOrderHistory from '@/components/orders/history/PanelOrderHistory.vue'
import PanelMarketTrades from '@/components/orders/history/PanelMarketTrades.vue'

const openOrdersCount = ref(0)
const { fromSymbol } = useTradingPair()
</script>

<template>
  <TabGroup as="div" class="rounded-lg grow flex flex-col primary-panel">
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
          <span>Open Orders</span>
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
          Order History
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
