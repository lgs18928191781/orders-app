<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import { TrophyIcon, Loader2Icon } from 'lucide-vue-next'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'

import {
  getActivityAssetTicks,
  getOneLeaderboard,
  getOneLeaderboardStats,
} from '@/queries/leaderboard'
import { useConnectionStore } from '@/stores/connection'
import assets from '@/data/assets'
import { prettyBtcDisplay, prettyTimestamp } from '@/lib/formatters'

import AssetSelect from '@/components/AssetSelect.vue'

const connectionStore = useConnectionStore()

const { data: activityAssets } = useQuery({
  queryKey: ['activityAssets'],
  queryFn: () => getActivityAssetTicks(),
  staleTime: 1000 * 60 * 60,
})
const activityAssetsInfo = computed(() => {
  if (!activityAssets.value) return []

  return activityAssets.value.map((tick) => {
    const asset = assets.find((asset) => asset.symbol === tick.tick)

    return {
      ...tick,
      info: asset,
    }
  })
})
const tick = useStorage('tick', 'btcs')
const selectedInfo = computed(() => {
  if (!tick.value) return null

  return activityAssetsInfo.value.find((a) => a.tick === tick.value)
})

const { data: stats, isFetching: isFetchingStats } = useQuery({
  queryKey: ['leaderboardStats', { tick, address: connectionStore.getAddress }],
  queryFn: () => getOneLeaderboardStats({ tick: tick.value.toLowerCase() }),
  enabled: computed(() => !!tick.value),
  staleTime: 1000 * 10,
})

const { data: leaderboard, isFetching: isFetchingLeaderboard } = useQuery({
  queryKey: ['leaderboard', { tick, address: connectionStore.getAddress }],
  queryFn: () => getOneLeaderboard({ tick: tick.value.toLowerCase() }),
  enabled: computed(() => !!tick.value),
  staleTime: 1000 * 10,
})

const trophyColor = (index: number) => {
  switch (index) {
    case 0:
      return 'text-yellow-400'
    case 1:
      return 'text-zinc-400'
    case 2:
      return 'text-yellow-600'

    default:
      return 'text-zinc-100'
  }
}

const currentLevelProgress = computed(() => {
  if (!stats.value) return 0

  const progress =
    ((stats.value.totalAmount - stats.value.tickCurrentLevelLimitAmount) /
      (stats.value.tickNextLevelLimitAmount -
        stats.value.tickCurrentLevelLimitAmount)) *
    100

  return progress
})
</script>

<template>
  <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-zinc-900">
    <h1 class="text-2xl font-semibold text-center mb-6 text-zinc-100">
      Leaderboard
    </h1>

    <section
      class="mb-8 p-6 rounded-lg bg-zinc-900 shadow-md shadow-primary/30 border border-primary/20"
    >
      <div class="flex gap-8 items-center">
        <span class="text-lg text-zinc-300">Tick</span>

        <div class="flex gap-4 items-center">
          <AssetSelect
            :asset-symbol="tick"
            :use-assets="activityAssetsInfo"
            @update:asset-symbol="tick = $event"
          />

          <Loader2Icon
            class="w-6 h-6 text-zinc-300 animate-spin-slow"
            v-if="isFetchingStats || isFetchingLeaderboard"
          />
        </div>
      </div>

      <!-- a border -->
      <div class="col-span-3 border-b border-primary/20 pt-4 mb-4"></div>

      <div class="space-y-4" v-if="stats">
        <div class="grid grid-cols-6">
          <div class="text-zinc-300 text-sm">Activity at</div>
          <div class="col-span-5" v-if="stats.eventStartTime">
            {{ prettyTimestamp(stats.eventStartTime) }} -
            {{ prettyTimestamp(stats.eventEndTime) }}
          </div>
          <div class="col-span-5" v-else>-</div>
        </div>

        <div class="grid grid-cols-6 gap-4">
          <div class="text-zinc-300 text-sm">Current Lv.</div>
          <div class="col-span-2 flex gap-4 items-center">
            <span class="text-primary">{{ stats.tickCurrentLevel }}</span>

            <div class="">
              <!-- progress bar -->
              <div
                class="relative h-2 bg-zinc-700 rounded-full overflow-hidden w-48"
              >
                <div
                  class="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                  :style="{ width: currentLevelProgress + '%' }"
                ></div>
              </div>

              <div class="mt-1 text-xs text-zinc-300">
                {{ prettyBtcDisplay(stats.totalAmount) }} /
                {{ prettyBtcDisplay(stats.tickNextLevelLimitAmount, true) }}
              </div>
            </div>
          </div>
          <div class="text-zinc-300 text-sm">Current Lv. Reward</div>
          <div class="col-span-2 text-orange-300">
            {{ stats.tickCurrentLevelRewardAmount + ' $RDEX' }}
          </div>
        </div>

        <div class="grid grid-cols-6 gap-4">
          <div class="text-zinc-300 text-sm">Next Lv.</div>
          <div class="col-span-2 text-orange-300">
            {{ stats.tickNextLevel }}
          </div>
          <div class="text-zinc-300 text-sm">Next Lv. Reward</div>
          <div class="col-span-2 text-orange-300">
            {{ stats.tickNextLevelRewardAmount + ' $RDEX' }}
          </div>
        </div>
      </div>

      <!-- divider -->
      <div class="col-span-3 border-b border-primary/20 pt-8 mb-8"></div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-8" v-if="stats">
        <div>
          <h3 class="text-lg font-semibold mb-2 text-zinc-100">Total Orders</h3>
          <p class="text-zinc-100">
            {{ stats.orderCount }}
          </p>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2 text-zinc-100">Total Amount</h3>
          <p class="text-zinc-100">
            {{ prettyBtcDisplay(stats.totalAmount) }}
          </p>
        </div>

        <div class="">
          <h3 class="text-lg font-semibold mb-2 text-zinc-100">My Orders</h3>
          <p class="text-zinc-100">
            {{ stats.addressOrderCount }}
          </p>
        </div>

        <div class="">
          <h3 class="text-lg font-semibold mb-2 text-zinc-100">My Amount</h3>
          <p class="text-zinc-100">
            {{ prettyBtcDisplay(stats.addressTotalAmount) }}
          </p>
        </div>
      </div>
    </section>

    <div class="flex justify-center mt-16">
      <div class="relative w-full overflow-auto">
        <table
          class="caption-bottom text-sm w-full text-zinc-100"
          v-if="leaderboard && leaderboard.total > 0"
        >
          <thead class="[&amp;_tr]:border-b border-zinc-500">
            <tr
              class="border-b border-zinc-500 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <th
                class="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 text-center"
              >
                Rank
              </th>
              <th
                class="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 text-center"
              >
                Address
              </th>
              <th
                class="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 text-center"
              >
                Total Amount
              </th>
            </tr>
          </thead>

          <tbody class="border-0">
            <tr
              class="border-b border-zinc-500 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              v-for="(row, index) in leaderboard.results"
            >
              <td class="text-center">
                <TrophyIcon
                  :class="['w-6 h-6 mx-auto', trophyColor(index)]"
                  v-if="index <= 2"
                />

                <span class="text-zinc-100" v-else>{{ index + 1 }}</span>
              </td>
              <td
                :class="['p-4 align-middle text-center', , trophyColor(index)]"
              >
                {{ row.address }}
              </td>
              <td
                :class="['p-4 align-middle text-center', , trophyColor(index)]"
              >
                {{ prettyBtcDisplay(row.totalValue) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
