import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, Ref, computed } from 'vue'

import { NETWORK } from '@/data/constants'
import { ordersCommonApiFetch } from '@/lib/fetch'

export type SwapToken = {
  creator: string
  decimal: string
  deployBlockTime: number
  deployHeight: number
  historyCount: number
  holdersCount: number
  inscriptionId: string
  inscriptionNumber: number
  limit: string
  max: string
  mintTimes: number
  minted: string
  ticker: string
  totalMinted: string
  txId: string
}

export const getSwapTokens = async ({
  keyword,
}: {
  keyword: string
}): Promise<SwapToken[]> => {
  const params = new URLSearchParams({
    net: NETWORK,
    size: '5',
  })
  if (keyword) {
    params.set('tick', keyword)
  }
  const res = await ordersCommonApiFetch(`brc20/tick/list?${params}`).then(
    ({ list }) => list,
  )
  return res
}

export const getSwapTokensQuery = (
  filters: {
    keyword: Ref<string>
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) =>
  queryOptions({
    queryKey: ['swapTokens', filters],
    queryFn: () => getSwapTokens({ keyword: filters.keyword.value }),

    enabled,
  })
