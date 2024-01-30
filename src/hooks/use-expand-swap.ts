import { createGlobalState, useStorage } from '@vueuse/core'

export const useExpandSwap = createGlobalState(() => {
  // state
  const isExpand = useStorage('expand-swap', false)

  // actions
  const toggleExpand = () => {
    isExpand.value = !isExpand.value
  }

  return {
    isExpand,
    toggleExpand,
  }
})
