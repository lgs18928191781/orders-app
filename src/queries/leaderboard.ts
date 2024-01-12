import fetchWrapper from '@/lib/fetch'
import { useConnectionStore } from '@/stores/connection'

async function eventFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit
) {
  const ordersApiUrl = `https://api.ordbook.io/book/event/${url}`
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

export const getOneLeaderboardStats = async ({
  tick,
}: {
  tick: string
}): Promise<{
  addressOrderCount: number
  addressTotalAmount: number
  orderCount: number
  totalAmount: number
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
