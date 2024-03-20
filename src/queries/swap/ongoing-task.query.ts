import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, Ref, computed } from 'vue'

import { swapApiFetch } from '@/lib/fetch'
import { Network } from '@/stores/network'
import { TaskType } from '@/queries/swap/types'
import { useCredentialsStore } from '@/stores/credentials'

const credentialsStore = useCredentialsStore()

export const getOngoingTask = async ({
  address,
  network,
  buildId,
}: {
  address: string
  network: Network
  buildId: string
}): Promise<{
  buildId: string
  type: TaskType
  status: 'failed' | 'completed' | 'built'
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
}> => {
  const params = new URLSearchParams({
    net: network,
    address,
    build_id: buildId,
  })
  const res = await swapApiFetch(`ongoing-task?${params}`, { auth: true }).then(
    (res) => {
      // mock status: 80% chance of built, 10% chance of failed, 10% chance of completed
      // const dice = Math.random()
      // const status = dice > 0.2 ? 'built' : dice > 0.15 ? 'failed' : 'completed'
      // console.log({ status })
      // res.status = status

      return res
    },
  )

  return res
}

export const getOngoingTaskQuery = (
  filters: {
    address: string
    network: Network
    buildId: Ref<string>
  },
  enabled: ComputedRef<boolean> = computed(() => true),
  refetchInterval: any,
) =>
  queryOptions({
    queryKey: ['swapOngoingTask', filters],
    queryFn: () =>
      getOngoingTask({
        address: filters.address,
        network: filters.network,
        buildId: filters.buildId.value,
      }),

    enabled: computed(() => credentialsStore.ready && enabled.value),
    refetchInterval: refetchInterval || 1000,
  })
