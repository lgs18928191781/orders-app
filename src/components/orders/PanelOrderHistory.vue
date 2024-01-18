<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
</script>

<template>
  <TabGroup as="div" class="rounded-lg grow flex flex-col primary-panel">
    <TabList class="p-3 rounded-t-lg bg-zinc-800 space-x-4 font-bold">
      <Tab as="template" v-slot="{ selected }">
        <button
          :class="[
            selected ? 'text-primary underline' : 'text-zinc-300',
            'font-bold py-1 px-2 outline-none',
          ]"
        >
          Open Orders
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
          Market Trades
        </button>
      </Tab>
    </TabList>

    <TabPanels class="p-3 flex items-center justify-center grow">
      <TabPanel>Content 1</TabPanel>
      <TabPanel>Content 2</TabPanel>
      <TabPanel>Content 3</TabPanel>
    </TabPanels>
  </TabGroup>
</template>

<style scoped></style>
