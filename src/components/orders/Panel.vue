<script lang="ts" setup>
import { Ref, computed, ref, watch } from 'vue'
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  XIcon,
  BookPlusIcon,
} from 'lucide-vue-next'
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

const connectionStore = useConnectionStore()
const address = connectionStore.getAddress
const networkStore = useNetworkStore()
const feebStore = useFeebStore()
const { highlight } = useAreaHighlight()
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
function changeTakeModeTab(index: number) {
  takeModeTab.value = index
}

function deviatePrice(price: number, deviator: number): number {
  return new Decimal(price * deviator).toDP(new Decimal(price).dp()).toNumber()
}

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
  <div class="flex flex-col bg-zinc-900 lg:mx-3 lg:rounded-lg">
    <OrderPanelHeader v-model:is-limit-exchange-mode="isLimitExchangeMode" />

    <!-- table -->
    <div class="grid grid-cols-2 flex-1 divide-x divide-zinc-800">
      <OrderList
        :askOrders="askOrders"
        :bidOrders="bidOrders"
        class="col-span-1 self-stretch p-4"
        @use-buy-price="(price: number, orderId: string) => setUseBuyPrice(price, orderId)"
        @use-sell-price="(price: number, orderId: string) => setUseSellPrice(price, orderId)"
      />

      <!-- operate panel -->
      <div class="col-span-1 flex flex-col p-4" v-if="isLimitExchangeMode">
        <div
          class="-mx-4 -mt-4 rounded-lg bg-zinc-800 p-4 shadow-md shadow-primary/20 flex-1 flex flex-col"
        >
          <div class="relative">
            <h3 class="font-sm text-center font-bold text-primary">
              Create Limit Order
            </h3>

            <!-- close button -->
            <button
              class="absolute right-0 top-0"
              @click="isLimitExchangeMode = false"
            >
              <XIcon class="h-6 w-6 text-zinc-300" aria-hidden="true" />
            </button>
          </div>

          <!-- tabs -->
          <TabGroup
            class="mt-8 flex-1 flex flex-col"
            as="div"
            @change="limitExchangeType = $event === 0 ? 'bid' : 'ask'"
            :default-index="limitExchangeType === 'bid' ? 0 : 1"
          >
            <TabList
              class="flex items-center justify-center gap-4"
              v-slot="{ selectedIndex }"
            >
              <Tab
                :class="[
                  'w-28 rounded py-2',
                  selectedIndex === 0
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-700 text-zinc-300',
                ]"
              >
                Bid
              </Tab>
              <Tab
                class="w-28 rounded py-2 text-white"
                :class="
                  selectedIndex === 1
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-700 text-zinc-300'
                "
                >Ask</Tab
              >
            </TabList>

            <TabPanels class="mt-8 flex-1">
              <!-- bid panel -->
              <TabPanel class="h-full flex flex-col justify-between">
                <div class="grow relative">
                  <div class="rounded-md border border-zinc-500 p-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <img :src="btcIcon" alt="btc icon" class="h-6 w-6" />
                        <span class="ml-2 text-zinc-500">Price</span>
                      </div>

                      <div class="relative max-w-[67%] grow">
                        <input
                          type="text"
                          class="w-full rounded bg-zinc-700 py-2 pl-2 pr-16 text-right placeholder-zinc-500 outline-none"
                          :placeholder="unit"
                          :value="
                            useBtcUnit
                              ? new Decimal(bidExchangePrice)
                                  .dividedBy(1e8)
                                  .toDP()
                                  .toFixed()
                              : bidExchangePrice
                          "
                          @input="(event: any) => updateExchangePrice(event.target.value, 'bid')"
                        />
                        <span
                          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                        >
                          {{ unit }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="cursor-pointer pt-2 text-right text-xs text-zinc-500"
                      v-if="marketPrice"
                      @click="
                        bidExchangePrice = deviatePrice(marketPrice!, 0.99)
                      "
                      title="Use market price"
                    >
                      {{
                        `Market Price: ${prettyBalance(
                          marketPrice,
                          useBtcUnit
                        )} ${unit}`
                      }}
                    </div>
                  </div>

                  <!-- amount -->
                  <div class="mt-4 rounded-md border border-zinc-500 p-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <img
                          :src="selectedPair.fromIcon"
                          alt="btc icon"
                          class="h-6 w-6 rounded-full"
                        />
                        <span class="ml-2 text-zinc-500">Amount</span>
                      </div>

                      <div class="relative max-w-[67%] grow">
                        <input
                          type="number"
                          class="w-full rounded bg-zinc-700 py-2 pl-2 pr-16 text-right placeholder-zinc-500 outline-none"
                          placeholder="0"
                          v-model.number="bidAmount"
                        />
                        <span
                          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                        >
                          ${{ selectedPair.fromSymbol }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-zinc-500">Total</span>
                    <span class="text-zinc-300">
                      {{
                        `${prettyBalance(
                          bidTotalExchangePrice,
                          useBtcUnit
                        )} ${unit}`
                      }}
                    </span>
                  </div>

                  <button
                    class="mt-4 w-full rounded-md py-4 font-bold"
                    :class="
                      canPlaceBidOrder
                        ? 'bg-primary text-orange-950'
                        : 'bg-zinc-700 text-zinc-500'
                    "
                    @click="buildOrder"
                    :disabled="!canPlaceBidOrder"
                  >
                    {{ cannotPlaceBidOrderReason || 'Place Bid Order' }}
                  </button>
                </div>
              </TabPanel>

              <!-- ask panel -->
              <TabPanel class="h-full flex flex-col justify-between">
                <div class="">
                  <div class="rounded-md border border-zinc-500 p-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <img :src="btcIcon" alt="btc icon" class="h-6 w-6" />
                        <span class="ml-2 text-zinc-500">Price</span>
                      </div>

                      <div class="relative max-w-[67%] grow">
                        <input
                          type="text"
                          class="w-full rounded bg-zinc-700 py-2 pl-2 pr-16 text-right placeholder-zinc-500 outline-none"
                          :placeholder="unit"
                          :value="
                            useBtcUnit
                              ? new Decimal(askExchangePrice)
                                  .dividedBy(1e8)
                                  .toDP()
                                  .toFixed()
                              : askExchangePrice
                          "
                          @input="(event: any) => updateExchangePrice(event.target.value, 'ask')"
                        />
                        <span
                          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                        >
                          {{ unit }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="cursor-pointer pt-2 text-right text-xs text-zinc-500"
                      v-if="marketPrice"
                      @click="
                        askExchangePrice = deviatePrice(marketPrice!, 1.01)
                      "
                      title="Use market price"
                    >
                      {{
                        `Market Price: ${prettyBalance(
                          marketPrice,
                          useBtcUnit
                        )} ${unit}`
                      }}
                    </div>
                  </div>

                  <!-- estimate -->
                  <!-- <div class="mt-2 text-right text-sm">≈$12.99</div> -->

                  <!-- amount -->
                  <div class="mt-4 rounded-md border border-zinc-500 p-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <img
                          :src="selectedPair.fromIcon"
                          alt="btc icon"
                          class="h-6 w-6 rounded-full"
                        />
                        <span class="ml-2 text-zinc-500">Amount</span>
                      </div>

                      <div
                        class="relative max-w-[67%] grow"
                        v-if="networkStore.network === 'testnet'"
                      >
                        <input
                          type="text"
                          class="w-full rounded bg-zinc-700 py-2 pl-2 pr-16 text-right placeholder-zinc-500 outline-none"
                          :placeholder="'$' + selectedPair.fromSymbol"
                          v-model.number="askExchangeOrdiAmount"
                        />
                        <span
                          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400 uppercase"
                        >
                          ${{ selectedPair.fromSymbol }}
                        </span>
                      </div>

                      <Listbox
                        v-model="selectedAskCandidate"
                        v-else
                        as="div"
                        class="relative max-w-[67%] grow"
                      >
                        <ListboxButton
                          class="relative w-full cursor-default rounded bg-zinc-700 py-2 pl-3 pr-20 text-right text-sm focus:outline-none"
                        >
                          <span class="block truncate">
                            {{ selectedAskCandidate?.amount || '-' }}
                          </span>

                          <span
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                          >
                            <span class="uppercase">
                              ${{ selectedPair.fromSymbol }}
                            </span>
                            <ChevronsUpDownIcon
                              class="h-5 w-5"
                              aria-hidden="true"
                            />
                          </span>
                        </ListboxButton>

                        <ListboxOptions
                          class="absolute z-10 mt-4 max-h-60 w-full translate-x-2 overflow-auto rounded-md border border-zinc-500 bg-zinc-900 p-2 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          <ListboxOption
                            v-for="askCandidate in myBrc20Info?.transferBalanceList"
                            v-slot="{ active, selected }"
                            as="template"
                            :key="askCandidate.inscriptionId"
                            :value="askCandidate"
                          >
                            <li
                              class="relative flex cursor-pointer items-center justify-end rounded py-2 pl-10 pr-2 transition"
                              :class="active && 'bg-orange-500/20'"
                            >
                              <span
                                v-if="selected"
                                class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                              >
                                <CheckIcon class="h-5 w-5" aria-hidden="true" />
                              </span>

                              <span :class="selected && 'text-primary'">
                                {{ askCandidate.amount }}
                              </span>
                            </li>
                          </ListboxOption>

                          <ListboxOption
                            as="template"
                            v-slot="{ active, selected }"
                            @click="goInscribe"
                          >
                            <li
                              :class="[
                                'flex cursor-pointer items-center justify-between rounded border-t border-zinc-700 p-2 text-zinc-300 transition',
                                { 'bg-orange-500/20 text-primary': active },
                              ]"
                            >
                              <BookPlusIcon
                                class="mr-2 h-5 w-5"
                                aria-hidden="true"
                              />
                              <span>Inscribe Transfer</span>
                            </li>
                          </ListboxOption>
                        </ListboxOptions>
                      </Listbox>
                    </div>

                    <div
                      class="cursor-pointer pt-2 text-right text-xs text-zinc-500"
                      v-if="networkStore.network === 'testnet'"
                      @click="askExchangeOrdiAmount = ordiBalance || 0"
                      :title="`Sell all $${selectedPair.fromSymbol.toUpperCase()}`"
                    >
                      {{
                        `Balance: ${ordiBalance} $${selectedPair.fromSymbol.toUpperCase()}`
                      }}
                    </div>
                  </div>

                  <!-- how to -->
                  <div
                    class="mt-4 text-right text-xs text-zinc-400 underline underline-offset-2 transition hover:text-primary"
                  >
                    <a
                      href="https://canary-sailor-7ad.notion.site/How-to-place-an-ASK-order-faedef7a12134b57a40962b06d75c024"
                      target="_blank"
                    >
                      How to place an ASK order?
                    </a>
                  </div>
                </div>

                <!-- buy -->
                <div class="">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-zinc-500">Total</span>
                    <span class="text-zinc-300">
                      {{
                        `${prettyBalance(
                          askTotalExchangePrice,
                          useBtcUnit
                        )} ${unit}`
                      }}
                    </span>
                  </div>

                  <button
                    class="mt-4 w-full rounded-md py-4 font-bold"
                    :class="
                      canPlaceAskOrder
                        ? 'bg-primary text-orange-950'
                        : 'bg-zinc-700 text-zinc-500'
                    "
                    @click="buildOrder"
                    :disabled="!canPlaceAskOrder"
                  >
                    {{ cannotPlaceAskOrderReason || 'Place Ask Order' }}
                  </button>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>

      <div class="col-span-1 flex flex-col p-4" v-else>
        <!-- tabs -->
        <TabGroup :selectedIndex="takeModeTab" @change="changeTakeModeTab">
          <TabList
            class="flex items-center justify-center gap-4"
            v-slot="{ selectedIndex }"
          >
            <Tab
              class="w-28 rounded py-2"
              :class="
                selectedIndex === 0
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-700 text-zinc-300'
              "
            >
              Buy
            </Tab>
            <Tab
              class="w-28 rounded py-2 text-white"
              :class="
                selectedIndex === 1
                  ? 'bg-red-500 text-white'
                  : 'bg-zinc-700 text-zinc-300'
              "
            >
              Sell
            </Tab>
          </TabList>

          <TabPanels class="mt-8 flex-1">
            <!-- buy panel -->
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

                  <div
                    class="max-w-[67%] grow flex items-center"
                    v-if="useBuyOrderId"
                  >
                    <div class="w-full p-2 text-right outline-none">
                      {{ selectedBuyCoinAmount }}
                    </div>
                    <div
                      class="pointer-events-none flex items-center pr-2 text-zinc-400 uppercase"
                    >
                      ${{ selectedPair.fromSymbol }}
                    </div>
                  </div>

                  <!-- <Listbox
                    v-model="selectedBuyOrders"
                    multiple
                    as="div"
                    class="relative max-w-[67%] grow"
                    v-if="useBuyOrderId"
                  >
                    <ListboxButton
                      class="relative w-full cursor-default rounded bg-zinc-700 py-2 pl-3 pr-20 text-right text-sm focus:outline-none"
                    >
                      <span class="block truncate">
                        {{ selectedBuyCoinAmount }}
                      </span>

                      <span
                        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                      >
                        <span class="uppercase"
                          >${{ selectedPair.fromSymbol }}</span
                        >
                        <ChevronsUpDownIcon
                          class="h-5 w-5"
                          aria-hidden="true"
                        />
                      </span>
                    </ListboxButton>

                    <ListboxOptions
                      class="absolute z-10 mt-4 max-h-60 w-full translate-x-2 overflow-auto rounded-md border border-zinc-500 bg-zinc-900 p-2 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <ListboxOption
                        v-for="psbt in candidateBuyOrders"
                        v-slot="{ active, selected }"
                        as="template"
                        :key="psbt.orderId"
                        :value="psbt"
                      >
                        <li
                          class="relative flex cursor-pointer items-center justify-between rounded py-2 pl-10 pr-2 transition"
                          :class="active && 'bg-orange-500/20'"
                        >
                          <span
                            v-if="selected"
                            class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                          >
                            <CheckIcon class="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span class="text-sm text-zinc-500">
                            {{
                              prettyBalance(
                                Number(psbt.coinRatePrice),
                                useBtcUnit
                              )
                            }}
                            {{ unit }}
                          </span>
                          <span :class="selected && 'text-primary'">
                            {{ psbt.coinAmount }}
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </Listbox> -->

                  <div
                    class="max-w-[67%] grow text-right text-primary py-1"
                    v-else
                  >
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

            <!-- sell panel -->
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
                      {{ prettyBalance(useSellPrice, useBtcUnit) }}
                    </div>
                    <span
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                    >
                      {{ unit }}
                    </span>
                  </div>
                </div>

                <!-- estimate -->
                <!-- <div class="mt-2 text-right text-sm">≈$12.99</div> -->

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

                  <div
                    class="max-w-[67%] grow flex items-center"
                    v-if="useSellOrderId"
                  >
                    <div class="w-full p-2 text-right outline-none">
                      {{ selectedSellCoinAmount }}
                    </div>
                    <div
                      class="pointer-events-none flex items-center pr-2 text-zinc-400 uppercase"
                    >
                      ${{ selectedPair.fromSymbol }}
                    </div>
                  </div>

                  <!-- <Listbox
                    v-model="selectedSellOrders"
                    multiple
                    as="div"
                    class="relative max-w-[67%] grow"
                    v-if="useSellOrderId"
                  >
                    <ListboxButton
                      class="relative w-full cursor-default rounded bg-zinc-700 py-2 pl-3 pr-20 text-right text-sm focus:outline-none"
                    >
                      <span class="block truncate">
                        {{ selectedSellCoinAmount }}
                      </span>

                      <span
                        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
                      >
                        <span class="uppercase"
                          >${{ selectedPair.fromSymbol }}</span
                        >
                        <ChevronsUpDownIcon
                          class="h-5 w-5"
                          aria-hidden="true"
                        />
                      </span>
                    </ListboxButton>

                    <ListboxOptions
                      class="absolute z-10 mt-4 max-h-60 w-full translate-x-2 overflow-auto rounded-md border border-zinc-500 bg-zinc-900 p-2 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <ListboxOption
                        v-for="psbt in candidateSellOrders"
                        v-slot="{ active, selected }"
                        as="template"
                        :key="psbt.orderId"
                        :value="psbt"
                      >
                        <li
                          class="relative flex cursor-pointer items-center justify-between rounded py-2 pl-10 pr-2 transition"
                          :class="active && 'bg-orange-500/20'"
                        >
                          <span
                            v-if="selected"
                            class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                          >
                            <CheckIcon class="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span class="text-sm text-zinc-500">
                            {{
                              prettyBalance(
                                Number(psbt.coinRatePrice),
                                useBtcUnit
                              )
                            }}
                            {{ unit }}
                          </span>
                          <span :class="selected && 'text-primary'">
                            {{ psbt.coinAmount }}
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </Listbox> -->

                  <div
                    class="max-w-[67%] grow text-right text-primary py-1"
                    v-else
                  >
                    <button
                      class="text-primary/80 flex items-center gap-2 justify-end w-full group"
                      @click="highlight('bidOrdersList')"
                    >
                      <span class="group-hover:underline">Select a</span>

                      <span
                        class="text-green-500 font-bold bg-green-500/20 py-0.5 px-2 rounded-md"
                      >
                        BID Order
                      </span>
                      <span class="group-hover:underline">to sell</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- brc-20 availability -->
              <!-- <div
                class="z-[-1] -mt-1 overflow-hidden rounded-lg bg-zinc-950 text-xs text-zinc-500"
              >
                <div class="px-6 py-2">
                  <h4 class="text-sm">Balance</h4>

                  <div class="mt-4">
                    <div class="">Available: 2000</div>
                    <div class="">Transferable: 2000</div>
                  </div>
                </div>
              </div> -->

              <!-- sell -->
              <div class="mt-12">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-500">Gas</span>
                  <span class="text-zinc-300">{{ prettySellFees }}</span>
                </div>

                <button
                  class="mt-4 w-full rounded-md py-4 font-bold"
                  :class="
                    canTakeSellOrder
                      ? 'bg-green-500 text-white'
                      : 'bg-zinc-700 text-zinc-500'
                  "
                  @click="buildOrder"
                  :disabled="!canTakeSellOrder"
                >
                  {{
                    cannotTakeSellOrderReason ||
                    `Sell $${selectedPair.fromSymbol.toUpperCase()}`
                  }}
                </button>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>

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
