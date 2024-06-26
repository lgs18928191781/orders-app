<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { getMarketPrice } from '@/queries/orders-api'
import { getOrders } from '@/queries/orders-v2'
import { useNetworkStore } from '@/stores/network'
import { prettyBalance } from '@/lib/formatters'
import { unit, useBtcUnit } from '@/lib/helpers'
import { useSelectOrder } from '@/hooks/use-select-order'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { useFiat } from '@/hooks/use-fiat'

import OrderItem from './OrderItem.vue'
import { Loader2Icon } from 'lucide-vue-next'

const networkStore = useNetworkStore()
const { select } = useSelectOrder()
const { selectedPair } = useTradingPair()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const {
  data: askOrders,
  isFetched: isFetchedAskOrders,
  isLoading: isLoadingAskOrders,
} = useQuery({
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
})
const { data: bidOrders, isLoading: isLoadingBidOrders } = useQuery({
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
  { immediate: true },
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
</script>

<template>
  <div class="flex grow flex-col py-2">
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
            class="ml-1 inline h-4 rounded-full"
          />
        </div>
      </div>
      <div class="th-right th-sticky">
        <div class="flex items-center justify-end">
          <span>Total</span>
          <span class="ml-2">({{ unit }})</span>
          <img
            :src="selectedPair.toIcon"
            class="ml-1 inline h-4 rounded-full"
          />
        </div>
      </div>
    </div>

    <!-- orders -->
    <div class="flex grow flex-col">
      <div
        class="nicer-scrollbar h-1 flex-auto overflow-y-scroll pr-1"
        id="askOrders"
      >
        <div
          class="flex h-full w-full items-center justify-center"
          v-if="isLoadingAskOrders"
        >
          <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
        </div>

        <div
          v-else-if="askOrders && askOrders.length"
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
        <div
          class="flex h-full w-full items-center justify-center"
          v-if="!isLoadingAskOrders && (!askOrders || !askOrders.length)"
        >
          <span class="text-zinc-500">No ask orders</span>
        </div>
      </div>

      <div class="py-2 pl-4">
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
              class="pl-2 text-xs text-zinc-500"
              v-if="isShowingFiat && fiatRate && marketPrice"
            >
              {{ getFiatPriceDisplay(marketPrice, fiatRate) }}
            </span>
          </div>
        </el-tooltip>
      </div>

      <div class="nicer-scrollbar h-1 flex-auto overflow-y-scroll pr-1">
        <div
          class="flex h-full items-center justify-center"
          v-if="isLoadingBidOrders"
        >
          <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
        </div>

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

        <div
          class="flex h-full items-center justify-center"
          v-if="!isLoadingBidOrders && (!bidOrders || !bidOrders.length)"
        >
          <span class="text-zinc-500">No bid orders</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.th {
  @apply col-span-1 pb-2 pt-0 text-left text-sm font-normal text-zinc-500;
}

.th-sticky {
  @apply sticky top-0 bg-zinc-900;
}

.th-right {
  @apply col-span-1 pb-2 pt-0 text-right text-sm font-normal text-zinc-500;
}
</style>
