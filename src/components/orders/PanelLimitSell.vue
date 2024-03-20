<script lang="ts" setup>
import { Ref, computed, ref, watch } from 'vue'
import {
  TabPanel,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { CheckIcon, ChevronsUpDownIcon, BookPlusIcon } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'

import { prettyBalance, prettySymbol } from '@/lib/formatters'
import { sleep, unit, useBtcUnit } from '@/lib/helpers'
import { buildAskLimit } from '@/lib/builders/orders'
import {
  getOrdiBalance,
  getOneBrc20,
  getMarketPrice,
  type Brc20Transferable,
} from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'
import { IS_DEV } from '@/data/constants'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { useSelectOrder } from '@/hooks/use-select-order'
import { useConfirmationModal } from '@/hooks/use-confirmation-modal'
import { useFiat } from '@/hooks/use-fiat'

import btcIcon from '@/assets/btc.svg?url'

const connectionStore = useConnectionStore()
const address = connectionStore.getAddress
const networkStore = useNetworkStore()
const feebStore = useFeebStore()
const { selectedPair } = useTradingPair()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const { openModal } = useConfirmationModal()
const { selectedAskOrder } = useSelectOrder()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

// price related
const price = ref(0) // always in satoshis
const updatePrice = (usePrice: number, inBtc = false) => {
  if (typeof usePrice === 'string') {
    usePrice = Number(usePrice)
  }
  if (isNaN(usePrice)) {
    usePrice = 0
  }
  if (inBtc) {
    usePrice = new Decimal(usePrice).times(1e8).toNumber()
  }
  price.value = usePrice
}
function deviatePrice(price: number, deviator: number): number {
  return new Decimal(price * deviator).toDP(new Decimal(price).dp()).toNumber()
}
watch(
  selectedAskOrder,
  (selectedAskOrder) => {
    if (!selectedAskOrder) return

    const priceInBtc = selectedAskOrder.price.toNumber()
    updatePrice(priceInBtc)
  },
  { immediate: true },
)

async function buildOrder() {
  const feeb = feebStore.get
  if (!feeb) {
    throw new Error('Choose a fee rate first.')
  }

  let buildRes: any

  try {
    openBuilding()
    buildRes = await buildAskLimit({
      total: Math.round(price.value * limitBrcAmount.value),
      amount: limitBrcAmount.value,
      selectedPair: selectedPair.value,
    })
  } catch (error: any) {
    await sleep(500)
    ElMessage.error(error.message)

    if (IS_DEV) throw error
  } finally {
    closeBuilding()
  }

  if (!buildRes) return
  console.log({ buildRes })
  openModal(buildRes)
  return
}

async function goInscribe() {
  const adapter = connectionStore.adapter

  await adapter?.inscribe(selectedPair.value.exactName)
}

const { data: marketPrice } = useQuery({
  queryKey: [
    'marketPrice',
    { network: networkStore.network, tick: selectedPair.value.fromSymbol },
  ],
  queryFn: () => getMarketPrice({ tick: selectedPair.value.fromSymbol }),
})

const exchangeOrdiAmount = ref(0)
const limitBrcAmount = computed(() => {
  if (networkStore.network === 'testnet') {
    return exchangeOrdiAmount.value
  }

  if (!selectedAskCandidate.value) return 0

  return Number(selectedAskCandidate.value.amount)
})
const totalExchangePrice = computed(() => {
  return Math.round(price.value * limitBrcAmount.value)
})

const hasEnoughPrice = computed(
  () => IS_DEV || totalExchangePrice.value >= 10000,
)
const canPlaceOrder = computed(() => {
  return price.value > 0 && limitBrcAmount.value > 0 && hasEnoughPrice.value
})
const cannotPlaceOrderReason = computed(() => {
  if (price.value <= 0) {
    return 'Enter a price'
  }
  if (limitBrcAmount.value <= 0) {
    return `Select an ${prettySymbol(selectedPair.value.fromSymbol)} amount`
  }
  if (!hasEnoughPrice.value) {
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
  <TabPanel class="flex h-full flex-col justify-between">
    <div class="">
      <div class="rounded-md border border-zinc-500 p-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img :src="btcIcon" alt="btc icon" class="h-6 w-6" />
            <span class="ml-2 text-zinc-500">Price</span>
          </div>

          <div class="max-w-[67%] grow rounded bg-zinc-700 py-0.5">
            <div class="relative w-full">
              <input
                type="text"
                class="quiet-input w-full bg-transparent py-2 pl-2 pr-16 text-right placeholder-zinc-500"
                :placeholder="unit"
                :value="
                  useBtcUnit
                    ? new Decimal(price).dividedBy(1e8).toDP().toFixed()
                    : price
                "
                @input="
                  (event: any) =>
                    updatePrice(event.target.value, useBtcUnit.value)
                "
              />
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
              >
                {{ unit }}
              </span>
            </div>

            <div
              class="-mt-2 pr-2 text-right text-sm text-zinc-500"
              v-if="isShowingFiat && fiatRate && price"
            >
              {{ getFiatPriceDisplay(price, fiatRate) }}
            </div>
          </div>
        </div>

        <div
          class="cursor-pointer pt-2 text-right text-xs text-zinc-500"
          v-if="marketPrice"
          @click="price = deviatePrice(marketPrice!, 1.01)"
          title="Use market price"
        >
          {{
            `Market Price: ${prettyBalance(marketPrice, useBtcUnit)} ${unit}`
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
              v-model.number="exchangeOrdiAmount"
            />
            <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 uppercase text-zinc-400"
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
                <span class="uppercase"> ${{ selectedPair.fromSymbol }} </span>
                <ChevronsUpDownIcon class="h-5 w-5" aria-hidden="true" />
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
                v-if="!myBrc20Info?.transferBalanceList.length"
                class="cursor-default px-2 py-4 text-right text-zinc-500"
              >
                No Transferable Balance
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
                  <BookPlusIcon class="mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Inscribe Transfer</span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </Listbox>
        </div>

        <div
          class="cursor-pointer pt-2 text-right text-xs text-zinc-500"
          v-if="networkStore.network === 'testnet'"
          @click="exchangeOrdiAmount = ordiBalance || 0"
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

    <div class="mt-8">
      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-500">Total</span>

        <div class="">
          <div class="text-zinc-300">
            {{ `${prettyBalance(totalExchangePrice, useBtcUnit)} ${unit}` }}
          </div>

          <div
            class="text-right text-sm text-zinc-500"
            v-if="isShowingFiat && fiatRate && totalExchangePrice"
          >
            {{ getFiatPriceDisplay(totalExchangePrice, fiatRate) }}
          </div>
        </div>
      </div>

      <button
        class="mt-4 w-full rounded-md py-4 font-bold"
        :class="
          canPlaceOrder
            ? 'bg-primary text-orange-950'
            : 'bg-zinc-700 text-zinc-500'
        "
        @click="buildOrder"
        :disabled="!canPlaceOrder"
      >
        {{ cannotPlaceOrderReason || 'Place Limit Sell Order' }}
      </button>
    </div>
  </TabPanel>
</template>
