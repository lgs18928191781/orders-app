import { useDebounceFn } from '@vueuse/core'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'

async function sign() {
  const connectionStore = useConnectionStore()
  const connection = useConnectionStore().last
  if (!connection.address || connection.status === 'disconnected') {
    throw new Error('Please connect to a wallet first.')
  }

  const address = useConnectionStore().getAddress
  const credentialsStore = useCredentialsStore()

  // read from store first.
  const credential = credentialsStore.getByAddress(address)

  if (credential) return credential

  // if not found, then sign and in store.
  const message = 'orders.exchange'

  let publicKey = connection.pubKey
  let signature = ''

  if (connection.wallet === 'unisat') {
    publicKey = await window.unisat.getPublicKey()
    signature = await connectionStore.adapter.signMessage(message)
  } else if (connection.wallet === 'okx') {
    const account: {
      address: string
      publicKey: string
      compressedPublicKey: string
    } = await window.okxwallet.bitcoin.connect()

    publicKey = account.compressedPublicKey || account.publicKey
    signature = await window.okxwallet.bitcoin.signMessage(message, {
      from: account.address,
    })
  } else if (connection.wallet === 'metalet') {
    publicKey = await window.metaidwallet.btc.getPublicKey()
    signature = await connectionStore.adapter.signMessage(message)
  }

  credentialsStore.add({ publicKey, signature, address })

  return { publicKey, signature, address }
}

function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeoutId: number

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  } as T
}

export default debounce(sign, 500);

// export default useDebounceFn(sign, 1000)
