import { createGlobalState } from '@vueuse/core'
import { ComputedRef, computed, ref } from 'vue'

import { type Order } from '@/queries/orders-v2'
import { useConnectionStore } from '@/stores/connection'
import Decimal from 'decimal.js'

export const useSelectOrder = createGlobalState(() => {
  const selectedOrder = ref<Order>()

  const selectedAskOrder = computed(() => {
    if (!selectedOrder.value) return

    return selectedOrder.value.orderType === 1 ? selectedOrder.value : undefined
  })
  const selectedBidOrder = computed(() => {
    if (!selectedOrder.value) return

    return selectedOrder.value.orderType === 2 ? selectedOrder.value : undefined
  })

  const isSelected = (orderId: string) => {
    return selectedOrder.value?.orderId === orderId
  }

  const selectedOrderType: ComputedRef<'ask' | 'bid' | undefined> = computed(
    () => {
      if (!selectedOrder.value) return

      return selectedOrder.value?.orderType === 1 ? 'ask' : 'bid'
    }
  )

  function select(
    order: Order & {
      price: Decimal
    }
  ) {
    const address = useConnectionStore().getAddress
    const makerAddress =
      order.orderType === 1 ? order.sellerAddress : order.buyerAddress

    if (address === makerAddress) return

    // use a more precise way to present price
    selectedOrder.value = {
      ...order,
      price: order.price,
    }
  }

  return {
    select,
    selectedOrder,
    selectedAskOrder,
    selectedBidOrder,
    isSelected,
    selectedOrderType,
  }
})