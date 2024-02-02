<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { Loader2Icon } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'

import { getBrcFiatRate, getFiatRate } from '@/queries/orders-api'
import { getBrc20s } from '@/queries/orders-api'
import { calcFiatPrice, unit, useBtcUnit } from '@/lib/helpers'
import { prettyBalance, prettySymbol } from '@/lib/formatters'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const { selectedPair } = useSwapPoolPair()

defineProps({
  side: {
    type: String,
    required: false,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
  calculating: {
    type: Boolean,
    default: false,
  },
})
const symbol = defineModel('symbol', { required: true, type: String })
const icon = computed(() => {
  if (!selectedPair.value) {
    return null
  }

  if (symbol.value === selectedPair.value.token1Symbol) {
    return selectedPair.value.token1Icon
  }

  return selectedPair.value.token2Icon
})

// amount
const amount = defineModel('amount', { type: String })
const normalizedAmount = computed(() => {
  if (!amount.value) {
    return '0'
  }

  const dividedBy = symbol.value.toLowerCase() === 'btc' ? 1e8 : 1
  return new Decimal(amount.value).dividedBy(dividedBy).toDP().toFixed()
})

const amountTextSize = computed(() => {
  if (!amount.value) {
    return 'text-4xl'
  }

  if (normalizedAmount.value.length > 16) {
    return 'text-xs'
  }

  if (normalizedAmount.value.length > 12) {
    return 'text-lg'
  }

  if (normalizedAmount.value.length > 10) {
    return 'text-xl'
  }

  if (normalizedAmount.value.length > 8) {
    return 'text-2xl'
  }

  if (normalizedAmount.value.length > 6) {
    return 'text-3xl'
  }

  return 'text-4xl'
})

const emit = defineEmits(['update:symbol'])

// fiat price
const { data: btcFiatRate } = useQuery({
  queryKey: ['fiatRate', { coin: 'btc' }],
  queryFn: getFiatRate,
})
const { data: brcFiatRates } = useQuery({
  queryKey: ['brcFiatRate'],
  queryFn: getBrcFiatRate,
  enabled: computed(() => false),
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
const { data: btcBalance, isLoading: isLoadingBtcBalance } = useQuery({
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
  queryFn: () =>
    getBrc20s({
      address: connectionStore.getAddress,
      network: networkStore.network,
    }),
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
</script>

<template>
  <div class="swap-sub-control-panel">
    <div class="text-zinc-400" v-if="!!side">You {{ side }}</div>

    <!-- main control -->
    <div class="flex items-center space-x-2 justify-between h-16">
      <div
        class="bg-transparent flex-1 w-12 p-0 leading-loose"
        :class="[
          calculating ? 'text-zinc-500' : 'text-zinc-100',
          // if too long, make it smaller
          amountTextSize,
        ]"
      >
        {{ normalizedAmount }}
      </div>

      <Loader2Icon class="animate-spin text-zinc-400" v-if="calculating" />

      <div
        :class="[
          'rounded-full p-1 px-4 text-base flex items-center gap-1 bg-zinc-900',
        ]"
      >
        <img :src="icon" class="w-5 h-5 rounded-full" v-if="icon" />
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
      <div class="text-xs text-zinc-400" v-show="!!symbol">
        Balance: {{ balanceDisplay }}
      </div>
    </div>
  </div>
</template>
