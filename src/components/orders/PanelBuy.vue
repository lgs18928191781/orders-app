<script lang="ts" setup>
import { computed, ref } from 'vue'
import { TabPanel } from '@headlessui/vue'
import { ElMessage } from 'element-plus'
import { useQuery } from '@tanstack/vue-query'
import { get } from '@vueuse/core'

import { prettyBalance, prettyBtcDisplay } from '@/lib/formatters'
import { calcFiatPrice, showFiat, unit, useBtcUnit } from '@/lib/helpers'
import { calculateFee } from '@/lib/build-helpers'
import { buildBuyTake } from '@/lib/builders/orders-v2'
import { getFiatRate } from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { IS_DEV } from '@/data/constants'
import { useAreaHighlight } from '@/hooks/use-area-highlight'
import { useTradingPair } from '@/hooks/use-trading-pair'

import btcIcon from '@/assets/btc.svg?url'
import { useSelectOrder } from '@/hooks/use-select-order'

const connectionStore = useConnectionStore()
const feebStore = useFeebStore()
const { highlight } = useAreaHighlight()
const { selectedPair } = useTradingPair()
const { selectedAskOrder } = useSelectOrder()

const totalPrice = computed(() => {
  if (!selectedAskOrder.value)
    return {
      display: '0',
      value: 0,
    }

  const total = selectedAskOrder.value.price.times(
    selectedAskOrder.value.coinAmount
  )

  return {
    display: prettyBtcDisplay(total),
    value: total.toNumber(),
  }
})

const buyFees = computed(() => {
  if (!selectedAskOrder.value) return 0
  if (!feebStore.get) return 0

  const ordersCount = 1

  return calculateFee(feebStore.get, 4, 6) * ordersCount
})
const prettyBuyFees = computed(() => {
  if (!buyFees.value) return '0'

  const feeInBtc = buyFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
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
    if (!selectedAskOrder.value) return

    buildRes = await buildBuyTake({
      order: selectedAskOrder.value,
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

const canTakeOrder = computed(() => {
  return connectionStore.connected && selectedAskOrder.value
})
const cannotTakeOrderReason = computed(() => {
  if (!connectionStore.connected) {
    return 'Connect wallet first'
  }
  if (!selectedAskOrder.value) {
    return 'Select an order'
  }

  return ''
})

// fiat price
const { data: fiatRate } = useQuery({
  queryKey: ['fiatRate', { coin: 'btc' }],
  queryFn: getFiatRate,
})
</script>

<template>
  <TabPanel class="flex flex-col justify-between h-full">
    <div>
      <div
        class="flex items-center justify-between rounded-md border border-zinc-500 p-2"
      >
        <div class="flex items-center">
          <img :src="btcIcon" alt="btc icon" class="h-6 w-6" />
          <span class="ml-2 text-zinc-500">Price</span>
        </div>

        <div class="grow max-w-[67%]">
          <div class="flex items-center justify-end">
            <div class="w-full p-2 text-right outline-none">
              {{ prettyBalance(selectedAskOrder?.price, useBtcUnit) }}
            </div>
            <span
              class="pointer-events-none flex items-center pr-2 text-zinc-400"
            >
              {{ unit }}
            </span>
          </div>

          <div
            class="text-sm text-zinc-500 text-right pr-2 -mt-2"
            v-if="showFiat && fiatRate && selectedAskOrder"
          >
            {{
              '$' + calcFiatPrice(selectedAskOrder.price.toNumber(), fiatRate)
            }}
          </div>
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

        <div class="max-w-[67%] grow flex items-center" v-if="selectedAskOrder">
          <div class="w-full p-2 text-right outline-none">
            {{ selectedAskOrder.coinAmount }}
          </div>
          <div
            class="pointer-events-none flex items-center pr-2 text-zinc-400 uppercase"
          >
            ${{ selectedPair.fromSymbol }}
          </div>
        </div>

        <div class="max-w-[67%] grow text-right text-primary py-1" v-else>
          <button
            class="text-primary/80 w-full group flex items-center justify-end gap-2"
            @click="highlight('askOrdersList')"
          >
            <span class="group-hover:underline">Select an</span>

            <span
              class="text-red-500 font-bold bg-red-500/20 py-0.5 px-1 rounded-md"
            >
              ASK Order
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- buy -->
    <div class="mt-8">
      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-500">Total</span>
        <div class="">
          <div class="text-zinc-300">{{ totalPrice.display }}</div>
          <div
            class="text-sm text-zinc-500 text-right"
            v-if="showFiat && fiatRate && totalPrice.value"
          >
            {{ '$' + calcFiatPrice(totalPrice.value, fiatRate) }}
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between text-sm"
        :class="[showFiat ? 'mt-4' : 'mt-2']"
      >
        <span class="text-zinc-500">Gas</span>
        <div class="">
          <div class="text-zinc-300">{{ prettyBuyFees }}</div>
          <div
            class="text-sm text-zinc-500 text-right"
            v-if="showFiat && fiatRate && buyFees"
          >
            {{ '$' + calcFiatPrice(buyFees, fiatRate) }}
          </div>
        </div>
      </div>

      <button
        class="mt-4 w-full rounded-md py-4 font-bold"
        :class="
          canTakeOrder ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-500'
        "
        @click="buildOrder"
        :disabled="!canTakeOrder"
      >
        {{
          cannotTakeOrderReason ||
          `Buy $${selectedPair.fromSymbol.toUpperCase()}`
        }}
      </button>
    </div>
  </TabPanel>
</template>
