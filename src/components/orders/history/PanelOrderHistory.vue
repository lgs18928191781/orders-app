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
  <TabPanel class="flex h-full flex-col text-sm">
    <!-- table header -->
    <div
      class="grid grid-cols-12 gap-2 border-b border-zinc-700 pb-4 text-zinc-500"
    >
      <div class="col-span-2">Order Time</div>
      <div class="col-span-1">Pair</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-2">Price</div>
      <div class="col-span-2">Amount</div>
      <div class="col-span-2">Total</div>
      <div class="col-span-1 text-right">Status</div>
    </div>

    <!-- table body -->
    <div
      class="flex grow flex-col items-center justify-center gap-2 text-base text-zinc-500"
      v-if="!connectionStore.connected"
    >
      <PlugZapIcon class="h-10 w-10 text-zinc-500" />
      Connect to a wallet to see your order history.
    </div>

    <div
      class="flex grow items-center justify-center text-sm text-zinc-500"
      v-else-if="isLoading"
    >
      <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
    </div>

    <div
      class="flex grow flex-col items-center justify-center gap-2 py-20 text-base text-zinc-500"
      v-else-if="orderHistory && orderHistory.length === 0"
    >
      <CalendarSearchIcon class="h-10 w-10 text-zinc-500" />
      <div class="">You have no order history.</div>
    </div>

    <div
      class="nicer-scrollbar -mr-3 flex h-1 flex-auto flex-col gap-2 overflow-y-auto py-4 pr-3"
      v-else
    >
      <div
        class="grid grid-cols-12 items-start gap-2 text-zinc-300"
        v-for="order in orderHistory"
        :key="order.orderId"
      >
        <div class="col-span-2">
          {{ prettyTimestamp(order.timestamp, false, true) }}
        </div>

        <div class="col-span-1">
          {{ `${prettySymbol(order.tick)}/BTC` }}
        </div>

        <div
          class="col-span-2 capitalize"
          :class="[
            order.orderTypeStrInDisplay2.includes('buy')
              ? 'text-green-500'
              : 'text-red-500',
          ]"
        >
          {{ order.orderTypeStrInDisplay2 }}
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
          class="col-span-1 flex items-center justify-end gap-2 text-right capitalize"
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
              class="inline-block h-4 w-4 text-zinc-300 hover:text-primary"
            />
          </a>
        </div>
      </div>
    </div>
  </TabPanel>
</template>

<style scoped></style>
