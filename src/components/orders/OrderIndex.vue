<script lang="ts" setup>
import { Ref, computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { get } from '@vueuse/core'

import { prettyBalance } from '@/lib/formatters'
import { sleep, unit, useBtcUnit } from '@/lib/helpers'
import { calculateFee } from '@/lib/build-helpers'
import { buildAskLimit } from '@/lib/builders/orders'
import {
  buildBidOffer,
  buildBuyTake,
  buildSellTake,
} from '@/lib/builders/orders-v2'
import {
  getOrdiBalance,
  getOrders,
  getOneBrc20,
  getMarketPrice,
  type Order,
  type Brc20Transferable,
} from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'
import { IS_DEV, SELL_TX_SIZE } from '@/data/constants'
import { useAreaHighlight } from '@/hooks/use-area-highlight'
import { useTradingPair } from '@/hooks/use-trading-pair'

import btcIcon from '@/assets/btc.svg?url'
import OrderPanelHeader from './PanelHeader.vue'
import OrderList from './List.vue'
import OrderConfirmationModal from '../ConfirmationModal.vue'
import PanelOrderBook from '@/components/orders/PanelOrderBook.vue'
import PanelPairInfo from '@/components/orders/PanelPairInfo.vue'
import PanelOrderHistory from '@/components/orders/PanelOrderHistory.vue'
import PanelTrade from '@/components/orders/PanelTrade.vue'

const connectionStore = useConnectionStore()
const address = connectionStore.getAddress
const networkStore = useNetworkStore()
const feebStore = useFeebStore()
const { highlight } = useAreaHighlight()
const { selectedPair } = useTradingPair()

// watch ask orders data
// when it finish loaded, scroll to the bottom

const takeModeTab = ref(0)
function changeTakeModeTab(index: number) {
  takeModeTab.value = index
}

function deviatePrice(price: number, deviator: number): number {
  return new Decimal(price * deviator).toDP(new Decimal(price).dp()).toNumber()
}

const selectedBuyOrders: Ref<Order[]> = ref([])
const selectedSellOrders: Ref<Order[]> = ref([])

const selectedBuyCoinAmount = computed(() => {
  return selectedBuyOrders.value.reduce((acc, cur) => {
    return acc + Number(cur.coinAmount)
  }, 0)
})
const selectedSellCoinAmount = computed(() => {
  return selectedSellOrders.value.reduce((acc, cur) => {
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
const sellFees = computed(() => {
  if (!feebStore.get) return 0

  return SELL_TX_SIZE * feebStore.get
})

const prettyBuyFees = computed(() => {
  if (!buyFees.value) return '0'

  const feeInBtc = buyFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})
const prettySellFees = computed(() => {
  if (!sellFees.value) return '0'

  const feeInBtc = sellFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
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
    if (isLimitExchangeMode.value) {
      if (limitExchangeType.value === 'bid') {
        const preBuildRes = await buildBidOffer({
          total: bidTotalExchangePrice.value,
          coinAmount: bidAmount.value,
          selectedPair: selectedPair.value,
        })
        buildRes = preBuildRes
      } else {
        buildRes = await buildAskLimit({
          total: Math.round(askExchangePrice.value * askLimitBrcAmount.value),
          amount: askLimitBrcAmount.value,
          selectedPair: selectedPair.value,
        })
      }
    } else {
      if (takeModeTab.value === 0) {
        // buy
        if (!selectedBuyOrders.value.length) return

        buildRes = await buildBuyTake({
          order: selectedBuyOrders.value[0],
          selectedPair: selectedPair.value,
        })
      } else if (takeModeTab.value === 1) {
        // sell
        if (!selectedSellOrders.value.length) return

        const total = selectedSellOrders.value.reduce((acc, cur) => {
          return acc + Number(cur.amount)
        }, 0)

        const sellTake = await buildSellTake({
          total,
          amount: selectedSellCoinAmount.value,
          selectedPair: selectedPair.value,
          orderId: selectedSellOrders.value[0].orderId,
        }).catch(async (err) => {
          await sleep(500)

          console.log({ err })
          ElMessage.error(err.message)
          setIsOpen(false)
          builtInfo.value = undefined
          isLimitExchangeMode.value = false
          if (IS_DEV) {
            throw err
          }
        })

        buildRes = {
          ...sellTake,
          orderId: selectedSellOrders.value[0].orderId,
          amount: selectedSellOrders.value[0].coinAmount.toString(),
        }
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message)
    setIsOpen(false)
    builtInfo.value = undefined
    isLimitExchangeMode.value = false

    if (IS_DEV) throw error
  }

  isBuilding.value = false

  if (!buildRes) return
  console.log({ buildRes })
  builtInfo.value = buildRes
  return
}

async function goInscribe() {
  const adapter = connectionStore.adapter

  await adapter?.inscribe(selectedPair.value.exactName)
}

// confirm modal
const isOpen = ref(false)
function setIsOpen(value: boolean) {
  isOpen.value = value
}
const isBuilding = ref(false)
const builtInfo = ref()

// limit exchange mode
const isLimitExchangeMode = ref(false)
const limitExchangeType: Ref<'bid' | 'ask'> = ref('bid')
const { data: marketPrice } = useQuery({
  queryKey: [
    'marketPrice',
    { network: networkStore.network, tick: selectedPair.value.fromSymbol },
  ],
  queryFn: () => getMarketPrice({ tick: selectedPair.value.fromSymbol }),
})

const bidExchangePrice = ref(0)
const bidAmount = ref()
const bidTotalExchangePrice = computed(() => {
  return Math.round(bidExchangePrice.value * bidAmount.value)
})

const canPlaceBidOrder = computed(() => {
  if (IS_DEV) {
    return bidExchangePrice.value > 0 && bidAmount.value > 0
  }

  return (
    bidExchangePrice.value > 0 &&
    bidAmount.value > 0 &&
    bidTotalExchangePrice.value >= 10000
  )
})
const cannotPlaceBidOrderReason = computed(() => {
  if (bidExchangePrice.value <= 0) {
    return 'Enter a price'
  }
  if (bidAmount.value <= 0) {
    return 'Enter an amount'
  }
  if (bidTotalExchangePrice.value < 10000) {
    return 'Order should > 0.0001 BTC'
  }

  return ''
})

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

const canTakeSellOrder = computed(() => {
  return selectedSellOrders.value.length > 0 && connectionStore.connected
})
const cannotTakeSellOrderReason = computed(() => {
  if (!connectionStore.connected) {
    return 'Connect wallet first'
  }
  if (selectedSellOrders.value.length === 0) {
    return 'Select an order'
  }

  return ''
})

const askExchangePrice = ref(0)
const updateExchangePrice = (price: number, type: 'ask' | 'bid') => {
  if (typeof price === 'string') {
    price = Number(price)
  }
  if (isNaN(price)) {
    price = 0
  }
  if (useBtcUnit.value) {
    price = new Decimal(price).times(1e8).toNumber()
  }

  if (type === 'ask') {
    askExchangePrice.value = price
  } else {
    bidExchangePrice.value = price
  }
}
const askExchangeOrdiAmount = ref(0)
const askLimitBrcAmount = computed(() => {
  if (networkStore.network === 'testnet') {
    return askExchangeOrdiAmount.value
  }

  if (!selectedAskCandidate.value) return 0

  return Number(selectedAskCandidate.value.amount)
})
const askTotalExchangePrice = computed(() => {
  return Math.round(askExchangePrice.value * askLimitBrcAmount.value)
})
const canPlaceAskOrder = computed(() => {
  return (
    askExchangePrice.value > 0 &&
    askLimitBrcAmount.value > 0 &&
    askTotalExchangePrice.value >= 10000
  )
})
const cannotPlaceAskOrderReason = computed(() => {
  if (askExchangePrice.value <= 0) {
    return 'Enter a price'
  }
  if (askLimitBrcAmount.value <= 0) {
    return 'Enter an amount'
  }
  if (askTotalExchangePrice.value < 10000) {
    return 'Order should > 0.0001 BTC'
  }

  return ''
})

const { data: ordiBalance } = useQuery({
  queryKey: [
    'ordiBalance',
    {
      address,
      network: networkStore.network,
    },
  ],
  queryFn: () => getOrdiBalance(address, networkStore.network),
})
const { data: myBrc20Info } = useQuery({
  queryKey: [
    'myBrc20Info',
    {
      address,
      network: networkStore.network,
      tick: selectedPair.value.fromSymbol,
    },
  ],
  queryFn: () =>
    getOneBrc20({
      address,
      tick: selectedPair.value.fromSymbol,
    }),

  enabled: computed(() => networkStore.network !== 'testnet' && !!address),
})
const selectedAskCandidate: Ref<Brc20Transferable | undefined> = ref()
</script>

<template>
  <div class="grid grid-cols-10 mx-auto px-3 mb-3 grow w-full max-w-9xl gap-3">
    <div class="col-span-7">
      <div class="grid grid-cols-7 gap-3 mb-3">
        <PanelPairInfo class="col-span-4" />

        <!-- table -->
        <PanelTrade class="col-span-3" />
      </div>

      <PanelOrderHistory />
    </div>

    <PanelOrderBook class="col-span-3" />

    <!-- modal -->
    <OrderConfirmationModal
      v-model:is-open="isOpen"
      v-model:is-building="isBuilding"
      v-model:built-info="builtInfo"
      v-model:is-limit-exchange-mode="isLimitExchangeMode"
      :build-process-tip="buildProcessTip"
    />
  </div>
</template>
