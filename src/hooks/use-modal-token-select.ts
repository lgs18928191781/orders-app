import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useModalTokenSelect = createGlobalState(() => {
  // state
  const isOpen = ref(true)

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
