<script lang="ts" setup>
import { ref, watch, type Ref, computed } from 'vue'
import { ArrowDownIcon } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionModal from '@/components/header/ConnectionModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import { ArrowUpDownIcon } from 'lucide-vue-next'
import { SWAP_READY } from '@/data/constants'

const { openConnectionModal } = useConnectionModal()

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

const connectionStore = useConnectionStore()

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
    handler: openConnectionModal,
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
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <div class="relative max-w-md mt-16 mx-auto rounded-3xl">
    <div
      class="border border-orange-300/30 rounded-3xl shadow-md p-2 pt-3 bg-zinc-900 space-y-3"
    >
      <!-- header -->
      <div class="px-3 flex gap-4">
        <router-link
          to="/swap"
          class="flex items-center space-x-1 text-zinc-200"
        >
          Swap
        </router-link>

        <router-link
          to="/swap-pools/btc-rdex/add"
          class="flex items-center space-x-1 text-zinc-400 hover:text-zinc-600"
        >
          Pools
        </router-link>
      </div>

      <!-- body -->
      <div class="text-sm space-y-0.5">
        <SwapSide
          side="pay"
          v-model:symbol="fromSymbol"
          v-model:amount="fromAmount"
          @has-enough="hasEnough = true"
          @not-enough="hasEnough = false"
          @amount-entered="hasAmount = true"
          @amount-cleared="hasAmount = false"
        />

        <!-- flip -->
        <div class="h-0 relative flex justify-center">
          <div class="absolute -translate-y-1/2 bg-zinc-900 p-1 rounded-xl">
            <div class="group transition-all">
              <ArrowDownIcon
                class="h-4 w-4 inline group-hover:hidden p-2 box-content bg-zinc-800 rounded-lg"
              />
              <button
                class="hidden group-hover:inline p-2 box-content transition-all duration-300 bg-zinc-800 rounded-lg shadow-sm shadow-orange-300/80"
                :class="{
                  'rotate-180': fromSymbol === 'btc',
                }"
                @click="flipAsset"
              >
                <ArrowUpDownIcon class="h-6 w-6 text-orange-300" />
              </button>
            </div>
          </div>
        </div>

        <SwapSide
          side="receive"
          v-model:symbol="toSymbol"
          v-model:amount="toAmount"
        />
      </div>

      <template v-if="SWAP_READY">
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
      </template>

      <button class="disabled main-btn" v-else :disabled="true" @click="">
        Coming Soon!
      </button>
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
