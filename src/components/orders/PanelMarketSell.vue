<script lang="ts" setup>
import { computed, ref } from 'vue'
import { TabPanel } from '@headlessui/vue'
import { ElMessage } from 'element-plus'
import { useQuery } from '@tanstack/vue-query'
import { get } from '@vueuse/core'

import { prettyBalance, prettyBtcDisplay } from '@/lib/formatters'
import { sleep, unit, useBtcUnit } from '@/lib/helpers'
import { calculateFee } from '@/lib/build-helpers'
import { buildSellTake } from '@/lib/builders/orders-v2'
import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { IS_DEV } from '@/data/constants'
import { useAreaHighlight } from '@/hooks/use-area-highlight'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { useSelectOrder } from '@/hooks/use-select-order'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { useFiat } from '@/hooks/use-fiat'
import { useConfirmationModal } from '@/hooks/use-confirmation-modal'

import btcIcon from '@/assets/btc.svg?url'

const connectionStore = useConnectionStore()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const feebStore = useFeebStore()
const { highlight } = useAreaHighlight()
const { selectedPair } = useTradingPair()
const { openModal } = useConfirmationModal()
const { selectedBidOrder } = useSelectOrder()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const totalPrice = computed(() => {
  if (!selectedBidOrder.value)
    return {
      display: '0',
      value: 0,
    }

  const total = selectedBidOrder.value.price.times(
    selectedBidOrder.value.coinAmount,
  )

  return {
    display: prettyBtcDisplay(total),
    value: total.toNumber(),
  }
})

const sellFees = computed(() => {
  if (!selectedBidOrder.value) return 0
  if (!feebStore.get) return 0

  const ordersCount = 1

  return calculateFee(feebStore.get, 4, 6) * ordersCount
})
const prettySellFees = computed(() => {
  if (!sellFees.value) return '0'

  const feeInBtc = sellFees.value

  return `≈ ${prettyBalance(feeInBtc, get(useBtcUnit))} ${get(unit)}`
})

const buildProcessTip = ref('Building Transaction...')
async function buildOrder() {
  const feeb = feebStore.get
  if (!feeb) {
    throw new Error('Choose a fee rate first.')
  }

  let buildRes: any

  buildProcessTip.value = 'Building Transaction...'

  try {
    openBuilding()
    if (!selectedBidOrder.value) return

    const sellTake = await buildSellTake({
      total: selectedBidOrder.value.amount,
      amount: selectedBidOrder.value.coinAmount,
      selectedPair: selectedPair.value,
      orderId: selectedBidOrder.value.orderId,
    }).catch(async (err) => {
      await sleep(500)
      ElMessage.error(err.message)
      if (IS_DEV) throw err
    })

    buildRes = {
      ...sellTake,
      orderId: selectedBidOrder.value.orderId,
      amount: selectedBidOrder.value.coinAmount.toString(),
    }
  } catch (error: any) {
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

const canTakeOrder = computed(() => {
  return connectionStore.connected && selectedBidOrder.value
})
const cannotTakeOrderReason = computed(() => {
  if (!connectionStore.connected) {
    return 'Connect wallet first'
  }
  if (!selectedBidOrder.value) {
    return 'Select an order'
  }

  return ''
})
</script>

<template>
  <TabPanel>
    <div>
      <div
        class="flex items-center justify-between rounded-md border border-zinc-500 p-2"
      >
        <div class="flex items-center">
          <img :src="btcIcon" alt="btc icon" class="h-6 w-6" />
          <span class="ml-2 text-zinc-500">Price</span>
        </div>

        <div class="max-w-[67%] grow">
          <div class="flex items-center justify-end">
            <div class="w-full p-2 text-right outline-none">
              {{ prettyBalance(selectedBidOrder?.price, useBtcUnit) }}
            </div>
            <span
              class="pointer-events-none flex items-center pr-2 text-zinc-400"
            >
              {{ unit }}
            </span>
          </div>

          <div
            class="-mt-2 pr-2 text-right text-sm text-zinc-500"
            v-if="isShowingFiat && fiatRate && selectedBidOrder"
          >
            {{
              getFiatPriceDisplay(selectedBidOrder.price.toNumber(), fiatRate)
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

        <div class="flex max-w-[67%] grow items-center" v-if="selectedBidOrder">
          <div class="w-full p-2 text-right outline-none">
            {{ selectedBidOrder.coinAmount }}
          </div>
          <div
            class="pointer-events-none flex items-center pr-2 uppercase text-zinc-400"
          >
            ${{ selectedPair.fromSymbol }}
          </div>
        </div>

        <div class="max-w-[67%] grow py-1 text-right text-primary" v-else>
          <button
            class="group flex w-full items-center justify-end gap-2 text-primary/80"
            @click="highlight('bidOrdersList')"
          >
            <span class="group-hover:underline">Select an</span>

            <span
              class="rounded-md bg-green-500/20 px-1 py-0.5 font-bold text-green-500"
            >
              BID Order
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-500">Total</span>
        <div class="">
          <div class="text-zinc-300">{{ totalPrice.display }}</div>
          <div
            class="text-right text-sm text-zinc-500"
            v-if="isShowingFiat && fiatRate && totalPrice.value"
          >
            {{ getFiatPriceDisplay(totalPrice.value, fiatRate) }}
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between text-sm"
        :class="[isShowingFiat && sellFees ? 'mt-4' : 'mt-2']"
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
        :class="[isShowingFiat && sellFees ? 'mt-4' : 'mt-2']"
      >
        <span class="text-zinc-500">Gas</span>
        <div class="">
          <div class="text-zinc-300">{{ prettySellFees }}</div>
          <div
            class="text-right text-sm text-zinc-500"
            v-if="isShowingFiat && fiatRate && sellFees"
          >
            {{ getFiatPriceDisplay(sellFees, fiatRate) }}
          </div>
        </div>
      </div>

      <button
        class="mt-4 w-full rounded-md py-4 font-bold"
        :class="
          canTakeOrder ? 'bg-red-500 text-white' : 'bg-zinc-700 text-zinc-500'
        "
        @click="buildOrder"
        :disabled="!canTakeOrder"
      >
        {{
          cannotTakeOrderReason ||
          `Sell $${selectedPair.fromSymbol.toUpperCase()}`
        }}
      </button>
    </div>
  </TabPanel>
</template>
