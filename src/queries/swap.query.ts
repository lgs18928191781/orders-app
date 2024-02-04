import { getPoolStatus, previewRemove } from '@/queries/swap'
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
    refetchInterval: 30000,
  })

export const getPreviewRemoveQuery = (
  filters: {
    address: string
    token1: ComputedRef<string>
    token2: ComputedRef<string>
    removeEquity: ComputedRef<string>
    network: Network
  },
  enabled: ComputedRef<boolean> = computed(() => true)
) =>
  queryOptions({
    queryKey: ['previewRemove', filters],
    queryFn: () =>
      previewRemove({
        address: filters.address,
        token1: filters.token1.value,
        token2: filters.token2.value,
        removeEquity: filters.removeEquity.value,
      }),

    enabled,
  })
