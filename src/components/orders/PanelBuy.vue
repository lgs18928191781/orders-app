<script lang="ts" setup>
import { Ref, computed, ref, watch } from 'vue'
import { TabPanel } from '@headlessui/vue'
import { ElMessage } from 'element-plus'
import { useQuery } from '@tanstack/vue-query'
import { get } from '@vueuse/core'

import { prettyBalance } from '@/lib/formatters'
import { unit, useBtcUnit } from '@/lib/helpers'
import { calculateFee } from '@/lib/build-helpers'
import { buildBuyTake } from '@/lib/builders/orders-v2'
import { getOrders, type Order } from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'
import { IS_DEV } from '@/data/constants'
import { useAreaHighlight } from '@/hooks/use-area-highlight'
import { useTradingPair } from '@/hooks/use-trading-pair'

import btcIcon from '@/assets/btc.svg?url'
import { useSelectOrder } from '@/hooks/use-select-order'

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const feebStore = useFeebStore()
const { highlight } = useAreaHighlight()
const { selectedPair } = useTradingPair()
const { select, selectedOrder, isSelected, selectedOrderType } =
  useSelectOrder()

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

const selectedBuyOrders: Ref<Order[]> = ref([])

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

const selectedBuyCoinAmount = computed(() => {
  return selectedBuyOrders.value.reduce((acc, cur) => {
    return acc + Number(cur.coinAmount)
  }, 0)
})

const buyTotal = computed(() => {
  if (!selectedBuyCoinAmount.value) return 0

  return (
    prettyBalance(
      selectedBuyCoinAmount.value * useBuyPrice.value,
      get(useBtcUnit)
    ) +
    ' ' +
    get(unit)
  )
})

const buyFees = computed(() => {
  if (!selectedBuyCoinAmount.value) return 0
  if (!feebStore.get) return 0

  const ordersCount = selectedBuyOrders.value.length

  return calculateFee(feebStore.get, 4, 6) * ordersCount
})
const prettyBuyFees = computed(() => {
  if (!buyFees.value) return '0'

  const feeInBtc = buyFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})

const useBuyPrice = ref(0)
const useBuyOrderId = ref()

const price = computed(() => {
  if (!selectedPair.value) return 0
  if (!selectedOrder.value) return 0

  return selectedOrder.value.coinPrice
})

// watch use BuyOrderId change, update selected orders
watch(useBuyOrderId, (buyOrderId) => {
  if (!buyOrderId || !askOrders.value) {
    selectedBuyOrders.value = []
  } else {
    selectedBuyOrders.value = candidateBuyOrders.value
  }
})

const buildProcessTip = ref('Building Transaction...')
async function buildOrder() {
  const feeb = feebStore.get
  if (!feeb) {
    throw new Error('Choose a fee rate first.')
  }

  setIsOpen(true)
  isBuilding.value = true
  let buildRes: any

  buildProcessTip.value = 'Building Transaction...'

  try {
    // buy
    if (!selectedBuyOrders.value.length) return

    buildRes = await buildBuyTake({
      order: selectedBuyOrders.value[0],
      selectedPair: selectedPair.value,
    })
  } catch (error: any) {
    ElMessage.error(error.message)
    setIsOpen(false)
    builtInfo.value = undefined

    if (IS_DEV) throw error
  }

  isBuilding.value = false

  if (!buildRes) return
  console.log({ buildRes })
  builtInfo.value = buildRes
  return
}

// confirm modal
const isOpen = ref(false)
function setIsOpen(value: boolean) {
  isOpen.value = value
}
const isBuilding = ref(false)
const builtInfo = ref()

const canTakeBuyOrder = computed(() => {
  return selectedBuyOrders.value.length > 0 && connectionStore.connected
})
const cannotTakeBuyOrderReason = computed(() => {
  if (!connectionStore.connected) {
    return 'Connect wallet first'
  }
  if (selectedBuyOrders.value.length === 0) {
    return 'Select an order'
  }

  return ''
})
</script>

<template>
  <TabPanel class="flex flex-col justify-between h-full">
    <div class="">
      <div
        class="flex items-center justify-between rounded-md border border-zinc-500 p-2"
      >
        <div class="flex items-center">
          <img :src="btcIcon" alt="btc icon" class="h-6 w-6" />
          <span class="ml-2 text-zinc-500">Price</span>
        </div>

        <div class="relative max-w-[67%] grow">
          <div class="w-full py-2 pl-2 pr-12 text-right outline-none">
            {{ prettyBalance(useBuyPrice, useBtcUnit) }}
          </div>
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
          >
            {{ unit }}
          </span>
        </div>
      </div>

      <!-- amount -->
      <div
        class="mt-4 flex items-center justify-between rounded-md border border-zinc-500 p-2"
      >
        <div class="flex items-center">
          <img
            :src="selectedPair.fromIcon"
            alt="btc icon"
            class="h-6 w-6 rounded-full"
          />
          <span class="ml-2 text-zinc-500">Amount</span>
        </div>

        <div class="max-w-[67%] grow flex items-center" v-if="useBuyOrderId">
          <div class="w-full p-2 text-right outline-none">
            {{ selectedBuyCoinAmount }}
          </div>
          <div
            class="pointer-events-none flex items-center pr-2 text-zinc-400 uppercase"
          >
            ${{ selectedPair.fromSymbol }}
          </div>
        </div>

        <div class="max-w-[67%] grow text-right text-primary py-1" v-else>
          <button
            class="text-primary/80 flex items-center gap-2 justify-end w-full group"
            @click="highlight('askOrdersList')"
          >
            <span class="group-hover:underline">Select an</span>

            <span
              class="text-red-500 font-bold bg-red-500/20 py-0.5 px-2 rounded-md"
            >
              ASK Order
            </span>
            <span class="group-hover:underline">to buy</span>
          </button>
        </div>
      </div>
    </div>

    <!-- buy -->
    <div class="">
      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-500">Total</span>
        <span class="text-zinc-300">{{ buyTotal }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-500">Gas</span>
        <span class="text-zinc-300">{{ prettyBuyFees }}</span>
      </div>

      <button
        class="mt-4 w-full rounded-md py-4 font-bold"
        :class="
          canTakeBuyOrder
            ? 'bg-green-500 text-white'
            : 'bg-zinc-700 text-zinc-500'
        "
        @click="buildOrder"
        :disabled="!canTakeBuyOrder"
      >
        {{
          cannotTakeBuyOrderReason ||
          `Buy $${selectedPair.fromSymbol.toUpperCase()}`
        }}
      </button>
    </div>
  </TabPanel>
</template>

<style scoped></style>
