import { createGlobalState } from '@vueuse/core'
import { ComputedRef, computed, ref } from 'vue'

import { type Order } from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'

export const useSelectOrder = createGlobalState(() => {
  const selectedOrder = ref<Order>()

  const isSelected = (orderId: string) => {
    return selectedOrder.value?.orderId === orderId
  }

  const selectedOrderType: ComputedRef<'ask' | 'bid' | undefined> = computed(
    () => {
      if (!selectedOrder.value) return

      return selectedOrder.value?.orderType === 1 ? 'ask' : 'bid'
    }
  )

  function select(order: Order) {
    const address = useConnectionStore().getAddress
    const makerAddress =
      order.orderType === 1 ? order.sellerAddress : order.buyerAddress

    if (address !== makerAddress) return

    selectedOrder.value = order
  }

  return { select, selectedOrder, isSelected, selectedOrderType }
})
