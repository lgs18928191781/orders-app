import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'

export default async function sign() {
  const connectionStore = useConnectionStore()
  const connection = connectionStore.last
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
