<script setup lang="ts">
import { useExpandSwap } from '@/hooks/use-expand-swap'
import { useConnectionStore } from '@/stores/connection'

const { isExpanded } = useExpandSwap()
const connectionStore = useConnectionStore()
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />
  <SwapOngoingTaskModal />

  <div
    class="mx-auto flex w-full max-w-9xl grow justify-center gap-8 p-3 lg:pt-8 xl:gap-12"
    :class="[isExpanded ? 'items-start' : 'items-start']"
  >
    <SwapStatsSection v-show="isExpanded" class="flex-1 lg:mb-8" />

    <div :class="['relative z-10 w-112 max-w-md rounded-3xl lg:mb-8']">
      <slot></slot>
      <!-- background blur -->
      <SwapBlur v-if="!isExpanded" />
      <!-- expand control -->
      <SwapExpandControl v-if="connectionStore.connected" />
    </div>
  </div>
</template>
