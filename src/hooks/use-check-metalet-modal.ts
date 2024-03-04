import { createGlobalState } from '@vueuse/core'
import { type Ref, ref } from 'vue'

export const useCheckMetaletLoginModal = createGlobalState(() => {
  // state
  const isConnectionMetaletModal = ref(false)

  // actions
  const openConnectionModal = () => {
    isConnectionMetaletModal.value = true
  }

  const closeConnectionModal = () => {
    isConnectionMetaletModal.value = false
  }

  return {
    isConnectionMetaletModal,
    openConnectionModal,
    closeConnectionModal,
  }
})
