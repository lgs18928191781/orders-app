import { defineStore } from 'pinia'
import { useLocalStorage, type RemovableRef } from '@vueuse/core'
import type { Psbt } from 'bitcoinjs-lib'

import * as unisatAdapter from '@/wallet-adapters/unisat'
import * as okxAdapter from '@/wallet-adapters/okx'
import * as metaletAdapter from '@/wallet-adapters/metalet'
import { login } from '@/queries/orders-api'

function getWalletAdapter(wallet: Wallet) {
  console.log('getWalletAdapter', wallet);

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
    getAddress: (state) => state.last.address,
    isTaproot: (state) => state.last.address.startsWith('bc1p'),
    getPubKey: (state) => state.last.pubKey,
    provider: (state) => {
      if (!state.last) return null
      return getWalletProvider(state.last.wallet)
    },
    adapter: (state) => {
      if (!state.last) throw new Error('No connection')
      console.log('adapter this', this,);
      console.log('adapter state', state, state.last);

      const adapter: {
        initPsbt: () => Psbt
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
      } = getWalletAdapter(state.last.wallet)

      return adapter
    },
  },

  actions: {
    async connect(wallet: Wallet) {
      console.log('this.last', JSON.stringify(this.last));

      const connection: WalletConnection = this.last
        ? (JSON.parse(JSON.stringify(this.last)) as WalletConnection)
        : {
          wallet,
          status: 'disconnected',
          address: '',
          pubKey: '',
        }

      const connectRes = await getWalletAdapter(wallet).connect()

      if (connectRes) {
        connection.address = connectRes.address
        connection.pubKey = connectRes.pubKey

        connection.status = 'connected'
        connection.wallet = wallet

        this.last = connection

        await login()
      }
      return this.last
    },

    async sync() {
      // get address again from wallet
      if (!this.connected) return

      this.last.status = 'connected'
      this.last.address = await this.adapter.getAddress()
      this.last.pubKey = await this.adapter.getPubKey()
      console.log("this last wallet", this.last.wallet);


      await login()

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
    },
  },
})
