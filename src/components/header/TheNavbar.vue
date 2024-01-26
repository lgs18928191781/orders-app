<script lang="ts" setup>
import { useRoute } from 'vue-router'

import NavbarMenu from './NavbarMenu.vue'

const route = useRoute()

const links: {
  name: string
  path: string
  version?: number
  new?: boolean
  disabled?: boolean
}[] = [
  {
    name: 'Orderbook',
    path: '/',
    version: 2,
  },
  // {
  //   name: 'Pool',
  //   path: '/pool',
  //   // new: true,
  // },
  {
    name: 'Swap',
    path: '/swap',
    version: 0,
  },
  {
    name: 'Events',
    path: '/events',
  },
  {
    name: 'Leaderboard',
    path: '/leaderboard',
  },
  // {
  //   name: 'Whitelist',
  //   path: '/whitelist',
  //   disabled: true,
  // },
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
      return route.path.startsWith('/events')
    case '/leaderboard':
      return route.path.startsWith('/leaderboard')
    case '/swap':
      return route.path.startsWith('/swap') || route.path.startsWith('/add')

    default:
      return false
  }
}
</script>

<template>
  <div class="flex items-center">
    <NavbarMenu />

    <nav class="hidden ml-6 lg:flex items-center gap-x-2">
      <component
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-all',
          isLinkActive(link.path)
            ? 'text-primary underline underline-offset-4 hover:underline-offset-2'
            : 'text-zinc-300',
          link.disabled
            ? 'text-zinc-500 cursor-default'
            : 'hover:bg-black hover:text-primary',
        ]"
        v-for="link in links"
        :key="link.name"
        :is="link.disabled ? 'span' : 'router-link'"
        :to="link.path"
        :title="link.disabled ? 'Coming soon' : ''"
      >
        {{ link.name }}
        <span
          class="inline-flex items-center rounded-md bg-red-400/30 px-1.5 py-0.5 text-xs font-medium text-red-400 -translate-y-2 -translate-x-1 absolute"
          v-if="link.new"
        >
          New
        </span>
        <span
          class="inline-flex items-center rounded-md bg-red-400/30 px-1.5 py-0.5 text-xs font-medium text-red-400 -translate-y-2 -translate-x-1 absolute"
          v-if="typeof link.version !== 'undefined'"
        >
          {{ 'V' + link.version }}
        </span>
      </component>
    </nav>
  </div>
</template>
