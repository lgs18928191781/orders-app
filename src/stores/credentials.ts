import { defineStore } from 'pinia'
import { useLocalStorage, type RemovableRef } from '@vueuse/core'

import { useConnectionStore } from '@/stores/connection'
import { SIGNING_MESSAGE } from '@/data/constants'
import { login } from '@/queries/orders-api'
import { ElMessage } from 'element-plus'

export const useCredentialsStore = defineStore('credentials', {
  state: () => {
    return {
      credentials: useLocalStorage(
        'credentials',
        [] as { publicKey: string; signature: string; address: string }[]
      ) as RemovableRef<
        { publicKey: string; signature: string; address: string }[]
      >,
      signing: false,
    }
  },

  getters: {
    getByAddress: (state) => {
      return (address: string) => {
        return state.credentials.find((s) => s.address === address)
      }
    },

    has: (state) => {
      return (address: string) => {
        return !!state.credentials.find((s) => s.address === address)
      }
    },

    get: (state) => {
      const connectionStore = useConnectionStore()
      const connected = connectionStore.connected
      const address = connectionStore.getAddress
      const credential = state.credentials.find((s) => s.address === address)

      const ready = connected && !!credential

      if (!ready) return false

      return credential
    },

    ready: (state) => {
      const connectionStore = useConnectionStore()
      const connected = connectionStore.connected
      const address = connectionStore.getAddress
      const credential = state.credentials.find((s) => s.address === address)

      return connected && !!credential
    },
  },

  actions: {
    add({
      publicKey,
      signature,
      address,
    }: {
      publicKey: string
      signature: string
      address: string
    }) {
      if (this.credentials.find((s) => s.address === address)) return

      this.credentials.push({ publicKey, signature, address })
    },

    remove(address: string) {
      this.credentials = this.credentials.filter((s) => s.address !== address)
    },

    async sign() {
      const connectionStore = useConnectionStore()
      const connection = connectionStore.last
      if (!connection.address || connection.status === 'disconnected') {
        throw new Error('Please connect to a wallet first.')
      }

      const address = connectionStore.getAddress

      // read from store first.
      const credential = this.getByAddress(address)
      if (credential) return credential

      // nothing in cache
      // check if signing already;
      // if so, wait for it.
      if (this.signing) return false
      this.signing = true

      // perform sign
      const message = SIGNING_MESSAGE
      let publicKey: string = connection.pubKey
      let signature: string = ''

      try {
        switch (connection.wallet) {
          case 'unisat':
            publicKey = await window.unisat.getPublicKey()
            signature = await connectionStore.adapter.signMessage(message)
            break
          case 'okx':
            const account: {
              address: string
              publicKey: string
              compressedPublicKey: string
            } = await window.okxwallet.bitcoin.connect()

            publicKey = account.compressedPublicKey || account.publicKey
            signature = await window.okxwallet.bitcoin.signMessage(message, {
              from: account.address,
            })
            break
          case 'metalet':
            publicKey = await window.metaidwallet.btc.getPublicKey()
            signature = await connectionStore.adapter.signMessage(message)
            break
          default:
            throw new Error(`Unsupported wallet: ${connection.wallet}`)
        }
        console.log('here')

        this.add({ publicKey, signature, address })

        return { publicKey, signature, address }
      } catch (e) {
        // it's likely that the user rejected the signing.
        this.signing = false
      }
    },

    async login() {
      // 1. sync connection
      const connectionStore = useConnectionStore()
      const synced = await connectionStore.sync()
      if (!synced) {
        return false
      }

      // 2. get credential
      const credential = await this.sign()
      if (!credential) return false

      // 3. login to api
      const res = await login(credential)
      if (res.error) {
        ElMessage.error(res.error)
        return false
      }

      return credential
    },
  },
})
