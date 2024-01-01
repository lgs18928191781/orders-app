<script lang="ts" setup>
import { ref, watch, type Ref } from 'vue'
import { ArrowDownIcon } from 'lucide-vue-next'

import { Wallet, useConnectionStore } from '@/stores/connection'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionsModal from '@/components/header/ConnectionsModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'

const fromSymbol = ref('RDEX')
const toSymbol = ref('btc')
// watch for changes to both symbols
// the rule is when one changes from brc to btc, the other changes from btc to brc
watch(fromSymbol, (newSymbol) => {
  if (newSymbol === 'btc' && toSymbol.value === 'btc') {
    toSymbol.value = ''
  } else if (newSymbol !== 'btc' && toSymbol.value !== 'btc') {
    toSymbol.value = 'btc'
  }
})
watch(toSymbol, (newSymbol) => {
  if (newSymbol === 'btc' && fromSymbol.value === 'btc') {
    fromSymbol.value = ''
  } else if (newSymbol !== 'btc' && fromSymbol.value !== 'btc') {
    fromSymbol.value = 'btc'
  }
})

const flipAsset = () => {
  const from = fromSymbol.value
  const to = toSymbol.value
  fromSymbol.value = to
  toSymbol.value = from
}

// connection
const connectionStore = useConnectionStore()
const connectionsModalOpen = ref(false)
const walletMissingModalOpen = ref(false)
const missingWallet: Ref<Wallet> = ref('unisat')
function onWalletMissing(wallet: Wallet) {
  missingWallet.value = wallet
  walletMissingModalOpen.value = true
}
</script>

<template>
  <ConnectionsModal
    v-model:open="connectionsModalOpen"
    @wallet-missing="onWalletMissing"
  />
  <WalletMissingModal
    v-model:open="walletMissingModalOpen"
    :missing-wallet="missingWallet"
  />

  <div class="relative max-w-md mt-16 mx-auto rounded-3xl">
    <div
      class="border border-orange-300/30 rounded-3xl shadow-md p-2 pt-3 bg-zinc-900 space-y-3"
    >
      <!-- header -->
      <h3 class="px-3">Swap</h3>

      <!-- body -->
      <div class="text-sm space-y-0.5">
        <SwapSide side="pay" v-model:symbol="fromSymbol" />

        <!-- flip -->
        <div class="h-0 relative flex justify-center">
          <div class="absolute -translate-y-1/2 bg-zinc-900 p-1 rounded-xl">
            <button
              class="bg-zinc-800 rounded-lg p-2 hover:text-orange-300"
              @click="flipAsset"
            >
              <ArrowDownIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <SwapSide side="receive" v-model:symbol="toSymbol" />
      </div>

      <!-- confirm button -->
      <button class="main-btn" v-if="connectionStore.connected">Swap</button>

      <!-- connect button -->
      <button class="main-btn" v-else @click="connectionsModalOpen = true">
        Connect Wallet
      </button>
    </div>

    <!-- background blur -->
    <SwapBlur />
  </div>
</template>

<style scoped>
.main-btn {
  @apply bg-orange-300/20 text-orange-300 font-medium block w-full py-4 rounded-2xl text-xl hover:bg-orange-300/30;
}
</style>
