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
      ...asset,
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
  <div class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-left text-2xl font-semibold text-zinc-100">
        Leaderboard
      </h1>

      <router-link
        to="/events"
        class="text-zinc-300 underline hover:text-primary"
      >
        Events & Rewards
      </router-link>
    </div>

    <section
      class="mb-8 rounded-lg border border-primary/20 bg-zinc-900 p-6 shadow-md shadow-primary/30"
    >
      <div class="flex items-center gap-8">
        <span class="text-lg text-zinc-300">Tick</span>

        <div class="flex items-center gap-4">
          <AssetSelect
            :asset-symbol="tick"
            :use-assets="activityAssetsInfo as any"
            @update:asset-symbol="tick = $event"
          />

          <Loader2Icon
            class="size-6 animate-spin-slow text-zinc-300"
            v-if="isFetchingStats || isFetchingLeaderboard"
          />
        </div>
      </div>

      <!-- a border -->
      <div class="col-span-3 mb-4 border-b border-primary/20 pt-4"></div>

      <div class="space-y-4" v-if="stats">
        <div class="grid grid-cols-6">
          <div class="text-sm text-zinc-300">Event Duration</div>
          <div class="col-span-5" v-if="stats.eventStartTime">
            {{ prettyTimestamp(stats.eventStartTime) }} -
            {{ prettyTimestamp(stats.eventEndTime) }}
          </div>
          <div class="col-span-5" v-else>-</div>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="text-sm text-zinc-300">Trading Volume</div>
          <div class="col-span-1 flex items-center gap-4">
            <span class="text-primary">{{
              prettyBtcDisplay(stats.totalAmount)
            }}</span>
          </div>
          <div class="text-sm text-zinc-300">Current Reward Pool</div>
          <div class="col-span-1 text-primary">
            {{ stats.tickCurrentLevelRewardAmount + ' $RDEX' }}
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="text-sm text-zinc-300">Progress Goal</div>

          <div class="col-span-1 flex items-center gap-4">
            <div class="">
              <!-- progress bar -->
              <div
                class="relative h-2 w-48 overflow-hidden rounded-full bg-zinc-700"
              >
                <div
                  class="absolute left-0 top-0 h-full rounded-full bg-green-500"
                  :style="{ width: currentLevelProgress + '%' }"
                ></div>
              </div>

              <div class="mt-1 text-xs text-zinc-300">
                {{ prettyBtcDisplay(stats.totalAmount) }} /
                {{ prettyBtcDisplay(stats.tickNextLevelLimitAmount, true) }}
              </div>
            </div>
          </div>

          <div class="text-sm text-zinc-300">Reward Pool for Next Goal</div>
          <div class="col-span-1 text-primary">
            {{ stats.tickNextLevelRewardAmount + ' $RDEX' }}
          </div>
        </div>
      </div>

      <!-- divider -->
      <div class="col-span-3 mb-8 border-b border-primary/20 pt-8"></div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-8" v-if="stats">
        <div>
          <h3 class="mb-2 text-lg font-semibold text-zinc-100">Total Orders</h3>
          <p class="text-zinc-100">
            {{ stats.orderCount }}
          </p>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold text-zinc-100">Total Amount</h3>
          <p class="text-zinc-100">
            {{ prettyBtcDisplay(stats.totalAmount) }}
          </p>
        </div>

        <div class="">
          <h3 class="mb-2 text-lg font-semibold text-zinc-100">My Orders</h3>
          <p class="text-zinc-100">
            {{ stats.addressOrderCount }}
          </p>
        </div>

        <div class="">
          <h3 class="mb-2 text-lg font-semibold text-zinc-100">My Amount</h3>
          <p class="text-zinc-100">
            {{ prettyBtcDisplay(stats.addressTotalAmount) }}
          </p>
        </div>
      </div>
    </section>

    <div class="mt-16 flex justify-center">
      <div class="relative w-full overflow-auto">
        <table
          class="w-full caption-bottom text-sm text-zinc-100"
          v-if="leaderboard && leaderboard.total > 0"
        >
          <thead class="[&amp;_tr]:border-b border-zinc-500">
            <tr
              class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-zinc-500 transition-colors"
            >
              <th
                class="text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 h-12 px-4 text-center align-middle font-medium"
              >
                Rank
              </th>
              <th
                class="text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 h-12 px-4 text-center align-middle font-medium"
              >
                Address
              </th>
              <th
                class="text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 h-12 px-4 text-center align-middle font-medium"
              >
                Total Amount
              </th>
            </tr>
          </thead>

          <tbody class="border-0">
            <tr
              class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-zinc-500 transition-colors"
              v-for="(row, index) in leaderboard.results"
            >
              <td class="text-center">
                <TrophyIcon
                  :class="['mx-auto size-6', trophyColor(index)]"
                  v-if="index <= 2"
                />

                <span class="text-zinc-100" v-else>{{ index + 1 }}</span>
              </td>
              <td
                :class="['p-4 text-center align-middle', , trophyColor(index)]"
              >
                {{ row.address }}
              </td>
              <td
                :class="['p-4 text-center align-middle', , trophyColor(index)]"
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
