<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import { computed, inject } from 'vue'

import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import { getMyReleasedRecords } from '@/queries/pool'

import PanelReleaseHistoryItem from './PanelReleaseHistoryItem.vue'
import { useConnectionStore } from '@/stores/connection'

const connectionStore = useConnectionStore()

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const enabled = computed(() => connectionStore.connected)

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
    <h3>
      <span class="text-zinc-500">Liquidity Usage History</span>
      <span class="pl-4 text-sm text-zinc-300"
        >({{ releaseHistory ? releaseHistory.length : 0 }})</span
      >
    </h3>
    <div
      class="nicer-scrollbar -mx-4 mt-4 h-[40vh] grow space-y-2 overflow-y-auto rounded"
    >
      <p v-if="isLoadingReleaseHistory" class="pt-4 text-center text-zinc-500">
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
    </div>
  </div>
</template>
