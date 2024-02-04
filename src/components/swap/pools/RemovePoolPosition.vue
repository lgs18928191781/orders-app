<script setup lang="ts">
import Decimal from 'decimal.js'
import { computed } from 'vue'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { prettySymbol } from '@/lib/formatters'

const { token1Symbol, token2Symbol, selectedPair } = useSwapPoolPair()
const token1Icon = computed(() => selectedPair.value?.token1Icon)
const token2Icon = computed(() => selectedPair.value?.token2Icon)

const props = defineProps(['poolStatus', 'poolShare'])

const token1AddressAmount = computed(() => {
  if (!props.poolStatus) return new Decimal(0)

  return new Decimal(props.poolStatus.addressEquity)
    .mul(props.poolStatus.token1Pool)
    .div(props.poolStatus.poolEquity)
})
const token2AddressAmount = computed(() => {
  if (!props.poolStatus) return new Decimal(0)

  return new Decimal(props.poolStatus.addressEquity)
    .mul(props.poolStatus.token2Pool)
    .div(props.poolStatus.poolEquity)
})
</script>

<template>
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
        {{ new Decimal(poolStatus.addressEquity).toDP() }}
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
        {{ token1AddressAmount.div(1e8) }}
      </div>
    </div>

    <div class="flex items-center text-sm">
      <div class="ml-2">{{ prettySymbol(token2Symbol) }}:</div>

      <div class="ml-auto">
        {{ token2AddressAmount }}
      </div>
    </div>
  </div>
</template>
