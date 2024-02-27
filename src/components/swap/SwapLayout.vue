<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useExpandSwap } from '@/hooks/use-expand-swap'
import { useConnectionStore } from '@/stores/connection'

import { sleep } from '@/lib/helpers'

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
