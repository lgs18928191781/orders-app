<script lang="ts" setup>
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import { inject, ref } from 'vue'
import Decimal from 'decimal.js'

import { prettyTimestamp } from '@/lib/formatters'
import {
  type PoolRecord,
  getReleaseEssential,
  submitRelease,
} from '@/queries/pool'
import { useAddressStore } from '@/store'
import { DEBUG, SIGHASH_SINGLE_ANYONECANPAY } from '@/data/constants'
import { buildReleasePsbt } from '@/lib/order-pool-builder'
import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'

import ReleasingOverlay from '@/components/overlays/Loading.vue'

const props = defineProps<{
  record: PoolRecord
}>()

const queryClient = useQueryClient()
const addressStore = useAddressStore()

const releasing = ref(false)

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const { mutate: mutateFinishRecord } = useMutation({
  mutationFn: submitRelease,
  onSuccess: () => {
    ElMessage.success('Record released')
    queryClient.invalidateQueries({
      queryKey: [
        'poolRecords',
        {
          address: addressStore.get as string,
          tick: selectedPair.fromSymbol,
        },
      ],
    })
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})

async function submitReleaseRecord() {
  releasing.value = true
  try {
    const releaseEssential = await getReleaseEssential({
      orderId: props.record.orderId,
      tick: props.record.tick,
    })

    const releasePsbt = await buildReleasePsbt({
      btcMsPsbtRaw: releaseEssential.psbtRaw,
      ordinalMsPsbtRaw: releaseEssential.coinPsbtRaw,
      ordinalReleasePsbtRaw: releaseEssential.coinTransferPsbtRaw,
    })

    type ToSignInput = {
      index: number
      address: string
      sighashTypes: number[]
    }
    const toSignInputs: ToSignInput[] = [
      {
        index: 0,
        address: addressStore.get!,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
      {
        index: 1,
        address: addressStore.get!,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
      {
        index: 2,
        address: addressStore.get!,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
      {
        index: 4,
        address: addressStore.get!,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
    ]
    const signed = await window.unisat.signPsbt(releasePsbt.toHex(), {
      autoFinalized: true,
      toSignInputs,
    })

    mutateFinishRecord({
      orderId: props.record.orderId,
      psbtRaw: signed,
    })
  } catch (e: any) {
    if (DEBUG) {
      console.log(e)
      ElMessage.error(e.message)
    } else {
      ElMessage.error('Error while releasing record.')
    }
  }

  releasing.value = false
}
</script>

<template>
  <ReleasingOverlay v-if="releasing" />

  <div class="py-4 mx-4 bg-zinc-950 rounded-lg px-4">
    <h3 class="items-center flex justify-between">
      <span class="text-orange-300" v-if="record.poolType === 3">
        {{
          `${record.coinAmount} ${record.tick.toUpperCase()} / ${new Decimal(
            record.amount
          ).dividedBy(1e8)} BTC`
        }}
      </span>
      <span class="text-orange-300" v-else>
        {{ `${record.coinAmount} ${record.tick.toUpperCase()}` }}
      </span>

      <span class="text-zinc-500 text-sm">
        {{ `${prettyTimestamp(record.timestamp)}` }}
      </span>
    </h3>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm space-y-2">
        <div class="flex items-center">
          <span class="w-20 inline-block text-zinc-500">Type</span>
          <span>{{
            record.poolType === 3
              ? 'Bidirectional Liquidity'
              : 'Unidirectional Liquidity'
          }}</span>
        </div>

        <div class="flex items-center">
          <span class="w-20 inline-block text-zinc-500">Assets</span>
          <span v-if="record.poolType === 3">
            {{
              `${
                record.coinAmount
              } ${record.tick.toUpperCase()} / ${new Decimal(
                record.amount
              ).dividedBy(1e8)} BTC`
            }}
          </span>
          <span v-else>
            {{ `${record.coinAmount} ${record.tick.toUpperCase()}` }}
          </span>
        </div>

        <div class="flex items-center">
          <span class="w-20 inline-block text-zinc-500">Rewards</span>
          <span>
            {{
              record.rewardCoinAmount ? `${record.rewardCoinAmount} RDEX` : '-'
            }}
          </span>
        </div>
      </div>

      <button
        :class="[
          'rounded-md bg-orange-300 text-orange-950 px-6 py-2 shadow-md shadow-orange-300/20',
          { 'opacity-30 saturate-50': record.claimState !== 'ready' },
        ]"
        @click.prevent="submitReleaseRecord"
        :disabled="record.claimState !== 'ready'"
      >
        {{ record.claimState === 'ready' ? 'Release' : 'Pending' }}
      </button>
    </div>
  </div>
</template>