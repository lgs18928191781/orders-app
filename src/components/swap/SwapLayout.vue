<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { DropletsIcon } from 'lucide-vue-next'
import { computed, watchEffect } from 'vue'

import { useExpandSwap } from '@/hooks/use-expand-swap'
import { useSwapPool } from '@/hooks/use-swap-pool'
import { useEmptyPoolSignal } from '@/hooks/use-empty-pool-signal'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'

import { getPoolStatusQuery } from '@/queries/swap.query'

const { isExpanded } = useExpandSwap()
const { token1, token2 } = useSwapPool()
const { setEmpty, reset, isEmpty } = useEmptyPoolSignal()
const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const address = connectionStore.getAddress
const network = networkStore.network

const { data: poolStatus } = useQuery(
  getPoolStatusQuery(
    {
      token1,
      token2,
      address,
      network,
    },
    computed(() => !!address),
  ),
)

watchEffect(() => {
  if (poolStatus.value) {
    if (Number(poolStatus.value.poolEquity) === 0) {
      setEmpty()
    } else {
      reset()
    }
  }
})
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />
  <SwapOngoingTaskModal />

  <div
    class="mx-auto flex w-full max-w-9xl grow justify-center gap-8 p-3 lg:pt-8 xl:gap-12"
    :class="[isExpanded ? 'items-start' : 'items-start']"
  >
    <SwapStatsSection v-show="isExpanded" class="flex-1 lg:mb-8" />

    <div :class="['relative z-10 w-112 max-w-md rounded-3xl lg:mb-8']">
      <!-- new pool warning -->
      <div
        class="mb-4 flex items-center gap-4 rounded-xl border border-primary/30 bg-black/60 p-4 text-xs text-zinc-300 shadow shadow-primary/10"
        v-if="isEmpty"
      >
        <DropletsIcon class="h-6 w-6 text-primary" />
        <div class="space-y-1">
          <p>No liquidity has been added to this pool yet.</p>
          <p>Add liquidity to create a new pool.</p>
        </div>
      </div>

      <slot></slot>
      <!-- background blur -->
      <SwapBlur v-if="!isExpanded" />
      <!-- expand control -->
      <SwapExpandControl v-if="connectionStore.connected" />
    </div>
  </div>
</template>
