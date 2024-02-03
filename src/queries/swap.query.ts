import { getPoolStatus } from '@/queries/swap'
import { Network } from '@/stores/network'
import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

export const getPoolStatusQuery = (
  filters: {
    address: string
    token1: ComputedRef<string>
    token2: ComputedRef<string>
    network: Network
  },
  enabled: ComputedRef<boolean> = computed(() => true)
) =>
  queryOptions({
    queryKey: ['poolStatus', filters],
    queryFn: () =>
      getPoolStatus({
        address: filters.address,
        token1: filters.token1.value,
        token2: filters.token2.value,
        network: filters.network,
      }),

    enabled,
  })
