import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useModalTokenSelect = createGlobalState(() => {
  // state
  const isOpen = ref(false)

  // actions
  function openModal() {
    console.log('open')
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
