import fetchWrapper, { type ApiOptions } from '@/lib/fetch'
import { raise } from '@/lib/helpers'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'

export async function eventFetch(url: string, options?: ApiOptions) {
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
  if (options.auth) {
    const credentialsStore = useCredentialsStore()
    const credential = credentialsStore.get
    if (!credential) {
      throw new Error('Please login first.')
    }

    options.headers = {
      ...options.headers,
      'X-Signature': credential.signature,
      'X-Public-Key': credential.publicKey,
    }
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

export async function rewardFetch(url: string, options?: ApiOptions) {
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
  if (options.auth) {
    const credentialsStore = useCredentialsStore()
    const credential = credentialsStore.get
    if (!credential) {
      throw new Error('Please login first.')
    }

    options.headers = {
      ...options.headers,
      'X-Signature': credential.signature,
      'X-Public-Key': credential.publicKey,
    }
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

export const getEventRemains = async ({
  event,
}: {
  event: string
}): Promise<{
  rewardTick: string
  remainingInfo: string
}> => {
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    net: network,
    rewardType: event,
  })

  const remains = await eventFetch(`reward/pool/info?${params}`)

  return remains
}

export const getClaimFees = async (): Promise<{
  feeAddress: string
  rewardSendFee: number
  rewardInscriptionFee: number
}> => {
  const feeb = useFeebStore().get ?? raise('Choose a fee rate first.')
  const network = useNetworkStore().network

  const params = new URLSearchParams({
    networkFeeRate: String(feeb),
    version: '2',
    net: network,
  })

  return await rewardFetch(`cal/fee?${params}`, { auth: true })
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

  return await rewardFetch(`claim`, {
    method: 'POST',
    auth: true,
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
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
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
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
    rewardType: event,
  })

  const history = await rewardFetch(`user/orders?${params}`)
    .then((res) => {
      // if is empty object, return empty array
      if (Object.keys(res).length === 0) return []

      return res?.results || []
    })
    .then((res) => {
      return res.map((item: any) => {
        if (item.rewardState === 3) {
          item.rewardState = 'finished'
        } else {
          item.rewardState = 'pending'
        }

        return item
      })
    })

  return history
}

export type SwapRewardHistory = {
  dailyCount: number
  endBlock: number
  lpBlock: number
  net: 'testnet' | 'livenet'
  realReward: number
  recordId: string
  startBlock: number
  tick: string
  timestamp: number
  userAddress: string
}
export const getSwapRewardHistory = async ({
  event,
}: {
  event: string
}): Promise<SwapRewardHistory[]> => {
  const address = useConnectionStore().getAddress
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
    rewardType: event,
  })

  const history = await rewardFetch(`user/records?${params}`)
    .then((res) => {
      // if is empty object, return empty array
      if (Object.keys(res).length === 0) return []

      return res.list
    })
    .then((res) => {
      // filter records that is 0
      return res.filter((item: any) => item.realReward > 0)
    })

  return history
}
