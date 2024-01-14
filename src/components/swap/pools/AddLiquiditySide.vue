<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { getBrcFiatRate, getFiatRate } from '@/queries/orders-api'
import { calcFiatPrice, unit, useBtcUnit } from '@/lib/helpers'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { prettyBalance, prettySymbol } from '@/lib/formatters'
import { getBrc20s } from '@/queries/orders-api'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()

const { selectedPair } = useSwapPoolPair()

const symbol = defineModel('symbol', { required: true, type: String })
const amount = defineModel('amount', { type: Number })
const emit = defineEmits([
  'hasEnough',
  'notEnough',
  'amountEntered',
  'amountCleared',
  'update:symbol',
])

// derive icon
const icon = computed(() => {
  if (!selectedPair.value) {
    return null
  }

  if (symbol.value === selectedPair.value.token1Symbol) {
    return selectedPair.value.token1Icon
  }

  return selectedPair.value.token2Icon
})

// fiat price
const { data: btcFiatRate } = useQuery({
  queryKey: ['fiatRate', { coin: 'btc' }],
  queryFn: getFiatRate,
})
const { data: brcFiatRates } = useQuery({
  queryKey: ['brcFiatRate'],
  queryFn: getBrcFiatRate,
})

const fiatPrice = computed(() => {
  if (!amount.value) {
    return null
  }

  if (symbol.value === 'btc') {
    if (!btcFiatRate.value) {
      return null
    }

    return calcFiatPrice(amount.value, btcFiatRate.value)
  }

  if (!brcFiatRates.value) {
    return null
  }

  const rate = brcFiatRates.value[symbol.value.toLowerCase()]
  return calcFiatPrice(amount.value, rate)
})

// balance
const { data: btcBalance } = useQuery({
  queryKey: [
    'balance',
    { network: networkStore.network, address: connectionStore.getAddress },
  ],
  queryFn: () => connectionStore.adapter.getBalance(),
  enabled: computed(() => connectionStore.connected),
})
const { data: myBrc20s } = useQuery({
  queryKey: [
    'myBrc20s',
    {
      address: connectionStore.getAddress,
      network: networkStore.network,
    },
  ],
  queryFn: () => getBrc20s({ address: connectionStore.getAddress }),
  enabled: computed(() => connectionStore.connected),
})
const balance = computed(() => {
  if (symbol.value !== 'btc') {
    // find symbol's balance
    const brc20 = myBrc20s.value?.find(
      (brc20) => brc20.token.toLowerCase() === symbol.value.toLowerCase()
    )

    if (!brc20) {
      return 0
    }

    return Number(brc20.balance)
  }

  if (!btcBalance.value) {
    return 0
  }

  return btcBalance.value
})

const balanceDisplay = computed(() => {
  if (balance.value === 0) {
    return '0'
  }

  if (symbol.value === 'btc') {
    return `${prettyBalance(balance.value, useBtcUnit.value)} ${unit.value}`
  }

  return `${balance.value} ${symbol.value.toUpperCase()}`
})

// use total balance
const useTotalBalance = () => {
  if (symbol.value !== 'btc') {
    // find symbol's balance
    const brc20 = myBrc20s.value?.find(
      (brc20) => brc20.token.toLowerCase() === symbol.value.toLowerCase()
    )

    if (!brc20) {
      amount.value = 0
      return
    }

    amount.value = Number(brc20.balance)
    return
  }

  if (!btcBalance.value) {
    amount.value = 0
    return
  }

  amount.value = btcBalance.value
}

const hasEnough = computed(() => {
  if (!amount.value) {
    return true
  }

  return amount.value <= balance.value
})

// watch for change of hasEnough; emit event
watch(
  () => hasEnough.value,
  (hasEnough) => {
    if (hasEnough) {
      emit('hasEnough')
    } else {
      emit('notEnough')
    }
  }
)

// watch for change of amount; emit event
watch(
  () => amount.value,
  (amount) => {
    if (amount) {
      emit('amountEntered')
    } else {
      emit('amountCleared')
    }
  }
)
</script>

<template>
  <div
    class="px-4 py-5 bg-zinc-800 rounded-2xl border border-transparent hover:border-zinc-700"
  >
    <!-- main control -->
    <div class="flex items-center space-x-2 justify-between">
      <input
        class="bg-transparent text-4xl quiet-input flex-1 w-12 p-0 leading-loose"
        :class="
          hasEnough
            ? 'text-zinc-100 caret-primary'
            : 'text-red-500 caret-red-500'
        "
        placeholder="0"
        type="number"
        v-model.number="amount"
      />

      <div
        :class="[
          'rounded-full p-1 px-4 text-xl flex items-center gap-1 bg-zinc-900',
        ]"
        v-if="selectedPair"
      >
        <img :src="icon" class="w-6 h-6 rounded-full" v-if="icon" />
        <div class="mr-1">
          {{ prettySymbol(symbol) }}
        </div>
      </div>
    </div>

    <!-- data footer -->
    <div
      class="flex items-center justify-between"
      v-if="connectionStore.connected"
    >
      <!-- fiat price -->
      <div class="text-sm text-zinc-400" v-if="fiatPrice">
        {{ fiatPrice ? '$' + fiatPrice : '-' }}
      </div>
      <div class="w-1" v-else></div>

      <!-- balance -->
      <div
        class="text-sm text-zinc-400 cursor-pointer"
        v-show="!!symbol"
        @click="useTotalBalance"
      >
        Balance: {{ balanceDisplay }}
      </div>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  /* display: none; <- Crashes Chrome on hover */
  -webkit-appearance: none;
  margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type='number'] {
  -moz-appearance: textfield; /* Firefox */
}
</style>
