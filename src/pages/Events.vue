<script lang="ts" setup>
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2Icon } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useConnectionStore } from '@/stores/connection'
import { useBtcJsStore } from '@/stores/btcjs'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'

import { getEventStatsQuery } from '@/queries/event-stats.query'
import { getEventRemains, postClaimReward } from '@/queries/events'

import { prettyBalance, prettyBtcDisplay } from '@/lib/formatters'
import { sleep } from '@/lib/helpers'
import { buildClaim } from '@/lib/builders/orders-v2'
import events from '@/data/events'
import { DEBUG, SWAP_YIELD_TRADE_FEE_CLAIM_THRESHOLD } from '@/data/constants'

const connectionStore = useConnectionStore()

const event = ref(events[events.length - 1].symbol)
const { data: eventStats, isFetching: isFetchingEventStats } = useQuery(
  getEventStatsQuery(
    {
      event: computed(() => event.value),
      address: connectionStore.getAddress,
    },
    computed(() => !!event.value),
  ),
)

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

async function onClaimTradeFee() {
  console.log('todo')
}
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-left text-2xl font-semibold text-zinc-100">
        Events & Rewards
      </h1>

      <router-link
        to="/leaderboard"
        class="text-zinc-300 underline hover:text-primary"
      >
        Leaderboard
      </router-link>
    </div>

    <section
      class="mb-8 rounded-lg border border-primary/20 bg-zinc-900 p-6 shadow-md shadow-primary/30"
    >
      <div class="flex items-center gap-8">
        <span class="text-lg text-zinc-300">Choose Event</span>

        <div class="">
          <div class="flex items-center gap-4">
            <EventSelect v-model:event-symbol="event" />

            <Loader2Icon
              class="size-6 animate-spin-slow text-zinc-300"
              v-if="isFetchingEventStats || isFetchingEventRemains"
            />
          </div>

          <div
            v-if="eventRemains && eventRemains.remainingInfo"
            class="mt-2 flex items-center space-x-2"
          >
            <span class="text-zinc-500">Rewards pool remaining: </span>
            <span>{{ eventRemains.remainingInfo }}</span>
          </div>
        </div>
      </div>

      <!-- a border -->
      <div class="col-span-3 mb-4 border-b border-primary/20 pt-4"></div>

      <div class="">
        <h3 class="text-sm font-medium leading-6 text-zinc-300">My Rewards</h3>
        <div class="mt-2 flex items-center gap-4 text-lg" v-if="eventStats">
          <div class="gap- flex items-baseline text-primary">
            <span
              class="text-3xl font-bold"
              v-if="eventStats.rewardTick === 'btc'"
            >
              {{ isFetchingEventStats ? '-' : prettyBalance(eventStats.total) }}
            </span>

            <span class="text-3xl font-bold" v-else>
              {{ isFetchingEventStats ? '-' : eventStats.total }}
            </span>

            <span class="ml-1 uppercase" v-if="eventStats.rewardTick === 'btc'">
              BTC
            </span>
            <span class="ml-1 uppercase" v-else>
              ${{ eventStats.rewardTick.toUpperCase() }}
            </span>
          </div>

          <!-- claim button -->
          <div
            v-if="
              event === 'swapYieldTradeFee' &&
              eventStats &&
              eventStats.total > 0
            "
            class="flex items-center gap-4"
          >
            <button
              class="rounded bg-primary px-4 py-1 text-sm text-orange-950 shadow-md shadow-primary/20 hover:shadow-primary/50 disabled:opacity-30 disabled:shadow-none disabled:saturate-50"
              @click="onClaimTradeFee"
              :disabled="
                !eventStats ||
                eventStats.total < SWAP_YIELD_TRADE_FEE_CLAIM_THRESHOLD
              "
            >
              Claim
            </button>
            <div class="mt-2 text-xs text-zinc-500">
              You need to accumulate at least 0.001 BTC to claim.
            </div>
          </div>

          <button
            class="rounded bg-primary px-4 py-1 text-sm text-orange-950 shadow-md shadow-primary/20 hover:shadow-primary/50 disabled:opacity-30 disabled:shadow-none disabled:saturate-50"
            @click="onClaimReward"
            :disabled="!eventStats || eventStats.total === 0"
            v-else-if="
              event !== 'swapYieldTradeFee' &&
              eventStats &&
              eventStats.total > 0
            "
          >
            Claim
          </button>
        </div>
      </div>
    </section>

    <SwapYieldBrc20Records :event="event" v-if="event === '51'" />
    <SwapYieldTradeFeeRecords
      :event="event"
      v-else-if="event === 'swapYieldTradeFee'"
    />
    <EventRecords :event="event" v-else />
  </div>
</template>
