<script lang="ts" setup>
import { ref, watch, type Ref, computed } from 'vue'
import { PlusIcon } from 'lucide-vue-next'
import Decimal from 'decimal.js'

import { useConnectionStore } from '@/stores/connection'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import { previewAdd } from '@/queries/swap'

import SwapSideBrc from '@/components/swap/SwapSideBrc.vue'
import SwapSideBtc from '@/components/swap/SwapSideBtc.vue'
import AddPricesAndShares from '@/components/swap/pools/AddPricesAndShares.vue'

const { token1Symbol, token2Symbol } = useSwapPoolPair()
const { openConnectionModal } = useConnectionModal()

// amount
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const calculatingToken1 = ref(false)
const token2InscriptionIds = ref<string[]>([])
const ratio = ref(new Decimal(0))
const addEquity = ref(new Decimal(0))
const poolEquity = ref(new Decimal(0))

// watch for token2Amount （always sourcing from token2Amount）
watch(token2Amount, async (newAmount) => {
  if (!newAmount) return

  if (Number(newAmount) === 0) {
    token1Amount.value = undefined
    token2Amount.value = undefined
    return
  }

  calculatingToken1.value = true

  previewAdd({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    source: 'token2',
    sourceAmount: newAmount,
  }).then((preview) => {
    conditions.value = conditions.value.map((c) => {
      if (c.condition === 'insufficient-liquidity') {
        c.met = true
      }
      return c
    })

    ratio.value = new Decimal(preview.ratio)
    addEquity.value = new Decimal(preview.addEquity)
    poolEquity.value = new Decimal(preview.poolEquity)

    token1Amount.value = preview.targetAmount
    calculatingToken1.value = false
  })
})

// connection
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
    message: 'Select some BRC20',
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
  () => [token1Symbol.value, token2Symbol.value],
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

function onAmountCleared() {
  token2InscriptionIds.value = []
  ratio.value = new Decimal(0)
  addEquity.value = new Decimal(0)
  poolEquity.value = new Decimal(0)
  hasAmount.value = false
}
</script>

<template>
  <div class="my-8 space-y-0.5 text-sm">
    <!-- brc first -->
    <SwapSideBrc
      v-model:symbol="token2Symbol"
      v-model:amount="token2Amount"
      v-model:inscription-ids="token2InscriptionIds"
      @has-enough="hasEnough = true"
      @not-enough="hasEnough = false"
      @amount-entered="hasAmount = true"
      @amount-cleared="onAmountCleared"
    />

    <!-- plus icon -->
    <div class="py-2">
      <PlusIcon class="mx-auto h-5 w-5 text-zinc-500" />
    </div>

    <SwapSideBtc
      v-model:symbol="token1Symbol"
      v-model:amount="token1Amount"
      :calculating="calculatingToken1"
    />
  </div>

  <AddPricesAndShares
    class="my-8"
    v-if="ratio.gt(0) && poolEquity.gt(0)"
    :token-1-symbol="token1Symbol"
    :token-2-symbol="token2Symbol"
    :ratio="ratio"
    :add-equity="addEquity"
    :pool-equity="poolEquity"
  />

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
  <button class="main-btn" v-else>Add Liquidity</button>
</template>

<style scoped>
.main-btn {
  @apply bg-primary/20 text-primary font-medium block w-full py-3 rounded-2xl text-xl hover:bg-primary/30;
}

.main-btn.disabled {
  @apply cursor-not-allowed bg-zinc-800 text-zinc-300/50;
}
</style>
