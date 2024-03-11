<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Decimal from 'decimal.js'
import { get } from '@vueuse/core'

import { useSwapPool } from '@/hooks/use-swap-pool'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useFiat } from '@/hooks/use-fiat'
import { useEmptyPoolSignal } from '@/hooks/use-empty-pool-signal'

import { getPoolStatusQuery } from '@/queries/swap.query'
import { prettyBalance, prettySymbol } from '@/lib/formatters'
import { Loader2Icon } from 'lucide-vue-next'

const { token1, token2, token1Icon, token2Icon, pairStr } = useSwapPool()

const { isEmpty } = useEmptyPoolSignal()

const { useFiatRateQuery, getFiatPrice, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const router = useRouter()
const address = connectionStore.getAddress
const network = networkStore.network

const { data: poolStatus, isLoading: isLoadingPoolStatus } = useQuery(
  getPoolStatusQuery(
    {
      token1: token1,
      token2: token2,
      address,
      network,
    },
    computed(() => !!address),
  ),
)
const hasPending = computed(
  () =>
    poolStatus.value?.poolSharePending !== '0' &&
    poolStatus.value?.poolSharePending !== '0%',
)

const tvl = computed(() => {
  if (!poolStatus.value || !fiatRate.value) return '0'

  const token1Pool = poolStatus.value.token1Pool
  const valueInFiat = getFiatPrice(token1Pool, get(fiatRate))
  return '≈ $' + new Decimal(valueInFiat).mul(2).toDP(2).toString()
})

function toAdd() {
  router.push(`/swap-pools/${pairStr.value}/add`)
}

function toSwap() {
  router.push(`/swap/${pairStr.value}`)
}
</script>

<template>
  <div class="hidden gap-8 lg:grid" v-if="poolStatus">
    <!-- row 1 -->
    <div class="flex items-end justify-between gap-4 text-sm xl:text-base">
      <!-- left -->
      <div class="flex flex-col items-start gap-6">
        <!-- title -->
        <div class="flex items-center text-2xl">
          <img
            :src="token1Icon"
            class="size-6 rounded-full"
            v-if="token1Icon"
          />
          <img
            :src="token2Icon"
            class="-ml-2 size-6 rounded-full"
            v-if="token2Icon"
          />
          <div class="ml-2">
            <p
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 "
            >
              {{ prettySymbol(token1) }}/{{ prettySymbol(token2) }}
            </p>
          </div>

          <div class="ml-2 text-base text-zinc-500" v-if="isEmpty">
            (New Pool)
          </div>
        </div>

        <!-- ratio -->
        <div class="space-y-2">
          <div
            class="flex items-center gap-2 rounded-xl bg-zinc-800/80 px-4 py-2 text-sm text-zinc-300 xl:text-base"
          >
            <img
              :src="token1Icon"
              class="size-6 rounded-full"
              v-if="token1Icon"
            />

            <div class="">
              {{
                `1 ${prettySymbol(token1)} = ${
                  poolStatus.token2PerToken1UsingBtcUnit
                } ${prettySymbol(token2)}`
              }}
            </div>
          </div>

          <div
            class="flex items-center gap-2 rounded-xl bg-zinc-800/80 px-4 py-2 text-sm text-zinc-300 xl:text-base"
          >
            <img
              :src="token2Icon"
              class="size-6 rounded-full"
              v-if="token2Icon"
            />

            <div class="">
              {{
                `1 ${prettySymbol(token2)} = ${
                  poolStatus.token1PerToken2UsingBtcUnit
                } ${prettySymbol(token1)}`
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- right -->
      <div class="flex justify-end space-x-3 text-zinc-300">
        <button
          class="rounded-xl bg-zinc-700 px-4 py-3 hover:text-zinc-400"
          @click="toAdd"
        >
          Add Liquidity
        </button>

        <button
          class="rounded-xl border-2 border-primary border-opacity-60 bg-transparent bg-opacity-80 px-6 py-2.5 text-orange-50 hover:border-opacity-100 hover:bg-opacity-100 hover:text-primary"
          @click="toSwap"
          v-if="!isEmpty"
        >
          Swap
        </button>
      </div>
    </div>

    <!-- row 2 -->
    <div
      className="w-full dark:bg-zinc-900 bg-white dark:bg-grid-small-white/[0.25] bg-grid-black/[0.2] relative rounded-3xl text-base"
    >
      <div
        className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-zinc-900 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,#18181b)] rounded-3xl z-10"
      ></div>
      <div class="relative z-20 flex items-start gap-8 p-4 text-zinc-300">
        <div class="w-72 rounded-2xl bg-zinc-800/50 p-4">
          <div class="label">Total Tokens Locked</div>

          <div class="mt-6 flex items-center gap-2 text-zinc-300">
            <img
              :src="token1Icon"
              class="size-6 rounded-full"
              v-if="token1Icon"
            />

            <div class="">
              {{ `${prettySymbol(token1)}` }}
            </div>

            <div class="ml-auto font-bold">
              {{ prettyBalance(poolStatus.token1Pool) }}
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2 text-zinc-300">
            <img
              :src="token2Icon"
              class="size-6 rounded-full"
              v-if="token2Icon"
            />

            <div class="">
              {{ `${prettySymbol(token2)}` }}
            </div>

            <div class="ml-auto font-bold">
              {{ poolStatus.token2Pool }}
            </div>
          </div>
        </div>

        <!-- right stats area -->
        <div class="grid grow grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div class="col-span-3 text-base font-bold text-primary/80">
            Pool Overview
          </div>
          <div class="">
            <div class="label">TVL</div>

            <div class="value">
              {{ tvl }}
            </div>
          </div>

          <div class="">
            <div class="label">Volume 24h</div>

            <div class="value">
              {{ '-' }}
            </div>
          </div>

          <div class="">
            <div class="label">24h Fees</div>

            <div class="value">
              {{ '-' }}
            </div>
          </div>

          <div class="col-span-3 mt-6 text-base font-bold text-primary/80">
            Your Position
          </div>

          <div class="">
            <div class="label">Pool Share</div>

            <div class="value">
              {{ poolStatus.poolShareAvailable }}
            </div>
            <div class="secondary flex items-center gap-2" v-if="hasPending">
              {{ '+ ' + poolStatus.poolSharePending }}
              <Loader2Icon class="size-3 animate-spin" />
            </div>
          </div>

          <div class="">
            <div class="label">{{ prettySymbol(token1) }}</div>

            <div class="value">
              {{ poolStatus.token1AmountUsingBtcUnitAvailable }}
            </div>
            <div class="secondary flex items-center gap-2" v-if="hasPending">
              {{ '+ ' + poolStatus.token1AmountUsingBtcUnitPending }}
              <Loader2Icon class="size-3 animate-spin" />
            </div>
          </div>

          <div class="">
            <div class="label">{{ prettySymbol(token2) }}</div>

            <div class="value">
              {{ poolStatus.token2AmountAvailable }}
            </div>
            <div class="secondary flex items-center gap-2" v-if="hasPending">
              {{ '+ ' + poolStatus.token2AmountPending }}
              <Loader2Icon class="size-3 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- row 3 -->
    <SwapStatsTransactions v-if="!isEmpty" />
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply mt-1 flex items-center gap-2 font-bold text-zinc-300;
}

.secondary {
  @apply text-zinc-500;
}
</style>
