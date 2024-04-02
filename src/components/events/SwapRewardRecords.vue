<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import {
  getClaimHistory,
  getRewardHistory,
  getSwapRewardHistory,
} from '@/queries/events'
import { useConnectionStore } from '@/stores/connection'

const connectionStore = useConnectionStore()

const props = defineProps({
  event: {
    type: String,
    required: true,
  },
})

const { data: rewardHistory } = useQuery({
  queryKey: [
    'rewardHistory',
    { event: computed(() => props.event), address: connectionStore.getAddress },
  ],
  queryFn: () => getSwapRewardHistory({ event: props.event }),
  select: (data) => {
    return data
  },
  enabled: computed(() => connectionStore.connected),
})

const { data: claimHistory } = useQuery({
  queryKey: [
    'claimHistory',
    { event: computed(() => props.event), address: connectionStore.getAddress },
  ],
  queryFn: () => getClaimHistory({ event: props.event }),
  select: (data) => {
    return data
  },
  enabled: computed(() => connectionStore.connected),
})
</script>

<template>
  <TabGroup as="div">
    <TabList class="flex gap-2">
      <Tab as="template" v-slot="{ selected }">
        <button
          class="px-2 py-1 text-lg font-bold"
          :class="[selected ? 'text-primary underline' : 'text-zinc-300']"
        >
          Reward History
        </button>
      </Tab>
      <Tab as="template" v-slot="{ selected }">
        <button
          class="px-2 py-1 text-lg font-bold"
          :class="[selected ? 'text-primary underline' : 'text-zinc-300']"
        >
          Claim History
        </button>
      </Tab>
    </TabList>

    <TabPanels class="mt-8">
      <TabPanel class="space-y-2">
        <template v-if="rewardHistory">
          <SwapRewardRecordItem
            v-for="record in rewardHistory"
            :record="record"
            v-if="rewardHistory.length"
          />

          <div class="text-center text-lg font-bold text-zinc-500" v-else>
            No reward history
          </div>
        </template>
      </TabPanel>
      <TabPanel class="space-y-2">
        <template v-if="claimHistory">
          <ClaimRecordItem
            v-for="record in claimHistory"
            :record="record"
            v-if="claimHistory.length"
          />

          <div class="text-center text-lg font-bold text-zinc-500" v-else>
            No claim history
          </div>
        </template>
      </TabPanel>
    </TabPanels>
  </TabGroup>
</template>

<style scoped></style>
