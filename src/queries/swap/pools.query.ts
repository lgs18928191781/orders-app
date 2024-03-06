import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

import { swapApiFetch } from '@/lib/fetch'
import { useCredentialsStore } from '@/stores/credentials'
import { useNetworkStore, type Network } from '@/stores/network'
import swapPairs, { testnetSwapPairs } from '@/data/swap-pairs'

const credentialsStore = useCredentialsStore()

export const getPools = async ({
  network,
}: {
  network: Network
}): Promise<
  {
    token1: string
    token2: string
    network: Network
  }[]
> => {
  const res = await swapApiFetch(`pools?net=${network}`)

  return res
}

export const getPoolsQuery = (
  filters: {
    network: Network
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) => {
  const network = useNetworkStore().network
  const defaultSwapPairs = (
    network === 'testnet' ? testnetSwapPairs : swapPairs
  ).map((pair) => ({
    token1: pair.token1Symbol,
    token2: pair.token2Symbol,
    network,
  }))

  return queryOptions({
    queryKey: ['swapPools', filters],
    queryFn: () => getPools(filters),
    enabled,
    placeholderData: defaultSwapPairs,
    select: (pools) =>
      pools.map((pool) => {
        return {
          ...pool,
          id: `${pool.token1}-${pool.token2}`,
          pairStr: `${pool.token1}-${pool.token2}`,
        }
      }),
  })
}
