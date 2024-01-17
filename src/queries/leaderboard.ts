import fetchWrapper from '@/lib/fetch'
import { useConnectionStore } from '@/stores/connection'

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

export const getActivityAssetTicks = async (): Promise<
  {
    endTime: number
    startTime: number
    tick: string
  }[]
> => {
  const params = new URLSearchParams({
    net: 'livenet',
  })

  const ticks = await eventFetch(`ranking/tick?${params}`).then(
    (res) => res?.results ?? []
  )
  console.log({ ticks })

  return ticks
}

export const getOneLeaderboardStats = async ({
  tick,
}: {
  tick: string
}): Promise<{
  addressOrderCount: number
  addressTotalAmount: number
  orderCount: number
  totalAmount: number
  eventStartTime: number
  eventEndTime: number
  tickCurrentLevel: number
  tickNextLevel: number
  tickCurrentLevelLimitAmount: number
  tickNextLevelLimitAmount: number
  tickCurrentLevelRewardAmount: number
  tickNextLevelRewardAmount: number
}> => {
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    tick,
    net: 'livenet',
    rankingType: 'ranking_address',
    address,
  })

  const stats = await eventFetch(`ranking/tick/info?${params}`)

  return stats
}

export const getOneLeaderboard = async ({
  tick,
}: {
  tick: string
}): Promise<{
  total: number
  results: {
    rankingId: string
    address: string
    totalValue: number
  }[]
}> => {
  const params = new URLSearchParams({
    tick,
    net: 'livenet',
    rankingType: 'ranking_address',
  })

  const res = await eventFetch(`ranking/address?${params}`)

  return res
}
