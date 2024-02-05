<script lang="ts" setup>
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2Icon } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { DEBUG } from '@/data/constants'
import { useConnectionStore } from '@/stores/connection'
import events from '@/data/events'
import {
  getEventRemains,
  getEventStats,
  postClaimReward,
} from '@/queries/events'
import { sleep } from '@/lib/helpers'
import { buildClaim } from '@/lib/builders/orders-v2'
import { useBtcJsStore } from '@/stores/btcjs'

import EventRecords from '@/components/events/Records.vue'
import EventSelect from '@/components/events/EventSelect.vue'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'

const connectionStore = useConnectionStore()

const event = ref(events[events.length - 1].symbol)
const { data: eventStats, isFetching: isFetchingEventStats } = useQuery({
  queryKey: ['events', { event, address: connectionStore.getAddress }],
  queryFn: () => getEventStats({ event: event.value }),
  enabled: computed(() => !!event.value),
})

const { data: eventRemains, isFetching: isFetchingEventRemains } = useQuery({
  queryKey: ['eventsRemains', { event }],
  queryFn: () => getEventRemains({ event: event.value }),
  enabled: computed(() => !!event.value),
})

const queryClient = useQueryClient()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const builtInfo = ref<void | Awaited<ReturnType<any>>>()
const { mutate: mutateClaimReward } = useMutation({
  mutationFn: postClaimReward,
  onSuccess: () => {
    ElMessage.success('Reward claimed')
    queryClient.invalidateQueries({
      queryKey: ['events', { event, address: connectionStore.getAddress }],
    })
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})
async function onClaimReward() {
  try {
    if (!eventStats.value) return
    // build pay Tx
    openBuilding()

    const res = await buildClaim().catch(async (e) => {
      await sleep(500)
      console.log(e)
      ElMessage.error(e.message)
    })
    builtInfo.value = res

    if (!res) return
    // ask wallet adapter to sign
    const signed = await connectionStore.adapter.signPsbt(res.order.toHex())
    // derive txid from signed psbt
    const bitcoinjs = useBtcJsStore().get!
    const signedPsbt = bitcoinjs.Psbt.fromHex(signed)
    const payTxid = signedPsbt.extractTransaction().getId()
    const feeRawTx = signedPsbt.extractTransaction().toHex()
    mutateClaimReward({
      rewardAmount: eventStats.value.total,
      feeSend: res.feeSend,
      feeInscription: res.feeInscription,
      networkFeeRate: res.feeb,
      feeUtxoTxId: payTxid,
      feeRawTx,
      rewardType: Number(event.value),
    })
    closeBuilding()
  } catch (e: any) {
    if (DEBUG) {
      console.log(e)
      ElMessage.error(e.message)
    } else {
      ElMessage.error('Error while claiming reward.')
    }
    closeBuilding()
  }
}
</script>

<template>
  <div class="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-2xl font-semibold text-left mb-6 text-zinc-100">
      Events & Rewards
    </h1>

    <section
      class="mb-8 p-6 rounded-lg bg-zinc-900 shadow-md shadow-primary/30 border border-primary/20"
    >
      <div class="flex gap-8 items-center">
        <span class="text-lg text-zinc-300">Choose Event</span>

        <div class="">
          <div class="flex gap-4 items-center">
            <EventSelect v-model:event-symbol="event" />

            <Loader2Icon
              class="w-6 h-6 text-zinc-300 animate-spin-slow"
              v-if="isFetchingEventStats || isFetchingEventRemains"
            />
          </div>

          <div
            v-if="eventRemains && eventRemains.remainingInfo"
            class="flex items-center mt-2 space-x-2"
          >
            <span class="text-zinc-500">Rewards pool remaining: </span>
            <span>{{ eventRemains.remainingInfo }}</span>
          </div>
        </div>
      </div>

      <!-- a border -->
      <div class="col-span-3 border-b border-primary/20 pt-4 mb-4"></div>

      <div class="">
        <h3 class="text-sm font-medium leading-6 text-zinc-300">My Rewards</h3>
        <div class="mt-2 flex items-center gap-4 text-lg" v-if="eventStats">
          <div class="flex items-baseline gap- text-primary">
            <span class="font-bold text-3xl">
              {{ isFetchingEventStats ? '-' : eventStats.total }}
            </span>

            <span class="ml-1 uppercase">
              ${{ eventStats.rewardTick.toUpperCase() }}
            </span>
          </div>

          <!-- claim button -->
          <button
            class="rounded bg-primary text-orange-950 px-4 py-1 shadow-md shadow-primary/20 text-sm hover:shadow-primary/50 disabled:opacity-30 disabled:saturate-50 disabled:shadow-none"
            @click="onClaimReward"
            :disabled="!eventStats || eventStats.total === 0"
            v-if="eventStats && eventStats.total > 0"
          >
            Claim
          </button>
        </div>
      </div>
    </section>

    <EventRecords :event="event" />
  </div>
</template>
