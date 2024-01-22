<script setup lang="ts">
import { computed } from 'vue'
import { TabPanel } from '@headlessui/vue'
import { useQuery } from '@tanstack/vue-query'
import { CalendarSearchIcon, Loader2Icon, PlugZapIcon } from 'lucide-vue-next'

import {
  prettyBtcDisplay,
  prettySymbol,
  prettyTimestamp,
} from '@/lib/formatters'
import { getMyOrderHistory } from '@/queries/orders-v2'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useFiat } from '@/hooks/use-fiat'
import { ExternalLinkIcon } from 'lucide-vue-next'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const { data: orderHistory, isLoading } = useQuery({
  queryKey: ['myOrderHistory', { network: networkStore.network }],
  queryFn: () =>
    getMyOrderHistory({
      address: connectionStore.getAddress,
    }),
  enabled: computed(() => connectionStore.connected),
})
</script>

<template>
  <TabPanel class="text-sm h-full flex flex-col">
    <!-- table header -->
    <div
      class="grid grid-cols-12 gap-2 text-zinc-500 border-b border-zinc-700 pb-4"
    >
      <div class="col-span-2">Order Time</div>
      <div class="col-span-2">Pair</div>
      <div class="col-span-1">Side</div>
      <div class="col-span-2">Price</div>
      <div class="col-span-2">Amount</div>
      <div class="col-span-2">Total</div>
      <div class="col-span-1 text-right">Status</div>
    </div>

    <!-- table body -->
    <div
      class="grow flex flex-col gap-2 items-center justify-center text-zinc-500 text-base"
      v-if="!connectionStore.connected"
    >
      <PlugZapIcon class="h-10 w-10 text-zinc-500" />
      Connect to a wallet to see your order history.
    </div>

    <div
      class="grow flex items-center justify-center text-zinc-500 text-sm"
      v-else-if="isLoading"
    >
      <Loader2Icon class="animate-spin h-8 w-8 text-zinc-500" />
    </div>

    <div
      class="grow flex flex-col gap-2 items-center justify-center text-zinc-500 text-base"
      v-else-if="orderHistory && orderHistory.length === 0"
    >
      <CalendarSearchIcon class="h-10 w-10 text-zinc-500" />
      <div class="">You have no order history.</div>
    </div>

    <div
      class="py-4 flex flex-col gap-2 overflow-y-auto h-1 flex-auto nicer-scrollbar pr-3 -mr-3"
      v-else
    >
      <div
        class="grid grid-cols-12 gap-2 text-zinc-300 items-start"
        v-for="order in orderHistory"
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

        <div class="col-span-2">
          <div class="break-all">
            {{ prettyBtcDisplay(order.amount) }}
          </div>
          <div class="text-xs text-zinc-500" v-if="isShowingFiat && fiatRate">
            {{ getFiatPriceDisplay(order.amount, fiatRate) }}
          </div>
        </div>

        <div
          class="col-span-1 text-right capitalize flex justify-end items-center gap-2"
          :class="[order.orderStateStr === 'canceled' && 'text-zinc-500']"
        >
          <div class="">
            {{ order.orderStateStr }}
          </div>

          <a
            v-if="order.orderStateStr === 'done' && order.dealTx"
            :title="`View on Mempool explorer`"
            :href="`https://mempool.space/tx/${order.dealTx}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon
              class="h-4 w-4 inline-block text-zinc-300 hover:text-primary"
            />
          </a>
        </div>
      </div>
    </div>
  </TabPanel>
</template>

<style scoped></style>
