<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { prettyAddress } from '@/lib/formatters'
import { useNetworkStore, type Network } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import whitelist from '@/lib/whitelist'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import WalletMissingModal from './WalletMissingModal.vue'
import AssetsDisplay from './AssetsDisplay.vue'
import NetworkState from './NetworkState.vue'
import Notifications from './Notifications.vue'
import TheNavbar from './TheNavbar.vue'
import unisatIcon from '@/assets/unisat-icon.png?url'
import okxIcon from '@/assets/okx-icon.png?url'
import { isUnsupportedAddress } from '@/lib/helpers'

const networkStore = useNetworkStore()
const queryClient = useQueryClient()
const connectionStore = useConnectionStore()

const { openConnectionModal } = useConnectionModal()

const unisatAccountsChangedHandler = (accounts: string[]) => {
  if (connectionStore.last.wallet !== 'unisat') return
  if (!accounts[0]) {
    // disconnect
    connectionStore.disconnect()
    return
  }

  if (isUnsupportedAddress(accounts[0])) return

  ElMessage.warning({
    message: 'Unisat account changed. Refreshing page...',
    type: 'warning',
    onClose: () => {
      queryClient.invalidateQueries()
      window.location.reload()
    },
  })
}
const okxAccountsChangedHandler = (accounts: string[] | null) => {
  if (connectionStore.last.wallet !== 'okx') return
  if (!accounts) {
    // disconnect
    connectionStore.disconnect()
    return
  }

  console.log({ accounts })

  if (isUnsupportedAddress(accounts[0])) return

  ElMessage.warning({
    message: 'Okx account changed. Refreshing page...',
    type: 'warning',
    onClose: () => {
      queryClient.invalidateQueries()
      window.location.reload()
    },
  })
}

onMounted(async () => {
  if (window.unisat) {
    const unisat = window.unisat
    unisat.on('accountsChanged', unisatAccountsChangedHandler)

    // getNetwork
    // const network: Network = await unisat.getNetwork()
    const network: Network = 'livenet'
    const address = connectionStore.getAddress

    // if not in whitelist, switch to mainnet
    if (network !== 'livenet' && address && !whitelist.includes(address)) {
      const switchRes = await unisat.switchNetwork('livenet').catch(() => false)
      if (!switchRes) {
        ElMessage({
          message: 'Testnet is not available, please switch to livenet.',
          type: 'error',
          onClose: () => {
            // redirect to a blank page
            window.location.href = 'about:blank'
          },
        })
      }

      networkStore.set('livenet')
      return
    }
    networkStore.set(network)
  }

  if (window.okxwallet) {
    window.okxwallet.bitcoin.on('accountsChanged', okxAccountsChangedHandler)
  }
})
onBeforeUnmount(() => {
  // remove event listener
  window.unisat?.removeListener('accountsChanged', unisatAccountsChangedHandler)
  window.okxwallet.bitcoin?.removeListener(
    'accountsChanged',
    okxAccountsChangedHandler
  )
})

// connect / address related
const { data: address } = useQuery({
  queryKey: ['address', { network: networkStore.network }],
  queryFn: async () =>
    connectionStore.sync().then((connection) => connection?.address),
  retry: 0,
  enabled: computed(() => connectionStore.connected),
})

async function switchNetwork() {
  if (!window.unisat) {
    ElMessage.warning('Please install the Unisat wallet extension first.')
    return
  }

  const network = networkStore.network === 'testnet' ? 'livenet' : 'testnet'
  const switchRes = await window.unisat.switchNetwork(network)
  if (switchRes) {
    networkStore.set(network)
  }

  // reload page
  window.location.reload()
}

const walletIcon = computed(() => {
  const connection = connectionStore.last

  if (!connection) return null

  return connection.wallet === 'unisat' ? unisatIcon : okxIcon
})

function copyAddress() {
  // copy address value to clipboard
  const address = connectionStore.getAddress
  if (!address) return
  navigator.clipboard.writeText(address)
  ElMessage.success('Address copied to clipboard')
}
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <header class="flex items-center justify-between px-6 py-4 select-none">
    <TheNavbar />

    <div class="flex gap-2">
      <div class="hidden lg:block">
        <!-- <el-tooltip
          effect="light"
          placement="bottom"
          :content="`Click to switch to ${
            networkStore.network === 'testnet' ? 'livenet' : 'testnet'
          } `"
        >
          <button
            class="h-10 cursor-pointer items-center rounded-lg bg-black/90 px-4 text-sm text-zinc-300 transition hover:text-orange-300"
            @click="switchNetwork"
          >
            {{ networkStore.network }}
          </button>
        </el-tooltip> -->
      </div>

      <button
        class="h-10 rounded-lg border-2 border-orange-300 px-4 transition hover:text-orange-950 hover:bg-orange-300"
        @click="openConnectionModal"
        v-if="!connectionStore.connected"
      >
        Connect Wallet
      </button>

      <div v-else class="flex items-center gap-2">
        <div
          class="flex h-10 items-center divide-x divide-zinc-700 rounded-lg bg-black/90 pl-2 pr-1"
        >
          <div
            class="lg:flex gap-2 pr-3 hidden cursor-pointer"
            @click="copyAddress"
            title="copy address"
          >
            <img class="h-5" :src="walletIcon" alt="Unisat" v-if="walletIcon" />
            <span class="text-sm text-orange-300">
              {{ address ? prettyAddress(address, 4) : '-' }}
            </span>
          </div>

          <AssetsDisplay />

          <NetworkState />
        </div>

        <Notifications />
      </div>
    </div>
  </header>
</template>
