<template>
  <TransitionRoot
    :show="isOpen"
    as="template"
    enter="duration-300 ease"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="duration-200 ease-in"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >
    <Dialog class="relative z-30" as="div" @close="closeModal">
      <!-- Modal背景 -->
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
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
          @click="closeModal"
        />
      </TransitionChild>
      <!-- Modal內容 -->
      <div class="fixed inset-0 overflow-y-auto text-zinc-300">
        <div class="flex mt-32 justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-500 transform"
            enter-from="opacity-0 -translate-y-40 sm:scale-95"
            enter-to="opacity-100 -translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 sm:scale-100"
            leave-to="opacity-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-xl bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-[0_0px_10px_rgba(255,255,255,0.3)] transition-all w-[515px] sm:p-7"
            >
              <DialogTitle
                as="h3"
                class="text-2xl text-gray-300 font-semibold leading-6 text-zinc-100 flex items-center justify-between"
              >
                History
                <div
                  class="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-500 cursor-pointer"
                  @click="closeModal"
                >
                  <X :size="20" class=" text-zinc-800"></X>
                </div>
              </DialogTitle>
              <div>
                <TabGroup>
                  <TabList
                    class="flex items-center gap-6"
                    v-slot="{ selectedIndex }"
                  >
                    <Tab
                      v-for="(item, index) in TxTypes"
                      :key="item.value"
                      class="rounded py-2 text-left outline-none"
                      :class="
                        selectedIndex === index
                          ? 'text-primary underline decoration-2 underline-offset-4'
                          : 'text-zinc-500 hover:text-zinc-300'
                      "
                      >{{ item.label }}</Tab
                    >
                  </TabList>
                  <TabPanels>
                    <TabPanel v-for="item in TxTypes" :key="item.value">
                      <BridgeHistoryPanel
                        :tx-type="item.value"
                        :address="mvcAddress"
                      ></BridgeHistoryPanel>
                    </TabPanel>
                  </TabPanels>
                </TabGroup>
              </div>
             
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<script setup lang="ts">
import { Ref, computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@headlessui/vue'
import { X } from 'lucide-vue-next'
import BridgeHistoryPanel from './BridgeHistoryPanel.vue'
import { useConnectionStore } from '@/stores/connection'

const { isOpen } = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(["handleHistoryVisible"]);
function closeModal() {
  emit("handleHistoryVisible",false );
}
const connectionStore = useConnectionStore()
const mvcAddress = ref<string>('')
const selectedIndex = ref<number>(0)
async function getAddress() {
  mvcAddress.value = await connectionStore.adapter.getMvcAddress()
}
getAddress()
const TxTypes = ref([
  {
    value: 'btcToMvc',
    label: 'BTC',
  },
  {
    value: 'brc20ToMvc',
    label: 'BRC20',
  },
  {
    value: 'mvcToBtc',
    label: 'Redeem BTC',
  },
  {
    value: 'mvcToBrc20',
    label: 'Redeem BRC20',
  },
])
</script>