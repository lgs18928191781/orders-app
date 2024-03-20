<script lang="ts" setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { getIssues } from '@/queries/issues'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()

const { data: issues } = useQuery({
  queryKey: [
    'issues',
    {
      network: networkStore.network,
      address: connectionStore.getAddress,
    },
  ],
  queryFn: () =>
    getIssues({
      address: connectionStore.getAddress,
    }),
  enabled: computed(() => !!connectionStore.connected),
})
</script>

<template>
  <div
    class="mx-auto mt-8 flex min-h-[75vh] min-w-[50vw] flex-col rounded-xl border-2 border-primary/20 bg-zinc-900 p-8 shadow-lg shadow-primary/10 hover:shadow-primary/20"
  >
    <div class="-mt-2 border-b border-primary/30 pb-4">
      <h3 class="text-lg font-bold text-zinc-300">
        Issues
        <span v-if="issues?.length">({{ issues.length }})</span>
      </h3>
    </div>

    <div class="flex grow flex-col justify-start space-y-4 py-4">
      <div
        class="text-center text-base text-zinc-500"
        v-if="issues && !issues.length"
      >
        You have no ongoing issues.
      </div>
      <IssueItem v-for="issue of issues" :key="issue.orderId" :issue="issue" />
    </div>
  </div>
</template>
