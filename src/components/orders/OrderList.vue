<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { getFiatRate, getMarketPrice } from '@/queries/orders-api'
import { getOrders } from '@/queries/orders-v2'
import { useNetworkStore } from '@/stores/network'
import { prettyBalance } from '@/lib/formatters'
import { calcFiatPrice, showFiat, unit, useBtcUnit } from '@/lib/helpers'
import { useSelectOrder } from '@/hooks/use-select-order'
import { useTradingPair } from '@/hooks/use-trading-pair'

import OrderItem from './OrderItem.vue'

const networkStore = useNetworkStore()
const { select } = useSelectOrder()
const { selectedPair } = useTradingPair()

const { data: askOrders, isFetched: isFetchedAskOrders } = useQuery({
  queryKey: [
    'askOrders',
    { network: networkStore.network, tick: selectedPair.value.fromSymbol },
  ],
  queryFn: () =>
    getOrders({
      type: 'ask',
      network: networkStore.network,
      sort: 'desc',
      tick: selectedPair.value.fromSymbol,
    }),
  placeholderData: [],
})
const { data: bidOrders } = useQuery({
  queryKey: [
    'bidOrders',
    { network: networkStore.network, tick: selectedPair.value.fromSymbol },
  ],
  queryFn: () =>
    getOrders({
      type: 'bid',
      network: networkStore.network,
      sort: 'desc',
      tick: selectedPair.value.fromSymbol,
    }),
  placeholderData: [],
})
// watch ask orders data
// when it finish loaded, scroll to the bottom
watch(
  isFetchedAskOrders,
  (isFetchedAskOrders) => {
    if (!isFetchedAskOrders) return

    setTimeout(() => {
      const el = document.getElementById('askOrders')
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }, 100)
  },
  { immediate: true }
)

const rearrangedAskOrders = computed(() => {
  if (!askOrders.value) return []

  // extract all free orders and put them at the bottom
  const freeOrders = askOrders.value.filter((order) => order.freeState === 1)
  const nonFreeOrders = askOrders.value.filter((order) => order.freeState !== 1)

  return [...nonFreeOrders, ...freeOrders]
})

const emit = defineEmits(['useBuyPrice', 'useSellPrice'])

const { data: marketPrice } = useQuery({
  queryKey: [
    'marketPrice',
    { network: networkStore.network, tick: selectedPair.value.fromSymbol },
  ],
  queryFn: () => getMarketPrice({ tick: selectedPair.value.fromSymbol }),
})

// fiat price
const { data: fiatRate } = useQuery({
  queryKey: ['fiatRate'],
  queryFn: getFiatRate,
})
</script>

<template>
  <div class="grow py-2 flex flex-col">
    <!-- head -->
    <div class="grid grid-cols-3 gap-1 px-2">
      <div class="th th-sticky">Price ({{ unit }})</div>
      <div class="th-right th-sticky">
        <div class="flex items-center justify-end">
          <span>Amount</span>
          <span class="ml-2">
            {{ '$' + selectedPair.fromSymbol.toUpperCase() }}
          </span>
          <img
            :src="selectedPair.fromIcon"
            class="h-4 rounded-full inline ml-1"
          />
        </div>
      </div>
      <div class="th-right th-sticky">
        <div class="flex items-center justify-end">
          <span>Total</span>
          <span class="ml-2">({{ unit }})</span>
          <img
            :src="selectedPair.toIcon"
            class="h-4 rounded-full inline ml-1"
          />
        </div>
      </div>
    </div>

    <!-- orders -->
    <div class="flex flex-col grow">
      <div
        class="nicer-scrollbar flex-auto h-1 overflow-y-scroll pr-1"
        id="askOrders"
      >
        <div class="w-full">
          <div
            v-if="askOrders && askOrders.length"
            id="askOrdersList"
            class="space-y-1"
          >
            <OrderItem
              v-for="order in rearrangedAskOrders"
              :key="order.orderId"
              :order="order"
              :order-type="'ask'"
              @click="select(order)"
            />
          </div>
        </div>
        <div
          class="flex h-full w-full items-center justify-center"
          v-if="!askOrders || !askOrders.length"
        >
          <span class="text-zinc-500">No ask orders</span>
        </div>
      </div>

      <div class="py-2 px-2">
        <el-tooltip :content="`Market Price`" placement="right" effect="light">
          <div class="inline-flex items-center">
            <span
              :class="[
                'text-lg',
                marketPrice ? 'text-green-500' : 'text-zinc-500',
              ]"
            >
              {{
                marketPrice
                  ? prettyBalance(marketPrice, useBtcUnit) + ' ' + unit
                  : '-'
              }}
            </span>
            <span
              class="text-xs text-zinc-500 pl-2"
              v-if="showFiat && fiatRate && marketPrice"
            >
              {{ '$' + calcFiatPrice(marketPrice, fiatRate) }}
            </span>
          </div>
        </el-tooltip>
      </div>

      <div class="nicer-scrollbar flex-auto h-1 overflow-y-scroll pr-1">
        <div class="w-full">
          <div
            id="bidOrdersList"
            v-if="bidOrders && bidOrders.length"
            class="space-y-1"
          >
            <OrderItem
              v-for="order in bidOrders"
              :key="order.orderId"
              :order="order"
              :order-type="'bid'"
              @click="select(order)"
            />
          </div>
        </div>

        <div
          class="flex h-full items-center justify-center"
          v-if="!bidOrders || !bidOrders.length"
        >
          <span class="text-zinc-500">No bid orders</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.th {
  @apply pb-2 pt-0 text-left text-sm font-normal text-zinc-500 col-span-1;
}

.th-sticky {
  @apply sticky top-0 bg-zinc-900;
}

.th-right {
  @apply pb-2 pt-0 text-right text-sm font-normal text-zinc-500 col-span-1;
}
</style>
