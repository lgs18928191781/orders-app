<script setup lang="ts">
import { useExpandSwap } from '@/hooks/use-expand-swap'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionModal from '@/components/header/ConnectionModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import SwapExpandControl from '@/components/swap/SwapExpandControl.vue'
import SwapStatsSection from '@/components/swap/SwapStatsSection.vue'

const { isExpanded } = useExpandSwap()
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <div
    class="grow flex justify-center gap-12 pt-16 px-8 max-w-10xl mx-auto"
    :class="[isExpanded ? 'items-start' : 'items-start']"
  >
    <SwapStatsSection v-show="isExpanded" class="flex-1 mb-16" />

    <div :class="['relative  rounded-3xl w-112  z-10 mb-16 max-w-md']">
      <slot></slot>
      <!-- background blur -->
      <SwapBlur v-if="!isExpanded" />
      <!-- expand control -->
      <SwapExpandControl />
    </div>
  </div>
</template>
