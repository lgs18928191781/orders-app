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
import { prettyBalance, prettyBtcDisplay, prettySymbol } from '@/lib/formatters'
import { Loader2Icon, LoaderIcon } from 'lucide-vue-next'
import { getPoolStatsQuery } from '@/queries/swap/pool-stats.query'

const { token1, token2, pairStr } = useSwapPool()

const { isEmpty } = useEmptyPoolSignal()

const { useFiatRateQuery, getFiatPrice } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const router = useRouter()
const network = networkStore.network

const { data: poolStats, isLoading: isLoadingPoolStats } = useQuery(
  getPoolStatsQuery({ token1, token2 }),
)

const { data: poolStatus, isLoading: isLoadingPoolStatus } = useQuery(
  getPoolStatusQuery(
    { token1, token2, address: connectionStore.getAddress, network },
    computed(() => !!connectionStore.getAddress),
  ),
)
const hasPending = computed(() => {
  if (!poolStatus.value) return false
  if (!poolStatus.value.poolSharePending) return false

  try {
    const poolSharePending = new Decimal(
      poolStatus.value.poolSharePending.replace('%', ''),
    )

    return poolSharePending.gt(0)
  } catch (e) {
    return false
  }
})

const tvl = computed(() => {
  if (!poolStatus.value || !fiatRate.value) return '0'

  const token1Pool = poolStatus.value.token1Pool
  const valueInFiat = getFiatPrice(token1Pool, get(fiatRate))
  return '≈ $' + new Decimal(valueInFiat).mul(2).toDP(2).toString()
})

const volume24h = computed(() => {
  if (!poolStats.value) return '-'

  const volume = poolStats.value.volume24h
  return prettyBtcDisplay(volume)
})

const fees24h = computed(() => {
  if (!poolStats.value) return '-'

  const fees = poolStats.value.fees24h
  return prettyBtcDisplay(fees)
})

function toAdd() {
  router.push(`/swap-pools/${pairStr.value}/add`)
}

function toSwap() {
  router.push(`/swap/${pairStr.value}`)
}
</script>

<template>
  <div class="hidden lg:block" v-if="connectionStore.connected">
    <div
      class="mt-8 flex items-center justify-center gap-4 text-zinc-500"
      v-if="isLoadingPoolStatus"
    >
      <Loader2Icon class="size-8 animate-spin" />
      <span> Loading pool status... </span>
    </div>
    <div class="grid gap-8" v-else-if="poolStatus">
      <!-- row 1 -->
      <div class="flex items-end justify-between gap-4 text-sm xl:text-base">
        <!-- left -->
        <div class="flex flex-col items-start gap-6">
          <!-- title -->
          <div class="flex items-center text-2xl">
            <TokenIcon :token="token1" class="size-6 rounded-full" />
            <TokenIcon :token="token2" class="-ml-2 size-6 rounded-full" />
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
              <TokenIcon :token="token1" class="size-6 rounded-full" />

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
              <TokenIcon :token="token2" class="size-6 rounded-full" />

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
              <TokenIcon :token="token1" class="size-6 rounded-full" />

              <div class="">
                {{ `${prettySymbol(token1)}` }}
              </div>

              <div class="ml-auto font-bold">
                {{ prettyBalance(poolStatus.token1Pool) }}
              </div>
            </div>

            <div class="mt-3 flex items-center gap-2 text-zinc-300">
              <TokenIcon :token="token2" class="size-6 rounded-full" />

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
              <div class="label">24h Volume</div>

              <div class="value">
                {{ volume24h }}
              </div>
            </div>

            <div class="">
              <div class="label">24h Fees</div>

              <div class="value">
                {{ fees24h }}
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
