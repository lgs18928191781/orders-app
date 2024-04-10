<script setup lang="ts">
import { Ref, computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useQuery } from '@tanstack/vue-query'
import { Loader2Icon } from 'lucide-vue-next'

import { useNetworkStore } from '@/stores/network'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStateModal } from '@/hooks/use-network-state-modal'

import { FeebPlan, getFeebPlans } from '@/queries/orders-api'

const { openModal } = useNetworkStateModal()

// custom feeb plan
const customFeeb = useStorage('customFeeb', 2)
const customFeebPlan: Ref<FeebPlan> = ref({
  title: 'Custom',
  feeRate: customFeeb,
})

const networkStore = useNetworkStore()
const { data: feebPlans, isLoading: isLoadingFeebPlans } = useQuery({
  queryKey: ['feebPlans', { network: networkStore.network }],
  queryFn: () => getFeebPlans(),
})

const selectedFeebPlanTitle = useStorage('selectedFeebPlanTitle', 'Avg')
const selectedFeebPlan = computed(() => {
  if (!feebPlans.value) return

  if (selectedFeebPlanTitle.value === 'Custom') {
    return customFeebPlan.value
  }

  return feebPlans.value.find(
    (plan) => plan.title === selectedFeebPlanTitle.value,
  )
})
// tell feebStore whenever selectedFeebPlan changes
const feebStore = useFeebStore()

const traffic = computed(() => {
  if (!feebPlans.value) return '-'

  const avgFeeRate = feebPlans.value[2].feeRate

  if (avgFeeRate < 20) return 'Low'
  if (avgFeeRate < 50) return 'Normal'
  if (avgFeeRate < 150) return 'Busy'

  return 'Extremely Busy'
})
const trafficColorClass = computed(() => {
  switch (traffic.value) {
    case 'Low':
      return {
        text: 'text-green-500',
        bg: 'bg-green-500',
        secondaryBg: 'bg-green-400',
      }
    case 'Normal':
      return {
        text: 'text-yellow-500',
        bg: 'bg-yellow-500',
        secondaryBg: 'bg-yellow-400',
      }
    case 'Busy':
    case 'Extremely Busy':
      return {
        text: 'text-red-500',
        bg: 'bg-red-500',
        secondaryBg: 'bg-red-400',
      }
    default:
      return {
        text: 'text-zinc-500',
        bg: 'bg-zinc-500',
        secondaryBg: 'bg-zinc-400',
      }
  }
})
</script>

<template>
  <button
    class="-mr-3 flex items-center gap-2 px-3 text-xs outline-none lg:mr-0 lg:hover:scale-105"
    @click="openModal"
    v-if="true"
  >
    <span class="hidden xl:inline">Network</span>
    <span class="relative hidden h-2 w-2 xl:flex">
      <span
        class="absolute inline-flex h-full w-full animate-ping-slow rounded-full opacity-75"
        :class="trafficColorClass.secondaryBg"
      ></span>
      <span
        class="relative inline-flex h-2 w-2 rounded-full"
        :class="trafficColorClass.bg"
      ></span>
    </span>

    <span class="pl-2">Gas</span>
    <span class="min-w-[60px]" v-if="isLoadingFeebPlans">
      <Loader2Icon class="mx-auto h-4 w-4 animate-spin text-zinc-500" />
    </span>

    <span class="min-w-[60px] text-left text-primary" v-else>
      {{
        selectedFeebPlan
          ? `${selectedFeebPlan.title} ${selectedFeebPlan.feeRate}`
          : '-'
      }}
    </span>
  </button>

  <div
    class="flex items-center gap-2 px-3 text-xs outline-none hover:scale-105"
    v-else
  >
    Testnet Gas
    <span class="text-primary">{{ feebStore.get }}</span>
  </div>
</template>
