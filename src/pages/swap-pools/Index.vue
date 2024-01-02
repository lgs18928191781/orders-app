<script lang="ts" setup>
import { ref, watch, type Ref, computed } from 'vue'
import { ArrowDownIcon } from 'lucide-vue-next'

import { Wallet, useConnectionStore } from '@/stores/connection'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionsModal from '@/components/header/ConnectionsModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import AddLiquiditySide from '@/components/swap/pools/AddLiquiditySide.vue'
import { PlusIcon } from 'lucide-vue-next'
import SwapPoolPairSelect from '@/components/swap/pools/SwapPoolPairSelect.vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  pair: {
    type: String,
    required: true,
  },
})

const fromSymbol = ref('btc')
const toSymbol = ref('RDEX')
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

// amount
const fromAmount = ref()
const toAmount = ref()

// flip
const flipAsset = () => {
  const from = fromSymbol.value
  const to = toSymbol.value
  fromSymbol.value = to
  toSymbol.value = from

  const fromAmt = fromAmount.value
  const toAmt = toAmount.value
  fromAmount.value = toAmt
  toAmount.value = fromAmt
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

// unmet conditions for swap
// if any of these conditions are not met, the swap button is disabled
const conditions: Ref<
  {
    condition: string
    message: string
    priority: number
    met: boolean
    handler?: Function
  }[]
> = ref([
  {
    condition: 'not-connected',
    message: 'Connect wallet',
    priority: 1,
    met: false,
    handler: () => (connectionsModalOpen.value = true),
  },
  {
    condition: 'not-select-token',
    message: 'Select a token',
    priority: 2,
    met: false,
  },
  {
    condition: 'enter-amount',
    message: 'Enter an amount',
    priority: 3,
    met: false,
  },
  {
    condition: 'insufficient-balance',
    message: 'Insufficient balance',
    priority: 4,
    met: false,
  },
])
const hasUnmet = computed(() => {
  return conditions.value.some((c) => !c.met)
})
const unmet = computed(() => {
  // use highest priority unmet condition
  if (!hasUnmet.value) {
    return null
  }

  const unmets = conditions.value.filter((c) => !c.met)

  return unmets.reduce((prev, curr) => {
    return prev.priority < curr.priority ? prev : curr
  }, unmets[0])
})

// try to met conditions
watch(
  () => connectionStore.connected,
  (connected) => {
    if (connected) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-connected') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-connected') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

watch(
  () => [fromSymbol.value, toSymbol.value],
  ([from, to]) => {
    if (from && to) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-select-token') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-select-token') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)
// third watcher: hasEnough
const hasEnough = ref(true)
watch(
  () => hasEnough.value,
  (hasEnough) => {
    if (hasEnough) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-balance') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-balance') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

// fourth watcher: hasAmount
const hasAmount = ref(false)
watch(
  () => hasAmount.value,
  (hasAmount) => {
    if (hasAmount) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'enter-amount') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'enter-amount') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

const route = useRoute()
function isLinkActive(keyword: string) {
  return route.path.includes(keyword)
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
      <div class="px-3 flex gap-4 border-b border-zinc-800 pb-2">
        <router-link
          to="/swap"
          class="flex items-center space-x-1 text-zinc-400 hover:text-zinc-600"
        >
          Swap
        </router-link>

        <router-link
          to="/swap-pools/btc-rdex/add"
          class="flex items-center space-x-1 text-zinc-200"
        >
          Pools
        </router-link>
      </div>

      <!-- pair control -->
      <div class="flex justify-between items-center">
        <SwapPoolPairSelect />

        <!-- sub nav -->
        <div class="flex items-center gap-1 text-sm">
          <router-link
            class="px-2 py-1 text-sm font-medium rounded-md transition-all hover:bg-black hover:text-orange-300"
            :class="
              isLinkActive('add')
                ? 'text-orange-300 underline underline-offset-4 hover:underline-offset-2'
                : 'text-zinc-300'
            "
            :to="`/swap-pools/${pair}/add`"
          >
            Add
          </router-link>

          <router-link
            class="px-2 py-1 text-sm font-medium rounded-md transition-all hover:bg-black hover:text-orange-300"
            :class="
              isLinkActive('remove')
                ? 'text-orange-300 underline underline-offset-4 hover:underline-offset-2'
                : 'text-zinc-300'
            "
            :to="`/swap-pools/${pair}/remove`"
          >
            Remove
          </router-link>
        </div>
      </div>

      <!-- body -->
      <div class="text-sm space-y-0.5">
        <AddLiquiditySide
          v-model:symbol="fromSymbol"
          v-model:amount="fromAmount"
          @has-enough="hasEnough = true"
          @not-enough="hasEnough = false"
          @amount-entered="hasAmount = true"
          @amount-cleared="hasAmount = false"
        />

        <!-- flip -->
        <div class="py-4">
          <PlusIcon class="h-5 w-5 mx-auto text-zinc-500" />
        </div>
        <!-- <div class="h-0 relative flex justify-center">
          <div
            class="absolute -translate-y-1/2 bg-zinc-900 p-1 rounded-xl"
          ></div>
        </div> -->

        <AddLiquiditySide v-model:symbol="toSymbol" v-model:amount="toAmount" />
      </div>

      <!-- disabled button -->
      <button
        :class="[!!unmet && !unmet.handler && 'disabled', 'main-btn']"
        v-if="unmet"
        :disabled="!unmet.handler"
        @click="!!unmet.handler && unmet.handler()"
      >
        {{ unmet.message || '' }}
      </button>

      <!-- confirm button -->
      <button class="main-btn" v-else>Swap</button>
    </div>

    <!-- background blur -->
    <SwapBlur />
  </div>
</template>

<style scoped>
.main-btn {
  @apply bg-orange-300/20 text-orange-300 font-medium block w-full py-3 rounded-2xl text-xl hover:bg-orange-300/30;
}

.main-btn.disabled {
  @apply bg-zinc-800 text-zinc-300/50 cursor-not-allowed;
}
</style>
