<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { MenuIcon, TriangleAlertIcon } from 'lucide-vue-next'

import { useNetworkStore, type Network } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import { isUnsupportedAddress } from '@/lib/helpers'
import MobileAppHeaderMenu from '@/components/overlays/MobileAppHeaderMenu.vue'

const networkStore = useNetworkStore()
const queryClient = useQueryClient()
const connectionStore = useConnectionStore()
const credentialsStore = useCredentialsStore()

const { openConnectionModal } = useConnectionModal()

// login
useQuery({
  queryKey: ['address', { network: networkStore.network }],
  queryFn: async () =>
    credentialsStore
      .login()
      .then((credential) => (credential ? credential.address : null)),
  retry: 0,
  enabled: computed(() => connectionStore.connected),
})

const isNetworkChanging = ref(false)
const unisatAccountsChangedHandler = (accounts: string[]) => {
  if (connectionStore.last.wallet !== 'unisat') return
  if (isNetworkChanging.value) return

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
function handleNetworkChanged(network: Network) {
  isNetworkChanging.value = true

  const appNetwork = networkStore.network
  if (network !== appNetwork) {
    connectionStore.disconnect()
  }

  isNetworkChanging.value = false
}
const unisatNetworkChangedHandler = (network: Network) => {
  if (connectionStore.last.wallet !== 'unisat') return
  handleNetworkChanged(network)
}

const okxAccountsChangedHandler = (accounts: string[] | null) => {
  if (connectionStore.last.wallet !== 'okx') return
  if (!accounts) {
    // disconnect
    connectionStore.disconnect()
    return
  }

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
const metaletAccountsChangedHandler = () => {
  if (useConnectionStore().last.wallet !== 'metalet') return

  // sync here to prevent chronological error
  connectionStore.sync()

  ElMessage.warning({
    message: 'Metalet account changed. Refreshing page...',
    type: 'warning',
    onClose: () => {
      window.location.reload()
    },
  })
}
const metaletNetworkChangedHandler = (network: Network) => {
  if (useConnectionStore().last.wallet !== 'metalet') return
  handleNetworkChanged(network)
}

onMounted(async () => {
  if (window.unisat) {
    const unisat = window.unisat
    unisat.on('accountsChanged', unisatAccountsChangedHandler)
    unisat.on('networkChanged', unisatNetworkChangedHandler)
  }

  if (window.okxwallet) {
    window.okxwallet.bitcoin.on('accountsChanged', okxAccountsChangedHandler)
  }

  if (window.metaidwallet) {
    window.metaidwallet.on('accountsChanged', metaletAccountsChangedHandler)
    window.metaidwallet.on('networkChanged', metaletNetworkChangedHandler)
  }
})
onBeforeUnmount(() => {
  // remove event listener
  window.unisat?.removeListener('accountsChanged', unisatAccountsChangedHandler)
  window.unisat?.removeListener('networkChanged', unisatNetworkChangedHandler)
  window.okxwallet?.removeListener('accountsChanged', okxAccountsChangedHandler)
  window.metaidwallet?.removeListener(
    'accountsChanged',
    metaletAccountsChangedHandler,
  )
  window.metaidwallet.removeListener(
    'networkChanged',
    metaletNetworkChangedHandler,
  )
})
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />
  <NetworkStateModal v-if="connectionStore.connected" />

  <header
    class="select-none border-b border-zinc-800 bg-zinc-900 py-3 lg:mb-3 lg:border-none lg:py-4"
  >
    <div
      class="mx-auto -mt-3 mb-3 flex items-center justify-center gap-2 bg-red-900/50 p-2 text-center text-amber-200 lg:-mt-4 lg:mb-4"
      v-if="networkStore.isTestnet"
    >
      <TriangleAlertIcon class="inline-block h-5 w-5" />
      This is a testnet version of Orders.Exchange. Funds and assets are not
      real.
    </div>
    <div class="mx-auto flex max-w-9xl items-center justify-between gap-4 px-3">
      <AppNavbar />

      <div class="flex grow gap-2 lg:grow-0">
        <button
          class="ml-auto rounded-lg border border-primary border-opacity-50 p-2 text-sm transition hover:bg-primary hover:text-orange-950 lg:ml-0 lg:h-10 lg:border-2 lg:border-opacity-100 lg:px-4 lg:py-0 lg:text-base"
          @click="openConnectionModal"
          v-if="!connectionStore.connected"
        >
          Connect Wallet
        </button>

        <button
          class="ml-auto rounded-lg border border-primary border-opacity-50 p-2 text-sm transition hover:bg-primary hover:text-orange-950 lg:ml-0 lg:h-10 lg:border-2 lg:border-opacity-100 lg:px-4 lg:py-0 lg:text-base"
          @click="credentialsStore.login()"
          v-else-if="!credentialsStore.get"
        >
          Authorize
        </button>

        <template v-else>
          <div class="hidden items-center gap-2 lg:flex">
            <div
              class="flex h-10 items-center divide-x divide-zinc-700 rounded-lg bg-black/90 pl-2 pr-1"
            >
              <AddressMenu />
              <AssetsDisplay />
              <NetworkStateButton />
            </div>

            <AppNotifications class="hidden xl:block" />
          </div>

          <div class="flex grow items-center lg:hidden">
            <MobileAppHeaderNavbar class="mr-auto" />
            <MobileAppHeaderMenu />
            <AppNotifications />
          </div>
        </template>
      </div>
    </div>

    <MobileAppHeaderSecondRow v-if="connectionStore.connected" />
  </header>
</template>
