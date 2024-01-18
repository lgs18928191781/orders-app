<script lang="ts" setup>
import { ref, watch } from 'vue'
import { TabGroup, TabList, Tab, TabPanels } from '@headlessui/vue'

import { useSelectOrder } from '@/hooks/use-select-order'

import PanelBuy from '@/components/orders/PanelBuy.vue'
import PanelSell from '@/components/orders/PanelSell.vue'

const { selectedOrderType } = useSelectOrder()

const takeModeTab = ref(0)
function changeTakeModeTab(index: number) {
  takeModeTab.value = index
}
watch(
  () => selectedOrderType.value,
  (value) => {
    if (value === 'bid') {
      takeModeTab.value = 1
    } else {
      takeModeTab.value = 0
    }
  }
)
</script>

<template>
  <div class="col-span-3 flex-1 primary-panel min-h-[40vh] lg:min-h-[60vh]">
    <div class="flex flex-col p-4 h-full flex-auto">
      <!-- tabs -->
      <TabGroup :selectedIndex="takeModeTab" @change="changeTakeModeTab">
        <TabList
          class="flex items-center justify-center gap-4"
          v-slot="{ selectedIndex }"
        >
          <Tab
            class="w-28 rounded py-2"
            :class="
              selectedIndex === 0
                ? 'bg-green-500 text-white'
                : 'bg-zinc-700 text-zinc-300'
            "
          >
            Buy
          </Tab>
          <Tab
            class="w-28 rounded py-2 text-white"
            :class="
              selectedIndex === 1
                ? 'bg-red-500 text-white'
                : 'bg-zinc-700 text-zinc-300'
            "
          >
            Sell
          </Tab>
        </TabList>

        <TabPanels class="mt-8 flex-1">
          <PanelBuy />
          <PanelSell />
        </TabPanels>
      </TabGroup>
    </div>
  </div>
</template>
