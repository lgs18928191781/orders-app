<script setup lang="ts">
import { computed } from 'vue'
import { get } from '@vueuse/core'
import { ArrowDownUpIcon } from 'lucide-vue-next'

import { useFiat } from '@/hooks/use-fiat'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStateModal } from '@/hooks/use-network-state-modal'

import { prettyBalance } from '@/lib/formatters'
import { SWAP_TX_SIZE } from '@/data/constants'
import { unit, useBtcUnit } from '@/lib/helpers'

const feebStore = useFeebStore()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { openModal } = useNetworkStateModal()
const { data: fiatRate } = useFiatRateQuery()

const swapFees = computed(() => {
  if (!feebStore.get) return 0

  return feebStore.get * SWAP_TX_SIZE
})
const prettySwapFees = computed(() => {
  if (!swapFees.value) return '0'

  const feeInBtc = swapFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})
</script>

<template>
  <div class="p-4 flex flex-col gap-2">
    <div class="flex w-full items-center justify-start gap-2">
      <span class="label">Gas Plan</span>

      <button class="ml-auto" @click="openModal">
        <ArrowDownUpIcon class="h-5 w-5 text-zinc-500 hover:text-primary" />
      </button>

      <div class="value">
        {{ feebStore.get ? feebStore.get + ' sat/vB' : '-' }}
      </div>
    </div>

    <div class="flex items-center justify-between text-sm">
      <span class="text-zinc-500">Gas</span>
      <div class="flex gap-3 items-center">
        <div class="text-zinc-300">{{ prettySwapFees }}</div>
        <div
          class="text-sm text-zinc-500 text-right"
          v-if="isShowingFiat && fiatRate && swapFees"
        >
          {{ getFiatPriceDisplay(swapFees, fiatRate) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply text-zinc-300;
}
</style>
