<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const links: {
  name: string
  path: string
  version?: number
  new?: boolean
  testing?: boolean
  disabled?: boolean
}[] = [
  {
    name: 'Orderbook',
    path: '/',
    version: 2,
  },
  {
    name: 'Swap',
    path: '/swap/',
    version: 0,
  },
]

function isLinkActive(path: string) {
  switch (path) {
    case '/':
      return route.path === '/' || route.path.startsWith('/orders')
    case '/whitelist':
      return route.path.startsWith('/whitelist')
    case '/pool':
      return route.path.startsWith('/pool')
    case '/events':
      return (
        route.path.startsWith('/events') ||
        route.path.startsWith('/leaderboard')
      )
    case '/swap/':
      return route.path.startsWith('/swap') || route.path.startsWith('/add')

    default:
      return false
  }
}
</script>

<template>
  <div class="flex">
    <RouterLink
      v-for="link in links"
      :key="link.name"
      :to="link.path"
      :class="[
        'flex items-center justify-between gap-2 rounded px-3 py-1 text-sm',
        isLinkActive(link.path) ? 'bg-black text-primary' : 'text-zinc-300',
      ]"
    >
      <span>
        {{ link.name }}
      </span>
    </RouterLink>
  </div>
</template>
