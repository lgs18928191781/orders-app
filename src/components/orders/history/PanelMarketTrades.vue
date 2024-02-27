<script setup lang="ts">
import { TabPanel } from '@headlessui/vue'
import { useQuery } from '@tanstack/vue-query'
import { CalendarSearchIcon, Loader2Icon } from 'lucide-vue-next'

import {
  prettyBtcDisplay,
  prettySymbol,
  prettyTimestamp,
} from '@/lib/formatters'
import { getMarketTrades } from '@/queries/orders-v2'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { useFiat } from '@/hooks/use-fiat'

const { fromSymbol } = useTradingPair()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const { data: marketTrades, isLoading } = useQuery({
  queryKey: ['marketTrades', { tick: fromSymbol }],
  queryFn: () => getMarketTrades({ tick: fromSymbol.value }),
})
</script>

<template>
  <TabPanel class="flex h-full flex-col text-sm">
    <!-- table header -->
    <div
      class="grid grid-cols-12 gap-2 border-b border-zinc-700 pb-4 text-zinc-500"
    >
      <div class="col-span-2">Order Time</div>
      <div class="col-span-2">Pair</div>
      <div class="col-span-1">Type</div>
      <div class="col-span-2">Price</div>
      <div class="col-span-2">Amount</div>
      <div class="col-span-3 text-right">Total</div>
    </div>

    <!-- table body -->
    <div
      class="flex grow items-center justify-center text-sm text-zinc-500"
      v-if="isLoading"
    >
      <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
    </div>

    <div
      class="flex grow flex-col items-center justify-center gap-2 text-base text-zinc-500"
      v-else-if="marketTrades && marketTrades.length === 0"
    >
      <CalendarSearchIcon class="h-10 w-10 text-zinc-500" />
      <div class="">There is no market trades now.</div>
    </div>

    <div
      class="nicer-scrollbar -mr-3 flex h-1 flex-auto flex-col gap-2 overflow-y-auto py-4 pr-3"
      v-else
    >
      <div
        class="grid grid-cols-12 items-start gap-2 text-zinc-300"
        v-for="order in marketTrades"
        :key="order.orderId"
      >
        <div class="col-span-2">
          {{ prettyTimestamp(order.timestamp, false, true) }}
        </div>

        <div class="col-span-2">
          {{ `${prettySymbol(order.tick)}/BTC` }}
        </div>

        <div
          class="col-span-1 capitalize"
          :class="[
            order.orderTypeStrInDisplay === 'buy'
              ? 'text-green-500'
              : 'text-red-500',
          ]"
        >
          {{ order.orderTypeStrInDisplay }}
        </div>

        <div class="col-span-2">
          <div class="break-all">
            {{ prettyBtcDisplay(order.price) }}
          </div>
          <div class="text-xs text-zinc-500" v-if="isShowingFiat && fiatRate">
            {{ getFiatPriceDisplay(order.price.toNumber(), fiatRate) }}
          </div>
        </div>

        <div class="col-span-2">{{ order.coinAmount }}</div>

        <div class="col-span-3 text-right">
          <div class="break-all">
            {{ prettyBtcDisplay(order.amount) }}
          </div>
          <div class="text-xs text-zinc-500" v-if="isShowingFiat && fiatRate">
            {{ getFiatPriceDisplay(order.amount, fiatRate) }}
          </div>
        </div>
      </div>
    </div>
  </TabPanel>
</template>

<style scoped></style>
