<script setup lang="ts">
import { prettySymbol } from '@/lib/formatters'
import { computed } from 'vue'

const props = defineProps([
  'token1Symbol',
  'token2Symbol',
  'ratio',
  'addEquity',
  'poolEquity',
])

const ratioDisplay = computed(() => props.ratio.div(1e8).toDP().toFixed())

const reversedRatioDisplay = computed(() =>
  props.ratio.div(1e8).pow(-1).toDP().toFixed()
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
    <h3 class="text-sm text-zinc-300 pb-4">Prices and pool share</h3>

    <div
      class="border border-zinc-700 rounded-2xl p-4 grid grid-cols-3 text-xs gap-4 -m-px"
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
