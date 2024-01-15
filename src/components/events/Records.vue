<script setup lang="ts">
import { getClaimHistory, getRewardHistory } from '@/queries/events'
import { useConnectionStore } from '@/stores/connection'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

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
    { event: props.event, address: connectionStore.getAddress },
  ],
  queryFn: () => getRewardHistory({ event: props.event }),
  select: (data) => {
    return data
  },
  enabled: computed(() => connectionStore.connected),
})

const { data: claimHistory } = useQuery({
  queryKey: [
    'claimHistory',
    { event: props.event, address: connectionStore.getAddress },
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
    <TabList class="flex gap-8">
      <Tab as="template" v-slot="{ selected }">
        <button
          class="text-lg font-bold"
          :class="[selected ? 'text-orange-300 underline' : 'text-zinc-300']"
        >
          Reward History
        </button>
      </Tab>
      <Tab as="template" v-slot="{ selected }">
        <button
          class="text-lg font-bold"
          :class="[selected ? 'text-orange-300 underline' : 'text-zinc-300']"
        >
          Claim History
        </button>
      </Tab>
    </TabList>

    <TabPanels class="mt-8">
      <TabPanel>
        <template v-if="rewardHistory">
          <div v-for="record in rewardHistory" v-if="rewardHistory.length">
            {{ record }}
          </div>

          <div class="text-lg font-bold text-center text-zinc-500" v-else>
            No reward history
          </div>
        </template>
      </TabPanel>
      <TabPanel>
        <template v-if="claimHistory">
          <div v-for="record in claimHistory" v-if="claimHistory.length">
            {{ record }}
          </div>

          <div class="text-lg font-bold text-center text-zinc-500" v-else>
            No claim history
          </div>
        </template>
      </TabPanel>
    </TabPanels>
  </TabGroup>
</template>

<style scoped></style>
