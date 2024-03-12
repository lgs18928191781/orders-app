<script setup lang="ts">
import { computed } from 'vue'
import { get } from '@vueuse/core'
import { ArrowDownUpIcon } from 'lucide-vue-next'

import { useFiat } from '@/hooks/use-fiat'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStateModal } from '@/hooks/use-network-state-modal'

import { prettyBalance } from '@/lib/formatters'
import {
  SWAP_2X_TX_SIZE,
  SWAP_POOL_ADD_TX_SIZE,
  SWAP_TX_SIZE,
} from '@/data/constants'
import { unit, useBtcUnit } from '@/lib/helpers'

const feebStore = useFeebStore()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { openModal } = useNetworkStateModal()
const { data: fiatRate } = useFiatRateQuery()

const props = defineProps(['taskType'])

const taskGas = computed(() => {
  if (!feebStore.get) return 0

  let txSize: number
  switch (props.taskType) {
    case 'add':
      txSize = SWAP_POOL_ADD_TX_SIZE
      break
    case '2x':
      txSize = SWAP_2X_TX_SIZE
      break
    default:
      txSize = SWAP_TX_SIZE
  }

  return feebStore.get * txSize
})
const prettyTaskGas = computed(() => {
  if (!taskGas.value) return '0'

  const feeInBtc = taskGas.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})

const prettyInscriptionGas = computed(() => {
  if (!feebStore.inscriptionFee) return '0'

  const feeInBtc = feebStore.inscriptionFee

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})

const showInscriptionGas = computed(() => {
  return ['1x', 'x2', 'remove'].includes(props.taskType)
})
</script>

<template>
  <div class="flex flex-col gap-2 p-4 text-xs lg:text-sm">
    <div class="flex w-full items-center justify-start gap-2">
      <span class="label">Gas Plan</span>

      <button class="ml-auto" @click="openModal">
        <ArrowDownUpIcon class="h-5 w-5 text-zinc-500 hover:text-primary" />
      </button>

      <div class="value">
        {{ feebStore.get ? feebStore.get + ' sat/vB' : '-' }}
      </div>
    </div>

    <div class="flex items-center justify-between text-xs lg:text-sm">
      <span class="text-zinc-500">Transaction Gas</span>
      <div class="flex items-center gap-3">
        <div class="text-zinc-300">{{ prettyTaskGas }}</div>
        <div
          class="text-right text-xs text-zinc-500 lg:text-sm"
          v-if="isShowingFiat && fiatRate && taskGas"
        >
          {{ getFiatPriceDisplay(taskGas, fiatRate) }}
        </div>
      </div>
    </div>

    <div
      class="flex items-center justify-between text-xs lg:text-sm"
      v-if="showInscriptionGas"
    >
      <span class="text-zinc-500">Inscription Gas</span>
      <div class="flex items-center gap-3">
        <div class="text-zinc-300">{{ prettyInscriptionGas }}</div>
        <div
          class="text-right text-xs text-zinc-500 lg:text-sm"
          v-if="isShowingFiat && fiatRate && taskGas"
        >
          {{ getFiatPriceDisplay(feebStore.inscriptionFee, fiatRate) }}
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
