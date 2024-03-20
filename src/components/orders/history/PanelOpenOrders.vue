<script setup lang="ts">
import { computed, watch } from 'vue'
import { TabPanel } from '@headlessui/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import {
  XSquareIcon,
  MenuIcon,
  XIcon,
  CalendarSearchIcon,
  Loader2Icon,
  PlugZapIcon,
} from 'lucide-vue-next'

import {
  prettyBtcDisplay,
  prettySymbol,
  prettyTimestamp,
} from '@/lib/formatters'
import { cancelOrder } from '@/queries/orders-api'
import { getMyOpenOrders } from '@/queries/orders-v2'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useFiat } from '@/hooks/use-fiat'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const ordersCount = defineModel('openOrdersCount')

const { data: openOrders, isLoading } = useQuery({
  queryKey: ['myOpenOrders', { network: networkStore.network }],
  queryFn: () =>
    getMyOpenOrders({
      address: connectionStore.getAddress,
    }),
  enabled: computed(() => connectionStore.connected),
})
watch(openOrders, (val) => {
  if (!val) {
    ordersCount.value = 0
    return
  }

  ordersCount.value = val.length
})

const queryClient = useQueryClient()
const { mutate } = useMutation({
  mutationFn: cancelOrder,
  onSuccess: () => {
    ElMessage.success('Order canceled')
    queryClient.invalidateQueries({ queryKey: ['myOpenOrders'] })
    queryClient.invalidateQueries({ queryKey: ['myOrderHistory'] })
    queryClient.invalidateQueries({ queryKey: ['askOrders'] })
    queryClient.invalidateQueries({ queryKey: ['bidOrders'] })
    queryClient.invalidateQueries({ queryKey: ['excludedBalance'] })
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
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
      <div class="col-span-1">Side</div>
      <div class="col-span-2">Price</div>
      <div class="col-span-2">Amount</div>
      <div class="col-span-2">Total</div>
      <div class="col-span-1 flex items-center justify-end text-right">
        <MenuIcon class="h-5 w-5" />
      </div>
    </div>

    <!-- table body -->
    <div
      class="flex grow flex-col items-center justify-center gap-2 text-base text-zinc-500"
      v-if="!connectionStore.connected"
    >
      <PlugZapIcon class="h-10 w-10 text-zinc-500" />
      Connect to a wallet to see your open orders.
    </div>

    <div
      class="flex grow items-center justify-center text-sm text-zinc-500"
      v-else-if="isLoading"
    >
      <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
    </div>

    <div
      class="flex grow flex-col items-center justify-center gap-2 py-20 text-base text-zinc-500"
      v-else-if="openOrders && openOrders.length === 0"
    >
      <CalendarSearchIcon class="h-10 w-10 text-zinc-500" />
      <div class="">You have no open orders.</div>
    </div>

    <div
      class="nicer-scrollbar -mr-3 flex h-1 flex-auto flex-col gap-2 overflow-y-auto py-4 pr-3"
      v-else
    >
      <div
        class="grid grid-cols-12 items-start gap-2 text-zinc-300"
        v-for="order in openOrders"
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

        <div class="col-span-1 text-right">
          <button
            class="group text-zinc-700 hover:text-primary"
            @click="mutate({ orderId: order.orderId })"
          >
            <XIcon class="inline h-5 w-5 group-hover:hidden" />
            <XSquareIcon class="hidden h-5 w-5 group-hover:inline" />
          </button>
        </div>
      </div>
    </div>
  </TabPanel>
</template>

<style scoped></style>
