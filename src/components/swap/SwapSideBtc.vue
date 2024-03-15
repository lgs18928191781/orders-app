<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { Loader2Icon, AlertCircleIcon } from 'lucide-vue-next'
import gsap from 'gsap'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useExcludedBalanceQuery } from '@/queries/excluded-balance'

import { getBrcFiatRate, getFiatRate } from '@/queries/orders-api'
import { getBrc20s } from '@/queries/orders-api'
import { calcFiatPrice, unit, useBtcUnit } from '@/lib/helpers'
import { prettyBalance, prettySymbol } from '@/lib/formatters'
import { ADD_THRESHOLD_AMOUNT, SWAP_THRESHOLD_AMOUNT } from '@/data/constants'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()

const props = defineProps({
  side: {
    type: String,
    required: false,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
  useCase: {
    type: String,
    required: false,
    validator: (useCase: string) => ['add', 'swap'].includes(useCase),
  },
  calculating: {
    type: Boolean,
    default: false,
  },
})

const symbol = defineModel('symbol', { required: true, type: String })

// amount
const amount = defineModel('amount', { type: String })
const normalizedAmount = computed(() => {
  if (!amount.value) {
    return 0
  }

  const dividedBy = symbol.value.toLowerCase() === 'btc' ? 1e8 : 1
  return new Decimal(amount.value).dividedBy(dividedBy).toDP(0).toNumber()
})
const tweenedAmount = reactive({
  number: 0,
})
watch(amount, (n) => {
  gsap.to(tweenedAmount, { duration: 0.2, number: Number(n) || 0 })
})

const amountTextSize = computed(() => {
  if (!amount.value) {
    return 'text-4xl'
  }

  if (String(normalizedAmount.value).length > 16) {
    return 'text-xs'
  }

  if (String(normalizedAmount.value).length > 12) {
    return 'text-lg'
  }

  if (String(normalizedAmount.value).length > 10) {
    return 'text-xl'
  }

  if (String(normalizedAmount.value).length > 8) {
    return 'text-2xl'
  }

  if (String(normalizedAmount.value).length > 6) {
    return 'text-3xl'
  }

  return 'text-4xl'
})

const emit = defineEmits([
  'update:symbol',
  'hasEnough',
  'notEnough',
  'moreThanThreshold',
  'lessThanThreshold',
])

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
const { data: btcBalance } = useExcludedBalanceQuery(
  computed(() => connectionStore.getAddress),
  computed(() => !!connectionStore.connected),
)
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
      (brc20) => brc20.token.toLowerCase() === symbol.value.toLowerCase(),
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

const hasEnough = computed(() => {
  if (!amount.value) {
    return true
  }

  if (props.side === 'receive') {
    return true
  }

  return new Decimal(amount.value).lte(new Decimal(balance.value))
})
watch(
  () => hasEnough.value,
  (hasEnough) => {
    if (hasEnough) {
      emit('hasEnough')
    } else {
      emit('notEnough')
    }
  },
)

const threshold = computed(() =>
  props.useCase === 'add' ? ADD_THRESHOLD_AMOUNT : SWAP_THRESHOLD_AMOUNT,
)
const thresholdInBtc = computed(() => new Decimal(threshold.value).div(1e8))
const amountMoreThanThreshold = computed(() => {
  if (!amount.value) {
    return true
  }

  return new Decimal(amount.value).gte(threshold.value)
})
watch(
  () => amountMoreThanThreshold.value,
  (moreThanThreshold) => {
    if (moreThanThreshold) {
      emit('moreThanThreshold')
    } else {
      emit('lessThanThreshold')
    }
  },
)
</script>

<template>
  <div class="swap-sub-control-panel">
    <div class="text-zinc-400" v-if="side === 'pay'">You pay</div>
    <div class="text-zinc-400" v-if="side === 'receive'">Should receive</div>

    <!-- main control -->
    <div class="flex h-16 items-center justify-between space-x-2">
      <div
        class="w-12 flex-1 bg-transparent p-0 leading-loose"
        :class="[
          hasEnough
            ? calculating
              ? 'text-zinc-500'
              : 'text-zinc-100 caret-primary'
            : calculating
              ? 'text-red-900/50 caret-red-900/50'
              : 'text-red-500 caret-red-500',
          // if too long, make it smaller
          amountTextSize,
        ]"
      >
        {{ new Decimal(tweenedAmount.number).div(1e8).toDP(8).toString() }}
      </div>

      <Loader2Icon class="animate-spin text-zinc-400" v-if="calculating" />

      <div
        :class="[
          'flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-base',
        ]"
      >
        <TokenIcon :token="'btc'" class="size-5 rounded-full" />
        <div class="mr-1">
          {{ prettySymbol(symbol) }}
        </div>
      </div>
    </div>

    <!-- warning -->
    <div
      class="-mt-2 mb-2 flex items-center gap-2 text-sm text-red-500"
      v-if="hasEnough && !calculating && !amountMoreThanThreshold"
    >
      <AlertCircleIcon class="size-4" />
      Amount should be at least {{ thresholdInBtc }} BTC
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
