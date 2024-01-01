<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import AssetSelect from '@/components/swap/AssetSelect.vue'
import { getBrcFiatRate, getFiatRate } from '@/queries/orders-api'
import { calcFiatPrice, unit, useBtcUnit } from '@/lib/helpers'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { prettyBalance } from '@/lib/formatters'
import { getBrc20s } from '@/queries/orders-api'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()

defineProps({
  side: {
    type: String,
    required: true,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
})
const symbol = defineModel('symbol', { required: true, type: String })

// amount
const amount = ref()

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
    console.log({ brc20, myBrc20s: myBrc20s.value })

    if (!brc20) {
      return null
    }

    return `${brc20.balance} $${symbol.value.toUpperCase()}`
  }

  if (!btcBalance.value) {
    return null
  }

  return `${prettyBalance(btcBalance.value, useBtcUnit.value)} ${unit.value}`
})

// use total balance
const useTotalBalance = () => {
  if (symbol.value !== 'btc') {
    // find symbol's balance
    const brc20 = myBrc20s.value?.find(
      (brc20) => brc20.token.toLowerCase() === symbol.value.toLowerCase()
    )

    if (!brc20) {
      return null
    }

    amount.value = brc20.balance
    return
  }

  if (!btcBalance.value) {
    return null
  }

  amount.value = btcBalance.value
}
</script>

<template>
  <div
    class="p-4 bg-zinc-800 rounded-2xl border border-transparent hover:border-zinc-700"
  >
    <div class="text-zinc-400">You {{ side }}</div>

    <!-- main control -->
    <div class="flex items-center space-x-2 justify-between">
      <input
        class="bg-transparent text-4xl quiet-input caret-orange-300 flex-1 w-12 p-0 leading-loose"
        type="text"
        placeholder="0"
        v-model.number="amount"
      />

      <AssetSelect
        :asset-symbol="symbol"
        @update:asset-symbol="$emit('update:symbol', $event)"
      />
    </div>

    <!-- data footer -->
    <div class="flex items-center justify-between">
      <!-- fiat price -->
      <div class="text-sm text-zinc-400" v-if="fiatPrice">
        {{ fiatPrice ? '$' + fiatPrice : '-' }}
      </div>
      <div class="w-1" v-else></div>

      <!-- balance -->
      <div
        class="text-sm text-zinc-400 cursor-pointer"
        @click="useTotalBalance"
      >
        Balance: {{ balance ?? '0' }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
