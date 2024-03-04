<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { TabPanel } from '@headlessui/vue'
import { ElMessage } from 'element-plus'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { get } from '@vueuse/core'

import { prettyBalance } from '@/lib/formatters'
import { sleep, unit, useBtcUnit } from '@/lib/helpers'
import { buildBidOffer } from '@/lib/builders/orders-v2'
import { getMarketPrice } from '@/queries/orders-api'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'
import { BID_TX_SIZE, IS_DEV } from '@/data/constants'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { useSelectOrder } from '@/hooks/use-select-order'
import { useConfirmationModal } from '@/hooks/use-confirmation-modal'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { useFiat } from '@/hooks/use-fiat'

import btcIcon from '@/assets/btc.svg?url'

const networkStore = useNetworkStore()
const feebStore = useFeebStore()
const { selectedPair } = useTradingPair()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const { selectedBidOrder } = useSelectOrder()
const { openModal } = useConfirmationModal()
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
  selectedBidOrder,
  (selectedBidOrder) => {
    if (!selectedBidOrder) return

    updatePrice(selectedBidOrder.price.toNumber())
  },
  { immediate: true }
)

async function buildOrder() {
  const feeb = feebStore.get
  if (!feeb) {
    throw new Error('Choose a fee rate first.')
  }

  let buildRes: any

  try {
    openBuilding()
    const preBuildRes = await buildBidOffer({
      total: totalExchangePrice.value,
      coinAmount: amount.value,
      selectedPair: selectedPair.value,
    })
    buildRes = preBuildRes
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

const buyFees = computed(() => {
  if (!feebStore.get) return 0
  if (!totalExchangePrice.value) return 0

  return feebStore.get * BID_TX_SIZE
})
const prettyBuyFees = computed(() => {
  if (!buyFees.value) return '0'

  const feeInBtc = buyFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})

const { data: marketPrice } = useQuery({
  queryKey: [
    'marketPrice',
    { network: networkStore.network, tick: selectedPair.value.fromSymbol },
  ],
  queryFn: () => getMarketPrice({ tick: selectedPair.value.fromSymbol }),
})

const amount = ref()
const totalExchangePrice = computed(() => {
  return Math.round(price.value * amount.value)
})

const hasEnoughPrice = computed(
  () => IS_DEV || totalExchangePrice.value >= 10000
)
const canPlaceOrder = computed(() => {
  return price.value > 0 && amount.value > 0 && hasEnoughPrice.value
})
const cannotPlaceOrderReason = computed(() => {
  if (price.value <= 0) {
    return 'Enter a price'
  }
  if (!amount.value || amount.value <= 0) {
    return 'Enter an amount'
  }
  if (!hasEnoughPrice.value) {
    return 'Order should > 0.0001 BTC'
  }

  return ''
})
</script>

<template>
  <TabPanel class="h-full flex flex-col justify-between">
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
                class="w-full bg-transparent py-2 pl-2 pr-16 text-right placeholder-zinc-500 quiet-input"
                :placeholder="unit"
                :value="
                  useBtcUnit
                    ? new Decimal(price).dividedBy(1e8).toDP().toFixed()
                    : price
                "
                @input="(event: any) => updatePrice(event.target.value, useBtcUnit.value)"
              />
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400"
              >
                {{ unit }}
              </span>
            </div>

            <div
              class="text-sm text-zinc-500 text-right pr-2 -mt-2"
              v-if="isShowingFiat && fiatRate && price"
            >
              {{ getFiatPriceDisplay(price, fiatRate) }}
            </div>
          </div>
        </div>

        <div
          class="cursor-pointer pt-2 text-right text-xs text-zinc-500"
          v-if="marketPrice"
          @click="price = deviatePrice(marketPrice!, 0.99)"
          title="Use market price"
        >
          {{
            `Market Price: ${prettyBalance(marketPrice, useBtcUnit)} ${unit}`
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
              v-model.number="amount"
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

    <div class="mt-8">
      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-500">Total</span>
        <div class="">
          <div class="text-zinc-300">
            {{ `${prettyBalance(totalExchangePrice, useBtcUnit)} ${unit}` }}
          </div>

          <div
            class="text-sm text-zinc-500 text-right"
            v-if="isShowingFiat && fiatRate && totalExchangePrice"
          >
            {{ getFiatPriceDisplay(totalExchangePrice, fiatRate) }}
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between text-sm"
        :class="[isShowingFiat && buyFees ? 'mt-4' : 'mt-2']"
      >
        <span class="text-zinc-500">Gas Plan</span>
        <div class="flex gap-2">
          <!-- <button class="hover:scale-125" @click="">
            <ArrowRightLeftIcon
              class="size-4 text-zinc-500 hover:text-primary"
            />
          </button> -->

          <div class="text-zinc-300">
            {{ feebStore.get ? feebStore.get + ' sat/vB' : '-' }}
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between text-sm"
        :class="[isShowingFiat && buyFees ? 'mt-4' : 'mt-2']"
      >
        <span class="text-zinc-500">Gas</span>
        <div class="">
          <div class="text-zinc-300">{{ prettyBuyFees }}</div>
          <div
            class="text-sm text-zinc-500 text-right"
            v-if="isShowingFiat && fiatRate && buyFees"
          >
            {{ getFiatPriceDisplay(buyFees, fiatRate) }}
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
        {{ cannotPlaceOrderReason || 'Place Limit Buy Order' }}
      </button>
    </div>
  </TabPanel>
</template>
