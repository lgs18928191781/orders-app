import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

import { swapApiFetch } from '@/lib/fetch'

export const getPoolStats = async ({
  token1,
  token2,
}: {
  token1: string
  token2: string
}): Promise<{
  volume24h: string
  fees24h: string
}> => {
  const res = await swapApiFetch(`pools/${token1}-${token2}/stats`)

  return res
}

export const getPoolStatsQuery = (
  filters: {
    token1: ComputedRef<string>
    token2: ComputedRef<string>
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) =>
  queryOptions({
    queryKey: ['swapPoolStats', filters],
    queryFn: () =>
      getPoolStats({
        token1: filters.token1.value,
        token2: filters.token2.value,
      }),

    enabled,
    refetchInterval: 30000,
  })
