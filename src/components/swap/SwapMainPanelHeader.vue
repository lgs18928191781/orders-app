<script setup lang="ts">
import { useRouteParams } from '@vueuse/router'
import { type Ref, computed } from 'vue'

import { useEmptyPoolSignal } from '@/hooks/use-empty-pool-signal'
import { useRoute, useRouter } from 'vue-router'
import { swapTokens } from '@/data/pinned-tokens'

const { isEmpty } = useEmptyPoolSignal()

const route = useRoute()
const router = useRouter()
const pairStr = useRouteParams('pair') as Ref<string>
const swapLink = computed(() =>
  pairStr.value ? `/swap/${pairStr.value}` : '/swap',
)
const swapPoolLink = computed(() =>
  pairStr.value ? `/swap-pools/${pairStr.value}` : '/swap-pools',
)

function isActive(keyword: string) {
  return route.fullPath.startsWith(keyword)
}

function onSelectToken(token: string) {
  if (['swap-pools-add', 'swap-pools-remove'].includes(route.name as string)) {
    router.push(`/swap-pools/btc-${token}`)
  } else {
    router.push(`/swap/btc-${token}`)
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between border-b border-zinc-800 px-3 pb-2"
  >
    <div class="flex gap-4">
      <router-link
        :to="swapLink"
        :class="[
          'flex items-center space-x-1 ',
          isActive('/swap/')
            ? 'text-zinc-200'
            : 'text-zinc-400 hover:text-zinc-600',
        ]"
        v-if="!isEmpty"
      >
        Swap
      </router-link>

      <router-link
        :to="swapPoolLink"
        :class="[
          'flex items-center space-x-1 ',
          isActive('/swap-pools/')
            ? 'text-zinc-200'
            : 'text-zinc-400 hover:text-zinc-600',
        ]"
      >
        Pools
      </router-link>
    </div>

    <ModalTokenSelect
      :pinned-tokens="swapTokens"
      @select-token="onSelectToken"
      class="ml-auto"
    />
  </div>
</template>
