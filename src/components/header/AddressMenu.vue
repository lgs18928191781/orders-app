<script lang="ts" setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import {
  MenuIcon,
  CopyIcon,
  ArrowRightLeftIcon,
  Trash2Icon,
  UnplugIcon,
} from 'lucide-vue-next'

import { useNetworkStore } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'

import { prettyAddress } from '@/lib/formatters'

import unisatIcon from '@/assets/unisat-icon.png?url'
import okxIcon from '@/assets/okx-icon.png?url'
import metaletIcon from '@/assets/metalet-icon.png?url'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const credentialStore = useCredentialsStore()

// connect / address related
const { data: address } = useQuery({
  queryKey: ['address', { network: networkStore.network }],
  queryFn: async () =>
    connectionStore.sync().then((connection) => connection?.address),
  retry: 0,
  enabled: computed(() => connectionStore.connected),
})

const walletIcon = computed(() => {
  const connection = connectionStore.last

  if (!connection) return null

  switch (connection.wallet) {
    case 'unisat':
      return unisatIcon
    case 'okx':
      return okxIcon
    case 'metalet':
      return metaletIcon
    default:
      return
  }
})

function copyAddress() {
  // copy address value to clipboard
  const address = connectionStore.getAddress
  if (!address) return
  navigator.clipboard.writeText(address)
  ElMessage.success('Address copied to clipboard')
}

function clearCache() {
  // clear the credential cache of this wallet address
  const address = useConnectionStore().getAddress
  if (!address) return

  credentialStore.remove(address)

  ElMessage.success('Account cache cleared. Refreshing...')

  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

function onDisconnect() {
  // remove from address store
  connectionStore.disconnect()

  // reload
  window.location.reload()
}

async function switchNetwork() {
  if (connectionStore.last.wallet !== 'unisat') {
    ElMessage({
      message: 'Only Unisat wallet supports switching network.',
      type: 'error',
    })
    return
  }

  const toNetwork = networkStore.network === 'testnet' ? 'livenet' : 'testnet'
  await window.unisat.switchNetwork(toNetwork)
}
</script>

<template>
  <Menu as="div" class="relative inline-block">
    <MenuButton class="flex gap-2 pr-3 group">
      <img class="h-5" :src="walletIcon" alt="wallet icon" v-if="walletIcon" />
      <span class="text-sm text-primary">
        {{ address ? prettyAddress(address, 4) : '-' }}
      </span>

      <MenuIcon
        class="h-5 text-zinc-300 group-hover:text-primary group-hover:scale-125"
      />
    </MenuButton>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        class="absolute right-0 z-50 mt-4 flex w-screen max-w-min origin-top-right"
      >
        <div
          class="w-56 shrink rounded-xl bg-zinc-800 text-sm font-semibold leading-6 text-zinc-300 shadow-lg ring-1 ring-zinc-900/5 overflow-hidden divide-y divide-zinc-700 shadow-primary/20"
        >
          <MenuItem v-slot="{ active }">
            <button
              class="p-4 flex gap-2 items-center hover:text-primary w-full text-left group"
              @click="copyAddress"
            >
              <CopyIcon class="h-4 w-4 inline-block group-hover:scale-125" />
              <span>Copy Address</span>
            </button>
          </MenuItem>

          <MenuItem v-slot="{ active }" as="div">
            <div class="px-4 pt-4 -mb-2 text-sm text-zinc-500">
              Network: {{ networkStore.network }}
            </div>
            <button
              class="p-4 flex gap-2 items-center hover:text-primary w-full text-left group"
              @click="switchNetwork"
            >
              <ArrowRightLeftIcon
                class="h-4 w-4 inline-block group-hover:scale-125"
              />
              <span>Switch Network</span>
            </button>
          </MenuItem>

          <MenuItem>
            <button
              class="p-4 flex gap-2 items-center hover:text-primary w-full text-left group"
              @click="clearCache"
            >
              <Trash2Icon class="h-4 w-4 inline-block group-hover:scale-125" />
              <span>Clear Account Cache</span>
            </button>
          </MenuItem>

          <MenuItem v-if="connectionStore.has">
            <button
              class="p-4 flex gap-2 items-center hover:text-primary w-full text-left group"
              @click="onDisconnect"
            >
              <UnplugIcon class="h-4 w-4 inline-block group-hover:scale-125" />
              <span>Disconnect</span>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<style scoped></style>
