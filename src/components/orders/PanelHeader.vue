<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'

import { useTradingPair } from '@/hooks/use-trading-pair'
import { useNetworkStore } from '@/stores/network'
import { getMarketPrice } from '@/queries/orders-api'
import { prettyBalance, prettySymbol } from '@/lib/formatters'
import { unit, useBtcUnit } from '@/lib/helpers'
import { SHOWING_TRADE_STATS } from '@/data/constants'

import PairSelect from './PairSelect.vue'
import { computed } from 'vue'
import { testnetOrderbookTokens } from '@/data/pinned-tokens'

defineProps(['isLimitExchangeMode'])
defineEmits(['update:isLimitExchangeMode'])

const networkStore = useNetworkStore()
const { fromSymbol } = useTradingPair()

const { data: marketPrice } = useQuery({
  queryKey: [
    'marketPrice',
    { network: networkStore.network, tick: fromSymbol.value },
  ],
  queryFn: () => getMarketPrice({ tick: fromSymbol.value }),
})

const pinnedTokens = computed(() => {
  if (networkStore.isTestnet) return testnetOrderbookTokens
})
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-t-md bg-zinc-800 px-4 py-2 lg:flex-row"
  >
    <div
      class="grid grid-cols-5 items-center justify-start gap-4 lg:flex lg:grid-cols-2"
    >
      <!-- pair select -->
      <PairSelect class="col-span-3 lg:col-span-1" />
      <ModalTokenSelect2 :pinned-tokens="pinnedTokens" />

      <div
        class="col-span-2 text-sm lg:col-span-1 lg:flex lg:gap-2 lg:text-base"
        v-if="marketPrice"
      >
        <div class="text-zinc-300">
          {{ `1 ${prettySymbol(fromSymbol)} =` }}
        </div>
        <div :class="['text-green-500']">
          {{
            marketPrice
              ? prettyBalance(marketPrice, useBtcUnit) + ' ' + unit
              : '-'
          }}
        </div>
      </div>
    </div>
    <div
      class="grid grid-cols-2 items-center gap-2 text-xs lg:grid-cols-4"
      v-if="SHOWING_TRADE_STATS"
    >
      <div class="">24h High</div>
      <div class="">24h Low</div>
      <div class="">24h Volume 1</div>
      <div class="">24h Volume 2</div>
    </div>
  </div>
  <!-- pair select -->

  <!-- limit exchange button -->
  <!-- <div class="col-span-2 flex justify-end">
      <button
        class="col-span-2 rounded-md border px-4 py-2 text-sm transition hover:border-primary hover:bg-primary hover:text-white"
        :class="
          isLimitExchangeMode
            ? 'border-primary bg-primary text-orange-950'
            : 'border-zinc-300 text-zinc-300'
        "
        @click="$emit('update:isLimitExchangeMode', !isLimitExchangeMode)"
        v-if="connectionStore.connected"
      >
        Create Order
      </button>
    </div> -->
</template>
