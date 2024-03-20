<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { provide } from 'vue'

import {
  defaultPoolPair,
  selectPair,
  selectedPoolPairKey,
} from '@/data/trading-pairs'

import PoolPairSelectorPanel from '@/components/pool/PairSelectorPanel.vue'
import PoolOperationPanel from '@/components/pool/OperationPanel.vue'

const route = useRoute()

const pairRaw = route.params?.pair as string | undefined
const selectedPair = pairRaw ? selectPair(pairRaw) : defaultPoolPair
provide(selectedPoolPairKey, selectedPair)
</script>

<template>
  <div class="mx-auto mt-[10vh] grid h-full w-96 max-w-7xl grid-cols-5 gap-8">
    <PoolPairSelectorPanel class="col-span-2" />
    <PoolOperationPanel class="col-span-3" />
  </div>
</template>
