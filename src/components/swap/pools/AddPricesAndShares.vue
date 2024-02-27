<script setup lang="ts">
import { prettySymbol } from '@/lib/formatters'
import Decimal from 'decimal.js'
import { computed } from 'vue'

const props = defineProps([
  'token1Symbol',
  'token2Symbol',
  'ratio',
  'addEquity',
  'poolEquity',
])

const ratioDisplay = computed(() =>
  (props.ratio as Decimal).div(1e8).toDP(8).toFixed(),
)

const reversedRatioDisplay = computed(() =>
  (props.ratio as Decimal).div(1e8).pow(-1).toDP(8).toFixed(),
)

const equityShare = computed(() => {
  const share = props.addEquity.div(props.poolEquity).mul(100)

  if (share.isNaN()) return '0%'
  if (share.toDP(2).eq(0)) return '<0.01%'

  return `${share.toDP(2).toFixed()}%`
})
</script>

<template>
  <div class="swap-sub-static-panel">
    <h3 class="pb-4 text-sm text-zinc-300">Prices and pool share</h3>

    <div
      class="-m-px grid grid-cols-3 gap-4 rounded-2xl border border-zinc-700 p-4 text-xs"
    >
      <div class="flex flex-col items-center justify-center gap-0.5">
        <div class="text-zinc-300">
          {{ reversedRatioDisplay }}
        </div>

        <div class="text-zinc-500">
          {{ `${prettySymbol(token2Symbol)} / ${prettySymbol(token1Symbol)}` }}
        </div>
      </div>

      <div class="flex flex-col items-center justify-center gap-0.5">
        <div class="text-zinc-300">
          {{ ratioDisplay }}
        </div>

        <div class="text-zinc-500">
          {{ `${prettySymbol(token1Symbol)} / ${prettySymbol(token2Symbol)}` }}
        </div>
      </div>

      <div class="flex flex-col items-center justify-center gap-0.5">
        <div class="text-zinc-300">
          {{ equityShare }}
        </div>

        <div class="text-zinc-500">Share of pool</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
