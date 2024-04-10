import { rewardFetch } from '@/queries/events'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { queryOptions } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

export const getEventStats = async ({
  event,
}: {
  event: string
}): Promise<{
  hadClaimRewardAmount: number
  hasReleasePoolOrderCount: number
  net: string
  rewardTick: string
  tick: string
  totalRewardAmount: number
  totalRewardExtraAmount: number
  total: number
}> => {
  const address = useConnectionStore().getAddress
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
    rewardType: event,
  })

  const stats = await rewardFetch(`user/info?${params}`).then((res) => {
    let total =
      res.totalRewardAmount +
      res.totalRewardExtraAmount -
      res.hadClaimRewardAmount
    if (total < 0) total = 0

    return {
      ...res,
      total,
    }
  })

  return stats
}

export const getSwapYieldTradeFeeStats = async (): Promise<{
  hadClaimRewardAmount: number
  net: string
  rewardTick: string
  totalRewardAmount: number
  total: number
}> => {
  const address = useConnectionStore().getAddress
  const network = useNetworkStore().network
  const params = new URLSearchParams({
    address,
    net: network,
  })

  const stats = await rewardFetch(`user/sharingfee/info?${params}`).then(
    (res) => {
      let total = res.totalRewardAmount
      if (total < 0) total = 0

      return {
        ...res,
        total,
      }
    },
  )

  return stats
}

export const getEventStatsQuery = (
  filters: {
    address: string
    event: ComputedRef<string>
  },
  enabled: ComputedRef<boolean> = computed(() => true),
) =>
  queryOptions({
    queryKey: ['eventStats', filters],
    queryFn: () => {
      if (filters.event.value === 'swapYieldTradeFee') {
        return getSwapYieldTradeFeeStats()
      }

      return getEventStats({ event: filters.event.value })
    },
    enabled,
  })
