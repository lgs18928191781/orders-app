<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import { computed, inject } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import { getMyReleasedRecords, getMyUsedPoolRecords } from '@/queries/pool'
import { useConnectionStore } from '@/stores/connection'

import PanelReleaseRecordItem from './PanelReleaseRecordItem.vue'
import PanelReleaseHistoryItem from './PanelReleaseHistoryItem.vue'

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const connectionStore = useConnectionStore()
const enabled = computed(() => !!connectionStore.connected)

const { data: poolRecords, isLoading: isLoadingPoolRecords } = useQuery({
  queryKey: [
    'poolReleasableRecords',
    {
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    },
  ],
  queryFn: () =>
    getMyUsedPoolRecords({
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    }),
  enabled,
})

const { data: releaseHistory, isLoading: isLoadingReleaseHistory } = useQuery({
  queryKey: [
    'poolReleaseHistory',
    {
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    },
  ],
  queryFn: () =>
    getMyReleasedRecords({
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    }),
  enabled,
})
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col">
    <TabGroup :default-index="0">
      <TabList class="flex items-center gap-8" v-slot="{ selectedIndex }">
        <Tab
          :class="[
            'text-sm font-medium leading-6 ',
            selectedIndex === 0
              ? 'text-primary'
              : 'text-zinc-500 hover:text-zinc-300',
          ]"
        >
          My Pool Records
        </Tab>
        <Tab
          :class="[
            'text-sm font-medium leading-6 ',
            selectedIndex === 1
              ? 'text-primary'
              : 'text-zinc-500 hover:text-zinc-300',
          ]"
        >
          Release History
        </Tab>
      </TabList>

      <TabPanels class="mt-8">
        <TabPanel
          class="nicer-scrollbar -mx-4 h-[40vh] grow space-y-2 overflow-y-auto rounded"
        >
          <p v-if="isLoadingPoolRecords" class="pt-4 text-center text-zinc-500">
            Loading...
          </p>

          <div
            class="flex h-full items-center justify-center text-zinc-500"
            v-else-if="!poolRecords || poolRecords.length === 0"
          >
            No Records Currently.
          </div>

          <PanelReleaseRecordItem
            v-for="record in poolRecords"
            :key="record.orderId"
            :record="record"
          />
        </TabPanel>

        <TabPanel
          class="nicer-scrollbar -mx-4 h-[40vh] grow space-y-2 overflow-y-auto rounded"
        >
          <p
            v-if="isLoadingReleaseHistory"
            class="pt-4 text-center text-zinc-500"
          >
            Loading...
          </p>

          <div
            class="flex h-full items-center justify-center text-zinc-500"
            v-else-if="!releaseHistory || releaseHistory.length === 0"
          >
            No release history.
          </div>

          <PanelReleaseHistoryItem
            v-for="history in releaseHistory"
            :key="history.orderId"
            :record="history"
          />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>
