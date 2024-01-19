<script setup lang="ts">
import { TabPanel } from '@headlessui/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import {
  XSquareIcon,
  MenuIcon,
  XIcon,
  CalendarSearchIcon,
  Loader2Icon,
} from 'lucide-vue-next'

import { prettyBtcDisplay, prettyTimestamp } from '@/lib/formatters'
import { cancelOrder } from '@/queries/orders-api'
import { getMyOrderHistory } from '@/queries/orders-v2'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()

const { data: orderHistory, isFetching: isFetchingOrderHistory } = useQuery({
  queryKey: ['myOrderHistory', { network: networkStore.network }],
  queryFn: () =>
    getMyOrderHistory({
      address: connectionStore.getAddress,
    }),
  placeholderData: [],
})

const queryClient = useQueryClient()
const { mutate } = useMutation({
  mutationFn: cancelOrder,
  onSuccess: () => {
    ElMessage.success('Order canceled')
    queryClient.invalidateQueries(['myOpenOrders'])
    queryClient.invalidateQueries(['askOrders'])
    queryClient.invalidateQueries(['bidOrders'])
    queryClient.invalidateQueries(['excludedBalance'])
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})
</script>

<template>
  <TabPanel class="text-sm h-full flex flex-col">
    <!-- table header -->
    <div
      class="grid grid-cols-12 gap-2 text-zinc-500 border-b border-zinc-700 pb-4"
    >
      <div class="col-span-2">Order Time</div>
      <div class="col-span-1">Side</div>
      <div class="col-span-3">Price</div>
      <div class="col-span-2">Amount</div>
      <div class="col-span-3">Total</div>
      <div class="col-span-1 text-right">Status</div>
    </div>

    <!-- table body -->
    <div
      class="grow flex items-center justify-center text-zinc-500 text-sm"
      v-if="isFetchingOrderHistory"
    >
      <Loader2Icon class="animate-spin h-8 w-8 text-zinc-500" />
    </div>

    <div
      class="grow flex flex-col gap-2 items-center justify-center text-zinc-500 text-base"
      v-else-if="orderHistory && orderHistory.length === 0"
    >
      <CalendarSearchIcon class="h-10 w-10 text-zinc-500" />
      <div class="">You have no open orders.</div>
    </div>

    <div
      class="py-4 flex flex-col gap-2 overflow-y-auto h-1 flex-auto nicer-scrollbar pr-3 -mr-3"
      v-else
    >
      <div
        class="grid grid-cols-12 gap-2 text-zinc-300"
        v-for="order in orderHistory"
        :key="order.orderId"
      >
        <div class="col-span-2">
          {{ prettyTimestamp(order.timestamp, false, true) }}
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
        <div class="col-span-3">{{ prettyBtcDisplay(order.price) }}</div>
        <div class="col-span-2">{{ order.coinAmount }}</div>
        <div class="col-span-3">{{ prettyBtcDisplay(order.amount) }}</div>
        <div
          class="col-span-1 text-right"
          :class="[order.orderStateStr === 'canceled' && 'text-zinc-500']"
        >
          {{ order.orderStateStr }}
        </div>
      </div>
    </div>
  </TabPanel>
</template>

<style scoped></style>
