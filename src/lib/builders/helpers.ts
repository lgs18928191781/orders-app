import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'
import { raise } from '../helpers'
import { getPlatformPublicKey } from '@/queries/orders-v2'
import { useBtcJsStore } from '@/stores/btcjs'
import { Buffer } from 'buffer'

export async function getBothPubKeys() {
  const selfAddress = useConnectionStore().getAddress
  const credential = useCredentialsStore().getByAddress(selfAddress)
  const selfPubKey =
    credential?.publicKey ??
    raise(
      'No credential. Please try again or contact customer service for assistance.'
    )

  const platformPubKey = (await getPlatformPublicKey()).platformPublicKey

  return {
    selfPubKey,
    platformPubKey,
  }
}

export async function generateP2wshPayment() {
  const btcjs = useBtcJsStore().get!

  const { selfPubKey, platformPubKey } = await getBothPubKeys()
  const pubkeys = [selfPubKey, platformPubKey].map((hex) =>
    Buffer.from(hex, 'hex')
  )
  const redeem = btcjs.payments.p2ms({ m: 1, pubkeys })
  return btcjs.payments.p2wsh({ redeem })
}
