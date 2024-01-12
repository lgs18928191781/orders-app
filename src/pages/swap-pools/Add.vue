<script lang="ts" setup>
import { ref, watch, type Ref, computed } from 'vue'
import { PlusIcon } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'

import AddLiquiditySide from '@/components/swap/pools/AddLiquiditySide.vue'
import { useConnectionModal } from '@/hooks/use-connection-modal'

const { fromSymbol, toSymbol } = useSwapPoolPair()
const { openConnectionModal } = useConnectionModal()

// amount
const fromAmount = ref()
const toAmount = ref()

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
  <div class="text-sm space-y-0.5 my-8">
    <AddLiquiditySide
      v-model:symbol="fromSymbol"
      v-model:amount="fromAmount"
      @has-enough="hasEnough = true"
      @not-enough="hasEnough = false"
      @amount-entered="hasAmount = true"
      @amount-cleared="hasAmount = false"
    />

    <!-- flip -->
    <div class="py-2">
      <PlusIcon class="h-5 w-5 mx-auto text-zinc-500" />
    </div>

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
</template>

<style scoped>
.main-btn {
  @apply bg-orange-300/20 text-orange-300 font-medium block w-full py-3 rounded-2xl text-xl hover:bg-orange-300/30;
}

.main-btn.disabled {
  @apply bg-zinc-800 text-zinc-300/50 cursor-not-allowed;
}
</style>