<script lang="ts" setup>
import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { getIssueDetail, submitRecover, type Issue } from '@/queries/issues'
import { prettyBtcDisplay, prettyTimestamp } from '@/lib/formatters'
import { DEBUG } from '@/data/constants'
import { useFeebStore } from '@/stores/feeb'
import { raise } from '@/lib/helpers'

import BuildingOverlay from '@/components/overlays/Loading.vue'

const props = defineProps<{
  issue: Issue
}>()

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()

const queryClient = useQueryClient()
const { mutate: mutateRecover } = useMutation({
  mutationFn: submitRecover,
  onSuccess: () => {
    ElMessage.success('Issue recovered')
    queryClient.invalidateQueries({
      queryKey: [
        'issues',
        {
          network: networkStore.network,
          address: connectionStore.getAddress,
        },
      ],
    })
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})

const building = ref(false)
async function onRecover() {
  building.value = true
  try {
    const feeb = useFeebStore().get ?? raise('Select a gas plan first.')
    const networkFeeRate = String(feeb)
    // get brc psbt
    const issueDetail = await getIssueDetail({
      orderId: props.issue.orderId,
      networkFeeRate,
    })

    // const releasePsbt = await buildRecoverPsbt({
    //   psbtRaw: issueDetail.psbtRaw,
    // })

    mutateRecover({
      orderId: props.issue.orderId,
      psbtRaw: issueDetail.psbtRaw,
      networkFeeRate,
    })
  } catch (e: any) {
    if (DEBUG) {
      console.log(e)
      ElMessage.error(e.message)
    } else {
      ElMessage.error(`Error while recovering issue. Reason: ${e.message}`)
    }
  }

  building.value = false
}
</script>

<template>
  <BuildingOverlay v-if="building" />

  <div class="p-4 bg-black rounded-md">
    <!-- order id -->
    <h3 class="text-zinc-500 text-xs">
      {{ issue.orderId }}
    </h3>

    <div class="mt-4 flex items-center justify-between">
      <div class="space-2">
        <div class="flex gap-1 text-primary">
          <div>{{ prettyBtcDisplay(issue.amount) }}</div>
        </div>

        <div class="text-sm text-zinc-300">
          {{ prettyTimestamp(issue.timestamp) }}
        </div>
      </div>

      <div class="">
        <button
          class="text-primary border border-primary/30 px-4 py-1 rounded-md shadow-md shadow-primary/10 hover:shadow-primary/30 hover:bg-primary hover:text-orange-950 transition-all duration-200"
          @click="onRecover"
        >
          Recover
        </button>
      </div>
    </div>

    <div class="flex mt-4 text-xs gap-8">
      <div class="text-zinc-500">Issue Description</div>
      <ul class="list-disc space-y-1">
        <li class="">Sell transactions failed</li>
        <li>BTC asset stuck in multi-sig address</li>
      </ul>
    </div>
  </div>
</template>
