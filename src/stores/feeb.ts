import { INSCRIBE_TX_SIZE_FACTOR, TX_BASE_SIZE } from '@/data/constants'
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
      const networkStore = useNetworkStore()
      if (networkStore.isTestnet) return 2

      return state.feeb
    },

    inscriptionFee: (state) => {
      if (!state.feeb) return 0

      function inflateFeeRate(feeRate: number) {
        // ceil to ..5 or ..0
        const lastDigit = feeRate % 10
        if (lastDigit > 5) {
          return feeRate + (10 - lastDigit)
        }

        return feeRate + (5 - lastDigit)
      }

      function calcInscriptionFee(inflatedFeeRate: number) {
        const inscribeFee =
          INSCRIBE_TX_SIZE_FACTOR * inflatedFeeRate + TX_BASE_SIZE

        return inscribeFee
      }

      return calcInscriptionFee(inflateFeeRate(state.feeb))
    },
  },

  actions: {
    set(feeb: number) {
      this.feeb = feeb
    },
  },
})
