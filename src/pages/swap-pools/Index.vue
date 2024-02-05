<script lang="ts" setup>
import { useRoute } from 'vue-router'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'

import SwapPairSelect from '@/components/swap/pools/SwapPairSelect.vue'
import SwapLayout from '@/components/swap/SwapLayout.vue'

const { pairStr } = useSwapPoolPair()

const route = useRoute()
function isLinkActive(keyword: string) {
  return route.name && route.name.toString().includes(keyword)
}
</script>

<template>
  <SwapLayout>
    <div
      class="border border-primary/30 rounded-3xl shadow-md p-2 pt-3 bg-zinc-900 z-10"
    >
      <!-- header -->
      <div class="px-3 flex gap-4 border-b border-zinc-800 pb-2">
        <router-link
          to="/swap"
          class="flex items-center space-x-1 text-zinc-400 hover:text-zinc-600"
        >
          Swap
        </router-link>

        <router-link
          to="/swap-pools"
          class="flex items-center space-x-1 text-zinc-200"
        >
          Pools
        </router-link>

        <SwapPairSelect class="ml-auto" />
      </div>

      <!-- pair control -->
      <div class="flex justify-between items-center mt-4">
        <!-- sub nav -->
        <div class="flex items-center gap-1 text-sm">
          <router-link
            class="py-1 text-sm font-medium rounded-md transition-all hover:bg-black hover:text-primary px-4"
            :class="
              isLinkActive('swap-pools-add')
                ? 'text-primary underline underline-offset-4 hover:underline-offset-2'
                : 'text-zinc-300'
            "
            :to="`/swap-pools/${pairStr}/add`"
          >
            Add
          </router-link>

          <router-link
            class="py-1 text-sm font-medium rounded-md transition-all hover:bg-black hover:text-primary px-4"
            :class="
              isLinkActive('swap-pools-remove')
                ? 'text-primary underline underline-offset-4 hover:underline-offset-2'
                : 'text-zinc-300'
            "
            :to="`/swap-pools/${pairStr}/remove`"
          >
            Remove
          </router-link>
        </div>
      </div>

      <!-- sub pages -->
      <router-view></router-view>
    </div>
  </SwapLayout>
</template>

<style scoped></style>
