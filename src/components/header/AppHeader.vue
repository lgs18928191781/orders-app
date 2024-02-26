<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { MenuIcon } from 'lucide-vue-next'

import { useNetworkStore, type Network } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import { isUnsupportedAddress } from '@/lib/helpers'

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
const metaletAccountsChangedHandler = () => {
  if (useConnectionStore().last.wallet !== 'metalet') return

  ElMessage.warning({
    message: 'Metalet account changed. Refreshing page...',
    type: 'warning',
    onClose: () => {
      window.location.reload()
    },
  })
}

onMounted(async () => {
  if (window.unisat) {
    const unisat = window.unisat
    unisat.on('accountsChanged', unisatAccountsChangedHandler)

    // getNetwork
    const network: Network = await unisat.getNetwork()
    // const network: Network = 'livenet'
    const address = connectionStore.getAddress

    // if not in whitelist, switch to mainnet
    // if (network !== 'livenet' && address && !whitelist.includes(address)) {
    //   const switchRes = await unisat.switchNetwork('livenet').catch(() => false)
    //   if (!switchRes) {
    //     ElMessage({
    //       message: 'Testnet is not available, please switch to livenet.',
    //       type: 'error',
    //       onClose: () => {
    //         // redirect to a blank page
    //         window.location.href = 'about:blank'
    //       },
    //     })
    //   }

    //   networkStore.set('livenet')
    //   return
    // }
    networkStore.set(network)
  }

  if (window.okxwallet) {
    window.okxwallet.bitcoin.on('accountsChanged', okxAccountsChangedHandler)
  }

  if (window.metaidwallet) {
    window.metaidwallet.on('accountsChanged', metaletAccountsChangedHandler)
  }
})
onBeforeUnmount(() => {
  // remove event listener
  window.unisat?.removeListener('accountsChanged', unisatAccountsChangedHandler)
  window.okxwallet?.removeListener('accountsChanged', okxAccountsChangedHandler)
  window.metaidwallet?.removeListener(
    'accountsChanged',
    metaletAccountsChangedHandler
  )
})
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />
  <NetworkStateModal v-if="connectionStore.connected" />

  <header
    class="py-2 lg:py-4 select-none bg-zinc-900 lg:mb-3 border-b border-zinc-800 lg:border-none"
  >
    <div class="max-w-9xl flex items-center justify-between mx-auto px-3">
      <AppNavbar />

      <div class="flex gap-2">
        <button
          class="h-10 rounded-lg border-2 border-primary px-4 transition hover:text-orange-950 hover:bg-primary"
          @click="openConnectionModal"
          v-if="!connectionStore.connected"
        >
          Connect Wallet
        </button>

        <button
          class="h-10 rounded-lg border-2 border-primary px-4 transition hover:text-orange-950 hover:bg-primary"
          @click="credentialsStore.login()"
          v-else-if="!credentialsStore.get"
        >
          Authorize
        </button>

        <template v-else>
          <div class="items-center gap-2 hidden lg:flex">
            <div
              class="flex h-10 items-center divide-x divide-zinc-700 rounded-lg bg-black/90 pl-2 pr-1"
            >
              <AddressMenu />
              <AssetsDisplay />
              <NetworkStateButton />
            </div>

            <AppNotifications />
          </div>

          <button class="lg:hidden">
            <MenuIcon class="h-6 w-6" />
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
