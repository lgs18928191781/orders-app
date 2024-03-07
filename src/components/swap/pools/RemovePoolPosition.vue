<script setup lang="ts">
import Decimal from 'decimal.js'
import { computed } from 'vue'

import { useSwapPool } from '@/hooks/use-swap-pool'
import { prettySymbol } from '@/lib/formatters'

const { token1, token2, token1Icon, token2Icon } = useSwapPool()

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
    <h3 class="text-zinc-300">Your position</h3>

    <div class="flex items-center text-lg">
      <img :src="token1Icon" class="size-6 rounded-full" v-if="token1Icon" />
      <img
        :src="token2Icon"
        class="-ml-2 size-6 rounded-full"
        v-if="token2Icon"
      />
      <div class="ml-2">
        {{ prettySymbol(token1) }}/{{ prettySymbol(token2) }}
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
      <div class="ml-2">{{ prettySymbol(token1) }}:</div>

      <div class="ml-auto">
        {{ poolStatus?.token1AmountUsingBtcUnit || '-' }}
      </div>
    </div>

    <div class="flex items-center text-sm">
      <div class="ml-2">{{ prettySymbol(token2) }}:</div>

      <div class="ml-auto">
        {{ poolStatus?.token2Amount || '-' }}
      </div>
    </div>
  </div>
</template>
