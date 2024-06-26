<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import * as secp256k1 from 'tiny-secp256k1'

import { useBtcJsStore } from '@/stores/btcjs'
import { useGeoStore } from '@/stores/geo'

import Toaster from '@/components/ui/toast/Toaster.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import NotAvailableOverlay from '@/components/overlays/NotAvailable.vue'
import BuildingOverlay from '@/components/overlays/Building.vue'

const btcJsStore = useBtcJsStore()
const geoStore = useGeoStore()

// After loaded, check if window width is less than 768px; if so, set isMobile to true
const isMobile = ref(false)

onMounted(async () => {
  if (window.innerWidth < 768) {
    isMobile.value = true
  }

  // initialize btcjs
  const btcjs = window.bitcoinjs
  btcjs.initEccLib(secp256k1)
  btcJsStore.set(btcjs)

  // initialize related btc modules
  const ECPair = window.ecpair.ECPairFactory(secp256k1)
  btcJsStore.setECPair(ECPair)
})

const queryClient = useQueryClient()
queryClient.setDefaultOptions({
  queries: {
    staleTime: 1000 * 30, // 30 seconds
    // staleTime: 0,
  },
})
</script>

<template>
  <Toaster />
  <BuildingOverlay />
  <NotAvailableOverlay v-if="false" />

  <template v-else>
    <AppHeader v-if="geoStore.pass" />

    <router-view :key="$route.fullPath"></router-view>
  </template>
</template>

<style scoped></style>
