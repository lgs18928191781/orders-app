<script lang="ts" setup>
import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import { UserIcon } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { cancelOrder, type Order, getFiatRate } from '@/queries/orders-api'
import { prettyBalance } from '@/lib/formatters'
import { calcFiatPrice, showFiat, useBtcUnit } from '@/lib/helpers'
import { useSelectOrder } from '@/hooks/use-select-order'
import { IS_DEV } from '@/data/constants'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const address = useConnectionStore().getAddress
const { isSelected } = useSelectOrder()

const props = defineProps<{
  order: Order
  orderType: 'ask' | 'bid'
}>()

const isMyOrder = computed(() => {
  if (IS_DEV) {
    // 30% to be true
    if (Math.random() < 0.2) {
      return true
    }
  }

  if (props.orderType === 'ask') {
    return props.order.sellerAddress === address
  }

  return props.order.buyerAddress === address
})

const isFreeOrder = computed(() => {
  return props.orderType === 'ask' && props.order.freeState === 1
})

const queryClient = useQueryClient()
const { mutate } = useMutation({
  mutationFn: cancelOrder,
  onSuccess: () => {
    ElMessage.success('Order canceled')
    const queryKey = props.orderType === 'ask' ? 'askOrders' : 'bidOrders'
    queryClient.invalidateQueries([queryKey])
    queryClient.invalidateQueries(['excludedBalance'])
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})
async function onCancel() {
  mutate({ orderId: props.order.orderId })
}

// fiat price
const { data: fiatRate } = useQuery({
  queryKey: ['fiatRate', { coin: 'btc' }],
  queryFn: getFiatRate,
})
</script>

<template>
  <div
    class="text-xs grid grid-cols-3 gap-1 py-1 rounded-sm px-2"
    :class="{
      '!bg-primary/20': isSelected(order.orderId) && !isMyOrder,
      'opacity-60 cursor-default': isMyOrder,
      'hover:bg-primary/15 cursor-pointer': !isMyOrder,
    }"
  >
    <div class="td flex items-center gap-1">
      <span
        class="flex items-center"
        :class="{
          'text-red-500': orderType === 'ask',
          'text-green-500': orderType === 'bid',
        }"
      >
        <span v-if="isFreeOrder" class="">0</span>
        <span v-else>
          {{ prettyBalance(order.coinRatePrice, useBtcUnit) }}
        </span>
        <TooltipProvider v-if="isMyOrder">
          <Tooltip>
            <TooltipTrigger as-child>
              <UserIcon class="w-3 h-3 ml-1 cursor-default" />
            </TooltipTrigger>
            <TooltipContent class="duration-500">
              <p>Your order</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>

      <span class="text-xs text-zinc-500" v-if="showFiat && fiatRate">
        {{ '$' + calcFiatPrice(order.coinRatePrice, fiatRate) }}
      </span>
    </div>

    <div class="td-right">{{ order.coinAmount }}</div>

    <div class="td-right">
      <template v-if="isFreeOrder">
        <span
          class="rounded bg-green-700/30 px-2 text-xs font-bold text-green-500"
        >
          FREE
        </span>
      </template>

      <span v-else class="inline-grid grid-cols-5 items-center gap-1">
        <span :class="showFiat && fiatRate ? 'col-span-3' : 'col-span-5'">{{
          prettyBalance(order.amount, useBtcUnit)
        }}</span>

        <span
          class="text-xs text-zinc-500 col-span-2"
          v-if="showFiat && fiatRate"
        >
          {{ '$' + calcFiatPrice(order.amount, fiatRate) }}
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.td {
  @apply text-left font-normal col-span-1;
}

.td-right {
  @apply text-right font-normal col-span-1;
}
</style>
