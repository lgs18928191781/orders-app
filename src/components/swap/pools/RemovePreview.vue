<script setup lang="ts">
import { computed } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { prettySymbol } from '@/lib/formatters'
import { AlertCircleIcon } from 'lucide-vue-next'
import { SWAP_THRESHOLD_AMOUNT } from '@/data/constants'
import Decimal from 'decimal.js'

defineProps([
  'preview',
  'isFetchingPreview',
  'token1Amount',
  'token2Amount',
  'moreThanThreshold',
])

const { token1Symbol, token2Symbol, selectedPair } = useSwapPoolPair()
const token1Icon = computed(() => selectedPair.value?.token1Icon)
const token2Icon = computed(() => selectedPair.value?.token2Icon)

const thresholdInBtc = computed(() =>
  new Decimal(SWAP_THRESHOLD_AMOUNT).div(1e8)
)
</script>

<template>
  <div class="swap-sub-static-panel text-2xl text-zinc-300">
    <div class="flex justify-between items-center gap-4">
      <div class="" v-if="isFetchingPreview">
        <Loader2Icon class="h-5 animate-spin" />
      </div>
      <div class="" v-else-if="preview">{{ token1Amount.div(1e8) }}</div>

      <div class="flex items-center gap-2">
        <img :src="token1Icon" class="size-6 rounded-full" v-if="token1Icon" />
        <div class="">{{ prettySymbol(token1Symbol) }}</div>
      </div>
    </div>
    <div
      class="text-red-500 text-sm flex items-center gap-2 mt-1"
      v-if="token1Amount.gt(0) && !moreThanThreshold"
    >
      <AlertCircleIcon class="size-4" />
      Amount should be at least {{ thresholdInBtc }} BTC
    </div>

    <div class="flex justify-between items-center gap-4 mt-4">
      <div class="" v-if="isFetchingPreview">
        <Loader2Icon class="h-5 animate-spin" />
      </div>
      <div class="" v-else-if="preview">{{ token2Amount }}</div>

      <div class="flex items-center gap-2">
        <img :src="token2Icon" class="size-6 rounded-full" v-if="token2Icon" />
        <div class="">{{ prettySymbol(token2Symbol) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
