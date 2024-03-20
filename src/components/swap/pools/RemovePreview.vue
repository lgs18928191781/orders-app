<script setup lang="ts">
import { computed } from 'vue'
import { Loader2Icon, AlertCircleIcon } from 'lucide-vue-next'
import Decimal from 'decimal.js'

import { useSwapPool } from '@/hooks/use-swap-pool'

import { prettySymbol } from '@/lib/formatters'
import { REMOVE_THRESHOLD_AMOUNT } from '@/data/constants'

defineProps([
  'preview',
  'isFetchingPreview',
  'token1Amount',
  'token2Amount',
  'moreThanThreshold',
])

const { token1, token2, token1Icon, token2Icon } = useSwapPool()

const thresholdInBtc = computed(() =>
  new Decimal(REMOVE_THRESHOLD_AMOUNT).div(1e8),
)
</script>

<template>
  <div class="swap-sub-static-panel text-2xl text-zinc-300">
    <div class="flex items-center justify-between gap-4">
      <div class="" v-if="isFetchingPreview">
        <Loader2Icon class="h-5 animate-spin" />
      </div>
      <div class="" v-else-if="preview">{{ token1Amount.div(1e8) }}</div>

      <div class="flex items-center gap-2">
        <img :src="token1Icon" class="size-6 rounded-full" v-if="token1Icon" />
        <div class="">{{ prettySymbol(token1) }}</div>
      </div>
    </div>
    <div
      class="mt-1 flex items-center gap-2 text-sm text-red-500"
      v-if="token1Amount.gt(0) && !moreThanThreshold"
    >
      <AlertCircleIcon class="size-4" />
      Amount should be at least {{ thresholdInBtc }} BTC
    </div>

    <div class="mt-4 flex items-center justify-between gap-4">
      <div class="" v-if="isFetchingPreview">
        <Loader2Icon class="h-5 animate-spin" />
      </div>
      <div class="" v-else-if="preview">{{ token2Amount }}</div>

      <div class="flex items-center gap-2">
        <img :src="token2Icon" class="size-6 rounded-full" v-if="token2Icon" />
        <div class="">{{ prettySymbol(token2) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
