import { useNetworkStore } from '@/stores/network'
import { defineStore } from 'pinia'

export const useFeebStore = defineStore('feeb', {
  state: () => {
    return {
      feeb: undefined as number | undefined,
    }
  },

  getters: {
    get: (state) => {
      // if testnet, return 1
      const networkStore = useNetworkStore()
      if (networkStore.network === 'testnet') return 1

      return state.feeb
    },
  },

  actions: {
    set(feeb: number) {
      this.feeb = feeb
    },
  },
})
