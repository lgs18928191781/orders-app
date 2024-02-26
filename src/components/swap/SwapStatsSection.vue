<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Decimal from 'decimal.js'
import { get } from '@vueuse/core'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useFiat } from '@/hooks/use-fiat'

import { getPoolStatusQuery } from '@/queries/swap.query'
import { prettyBalance, prettySymbol } from '@/lib/formatters'

const { token1Symbol, token2Symbol, selectedPair, pairStr } = useSwapPoolPair()
const token1Icon = computed(() => selectedPair.value?.token1Icon)
const token2Icon = computed(() => selectedPair.value?.token2Icon)

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
      token1: token1Symbol,
      token2: token2Symbol,
      address,
      network,
    },
    computed(() => !!address)
  )
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
  <div class="grid gap-8" v-if="poolStatus">
    <!-- row 1 -->
    <div class="flex items-end justify-between gap-4 text-sm xl:text-base">
      <!-- left -->
      <div class="flex flex-col gap-6">
        <!-- title -->
        <div class="flex items-center text-2xl">
          <img
            :src="token1Icon"
            class="size-6 rounded-full"
            v-if="token1Icon"
          />
          <img
            :src="token2Icon"
            class="size-6 rounded-full -ml-2"
            v-if="token2Icon"
          />
          <div class="ml-2">
            <p
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 "
            >
              {{ prettySymbol(token1Symbol) }}/{{ prettySymbol(token2Symbol) }}
            </p>
          </div>
        </div>

        <!-- ratio -->
        <div class="space-y-2">
          <div
            class="flex items-center text-zinc-300 gap-2 bg-zinc-800/80 px-4 py-2 rounded-xl text-sm xl:text-base"
          >
            <img
              :src="token1Icon"
              class="size-6 rounded-full"
              v-if="token1Icon"
            />

            <div class="">
              {{
                `1 ${prettySymbol(token1Symbol)} = ${
                  poolStatus.token2PerToken1UsingBtcUnit
                } ${prettySymbol(token2Symbol)}`
              }}
            </div>
          </div>

          <div
            class="flex items-center text-zinc-300 gap-2 bg-zinc-800/80 px-4 py-2 rounded-xl text-sm xl:text-base"
          >
            <img
              :src="token2Icon"
              class="size-6 rounded-full"
              v-if="token2Icon"
            />

            <div class="">
              {{
                `1 ${prettySymbol(token2Symbol)} = ${
                  poolStatus.token1PerToken2UsingBtcUnit
                } ${prettySymbol(token1Symbol)}`
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- right -->
      <div class="text-zinc-300 space-x-3 flex justify-end">
        <button
          class="py-3 px-4 bg-zinc-700 rounded-xl hover:text-zinc-400"
          @click="toAdd"
        >
          Add Liquidity
        </button>

        <button
          class="py-2.5 px-6 rounded-xl bg-transparent border-2 border-primary text-orange-50 bg-opacity-80 hover:bg-opacity-100 border-opacity-60 hover:border-opacity-100 hover:text-primary"
          @click="toSwap"
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
      <div class="z-20 text-zinc-300 p-4 relative flex items-start gap-8">
        <div class="p-4 bg-zinc-800/50 rounded-2xl w-72">
          <div class="label">Total Tokens Locked</div>

          <div class="flex items-center text-zinc-300 gap-2 mt-6">
            <img
              :src="token1Icon"
              class="size-6 rounded-full"
              v-if="token1Icon"
            />

            <div class="">
              {{ `${prettySymbol(token1Symbol)}` }}
            </div>

            <div class="ml-auto font-bold">
              {{ prettyBalance(poolStatus.token1Pool) }}
            </div>
          </div>

          <div class="flex items-center text-zinc-300 gap-2 mt-3">
            <img
              :src="token2Icon"
              class="size-6 rounded-full"
              v-if="token2Icon"
            />

            <div class="">
              {{ `${prettySymbol(token2Symbol)}` }}
            </div>

            <div class="ml-auto font-bold">
              {{ poolStatus.token2Pool }}
            </div>
          </div>
        </div>

        <!-- right stats area -->
        <div class="grid grid-cols-3 grow gap-x-4 gap-y-2 text-sm">
          <div class="col-span-3 text-primary/80 font-bold text-base">
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

          <div class="col-span-3 text-primary/80 font-bold mt-6 text-base">
            Your Position
          </div>

          <div class="">
            <div class="label">Pool Share</div>

            <div class="value">
              {{ poolStatus.poolShare }}
            </div>
          </div>

          <div class="">
            <div class="label">{{ prettySymbol(token1Symbol) }}</div>

            <div class="value">
              {{ poolStatus.token1AmountUsingBtcUnit }}
            </div>
          </div>

          <div class="">
            <div class="label">{{ prettySymbol(token2Symbol) }}</div>

            <div class="value">
              {{ poolStatus.token2Amount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- row 3 -->
    <SwapStatsTransactions />
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply flex items-center text-zinc-300 gap-2 mt-1 font-bold;
}
</style>
