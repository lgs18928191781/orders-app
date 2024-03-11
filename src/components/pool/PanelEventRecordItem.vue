<script lang="ts" setup>
import { prettyAddress, prettyBalance, prettyTimestamp } from '@/lib/formatters'
import { getMyEventRecords } from '@/queries/pool'
import { unit, useBtcUnit } from '@/lib/helpers'
import { EVENT_REWARDS_TICK } from '@/data/constants'
import { CopyIcon } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  record: Awaited<ReturnType<typeof getMyEventRecords>>[0]
}>()

const onCopyOrderId = () => {
  navigator.clipboard.writeText(props.record.orderId)

  ElMessage.success('Order ID copied')
}
</script>

<template>
  <div class="mx-4 rounded-lg bg-zinc-950 px-4 py-4">
    <h3 class="flex items-center justify-between">
      <span class="text-primary">
        {{
          `${
            record.fromOrderCoinAmount
          } ${record.tick.toUpperCase()} / ${prettyBalance(
            record.fromOrderAmount,
            useBtcUnit,
          )} ${unit}`
        }}
      </span>

      <span class="text-sm text-zinc-500">
        {{ `${prettyTimestamp(record.fromOrderDealTime)}` }}
      </span>
    </h3>

    <div class="mt-4 flex items-center justify-between">
      <div class="space-y-2 text-sm">
        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500">Order ID</span>

          <div class="flex items-center gap-2">
            <div class="text-zinc-500">
              {{ prettyAddress(record.orderId, 6) }}
            </div>

            <button title="copy order id" @click="onCopyOrderId">
              <CopyIcon
                class="size-4 cursor-pointer text-zinc-500 hover:text-primary"
              />
            </button>
          </div>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500"
            >Deal Block</span
          >
          <span>
            {{ record.fromOrderDealBlock || '-' }}
          </span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500"
            >Reward Block Range</span
          >
          <span v-if="record.calStartBlock">
            {{ record.calStartBlock + ' - ' + record.calEndBlock }}
          </span>

          <span v-else>-</span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500">Reward</span>
          <span class="font-bold text-primary" v-if="record.rewardAmount">
            {{ record.rewardAmount }} {{ EVENT_REWARDS_TICK.toUpperCase() }}
          </span>
          <span v-else class="text-zinc-500">Calculating...</span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-40 shrink-0 text-zinc-500">Reward %</span>
          <span class="" v-if="record.percentage">
            {{ (record.percentage / 100).toFixed(2) }}%
          </span>
          <span v-else class="text-zinc-500">Calculating...</span>
        </div>
      </div>
    </div>
  </div>
</template>
