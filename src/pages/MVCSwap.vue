<script lang="ts" setup>
import {
  ref,
  watch,
  type Ref,
  computed,
  onMounted,
  reactive,
  watchEffect,
  provide,
  onBeforeUnmount,
  onUnmounted,
} from 'vue'
import { useMVCSwapStore } from '@/stores/mvcswap'
import { useConnectionStore } from '@/stores/connection'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  Loader2Icon,
  HandCoins,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
//@ts-ignore
import { API_NET, API_TARGET, FtManager } from 'meta-contract'
import Decimal from 'decimal.js'
import { ElMessage } from 'element-plus'
const connectionStore = useConnectionStore()
const tabs = ref(['Swap', 'Pools'])
const currentTab = ref(0)
const changeTab = (index: number) => {
  currentTab.value = index
}
const store = useMVCSwapStore()
const {
  fetchPairs,
  fetchBalance,
  fetchIcons,
  fetchBridgeAssets,
  fetchPairInfo,
} = store
const { loading } = storeToRefs(store)
let intervalId = 0
const initData = async () => {
  await fetchBridgeAssets()
  await Promise.all([fetchIcons(), fetchPairs(), fetchBalance()])
}

async function getTestTokenFacuet() {
  const ftManager = new FtManager({
    apiTarget: API_TARGET.MVC,
    network: API_NET.TEST,
    purse: import.meta.env.VITE_FACUET_WIF,
    feeb: 1,
    apiHost: import.meta.env.VITE_MVC_API_HOST,
  })
  try {
    const selfMvcAddress = await connectionStore.adapter.getMvcAddress()

    const { txid } = await ftManager.transfer({
      codehash: `c9cc7bbd1010b44873959a8b1a2bcedeb62302b7`,
      genesis: `cf45d1f6ab1dc176fe1849904386a1d574baa573`,
      receivers: [
        {
          address: selfMvcAddress,
          amount: new Decimal(200).mul(10 ** 8).toString(),
        },
      ],
      senderWif: import.meta.env.VITE_FACUET_WIF,
    })
    if (txid) {
      ElMessage.success(`Receive 200 token1 success!,Txid: ${txid}`)
    } else {
      throw new Error(`Receive token1 fail`)
    }
  } catch (error) {
    ElMessage.error(error as any)
  }
}

onMounted(() => {
  initData()
  intervalId = window.setInterval(() => {
    fetchPairs(), fetchPairInfo()
  }, 10000)
})
watch(
  () => connectionStore.connected,
  (staus) => {
    if (staus) {
      initData()
    }
  },
)
onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-9xl grow items-start justify-center gap-8 p-3 lg:pt-8 xl:gap-12"
  >
    <div :class="['relative z-10 w-112 max-w-md rounded-3xl lg:mb-8']">
      <TransitionRoot
        :show="loading"
        as="template"
        enter="duration-300 ease"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          >
            <div class="flex h-full w-full items-center justify-center">
              <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          </div>
        </TransitionChild>
      </TransitionRoot>

      <SwapChainSelector :chain="'mvc'" />

      <div
        class="h-full space-y-3 rounded-xl border-2 border-mvc/30 bg-zinc-900 p-2 lg:rounded-3xl lg:!pt-3"
      >
        <div class="flex gap-4 border-b border-zinc-800 px-3 pb-2">
          <span
            v-for="(tab, index) in tabs"
            :key="index"
            @click="changeTab(index)"
            :class="[
              'flex cursor-pointer items-center space-x-1',
              currentTab === index
                ? 'text-zinc-200'
                : 'text-zinc-400 hover:text-zinc-600',
            ]"
          >
            {{ tab }}
          </span>
          <div
            class="flex cursor-pointer items-center hover:text-zinc-300"
            @click="getTestTokenFacuet"
          >
            <HandCoins :size="18" />
            <span class="ml-1 text-sm">Facuet</span>
          </div>
          <MvcSwapPairSelect class="ml-auto" />
        </div>
        <div v-if="currentTab === 0">
          <MVCSwapPanel />
        </div>
        <div v-else>
          <MVCSwapPool />
        </div>
      </div>
    </div>
  </div>
</template>
