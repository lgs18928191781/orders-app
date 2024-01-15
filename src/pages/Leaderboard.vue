<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
import { TrophyIcon, Loader2Icon } from 'lucide-vue-next'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'

import {
  getOneLeaderboard,
  getOneLeaderboardStats,
} from '@/queries/leaderboard'
import { useConnectionStore } from '@/stores/connection'

import AssetSelect from '@/components/AssetSelect.vue'

const connectionStore = useConnectionStore()

const tick = useStorage('tick', 'rdex')

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
      return 'text-zinc-400'
  }
}
</script>

<template>
  <div class="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-zinc-900">
    <h1 class="text-2xl font-semibold text-center mb-6 text-zinc-100">
      Leaderboard
    </h1>

    <section
      class="mb-8 p-6 rounded-lg bg-zinc-900 shadow-md shadow-orange-300/30 border border-orange-300/20"
    >
      <div class="flex gap-8 items-center">
        <span class="text-lg text-zinc-300">Tick</span>

        <div class="flex gap-4 items-center">
          <AssetSelect
            :asset-symbol="tick"
            @update:asset-symbol="tick = $event"
          />

          <Loader2Icon
            class="w-6 h-6 text-zinc-300 animate-spin-slow"
            v-if="isFetchingStats || isFetchingLeaderboard"
          />
        </div>
      </div>

      <!-- a border -->
      <div class="col-span-3 border-b border-orange-300/20 pt-4 mb-4"></div>

      <div class="grid grid-cols-2 gap-8" v-if="stats">
        <div>
          <h3 class="text-lg font-semibold mb-2 text-zinc-100">Total Orders</h3>
          <p class="text-zinc-100">
            {{ stats.orderCount }}
          </p>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2 text-zinc-100">Total Amount</h3>
          <p class="text-zinc-100">
            {{ stats.totalAmount }}
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
            {{ stats.addressTotalAmount }}
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
              <td class="p-4 align-middle text-center">
                {{ row.address }}
              </td>
              <td
                class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center"
              >
                {{ row.totalValue }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
