import { createGlobalState, useStorage } from '@vueuse/core'

export const useExpandSwap = createGlobalState(() => {
  // state
  const isExpanded = useStorage('expand-swap', false)

  // actions
  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
  }

  return {
    isExpanded,
    toggleExpand,
  }
})
