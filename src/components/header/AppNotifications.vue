<script lang="ts" setup>
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { getNotifications, clearNotifications } from '@/queries/orders-api'
import { BellRingIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const networkStore = useNetworkStore()
const address = computed(() => useConnectionStore().getAddress)
const enabled = computed(() => !!useConnectionStore().connected)

const { data: notifications } = useQuery({
  queryKey: [
    'notifications',
    { network: networkStore.network, address: address.value },
  ],
  queryFn: async () => getNotifications(address.value!),
  enabled,
})

const router = useRouter()
function onNotificationClick(notification: any) {
  // clear this type of notifications
  mutate({
    address: address.value!,
    notificationType: notification.notificationType,
  })

  // if it's liquidity used up notification, redirect to pool page
  if (notification.notificationType === 1) {
    router.push('/pool?action=release')
  }
}

const queryClient = useQueryClient()
const { mutate } = useMutation({
  mutationFn: clearNotifications,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  },
})
function onClearNotifications() {
  mutate({
    address: address.value!,
  })
}
</script>

<template>
  <div class="text-sm text-zinc-300">
    <div class="group flex items-center gap-1">
      <Menu as="div" class="relative inline-block text-left">
        <div>
          <MenuButton
            class="group relative -mr-2 h-10 cursor-pointer items-center rounded-lg px-2 text-sm text-zinc-300 transition-all duration-200 hover:text-primary lg:mr-0 lg:bg-black/90 lg:px-4"
          >
            <div class="flex h-full w-full items-center">
              <BellRingIcon class="h-5 group-hover:animate-wiggle-once" />
            </div>

            <!-- badge showing notifications count -->
            <span
              class="absolute right-0 top-0 -translate-y-1 translate-x-1 items-center rounded-md bg-red-400/40 px-1.5 text-sm font-medium text-red-400"
              v-if="notifications && notifications.length"
            >
              {{ notifications.length }}
            </span>
          </MenuButton>
        </div>

        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
            class="absolute right-0 z-10 mt-4 w-96 origin-top-right divide-y divide-zinc-700 overflow-hidden rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <MenuItem
              v-slot="{ active }"
              v-if="notifications && notifications.length"
              v-for="notification in notifications"
              :key="notification.notificationType"
            >
              <div
                :class="[
                  'block cursor-pointer px-6 py-4 transition-all',
                  active && 'bg-zinc-950',
                ]"
                @click="onNotificationClick(notification)"
              >
                <div class="flex items-center gap-2">
                  <span class="text-zinc-300">
                    {{ notification.notificationTitle }}
                  </span>

                  <span
                    class="rounded bg-orange-500/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {{ notification.notificationCount }}
                  </span>
                </div>

                <div class="mt-2 space-y-1 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-500">
                      {{ notification.notificationDesc }}
                    </span>
                  </div>
                </div>
              </div>
            </MenuItem>

            <!-- mark as all read button -->
            <MenuItem
              v-slot="{ active }"
              v-if="notifications && notifications.length"
            >
              <div
                :class="[
                  'block cursor-pointer px-6 py-4 text-zinc-500 hover:text-zinc-300',
                  active && 'bg-zinc-950',
                ]"
                @click="onClearNotifications"
              >
                <div class="flex items-center gap-2">
                  <span class="">Mark all as read</span>
                </div>
              </div>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </div>
  </div>
</template>
