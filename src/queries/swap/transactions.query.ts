import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

import { swapApiFetch } from '@/lib/fetch'
import { Network } from '@/stores/network'
import { sleep } from '@/lib/helpers'

export const getTransactions = async ({
  token1,
  token2,
  address,
  network,
  selectedTransactionType,
  onlyMyTransactions,
}: {
  token1: string
  token2: string
  address: string
  network: Network
  selectedTransactionType: string
  onlyMyTransactions: boolean
}): Promise<
  {
    id: string
    type: '1x' | 'x2' | '2x' | 'x1' | 'add' | 'remove'
    status: 'failed' | 'completed'
    address: string
    txid?: string
    failedReason?: string
    token1: string
    token2: string
    amount1: string
    amount2: string
    feeRate: number
    inflatedFeeRate: number
    minerFee: number
    inscriptionFee: number
    equity: string
    createdAt: number
    updatedAt: number
  }[]
> => {
  const params = new URLSearchParams({
    net: network,
  })
  if (selectedTransactionType !== 'all') {
    params.append('type', selectedTransactionType)
  }
  if (onlyMyTransactions) {
    params.append('address', address)
  }
  const res = await swapApiFetch(
    `pools/${token1}-${token2}/transactions?${params}`
  )

  return res
}

export const getTransactionsQuery = (
  filters: {
    address: string
    token1: ComputedRef<string>
    token2: ComputedRef<string>
    network: Network
    selectedTransactionType: ComputedRef<string>
    onlyMyTransactions: ComputedRef<boolean>
  },
  enabled: ComputedRef<boolean> = computed(() => true)
) =>
  queryOptions({
    queryKey: ['swapPoolTransactions', filters],
    queryFn: () =>
      getTransactions({
        address: filters.address,
        token1: filters.token1.value,
        token2: filters.token2.value,
        network: filters.network,
        selectedTransactionType: filters.selectedTransactionType.value,
        onlyMyTransactions: filters.onlyMyTransactions.value,
      }),

    enabled,
    refetchInterval: 30000,
  })
