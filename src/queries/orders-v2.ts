import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import sign from '@/lib/sign'
import { ordersV2Fetch } from '@/lib/fetch'
import { Order } from './orders-api'

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

type DetailedOrder = Order & {
  psbtRaw: string
  takePsbtRaw: string
  platformFee: number
}
export const getBuyEssentials = async ({
  orderId,
  address,
  tick,
  buyerChangeAmount,
}: {
  orderId: string
  address: string
  tick: string
  buyerChangeAmount: number
}): Promise<DetailedOrder> => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    buyerAddress: address,
    tick,
    platformDummy: '1',
  })

  const order: DetailedOrder = await ordersV2Fetch(`${orderId}?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return order
}

export const postBuyTake = async ({
  network,
  psbtRaw,
  orderId,
}: {
  network: 'livenet' | 'testnet'
  psbtRaw: string
  orderId: string
}) => {
  const address = useConnectionStore().getAddress

  const { publicKey, signature } = await sign()

  const updateRes = await ordersV2Fetch(`update`, {
    method: 'POST',
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
    body: JSON.stringify({
      net: network,
      address,
      orderId,
      orderState: 2,
      psbtRaw,
      broadcastIndex: 1,
    }),
  })

  return updateRes
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

export const getSellFees = async ({
  orderId,
}: {
  orderId: string
}): Promise<{
  feeAddress: string
  platformFee: number
}> => {
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

  return !res ? { feeAddress: '', platformFee: 0 } : res
}

export const getSellEssentials = async ({
  orderId,
  inscriptionId,
  feeb,
}: {
  orderId: string
  inscriptionId: string
  feeb: number
}): Promise<{
  orderId: string
  psbtRaw: string
}> => {
  const { publicKey, signature } = await sign()
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    orderId,
    sellerAddress: address,
    inscriptionId,
    networkFeeRate: String(feeb),
  })

  const res = await ordersV2Fetch(`bid/do/pre?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return res
}

export const postSellTake = async ({
  orderId,
  psbtRaw,
  networkFee,
  networkFeeRate,
}: {
  orderId: string
  psbtRaw: string
  networkFee: number
  networkFeeRate: number
}): Promise<{
  txId: string
}> => {
  const { publicKey, signature } = await sign()

  const res = await ordersV2Fetch(`bid/do`, {
    method: 'POST',
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
    body: JSON.stringify({
      net: useNetworkStore().network,
      networkFee,
      networkFeeRate,
      orderId,
      psbtRaw,
    }),
  })

  return res
}
