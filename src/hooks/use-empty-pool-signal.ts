import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useEmptyPoolSignal = createGlobalState(() => {
  // state
  const isEmpty = ref(false)

  // actions
  function setEmpty() {
    isEmpty.value = true
  }

  function reset() {
    isEmpty.value = false
  }

  return {
    isEmpty,
    setEmpty,
    reset,
  }
})
