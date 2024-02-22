<script setup lang="ts">
import { Ref, computed, ref, watch } from 'vue'
import { ArrowDownIcon } from 'lucide-vue-next'
import { refDebounced } from '@vueuse/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { ElMessage } from 'element-plus'

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useConnectionModal } from '@/hooks/use-connection-modal'
import { useOngoingTask } from '@/hooks/use-ongoing-task'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'

import { getPoolStatusQuery, getPreviewRemoveQuery } from '@/queries/swap.query'
import { buildRemove, postTask } from '@/queries/swap'
import { IS_DEV } from '@/data/constants'

const { token1Symbol, token2Symbol } = useSwapPoolPair()
const { openConnectionModal } = useConnectionModal()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const address = connectionStore.getAddress
const network = networkStore.network

const { data: poolStatus, isLoading: isLoadingPoolStatus } = useQuery(
  getPoolStatusQuery(
    {
      token1: token1Symbol,
      token2: token2Symbol,
      address,
      network,
    },
    computed(() => !!address)
  )
)
const poolShare = computed(() => {
  if (!poolStatus.value) return '0%'

  return (
    new Decimal(poolStatus.value.addressEquity)
      .div(poolStatus.value.poolEquity)
      .mul(100)
      .toDP(4)
      .toFixed() + '%'
  )
})

const removePercentage = ref([0])
const debouncedPercentage = refDebounced(removePercentage, 300)

const removeEquity = computed(() => {
  if (!poolStatus.value) return '0'

  return new Decimal(debouncedPercentage.value[0])
    .div(100)
    .mul(poolStatus.value.addressEquity || 0)
    .toFixed(4)
})

const { data: preview, isFetching: isFetchingPreview } = useQuery(
  getPreviewRemoveQuery(
    {
      token1: token1Symbol,
      token2: token2Symbol,
      removeEquity,
      address,
      network,
    },
    computed(() => !!address)
  )
)
const token1Amount = computed(() => {
  if (!preview.value) return new Decimal('0')

  return new Decimal(preview.value.token1Amount)
})
const token2Amount = computed(() => {
  if (!preview.value) return new Decimal('0')

  return new Decimal(preview.value.token2Amount)
})

// unmet conditions for swap
// if any of these conditions are not met, the swap button is disabled
const conditions: Ref<
  {
    condition: string
    message: string
    priority: number
    met: boolean
    handler?: Function
  }[]
> = ref([
  {
    condition: 'not-connected',
    message: 'Connect wallet',
    priority: 1,
    met: false,
    handler: openConnectionModal,
  },
  {
    condition: 'enter-amount',
    message: 'Select amount',
    priority: 3,
    met: false,
  },
])

const hasUnmet = computed(() => {
  return conditions.value.some((c) => !c.met)
})
const unmet = computed(() => {
  // use highest priority unmet condition
  if (!hasUnmet.value) {
    return null
  }

  const unmets = conditions.value.filter((c) => !c.met)

  return unmets.reduce((prev, curr) => {
    return prev.priority < curr.priority ? prev : curr
  }, unmets[0])
})

// try to met conditions
watch(
  () => connectionStore.connected,
  (connected) => {
    if (connected) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-connected') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-connected') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

// fourth watcher: hasAmount
const hasAmount = computed(() => {
  return debouncedPercentage.value[0] > 0 && token1Amount.value.gt(0)
})
watch(
  () => hasAmount.value,
  (hasAmount) => {
    if (hasAmount) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'enter-amount') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'enter-amount') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

const { pushOngoing } = useOngoingTask()
const { mutate: mutatePostRemove } = useMutation({
  mutationFn: postTask,
  onSuccess: async ({ id: taskId }) => {
    pushOngoing(taskId)
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
    if (IS_DEV) throw err
  },
  onSettled: () => closeBuilding(),
})
const afterBuildRemove = async ({
  rawPsbt,
  buildId,
}: {
  rawPsbt: string
  buildId: string
}) => {
  mutatePostRemove({
    rawPsbt,
    buildId,
  })
}
const { mutate: mutateBuildRemove } = useMutation({
  mutationFn: buildRemove,
  onSuccess: afterBuildRemove,
  onError: (err: any) => {
    closeBuilding()
    ElMessage.error(err.message)
    if (IS_DEV) throw err
  },
})

async function doRemoveLiquidity() {
  openBuilding()
  // all kinds of checks
  if (!connectionStore.connected) {
    openConnectionModal()
    return
  }
  if (!hasAmount.value) return
  if (unmet.value) {
    if (unmet.value.handler) {
      unmet.value.handler()
    }
    return
  }

  // go for it!
  mutateBuildRemove({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    removeEquity: removeEquity.value,
  })
}
</script>

<template>
  <div class="mt-4 flex flex-col gap-3">
    <RemoveSlider v-model:remove-percentage="removePercentage" />

    <div class="flex justify-center">
      <ArrowDownIcon class="size-4 text-zinc-500" />
    </div>

    <RemovePreview
      :preview="preview"
      :is-fetching-preview="isFetchingPreview"
      :token-1-amount="token1Amount"
      :token-2-amount="token2Amount"
    />

    <SwapGasStats v-show="token1Amount.gt(0)" :task-type="'remove'" />

    <!-- disabled button -->
    <MainBtn
      :class="[!!unmet && !unmet.handler && 'disabled']"
      v-if="unmet"
      :disabled="!unmet.handler"
      @click="!!unmet.handler && unmet.handler()"
    >
      {{ unmet.message || '' }}
    </MainBtn>

    <!-- confirm button -->
    <MainBtn @click="doRemoveLiquidity" v-else>Remove Liquidity</MainBtn>

    <RemovePoolPosition
      v-if="poolStatus"
      :pool-status="poolStatus"
      :pool-share="poolShare"
      class="mt-8"
    />
  </div>
</template>
