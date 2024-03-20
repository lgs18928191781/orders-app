import { defineStore } from 'pinia'
import { useLocalStorage, type RemovableRef } from '@vueuse/core'
import { bitcoin, testnet } from 'bitcoinjs-lib/src/networks'

export type Network = 'livenet' | 'testnet'
export const useNetworkStore = defineStore('network', {
  state: () => {
    return {
      network: useLocalStorage('network', 'livenet') as RemovableRef<Network>,
    }
  },

  getters: {
    btcNetwork: (state) =>
      state.network === 'livenet' ? 'bitcoin' : 'testnet',
    typedNetwork: (state) => (state.network === 'livenet' ? bitcoin : testnet),
    ordersNetwork: (state) => state.network,
    isTestnet: (state) => state.network === 'testnet',
  },

  actions: {
    switch() {
      this.network = this.network === 'livenet' ? 'testnet' : 'livenet'
    },
    set(network: Network) {
      this.network = network
    },
  },
})
