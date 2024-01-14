import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useSelectOrder = createGlobalState(() => {
  const selectedOrder = ref<String>()

  function select(order: string) {
    selectedOrder.value = order
  }

  const isSelected = (order: string) => {
    return selectedOrder.value === order
  }

  return { select, isSelected }
})
