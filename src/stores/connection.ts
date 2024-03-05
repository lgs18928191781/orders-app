import { defineStore } from 'pinia'
import { useLocalStorage, type RemovableRef } from '@vueuse/core'
import type { Psbt } from 'bitcoinjs-lib'

import * as unisatAdapter from '@/wallet-adapters/unisat'
import * as okxAdapter from '@/wallet-adapters/okx'
import * as metaletAdapter from '@/wallet-adapters/metalet'
import { login } from '@/queries/orders-api'
import { ElMessage } from 'element-plus'
import { IS_DEV } from '@/data/constants'
import { Network, useNetworkStore } from './network'

function getWalletAdapter(wallet: Wallet) {
  switch (wallet) {
    case 'unisat':
      return unisatAdapter
    case 'okx':
      return okxAdapter
    case 'metalet':
      return metaletAdapter
    default:
      throw new Error(`Unsupported wallet: ${wallet}`)
  }
}

function getWalletProvider(wallet: Wallet) {
  switch (wallet) {
    case 'unisat':
      return window.unisat
    case 'okx':
      return window.unisat
    case 'metalet':
      return window.metaidwallet
    default:
      throw new Error(`Unsupported wallet: ${wallet}`)
  }
}

export type Wallet = 'unisat' | 'okx' | 'metalet'
export type WalletConnection = {
  wallet: Wallet
  status: 'connected' | 'disconnected'
  address: string
  pubKey: string
}

export const useConnectionStore = defineStore('connection', {
  state: () => {
    return {
      last: useLocalStorage('last-connection', {
        wallet: 'unisat',
        status: 'disconnected',
        address: '',
        pubKey: '',
      } as WalletConnection) as RemovableRef<WalletConnection>,
    }
  },

  getters: {
    has: (state) => !!state.last,
    connected: (state) =>
      state.last.status === 'connected' && !!state.last.address,
    getAddress: (state) => {
      if (IS_DEV && import.meta.env.VITE_TESTING_ADDRESS) {
        console.log(
          'Using testing address',
          import.meta.env.VITE_TESTING_ADDRESS,
        )
        return import.meta.env.VITE_TESTING_ADDRESS as string
      }

      return state.last.address
    },
    isTaproot: (state) =>
      state.last.address.startsWith('bc1p') ||
      state.last.address.startsWith('tb1p'),
    getPubKey: (state) => state.last.pubKey,
    provider: (state) => {
      if (!state.last) return null
      return getWalletProvider(state.last.wallet)
    },
    adapter: (state) => {
      if (!state.last) throw new Error('No connection')

      const adapter: {
        initPsbt: () => Psbt
        getMvcAddress?: () => Promise<string>
        finishPsbt: (psbt: string) => string
        getAddress: () => Promise<string>
        getPubKey: () => Promise<string>
        connect: () => Promise<{
          address: string
          pubKey: string
        }>
        disconnect: () => Promise<void>
        getBalance: () => Promise<number>
        inscribe: (tick: string) => Promise<string>
        signPsbt: (psbt: string, options?: any) => Promise<string>
        signPsbts: (psbts: string[], options?: any) => Promise<string[]>
        pushPsbt: (psbt: string) => Promise<string>
        signMessage: (message: string) => Promise<string>
      } = getWalletAdapter(state.last.wallet)

      return adapter
    },
  },

  actions: {
    async connect(wallet: Wallet) {
      const connection: WalletConnection = this.last
        ? (JSON.parse(JSON.stringify(this.last)) as WalletConnection)
        : {
            wallet,
            status: 'disconnected',
            address: '',
            pubKey: '',
          }

      const connectRes = await getWalletAdapter(wallet).connect()

      try {
        if (connectRes) {
          connection.address = connectRes.address
          connection.pubKey = connectRes.pubKey

          connection.status = 'connected'
          connection.wallet = wallet

          this.last = connection

          return this.last
        }
      } catch (e: any) {
        ElMessage.error(e.message)
        connection.status = 'disconnected'
        connection.wallet = wallet
        this.last = connection
      }

      return this.last
    },

    async sync() {
      // get address again from wallet
      if (!this.connected) return

      this.last.status = 'connected'
      this.last.address = await this.adapter.getAddress()
      this.last.pubKey = await this.adapter.getPubKey()

      // sync network
      const networkStore = useNetworkStore()
      if (this.last.wallet === 'okx') {
        networkStore.set('livenet')
      } else if (this.last.wallet === 'unisat') {
        const network: Network = await window.unisat.getNetwork()
        networkStore.set(network)
      } else if (this.last.wallet === 'metalet') {
        const network: Network = await window.metaidwallet
          .getNetwork()
          .then((n: 'mainnet' | 'testnet') => {
            if (n === 'mainnet') return 'livenet'

            return 'testnet'
          })
        networkStore.set(network)
      }

      return this.last
    },

    async disconnect() {
      if (!this.last) return

      if (this.last.wallet === 'okx') {
        this.adapter.disconnect()
      }

      this.last.status = 'disconnected'
      this.last.address = ''
      this.last.pubKey = ''

      // reset network
      const networkStore = useNetworkStore()
      networkStore.set('livenet')
    },
  },
})
