<script lang="ts" setup>
import { ref, watch, type Ref, computed, onMounted, reactive, watchEffect, provide } from 'vue'
import { useMVCSwapStore } from '@/stores/mvcswap'
import { useConnectionStore } from '@/stores/connection'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia';
const connectionStore = useConnectionStore()
const tabs = ref(['Swap', 'Pools']);
const currentTab = ref(0);
const changeTab = (index: number) => {
  currentTab.value = index;
};
const store = useMVCSwapStore()
const { fetchPairs, fetchBalance, fetchIcons } = store;
const { loading } = storeToRefs(store);
const initData = async () => {
  await Promise.all([
    fetchIcons(),
    fetchPairs(),
    fetchBalance()
  ])
}
onMounted(() => {
  initData()
})
watch(
  () => connectionStore.connected,
  (staus) => {
    if (staus) {
      initData()
    }
  },
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-9xl grow justify-center gap-8 p-3 lg:pt-8 xl:gap-12 items-start">
    <div :class="['relative z-10 w-112 max-w-md rounded-3xl lg:mb-8']">
      <TransitionRoot :show="loading" as="template" enter="duration-300 ease" enter-from="opacity-0"
        enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm z-50" aria-hidden="true">
            <div class="flex h-full w-full items-center justify-center">
              <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          </div>
        </TransitionChild>
      </TransitionRoot>


      <div class="swap-main-border h-full space-y-3 rounded-xl bg-zinc-900 p-2 lg:rounded-3xl lg:!pt-3">
        <div class="flex gap-4 border-b border-zinc-800 px-3 pb-2">

          <span v-for="(tab, index) in tabs" :key="index" @click="changeTab(index)" :class="[
      'flex items-center space-x-1 cursor-pointer',
      currentTab === index
        ? 'text-zinc-200'
        : 'text-zinc-400 hover:text-zinc-600',
    ]">
            {{ tab }}
          </span>



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
