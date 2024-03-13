<script lang="ts" setup>
import { ref } from 'vue'
import { TabGroup, TabList, Tab, TabPanels } from '@headlessui/vue'

import PanelBuy from '@/components/orders/PanelBuy.vue'
import PanelSell from '@/components/orders/PanelSell.vue'

const modeTab = ref(0)
function changeModeTab(index: number) {
  modeTab.value = index
}
</script>

<template>
  <div
    class="primary-panel col-span-3 min-h-[40vh] flex-1 lg:min-h-[45vh]"
    id="tradePanel"
  >
    <div class="flex h-full flex-auto flex-col p-4">
      <!-- tabs -->
      <TabGroup :selected-index="modeTab" @change="changeModeTab">
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
