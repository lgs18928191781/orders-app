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
import PanelBuy from '@/components/orders/PanelBuy.vue'
import PanelSell from '@/components/orders/PanelSell.vue'
import { useSelectOrder } from '@/hooks/use-select-order'

const connectionStore = useConnectionStore()
const address = connectionStore.getAddress
const networkStore = useNetworkStore()
const feebStore = useFeebStore()
const { selectedPair } = useTradingPair()
const { selectedOrderType } = useSelectOrder()

const takeModeTab = ref(0)
function changeTakeModeTab(index: number) {
  takeModeTab.value = index
}
watch(
  () => selectedOrderType.value,
  (value) => {
    if (value === 'bid') {
      takeModeTab.value = 1
    } else {
      takeModeTab.value = 0
    }
  }
)

function deviatePrice(price: number, deviator: number): number {
  return new Decimal(price * deviator).toDP(new Decimal(price).dp()).toNumber()
}

const selectedBuyOrders: Ref<Order[]> = ref([])
const selectedSellOrders: Ref<Order[]> = ref([])

const selectedSellCoinAmount = computed(() => {
  return selectedSellOrders.value.reduce((acc, cur) => {
    return acc + Number(cur.coinAmount)
  }, 0)
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
  <div class="col-span-3 flex-1 primary-panel min-h-[40vh]">
    <!-- operate panel -->
    <div class="flex flex-col p-4" v-if="false">
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
                    @click="bidExchangePrice = deviatePrice(marketPrice!, 0.99)"
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
                    @click="askExchangePrice = deviatePrice(marketPrice!, 1.01)"
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

    

    <div class="flex flex-col p-4 h-full flex-auto">
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
          <PanelBuy />
          <PanelSell />
        </TabPanels>
      </TabGroup>
    </div>
  </div>
</template>

<style scoped></style>
