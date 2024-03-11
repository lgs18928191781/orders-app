<script lang="ts" setup>
import { useRoute } from 'vue-router'

import { useEmptyPoolSignal } from '@/hooks/use-empty-pool-signal'
import { useSwapPool } from '@/hooks/use-swap-pool'

const { isEmpty } = useEmptyPoolSignal()
const { pairStr } = useSwapPool()

const route = useRoute()
function isLinkActive(keyword: string) {
  return route.name && route.name.toString().includes(keyword)
}
</script>

<template>
  <SwapLayout>
    <div
      class="h-full rounded-3xl border border-primary/30 bg-zinc-900 p-2 pt-3 shadow-md"
    >
      <SwapMainPanelHeader />

      <!-- pair control -->
      <div class="mt-4 flex items-center justify-between">
        <!-- sub nav -->
        <div class="flex items-center gap-1 text-sm">
          <router-link
            class="rounded-md px-4 py-1 text-sm font-medium transition-all hover:bg-black hover:text-primary"
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
            class="rounded-md px-4 py-1 text-sm font-medium transition-all hover:bg-black hover:text-primary"
            :class="
              isLinkActive('swap-pools-remove')
                ? 'text-primary underline underline-offset-4 hover:underline-offset-2'
                : 'text-zinc-300'
            "
            :to="`/swap-pools/${pairStr}/remove`"
            v-if="!isEmpty"
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
