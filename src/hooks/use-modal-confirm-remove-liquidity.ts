import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useModalConfirmRemoveLiquidity = createGlobalState(() => {
  // state
  const isOpen = ref(false)

  // actions
  function openModal() {
    console.log('ok')
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
