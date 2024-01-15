import { IS_DEV } from '@/data/constants'
import fetchWrapper from '@/lib/fetch'
import { raise } from '@/lib/helpers'
import sign from '@/lib/sign'
import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'

async function eventFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit
) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/event/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

async function rewardFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit
) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/reward/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

export const getEventStats = async ({
  event,
}: {
  event: string
}): Promise<{
  hadClaimRewardAmount: number
  hasReleasePoolOrderCount: number
  net: string
  rewardTick: string
  tick: string
  totalRewardAmount: number
  totalRewardExtraAmount: number
  total: number
}> => {
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    address,
    net: 'livenet',
    rewardType: event,
  })

  const stats = await rewardFetch(`user/info?${params}`).then((res) => {
    let total =
      res.totalRewardAmount +
      res.totalRewardExtraAmount -
      res.hadClaimRewardAmount
    if (total < 0) total = 0
    if (!total && IS_DEV) total = 100

    return {
      ...res,
      total,
    }
  })

  console.log('🚀 ~ stats:', stats)
  return stats
}

export const getClaimFees = async (): Promise<{
  feeAddress: string
  rewardSendFee: number
  rewardInscriptionFee: number
}> => {
  const feeb = useFeebStore().get ?? raise('Choose a fee rate first.')
  const { publicKey, signature } = await sign()

  const params = new URLSearchParams({
    networkFeeRate: String(feeb),
    version: '2',
  })

  return await rewardFetch(`cal/fee?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })
}

export const postClaimReward = async ({
  rewardAmount,
  feeSend,
  feeInscription,
  networkFeeRate,
  feeUtxoTxId,
  feeRawTx,
  rewardType,
}: {
  rewardAmount: number
  feeSend: number
  feeInscription: number
  networkFeeRate: number
  feeUtxoTxId: string
  feeRawTx: string
  rewardType: number
}) => {
  const network = useNetworkStore().network
  const address = useConnectionStore().getAddress
  const { publicKey, signature } = await sign()

  return await rewardFetch(`claim`, {
    method: 'POST',
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
    body: JSON.stringify({
      net: network,
      rewardAmount,
      address,
      version: 2,

      feeInscription,
      feeSend,
      feeUtxoTxId,
      networkFeeRate,
      feeRawTx,
      rewardType,
    }),
  })
}

export const getRewardHistory = async ({ event }: { event: string }) => {
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    address,
    net: 'livenet',
    rewardType: event,
  })

  const history = await eventFetch(`reward/records?${params}`).then((res) => {
    // if is empty object, return empty array
    if (Object.keys(res).length === 0) return []

    return res.results
  })

  return history
}

export const getClaimHistory = async ({ event }: { event: string }) => {
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    address,
    net: 'livenet',
    rewardType: event,
  })

  const history = await rewardFetch(`user/orders?${params}`).then((res) => {
    // if is empty object, return empty array
    if (Object.keys(res).length === 0) return []

    return res.results
  })

  return history
}
