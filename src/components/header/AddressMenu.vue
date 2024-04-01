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
  FuelIcon,
  ChevronsUpDownIcon,
  ChevronsDownUpIcon,
} from 'lucide-vue-next'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

import { useNetworkStore } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'

import { prettyAddress } from '@/lib/formatters'

import unisatIcon from '@/assets/unisat-icon.png?url'
import okxIcon from '@/assets/okx-icon.png?url'
import metaletIcon from '@/assets/metalet-icon.png?url'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const credentialsStore = useCredentialsStore()

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

  credentialsStore.remove(address)

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
  if (connectionStore.last.wallet === 'okx') {
    ElMessage({
      message: 'OKX wallet does not support switching network.',
      type: 'error',
    })
    return
  }

  const toNetwork = networkStore.isTestnet ? 'livenet' : 'testnet'
  await connectionStore.adapter.switchNetwork(toNetwork)

  // reload
  window.location.reload()
}

async function onGetGasFromFaucet() {
  window.open('https://coinfaucet.eu/en/btc-testnet/', '_blank')
}
</script>

<template>
  <Menu as="div" class="relative inline-block" v-slot="{ open }">
    <MenuButton class="group flex w-full items-center gap-2 lg:pr-3">
      <img class="h-5" :src="walletIcon" alt="wallet icon" v-if="walletIcon" />
      <span class="text-sm text-primary">
        {{ address ? prettyAddress(address, 4) : '-' }}
      </span>
      <span
        class="text-xs font-bold text-red-500"
        v-if="networkStore.isTestnet"
      >
        (Testnet)
      </span>

      <ChevronsDownUpIcon
        class="ml-auto h-5 text-zinc-300 lg:hidden"
        v-if="open"
      />
      <ChevronsUpDownIcon class="ml-auto h-5 text-zinc-300 lg:hidden" v-else />
      <MenuIcon
        class="hidden h-5 text-zinc-300 group-hover:scale-125 group-hover:text-primary lg:inline"
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
        class="absolute right-0 z-50 mt-10 flex w-full origin-top-right lg:mt-4 lg:w-auto"
      >
        <div
          class="w-full shrink divide-y divide-zinc-700 overflow-hidden rounded-xl bg-zinc-950 text-sm font-semibold leading-6 text-zinc-300 shadow-lg shadow-primary/20 ring-1 ring-zinc-900/5 lg:w-56 lg:bg-zinc-800"
        >
          <MenuItem v-slot="{ active }">
            <button
              class="group flex w-full items-center gap-2 p-4 text-left hover:text-primary"
              @click="copyAddress"
            >
              <CopyIcon class="inline-block h-4 w-4 group-hover:scale-125" />
              <span>Copy Address</span>
            </button>
          </MenuItem>

          <MenuItem v-slot="{ active }" as="div">
            <div class="-mb-2 px-4 pt-4 text-sm text-zinc-500">
              Network: {{ networkStore.network }}
            </div>
            <button
              class="group flex w-full items-center gap-2 p-4 text-left hover:text-primary"
              @click="switchNetwork"
            >
              <ArrowRightLeftIcon
                class="inline-block h-4 w-4 group-hover:scale-125"
              />
              <span>Switch Network</span>
            </button>
          </MenuItem>

          <MenuItem v-slot="{ active }" as="div" v-if="networkStore.isTestnet">
            <button
              class="group flex w-full items-center gap-2 p-4 text-left hover:text-primary"
              @click="onGetGasFromFaucet"
            >
              <FuelIcon class="inline-block h-4 w-4 group-hover:scale-125" />
              <span>Testnet Faucet</span>
            </button>
          </MenuItem>

          <MenuItem>
            <button
              class="group flex w-full items-center gap-2 p-4 text-left hover:text-primary"
              @click="clearCache"
            >
              <Trash2Icon class="inline-block h-4 w-4 group-hover:scale-125" />
              <span>Clear Account Cache</span>
            </button>
          </MenuItem>

          <MenuItem v-if="connectionStore.has">
            <button
              class="group flex w-full items-center gap-2 p-4 text-left hover:text-primary"
              @click="onDisconnect"
            >
              <UnplugIcon class="inline-block h-4 w-4 group-hover:scale-125" />
              <span>Disconnect</span>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<style scoped></style>
