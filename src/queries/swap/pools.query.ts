import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

import { swapApiFetch } from '@/lib/fetch'
import { useCredentialsStore } from '@/stores/credentials'
import type { Network } from '@/stores/network'

const credentialsStore = useCredentialsStore()

export const getPools = async ({
  network,
}: {
  network: Network
}): Promise<{
  token1: string
  token2: string
  network: Network
}> => {
  const res = await swapApiFetch(`pools?net=${network}`)

  return res
}

export const getPoolsQuery = (
  filters: {
    address: string
    network: Network
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) =>
  queryOptions({
    queryKey: ['swapPools', filters],
    queryFn: () => getPools(filters),
    enabled,
  })
