<script lang="ts" setup>
import { useNetworkStore } from '@/stores/network'
import { useRouter } from 'vue-router'

const router = useRouter()
const networkStore = useNetworkStore()

if (networkStore.isTestnet) {
  router.push('/swap')
}
</script>

<template>
  <div class="flex grow flex-col">
    <OrderbookLayout />
  </div>
</template>
