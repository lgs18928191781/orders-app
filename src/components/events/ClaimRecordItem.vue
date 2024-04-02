<script lang="ts" setup>
import { ExternalLinkIcon } from 'lucide-vue-next'

import { prettySymbol, prettyTimestamp, prettyTxid } from '@/lib/formatters'
import { toTx } from '@/lib/helpers'
import { type RewardsClaimRecord } from '@/queries/pool'

const { record } = defineProps<{
  record: RewardsClaimRecord
}>()
</script>

<template>
  <div class="mx-4 rounded-lg border border-primary/15 bg-zinc-950 px-4 py-4">
    <!-- order id -->
    <span class="text-xs text-zinc-500"># {{ record.orderId }}</span>

    <!-- order amount & timestamp -->
    <div class="mt-4 flex items-center justify-between">
      <div class="">
        <div class="flex items-center gap-2">
          <span class="text-primary">
            {{ `${record.rewardCoinAmount} ${prettySymbol(record.tick)}` }}
          </span>

          <span class="text-xs text-zinc-500">
            {{ `${prettyTimestamp(record.timestamp)}` }}
          </span>
        </div>

        <div class="mt-2 flex items-center gap-2" v-if="record.sendId">
          <span class="text-xs text-zinc-500">Claim Tx</span>

          <div
            class="flex items-center gap-2 hover:cursor-pointer"
            @click="toTx(record.sendId)"
          >
            <span class="underline hover:text-primary">
              {{ prettyTxid(record.sendId, 4) }}
            </span>

            <ExternalLinkIcon class="inline-block size-4" />
          </div>
        </div>
      </div>

      <!-- order state -->
      <span
        class="inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium capitalize"
        :class="[
          record.rewardState === 'pending' ? 'text-zinc-500' : 'text-green-500',
        ]"
      >
        {{ record.rewardState }}
      </span>
    </div>
  </div>
</template>
