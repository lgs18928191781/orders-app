<script lang="ts" setup>
import { computed } from 'vue'
import { UserIcon } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { type Order } from '@/queries/orders-api'
import { prettyBalance } from '@/lib/formatters'
import { useBtcUnit } from '@/lib/helpers'
import { useSelectOrder } from '@/hooks/use-select-order'
import { useFiat } from '@/hooks/use-fiat'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const address = useConnectionStore().getAddress
const { isSelected } = useSelectOrder()
const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const props = defineProps<{
  order: Order
  orderType: 'ask' | 'bid'
}>()

const isMyOrder = computed(() => {
  if (props.orderType === 'ask') {
    return props.order.sellerAddress === address
  }

  return props.order.buyerAddress === address
})

const isFreeOrder = computed(() => {
  return props.orderType === 'ask' && props.order.freeState === 1
})
</script>

<template>
  <div
    class="grid grid-cols-3 gap-1 rounded-sm px-2 py-1 text-xs"
    :class="{
      '!bg-primary/20': isSelected(order.orderId) && !isMyOrder,
      'cursor-default opacity-60': isMyOrder,
      'cursor-pointer hover:bg-primary/15': !isMyOrder,
    }"
  >
    <div class="td">
      <div
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
              <UserIcon class="ml-1 size-3 cursor-default" />
            </TooltipTrigger>
            <TooltipContent class="duration-500">
              <p>Your order</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div class="text-xs text-zinc-500" v-if="isShowingFiat && fiatRate">
        {{ getFiatPriceDisplay(order.coinRatePrice, fiatRate) }}
      </div>
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

      <div v-else class="">
        <div :class="isShowingFiat && fiatRate ? 'col-span-3' : 'col-span-5'">
          {{ prettyBalance(order.amount, useBtcUnit) }}
        </div>

        <div
          class="col-span-2 text-xs text-zinc-500"
          v-if="isShowingFiat && fiatRate"
        >
          {{ getFiatPriceDisplay(order.amount, fiatRate) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.td {
  @apply col-span-1 text-left font-normal;
}

.td-right {
  @apply col-span-1 text-right font-normal;
}
</style>
