<script lang="ts" setup>
import { Ref, computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { getOrders, type Order } from '@/queries/orders-api'
import { useNetworkStore } from '@/stores/network'
import { useTradingPair } from '@/hooks/use-trading-pair'

import OrderList from './List.vue'

const networkStore = useNetworkStore()
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

const takeModeTab = ref(0)

const selectedBuyOrders: Ref<Order[]> = ref([])
const selectedSellOrders: Ref<Order[]> = ref([])

const candidateBuyOrders = computed(() => {
  if (useBuyPrice.value === 0) return []
  if (!askOrders.value) return []

  return askOrders.value
    .filter((item) => {
      return (
        Number(item.coinRatePrice) === useBuyPrice.value &&
        item.orderId === useBuyOrderId.value
      )
    })
    .slice(0, 1)
})
const candidateSellOrders = computed(() => {
  if (useSellPrice.value === 0) return []
  if (!bidOrders.value) return []

  return bidOrders.value
    .filter((item) => {
      return (
        Number(item.coinRatePrice) === useSellPrice.value &&
        item.orderId === useSellOrderId.value
      )
    })
    .slice(0, 1)
})

const useBuyPrice = ref(0)
const useSellPrice = ref(0)
const useBuyOrderId = ref()
const useSellOrderId = ref()

function setUseBuyPrice(price: number, orderId: string) {
  takeModeTab.value = 0
  useBuyPrice.value = price
  useBuyOrderId.value = orderId
}
function setUseSellPrice(price: number, orderId: string) {
  takeModeTab.value = 1
  useSellPrice.value = price
  useSellOrderId.value = orderId
}

// watch use BuyOrderId change, update selected orders
watch(useBuyOrderId, (buyOrderId) => {
  if (!buyOrderId || !askOrders.value) {
    selectedBuyOrders.value = []
  } else {
    selectedBuyOrders.value = candidateBuyOrders.value
  }
})
watch(useSellOrderId, (sellOrderId) => {
  if (!sellOrderId || !bidOrders.value) {
    selectedSellOrders.value = []
  } else {
    selectedSellOrders.value = candidateSellOrders.value
  }
})
</script>

<template>
  <div class="primary-panel flex flex-col">
    <div class="p-4 bg-zinc-800 flex flex-col lg:flex-row gap-4 rounded-t-lg">
      Order Book
    </div>
    <OrderList
      :askOrders="askOrders"
      :bidOrders="bidOrders"
      @use-buy-price="(price: number, orderId: string) => setUseBuyPrice(price, orderId)"
      @use-sell-price="(price: number, orderId: string) => setUseSellPrice(price, orderId)"
    />
  </div>
</template>

<style scoped></style>
