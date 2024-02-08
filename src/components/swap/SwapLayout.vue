<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useExpandSwap } from '@/hooks/use-expand-swap'
import { useConnectionStore } from '@/stores/connection'

import { sleep } from '@/lib/helpers'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionModal from '@/components/header/ConnectionModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import SwapExpandControl from '@/components/swap/SwapExpandControl.vue'
import SwapStatsSection from '@/components/swap/SwapStatsSection.vue'

const { isExpanded } = useExpandSwap()
const connectionStore = useConnectionStore()
const router = useRouter()

onMounted(() => {
  // currently only support unisat wallet
  if (connectionStore.connected && connectionStore.last.wallet !== 'unisat') {
    ElMessage.warning('Currently only support Unisat wallet.')

    sleep(3000).then(() => {
      router.push('/')
    })
  }
})
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <div
    class="grow flex justify-center gap-8 xl:gap-12 pt-8 px-3 max-w-9xl w-full mx-auto"
    :class="[isExpanded ? 'items-start' : 'items-start']"
  >
    <SwapStatsSection v-show="isExpanded" class="flex-1 mb-8" />

    <div :class="['relative rounded-3xl w-112 z-10 mb-8 max-w-md']">
      <slot></slot>
      <!-- background blur -->
      <SwapBlur v-if="!isExpanded" />
      <!-- expand control -->
      <SwapExpandControl />
    </div>
  </div>
</template>
