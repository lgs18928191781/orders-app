<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import RemoveSlider from '@/components/swap/pools/RemoveSlider.vue'
import { ArrowDownIcon } from 'lucide-vue-next'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { prettySymbol } from '@/lib/formatters'
import { previewRemove } from '@/queries/swap'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { getPoolStatusQuery } from '@/queries/swap.query'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'

const { token1Symbol, token2Symbol, selectedPair } = useSwapPoolPair()
const token1Icon = computed(() => selectedPair.value?.token1Icon)
const token2Icon = computed(() => selectedPair.value?.token2Icon)
const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
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
const poolShare = computed(() => {
  if (!poolStatus.value) return '0%'

  return (
    new Decimal(poolStatus.value.addressEquity)
      .div(poolStatus.value.poolEquity)
      .mul(100)
      .toDP(4)
      .toFixed() + '%'
  )
})

const removePercentage = ref([0])
const token1Amount = ref<string>('0')
const token2Amount = ref<string>('0')
watch(
  removePercentage,
  async (newPercentageContainer) => {
    const newPercentage = newPercentageContainer[0]
    if (Number(newPercentage) === 0) {
      token1Amount.value = '0'
      token2Amount.value = '0'
    }

    previewRemove({
      token1: token1Symbol.value.toLowerCase(),
      token2: token2Symbol.value.toLowerCase(),
      removeEquity: String(newPercentage),
      // }).then((preview) => {
      //   conditions.value = conditions.value.map((c) => {
      //     if (c.condition === 'insufficient-liquidity') {
      //       c.met = true
      //     }
      //     return c
      //   })

      //   ratio.value = new Decimal(preview.ratio)
      //   addEquity.value = new Decimal(preview.addEquity)
      //   poolEquity.value = new Decimal(preview.poolEquity)

      //   token1Amount.value = preview.targetAmount
      //   calculatingToken1.value = false
    })
  },
  {
    immediate: true,
    deep: true,
  }
)
</script>

<template>
  <div class="my-4 flex flex-col gap-3">
    <RemoveSlider v-model:remove-percentage="removePercentage" />

    <div class="flex justify-center">
      <ArrowDownIcon class="w-4 h-4 text-zinc-500" />
    </div>

    <div class="swap-sub-static-panel text-2xl space-y-4 text-zinc-300">
      <div class="flex justify-between items-center gap-4">
        <div class="">{{ token1Amount }}</div>

        <div class="flex items-center gap-2">
          <img
            :src="token1Icon"
            class="w-6 h-6 rounded-full"
            v-if="token1Icon"
          />
          <div class="">{{ prettySymbol(token1Symbol) }}</div>
        </div>
      </div>

      <div class="flex justify-between items-center gap-4">
        <div class="">{{ token2Amount }}</div>

        <div class="flex items-center gap-2">
          <img
            :src="token2Icon"
            class="w-6 h-6 rounded-full"
            v-if="token2Icon"
          />
          <div class="">{{ prettySymbol(token2Symbol) }}</div>
        </div>
      </div>
    </div>

    <div class="swap-sub-static-panel flex flex-col gap-2" v-if="poolStatus">
      <h3>Your position</h3>

      <div class="flex items-center text-lg">
        <img :src="token1Icon" class="w-6 h-6 rounded-full" v-if="token1Icon" />
        <img
          :src="token2Icon"
          class="w-6 h-6 rounded-full -ml-2"
          v-if="token2Icon"
        />
        <div class="ml-2">
          {{ prettySymbol(token1Symbol) }}/{{ prettySymbol(token2Symbol) }}
        </div>

        <div class="ml-auto">
          {{ poolStatus.addressEquity }}
        </div>
      </div>

      <div class="flex items-center text-sm">
        <div class="ml-2">Your pool share:</div>

        <div class="ml-auto">
          {{ poolShare }}
        </div>
      </div>

      <div class="flex items-center text-sm">
        <div class="ml-2">{{ prettySymbol(token1Symbol) }}:</div>

        <div class="ml-auto">
          {{ token1Amount }}
        </div>
      </div>

      <div class="flex items-center text-sm">
        <div class="ml-2">{{ prettySymbol(token2Symbol) }}:</div>

        <div class="ml-auto">
          {{ poolShare }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
