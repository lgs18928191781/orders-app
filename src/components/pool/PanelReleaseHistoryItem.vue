<script lang="ts" setup>
import Decimal from 'decimal.js'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { computed } from 'vue'
import { ExternalLinkIcon, ChevronRightIcon } from 'lucide-vue-next'

import { prettyBalance, prettyTimestamp, prettyTxid } from '@/lib/formatters'
import { type ReleaseHistory } from '@/queries/pool'
import { POOL_REWARDS_TICK } from '@/data/constants'
import { toBlock, toTx, unit, useBtcUnit } from '@/lib/helpers'

const props = defineProps<{
  record: ReleaseHistory
}>()

const status = computed(() => {
  if (props.record.releaseTxBlock) {
    return 'confirmed'
  }

  return 'unconfirmed'
})
</script>

<template>
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
          <span class="inline-block w-32 text-zinc-500">Type</span>
          <span>{{
            record.poolType === 3
              ? 'Bidirectional Liquidity'
              : 'Unidirectional Liquidity'
          }}</span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-32 text-zinc-500">Assets</span>
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
          <span class="inline-block w-32 text-zinc-500">Released At</span>
          <span>
            {{ prettyTimestamp(record.releaseTime) }}
          </span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-32 text-zinc-500">Release Block</span>
          <div
            class="flex items-center gap-2 hover:cursor-pointer"
            @click="toBlock(record.releaseTxBlock)"
            v-if="record.releaseTxBlock"
          >
            <span class="underline hover:text-primary">
              {{ record.releaseTxBlock }}
            </span>

            <ExternalLinkIcon class="inline-block size-4" />
          </div>
          <span v-else>-</span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-32 text-zinc-500">Deal Block</span>
          <div
            class="flex items-center gap-2 hover:cursor-pointer"
            @click="toBlock(record.dealCoinTxBlock)"
            v-if="record.dealCoinTxBlock"
          >
            <span class="underline hover:text-primary">
              {{ record.dealCoinTxBlock }}
            </span>

            <ExternalLinkIcon class="inline-block size-4" />
          </div>
          <span v-else>-</span>
        </div>

        <div class="flex items-center">
          <div class="inline-block w-32 text-zinc-500">
            Distributing across Blocks
          </div>
          <div class="text-zinc-300">
            {{ record.calStartBlock }} - {{ record.calEndBlock }}
          </div>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-32 text-zinc-500">Release Tx</span>
          <div
            class="flex items-center gap-2 hover:cursor-pointer"
            @click="toTx(record.releaseTx)"
          >
            <span class="underline hover:text-primary">
              {{ prettyTxid(record.releaseTx, 4) }}
            </span>

            <ExternalLinkIcon class="inline-block size-4" />
          </div>
        </div>

        <div class="flex items-baseline">
          <span class="inline-block w-32 shrink-0 text-zinc-500">Rewards</span>

          <Disclosure
            v-if="record.rewardRealAmount"
            as="div"
            v-slot="{ open }"
            class="grow"
          >
            <DisclosureButton class="flex items-center gap-2">
              <span>
                {{
                  `${
                    record.rewardRealAmount
                  } ${POOL_REWARDS_TICK.toUpperCase()}`
                }}
              </span>

              <ChevronRightIcon
                class="w-4"
                :class="open && 'rotate-90 transform'"
              />
            </DisclosureButton>

            <DisclosurePanel
              class="mt-0.5 space-y-2 rounded-md bg-black px-2 py-2 text-zinc-500"
            >
              <div class="">
                <span>=</span>
                <span class="ml-1 inline-flex items-center gap-1">
                  <span>{{ record.rewardAmount }}</span>
                  <span
                    class="rounded bg-zinc-700/30 px-2 py-0.5 text-xs text-primary"
                  >
                    base amount
                  </span>
                </span>
              </div>

              <div class="">
                <span>*</span>
                <span class="ml-1 inline-flex items-center gap-1">
                  <span>(100% - {{ record.decreasing }}%</span>
                  <span
                    class="rounded bg-red-900/30 px-2 py-0.5 text-xs text-red-700"
                  >
                    decrease % over time
                  </span>
                  <span>)</span>
                </span>
              </div>

              <div class="">
                <span>+</span>
                <span class="ml-1 inline-flex items-center gap-1">
                  <span>{{ record.rewardExtraAmount }}</span>
                  <span
                    class="rounded bg-cyan-900/30 px-2 py-0.5 text-xs text-cyan-700"
                  >
                    long standby time bonus
                  </span>
                </span>
              </div>
            </DisclosurePanel>
          </Disclosure>

          <span v-else>Calculating...</span>
        </div>

        <div class="flex items-center">
          <span class="inline-block w-32 text-zinc-500">Status</span>
          <span
            class="inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium capitalize"
            :class="[
              status === 'unconfirmed' ? 'text-primary' : 'text-green-500',
            ]"
          >
            {{ status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
