import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'
import sign from '@/lib/sign'
import { ordersV2Fetch } from '@/lib/fetch'
import { raise } from '@/lib/helpers'

export const getPlatformPublicKey = async (): Promise<{
  platformPublicKey: string
}> => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    network: useNetworkStore().network,
  })

  const res = await ordersV2Fetch(`bid/key?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return res
}

export const postBidOffer = async () => {}

export const getSellFees = async () => {}

export const getSellEssentials = async () => {}

export const postSellTake = async () => {}
