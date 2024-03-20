<script lang="ts" setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { computed, inject, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import { useConnectionStore } from '@/stores/connection'
import { getMyRewardsEssential } from '@/queries/pool'
import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'

import PanelAdd from './PanelAdd.vue'
import PanelRemove from './PanelRemove.vue'
import PanelStandbys from './PanelStandbys.vue'
import PanelRelease from './PanelRelease.vue'
import PanelHistory from './PanelHistory.vue'
import PanelClaim from './PanelClaim.vue'
import PanelEvent from './PanelEvent.vue'

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)

const tabLabels = ['Add', 'Standbys', 'Remove', 'Release', 'History', 'Claim']
if (selectedPair.fromSymbol === 'rdex') {
  tabLabels.push('Event🔥')

  // remove Add
  tabLabels.shift()
}

const loggedIn = ref(useConnectionStore().connected)
async function connectWallet() {
  const connection = await useConnectionStore().connect('unisat')
  if (connection.status === 'connected') {
    loggedIn.value = true
  }
}

const selectedTab = ref(0)
function changeTab(index: number) {
  selectedTab.value = index
}

const route = useRoute()
const queryAction = route.query.action as string | undefined
if (queryAction === 'release') {
  selectedTab.value = tabLabels.indexOf('Release')
}

const connectionStore = useConnectionStore()
const { data: rewardsEssential } = useQuery({
  queryKey: [
    'poolRewardsEssential',
    { address: connectionStore.getAddress, tick: selectedPair.fromSymbol },
  ],
  queryFn: () =>
    getMyRewardsEssential({
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    }),
  enabled: computed(() => connectionStore.connected),
})

// hasReleasable
const hasReleasable = computed(() => {
  if (!rewardsEssential.value) return false

  return !!rewardsEssential.value?.hasReleasePoolOrderCount
})
</script>

<template>
  <div class="rounded-xl border-2 border-primary/30 p-8">
    <TabGroup
      v-if="loggedIn"
      :default-index="selectedTab"
      :selected-index="selectedTab"
      @change="changeTab"
    >
      <TabList
        class="flex items-center justify-center gap-4"
        v-slot="{ selectedIndex }"
      >
        <Tab
          :class="[
            'border-b-2 px-4 py-1 font-bold outline-none',
            selectedIndex === index
              ? 'border-primary text-zinc-100'
              : 'border-transparent text-zinc-500',
          ]"
          v-for="(label, index) in tabLabels"
        >
          <span>{{ label }}</span>
          <span
            v-if="label === 'Release' && hasReleasable"
            class="absolute inline-flex -translate-x-1 -translate-y-2 items-center rounded-md bg-primary/30 px-1.5 py-0.5 text-xs font-medium text-primary"
          >
            {{ rewardsEssential?.hasReleasePoolOrderCount }}
          </span>
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel class="tab-panel" v-if="selectedPair.fromSymbol !== 'rdex'">
          <PanelAdd />
        </TabPanel>

        <TabPanel class="tab-panel">
          <PanelStandbys />
        </TabPanel>

        <TabPanel class="tab-panel">
          <PanelRemove />
        </TabPanel>

        <TabPanel class="tab-panel">
          <PanelRelease />
        </TabPanel>

        <TabPanel class="tab-panel">
          <PanelHistory />
        </TabPanel>

        <TabPanel class="pt-12 focus-visible:outline-none">
          <PanelClaim @go-release="changeTab(tabLabels.indexOf('Release'))" />
        </TabPanel>

        <TabPanel class="tab-panel">
          <PanelEvent />
        </TabPanel>
      </TabPanels>
    </TabGroup>

    <div class="flex h-full flex-col items-center justify-center gap-8" v-else>
      <p class="text-zinc-300">
        Please connect your wallet first to use the pool.
      </p>

      <button
        class="rounded-lg border-2 border-primary px-4 py-2 transition hover:border-primary hover:bg-primary"
        @click="connectWallet"
      >
        Connect Wallet
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-panel {
  padding-top: 3rem;
  outline: none;
}
</style>
