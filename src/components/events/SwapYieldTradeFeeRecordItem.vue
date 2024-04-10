<script lang="ts" setup>
import { CopyIcon } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

import {
  prettyAddress,
  prettyCoinDisplay,
  prettyTimestamp,
} from '@/lib/formatters'
import { type SwapYieldTradeFeeHistory } from '@/queries/swap-yield-reward-history.query'

const props = defineProps<{
  record: SwapYieldTradeFeeHistory
}>()

const onCopyOrderId = () => {
  navigator.clipboard.writeText(props.record.recordId)

  ElMessage.success('Order ID copied')
}
</script>

<template>
  <div class="rounded-lg border border-primary/15 bg-zinc-950 px-4 py-4">
    <h3 class="flex items-center justify-between">
      <div class="flex items-center text-lg">
        <span class="font-bold text-primary" v-if="record.proportionFee">
          {{ prettyCoinDisplay(record.proportionFee, 'btc') }}
        </span>
        <span v-else class="text-zinc-500">Calculating...</span>
      </div>

      <span class="text-sm text-zinc-500">
        {{ `${prettyTimestamp(record.timestamp)}` }}
      </span>
    </h3>

    <div class="mt-4 flex items-center justify-between">
      <div class="space-y-2 text-sm">
        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500">Order ID</span>

          <div class="flex items-center gap-2">
            <div class="text-zinc-500">
              {{ prettyAddress(record.recordId, 6) }}
            </div>

            <button title="copy order id" @click="onCopyOrderId">
              <CopyIcon
                class="size-4 cursor-pointer text-zinc-500 hover:text-primary"
              />
            </button>
          </div>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500">
            Blocks per round
          </span>
          <span>
            {{ record.dailyBlock || '-' }}
          </span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500"
            >Reward Block Range</span
          >
          <span v-if="record.startBlock">
            {{ record.startBlock + ' - ' + record.endBlock }}
          </span>

          <span v-else>-</span>
        </div>

        <!-- <div class="flex items-center">
          <span class="w-40 shrink-0 inline-block text-zinc-500">Reward</span>
          <span class="font-bold text-primary" v-if="record.rewardAmount">
            {{ record.rewardAmount }} {{ EVENT_REWARDS_TICK.toUpperCase() }}
          </span>
          <span v-else class="text-zinc-500">Calculating...</span>
        </div> -->

        <!-- <div class="flex items-center">
          <span class="w-40 shrink-0 inline-block text-zinc-500">Reward %</span>
          <span class="" v-if="record.percentage">
            {{ (record.percentage / 100).toFixed(2) }}%
          </span>
          <span v-else class="text-zinc-500">Calculating...</span>
        </div> -->
      </div>
    </div>
  </div>
</template>
