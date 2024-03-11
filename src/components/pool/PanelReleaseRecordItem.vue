<script lang="ts" setup>
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import { inject, ref } from 'vue'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  HelpCircleIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from 'lucide-vue-next'

import { prettyBalance, prettyTimestamp, prettyTxid } from '@/lib/formatters'
import {
  type PoolRecord,
  getReleaseEssential,
  submitRelease,
} from '@/queries/pool'
import { useConnectionStore } from '@/stores/connection'
import {
  DEBUG,
  POOL_REWARDS_TICK,
  SIGHASH_SINGLE_ANYONECANPAY,
} from '@/data/constants'
import { buildReleasePsbt } from '@/lib/builders/pool'
import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import { toTx, unit, useBtcUnit } from '@/lib/helpers'

import ReleasingOverlay from '@/components/overlays/Loading.vue'

const props = defineProps<{
  record: PoolRecord
}>()

const queryClient = useQueryClient()
const connectionStore = useConnectionStore()

const releasing = ref(false)

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const { mutate: mutateFinishRecord } = useMutation({
  mutationFn: submitRelease,
  onSuccess: () => {
    ElMessage.success('Record released')
    queryClient.invalidateQueries({
      queryKey: [
        'poolReleasableRecords',
        {
          address: connectionStore.getAddress,
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
        address: connectionStore.getAddress,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
      {
        index: 1,
        address: connectionStore.getAddress,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
      {
        index: 2,
        address: connectionStore.getAddress,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
      {
        index: 3,
        address: connectionStore.getAddress,
        sighashTypes: [SIGHASH_SINGLE_ANYONECANPAY],
      },
    ]
    const signed = await connectionStore.adapter.signPsbt(releasePsbt.toHex(), {
      autoFinalized: true,
      toSignInputs,
    })
    // 123

    mutateFinishRecord({
      orderId: props.record.orderId,
      psbtRaw: signed,
    })
  } catch (e: any) {
    if (DEBUG) {
      console.log(e)
      ElMessage.error(e.message)
    } else {
      ElMessage.error(`Error while releasing record. Reason: ${e.message}`)
    }
  }

  releasing.value = false
}
</script>

<template>
  <ReleasingOverlay v-if="releasing" />

  <div class="mx-4 rounded-lg bg-zinc-950 px-4 py-4">
    <h3 class="flex items-center justify-between">
      <span class="text-primary" v-if="record.poolType === 3">
        {{
          `${record.coinAmount} ${record.tick.toUpperCase()} / ${prettyBalance(
            record.amount,
            useBtcUnit,
          )} ${unit}`
        }}
      </span>
      <span class="text-primary" v-else>
        {{ `${record.coinAmount} ${record.tick.toUpperCase()}` }}
      </span>

      <span class="text-sm text-zinc-500">
        {{ `${prettyTimestamp(record.dealTime)}` }}
      </span>
    </h3>

    <div class="mt-4 flex items-center justify-between">
      <div class="space-y-2 text-sm">
        <div class="flex items-center">
          <span class="inline-block w-28 text-zinc-500">Type</span>
          <span>{{
            record.poolType === 3
              ? 'Bidirectional Liquidity'
              : 'Unidirectional Liquidity'
          }}</span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-28 text-zinc-500">Assets</span>
          <span v-if="record.poolType === 3">
            {{
              `${
                record.coinAmount
              } ${record.tick.toUpperCase()} / ${prettyBalance(
                record.amount,
                useBtcUnit,
              )} ${unit}`
            }}
          </span>
          <span v-else>
            {{ `${record.coinAmount} ${record.tick.toUpperCase()}` }}
          </span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-28 text-zinc-500">Tx Record</span>
          <div class="space-y-1">
            <div
              class="flex items-center gap-2 hover:cursor-pointer"
              @click="toTx(record.dealCoinTx)"
              v-if="record.dealCoinTx"
            >
              <span
                class="w-12 rounded bg-cyan-500/50 py-0.5 text-center text-xs"
              >
                {{ record.tick.toUpperCase() }}
              </span>
              <span class="underline hover:text-primary">
                {{ prettyTxid(record.dealCoinTx, 4) }}
              </span>

              <ExternalLinkIcon class="inline-block size-4" />
            </div>

            <div
              class="flex items-center gap-2 hover:cursor-pointer"
              @click="toTx(record.dealTx)"
              v-if="record.dealTx"
            >
              <span
                class="w-12 rounded bg-indigo-500/50 py-0.5 text-center text-xs"
              >
                BTC
              </span>
              <span class="underline hover:text-primary">
                {{ prettyTxid(record.dealTx, 4) }}
              </span>

              <ExternalLinkIcon class="inline-block size-4" />
            </div>
          </div>
        </div>

        <div class="flex items-center" v-if="record.claimState === 'ready'">
          <span class="inline-block w-28 text-zinc-500">Rewards</span>

          <Disclosure as="div" v-slot="{ open }" class="grow">
            <DisclosureButton class="flex items-center gap-2">
              <span v-if="record.calStartBlock === 0" class="text-zinc-500">
                Calculating...
              </span>
              <span v-else>
                {{
                  record.rewardAmount
                    ? `${
                        record.rewardAmount
                      } ${POOL_REWARDS_TICK.toUpperCase()}`
                    : '-'
                }}
              </span>
              <span class="ml-2">
                {{
                  record.percentage
                    ? ` - ${(record.percentage / 100).toFixed(2)} %`
                    : ''
                }}
              </span>

              <ChevronRightIcon
                class="w-4"
                :class="open && 'rotate-90 transform'"
              />
            </DisclosureButton>

            <DisclosurePanel
              class="mt-0.5 space-y-2 rounded-md bg-black px-2 py-2 text-xs text-zinc-500"
            >
              <div class="">
                <div>Confirm Block Height</div>
                <div class="text-zinc-300">
                  {{ record.dealCoinTxBlock }}
                </div>
              </div>

              <div class="">
                <div>Distributing across Blocks</div>
                <div class="text-zinc-300">
                  {{ record.calStartBlock }} - {{ record.calEndBlock }}
                </div>
              </div>
            </DisclosurePanel>
          </Disclosure>
        </div>

        <div class="flex items-center" v-if="record.decreasing">
          <span class="inline-block w-28 text-zinc-500">Reward %</span>

          <div class="flex items-center gap-1 text-red-400">
            <span>{{ record.decreasing + '%' }}</span>
            <!-- <ArrowDownRightIcon class="h-4 w-4" /> -->
          </div>

          <el-popover
            placement="bottom"
            title="What is decreasing?"
            :width="400"
            trigger="hover"
            content="The rewards obtained from this record will be reduced by a certain percentage unless this asset is released."
            popper-class="!bg-zinc-800 !text-zinc-300 !shadow-lg !shadow-primary/10 "
          >
            <template #reference>
              <HelpCircleIcon
                class="ml-2 h-4 w-4 text-zinc-300"
                aria-hidden="true"
              />
            </template>
          </el-popover>
        </div>
      </div>

      <button
        :class="[
          'rounded-md bg-primary px-6 py-2 text-orange-950 shadow-md shadow-primary/20',
          { 'opacity-30 saturate-50': record.claimState !== 'ready' },
        ]"
        @click.prevent="submitReleaseRecord"
        :disabled="record.claimState !== 'ready'"
        v-if="record.claimState === 'ready'"
      >
        {{ record.claimState === 'ready' ? 'Release' : 'Pending' }}
      </button>

      <span class="text-xs text-zinc-500" v-else>
        Waiting for block confirm
      </span>
    </div>
  </div>
</template>
