<script setup lang="ts">
import { ChevronRightIcon } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

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
  {
    name: 'Events',
    path: '/events',
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

const emit = defineEmits(['close'])
function toLink(path: string) {
  emit('close')
  router.push(path)
}
</script>

<template>
  <div class="">
    <div class="flex flex-col">
      <button
        v-for="link in links"
        :key="link.name"
        :class="[
          'flex items-center justify-between px-4 py-4 ',
          isLinkActive(link.path) ? 'text-primary' : 'text-zinc-300',
        ]"
        @click="toLink(link.path)"
      >
        <span>
          {{ link.name }}
        </span>
        <ChevronRightIcon class="h-5 w-5" />
      </button>
    </div>

    <div class="mt-8">
      <h3 class="label">Address</h3>
      <AddressMenu class="flex w-full rounded-xl bg-black p-4" />
    </div>
  </div>
</template>

<style scoped>
.label {
  @apply mb-2 text-base text-zinc-500;
}
</style>
