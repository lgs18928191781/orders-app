import { useNetworkStore } from '@/stores/network'
const mainBaseUrl = 'https://api.mvcswap.com/swap'
const testBaseUrl = 'https://api.mvcswap.com/swap/test'

interface IRequest {
  <T = any>(url: string, opts: RequestInit): Promise<T>
  <T = any>(url: string): Promise<T>
}

const getBaseUrl = (isTestNet: boolean) => {
  if (isTestNet) {
    return testBaseUrl
  } else {
    return mainBaseUrl
  }
}
const fetchWrapper: IRequest = async (url: string, options?: RequestInit) => {
  const networkStore = useNetworkStore()
  const isTestNet = networkStore.isTestnet
  if (url.indexOf('http') < 0) {
    url = `${getBaseUrl(isTestNet)}${url}`
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    if (response.status === 422 || response.status === 403) {
      const jsoned = await response.json()

      throw new Error(jsoned.message)
    }

    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    )
  }
  return await response.json()
}
export async function queryAllPairs() {
  return fetchWrapper<MS.Ret<Record<string, MS.Pair>>>(`/allpairs`)
}

export async function queryIcons() {
  return fetchWrapper<MS.Ret<MS.Icon[]>>(
    'https://icons.mvcswap.com/resources/icons.json',
  )
}

export async function queryPairInfo(symbol: string) {
  return fetchWrapper<MS.Ret<MS.PairInfo>>(`/swapinfo?symbol=${symbol}`)
}
export async function reqSwap(data: {
  symbol: string
  address: string
  op: number
  source: string
}) {
  return fetchWrapper<MS.Ret<MS.SwapArgs>>(`/reqswapargs`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
export async function token1totoken2(data: { data: string }) {
  return fetchWrapper<
    MS.Ret<{
      token2Amount: string
      txid: string
    }>
  >(`/token1totoken2`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
export async function token2toToken1(data: { data: any }) {
  return fetchWrapper<
    MS.Ret<{
      token1Amount: string
      txid: string
    }>
  >(`/token2toToken1`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function addLiq(data: { data: any }) {
  return fetchWrapper<
    MS.Ret<{
      lpAddAmount: string
      txid: string
    }>
  >(`/addLiq`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function removeLiq(data: { data: any }) {
  return fetchWrapper<
    MS.Ret<{
      token1Amount: string
      token2Amount: string
      txid: string
    }>
  >(`/removeLiq`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}