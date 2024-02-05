<script setup lang="ts">
import { useExpandSwap } from '@/hooks/use-expand-swap'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionModal from '@/components/header/ConnectionModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import SwapExpandControl from '@/components/swap/SwapExpandControl.vue'
import SwapDataArea from '@/components/swap/SwapDataArea.vue'

const { isExpanded } = useExpandSwap()
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <div
    class="grow flex justify-center gap-16 pt-16"
    :class="[isExpanded ? 'items-start' : 'items-start']"
  >
    <SwapDataArea v-show="isExpanded" />

    <div class="relative max-w-md rounded-3xl w-112 fill-zinc-100 z-10 mb-16">
      <slot></slot>
      <!-- background blur -->
      <SwapBlur />
      <!-- expand control -->
      <SwapExpandControl />
    </div>
  </div>
</template>
