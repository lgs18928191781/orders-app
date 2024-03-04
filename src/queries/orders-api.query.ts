import { getOneBrc20 } from '@/queries/orders-api'
import { Network } from '@/stores/network'
import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef } from 'vue'

export const getOneBrc20Query = (
  filters: {
    address: string
    network: Network
    tick: ComputedRef<string>
  },
  enabled: ComputedRef<boolean>
) =>
  queryOptions({
    queryKey: ['myOneBrc20', filters],
    queryFn: () =>
      getOneBrc20({
        address: filters.address,
        tick: filters.tick.value,
      }),

    enabled,
  })
