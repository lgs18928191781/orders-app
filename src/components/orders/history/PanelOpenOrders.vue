<script setup lang="ts">
import { watch } from 'vue'
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

import {
  prettyBtcDisplay,
  prettySymbol,
  prettyTimestamp,
} from '@/lib/formatters'
import { cancelOrder } from '@/queries/orders-api'
import { getMyOpenOrders } from '@/queries/orders-v2'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()

const ordersCount = defineModel('openOrdersCount')

const { data: openOrders, isFetching: isFetchingOpenOrders } = useQuery({
  queryKey: ['myOpenOrders', { network: networkStore.network }],
  queryFn: () =>
    getMyOpenOrders({
      address: connectionStore.getAddress,
    }),
  placeholderData: [],
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
    queryClient.invalidateQueries(['myOpenOrders'])
    queryClient.invalidateQueries(['myOrderHistory'])
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
      <div class="col-span-2">Pair</div>
      <div class="col-span-1">Side</div>
      <div class="col-span-2">Price</div>
      <div class="col-span-2">Amount</div>
      <div class="col-span-2">Total</div>
      <div class="col-span-1 text-right flex items-center justify-end">
        <MenuIcon class="h-5 w-5" />
      </div>
    </div>

    <!-- table body -->
    <div
      class="grow flex items-center justify-center text-zinc-500 text-sm"
      v-if="isFetchingOpenOrders"
    >
      <Loader2Icon class="animate-spin h-8 w-8 text-zinc-500" />
    </div>

    <div
      class="grow flex flex-col gap-2 items-center justify-center text-zinc-500 text-base"
      v-else-if="openOrders && openOrders.length === 0"
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
        <div class="col-span-2 break-all">
          {{ prettyBtcDisplay(order.price) }}
        </div>
        <div class="col-span-2">{{ order.coinAmount }}</div>
        <div class="col-span-2 break-all">
          {{ prettyBtcDisplay(order.amount) }}
        </div>
        <div class="col-span-1 text-right">
          <button
            class="text-zinc-700 hover:text-primary group"
            @click="mutate({ orderId: order.orderId })"
          >
            <XIcon class="h-5 w-5 inline group-hover:hidden" />
            <XSquareIcon class="h-5 w-5 hidden group-hover:inline" />
          </button>
        </div>
      </div>
    </div>
  </TabPanel>
</template>

<style scoped></style>
