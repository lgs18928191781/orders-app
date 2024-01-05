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

export const postBidOrder = async ({
  network,
  address,
  tick,
  preTxRaw,
  mergeTxRaw,
  total,
  coinAmount,
}: {
  network: 'livenet' | 'testnet'
  address: string
  tick: string
  preTxRaw: string
  mergeTxRaw?: string
  total: number
  coinAmount: number
}) => {
  try {
    const { publicKey, signature } = await sign()
    const createRes = await ordersV2Fetch(`bid/push`, {
      method: 'POST',
      headers: {
        'X-Signature': signature,
        'X-Public-Key': publicKey,
      },
      body: JSON.stringify({
        net: network,
        address,
        tick,
        preTxRaw,
        mergeTxRaw,
        amount: total,
        coinAmount,
      }),
    })

    return createRes
  } catch (e) {
    throw e
  }
}

export const getSellFees = async ({ orderId }: { orderId: string }) => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    orderId,
  })

  const res = await ordersV2Fetch(`bid/cal/fee?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return res
}

export const getSellEssentials = async () => {}

export const postSellTake = async () => {}
