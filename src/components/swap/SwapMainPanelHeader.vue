<script setup lang="ts">
import { useRouteParams } from '@vueuse/router'
import { type Ref, computed } from 'vue'

import { useEmptyPoolSignal } from '@/hooks/use-empty-pool-signal'

const { isEmpty } = useEmptyPoolSignal()

const pairStr = useRouteParams('pair') as Ref<string>
const swapLink = computed(() =>
  pairStr.value ? `/swap/${pairStr.value}` : '/swap',
)
const swapPoolLink = computed(() =>
  pairStr.value ? `/swap-pools/${pairStr.value}` : '/swap-pools',
)
</script>

<template>
  <div class="flex gap-4 border-b border-zinc-800 px-3 pb-2">
    <router-link
      :to="swapLink"
      class="flex items-center space-x-1 text-zinc-400 hover:text-zinc-600"
      v-if="!isEmpty"
    >
      Swap
    </router-link>

    <router-link
      :to="swapPoolLink"
      class="flex items-center space-x-1 text-zinc-200"
    >
      Pools
    </router-link>

    <SwapPairSelect class="ml-auto" />
  </div>
</template>
