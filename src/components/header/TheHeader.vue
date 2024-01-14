<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { prettyAddress, prettyOneSideAddress } from '@/lib/formatters'
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
import { MenuIcon } from 'lucide-vue-next'

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

  <header
    class="flex items-center justify-between px-4 lg:px-6 py-2 lg:py-4 select-none bg-zinc-900 border-b-2 border-zinc-800"
  >
    <TheNavbar />

    <div class="flex gap-2">
      <button
        class="h-10 rounded-lg border-2 border-primary px-4 transition hover:text-orange-950 hover:bg-primary"
        @click="openConnectionModal"
        v-if="!connectionStore.connected"
      >
        Connect Wallet
      </button>

      <template v-else>
        <div class="items-center gap-2 hidden lg:flex">
          <div
            class="flex h-10 items-center divide-x divide-zinc-700 rounded-lg bg-black/90 pl-2 pr-1"
          >
            <div
              class="flex gap-2 pr-3 cursor-pointer"
              @click="copyAddress"
              title="copy address"
            >
              <img
                class="h-5"
                :src="walletIcon"
                alt="Unisat"
                v-if="walletIcon"
              />
              <span class="text-sm text-primary">
                {{ address ? prettyAddress(address, 4) : '-' }}
              </span>
            </div>

            <AssetsDisplay />

            <NetworkState />
          </div>

          <Notifications />
        </div>

        <button class="lg:hidden">
          <MenuIcon class="h-6 w-6" />
        </button>
      </template>
    </div>
  </header>
</template>
