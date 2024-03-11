import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useNetworkStateModal = createGlobalState(() => {
  // state
  const isOpen = ref(false)

  // actions
  function openModal() {
    isOpen.value = true
  }

  function closeModal() {
    isOpen.value = false
  }

  return {
    isOpen,
    openModal,
    closeModal,
  }
})
