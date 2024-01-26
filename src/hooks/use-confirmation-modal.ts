import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'

export const useConfirmationModal = createGlobalState(() => {
  // state
  const isOpen = ref(false)
  const transactionInfo = ref<any>()

  const isReady = computed(() => {
    return !!transactionInfo.value && isOpen.value
  })

  // actions
  function openModal(info: any) {
    transactionInfo.value = info

    isOpen.value = true
  }

  function closeModal() {
    transactionInfo.value = undefined
    isOpen.value = false
  }

  return {
    isOpen,
    isReady,
    transactionInfo,
    openModal,
    closeModal,
  }
})
