import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

import { rewardFetch } from '@/queries/events'
import { useNetworkStore } from '@/stores/network'

export type SwapYieldBrc20History = {
  dailyCount: number
  endBlock: number
  lpBlock: number
  net: 'testnet' | 'livenet'
  realReward: number
  recordId: string
  startBlock: number
  tick: string
  timestamp: number
  userAddress: string
}
export const getSwapYieldBrc20History = async ({
  address,
}: {
  address: string
}): Promise<SwapYieldBrc20History[]> => {
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
    rewardType: '51',
  })

  const history = await rewardFetch(`user/records?${params}`)
    .then((res) => {
      // if is empty object, return empty array
      if (Object.keys(res).length === 0) return []

      return res.list
    })
    .then((res) => {
      // filter records that is 0
      return res.filter((item: any) => item.realReward > 0)
    })

  return history
}

export const getSwapYieldBrc20HistoryQuery = (
  filters: {
    address: string
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) =>
  queryOptions({
    queryKey: ['swapYieldBrc20History', filters],
    queryFn: () => getSwapYieldBrc20History(filters),
    enabled,
  })

export type SwapYieldTradeFeeHistory = {
  bigBlock: number
  dailyBlock: number
  endBlock: number
  net: string
  proportion: number
  proportionFee: number
  recordId: string
  startBlock: number
  tick: string
  timestamp: number
  userAddress: string
  uuid: string
  version: number
}
export const getSwapYieldTradeFeeHistory = async ({
  address,
}: {
  address: string
}): Promise<SwapYieldTradeFeeHistory[]> => {
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
  })

  const history = await rewardFetch(`user/sharingfee/records?${params}`)
    .then((res) => {
      // if is empty object, return empty array
      if (Object.keys(res).length === 0) return []

      return res.list
    })
    .then((res) => {
      // filter records that is 0
      return res.filter((item: any) => item.proportionFee > 0)
    })

  return history
}

export const getSwapYieldTradeFeeHistoryQuery = (
  filters: {
    address: string
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) =>
  queryOptions({
    queryKey: ['swapYieldTradeFeeHistory', filters],
    queryFn: () => getSwapYieldTradeFeeHistory(filters),
    enabled,
  })
