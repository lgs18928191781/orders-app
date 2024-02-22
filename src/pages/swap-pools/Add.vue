<script lang="ts" setup>
import { ref, watch, type Ref, computed, PropType } from 'vue'
import { PlusIcon } from 'lucide-vue-next'
import Decimal from 'decimal.js'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'

import { useConnectionStore } from '@/stores/connection'
import { useBtcJsStore } from '@/stores/btcjs'
import { useNetworkStore } from '@/stores/network'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useConnectionModal } from '@/hooks/use-connection-modal'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { useOngoingTask } from '@/hooks/use-ongoing-task'

import { buildAdd, postTask, previewAdd } from '@/queries/swap'
import { IS_DEV, SIGHASH_ALL, USE_UTXO_COUNT_LIMIT } from '@/data/constants'
import { exclusiveChange } from '@/lib/build-helpers'
import { sleep } from '@/lib/helpers'
import SwapGasStats from '@/components/swap/SwapGasStats.vue'

const { token1Symbol, token2Symbol } = useSwapPoolPair()
const { openConnectionModal } = useConnectionModal()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const btcjsStore = useBtcJsStore()
const networkStore = useNetworkStore()

// amount
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const calculatingToken1 = ref(false)
const token2InscriptionIds = ref<string[]>([])
const ratio = ref(new Decimal(0))
const addEquity = ref(new Decimal(0))
const poolEquity = ref(new Decimal(0))

// watch for token2Amount （always sourcing from token2Amount）
watch(token2Amount, async (newAmount) => {
  if (!newAmount) return

  if (Number(newAmount) === 0) {
    token1Amount.value = undefined
    token2Amount.value = undefined
    return
  }

  calculatingToken1.value = true

  previewAdd({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    source: 'token2',
    sourceAmount: newAmount,
  })
    .then((preview) => {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-liquidity') {
          c.met = true
        }
        return c
      })

      ratio.value = new Decimal(preview.ratio)
      addEquity.value = new Decimal(preview.addEquity)
      poolEquity.value = new Decimal(preview.poolEquity)

      token1Amount.value = preview.targetAmount
      calculatingToken1.value = false
    })
    .catch(() => {
      ElMessage.error('Failed to calculate')
    })
})

// connection
const connectionStore = useConnectionStore()

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
    condition: 'not-select-token',
    message: 'Select a token',
    priority: 2,
    met: false,
  },
  {
    condition: 'enter-amount',
    message: 'Select some BRC20',
    priority: 3,
    met: false,
  },
  {
    condition: 'insufficient-balance',
    message: 'Insufficient balance',
    priority: 4,
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

watch(
  () => [token1Symbol.value, token2Symbol.value],
  ([from, to]) => {
    if (from && to) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-select-token') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'not-select-token') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)
// third watcher: hasEnough
const hasEnough = ref(true)
watch(
  () => hasEnough.value,
  (hasEnough) => {
    if (hasEnough) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-balance') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-balance') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

// fourth watcher: hasAmount
const hasAmount = ref(false)
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

function onAmountCleared() {
  token2InscriptionIds.value = []
  ratio.value = new Decimal(0)
  addEquity.value = new Decimal(0)
  poolEquity.value = new Decimal(0)
  hasAmount.value = false
}

// mutations
const { pushOngoing } = useOngoingTask()
const queryClient = useQueryClient()
const { mutate: mutatePostAdd } = useMutation({
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
const afterBuildAdd = async ({
  rawPsbt,
  buildId,
}: {
  rawPsbt: string
  buildId: string
}) => {
  const btcjs = btcjsStore.get!
  // continue building and add change to the psbt
  const psbtAdd = btcjs.Psbt.fromHex(rawPsbt, {
    network: networkStore.typedNetwork,
  })
  const { psbt: psbtAddFinished } = await exclusiveChange({
    psbt: psbtAdd,
    maxUtxosCount: USE_UTXO_COUNT_LIMIT,
    sighashType: SIGHASH_ALL,
  })
  if (!psbtAddFinished) throw new Error('Failed to add change')

  const signedAdd = await connectionStore.adapter.signPsbt(
    psbtAddFinished.toHex()
  )
  if (!signedAdd) return

  mutatePostAdd({
    rawPsbt: signedAdd,
    buildId,
  })
}

const { mutate: mutateBuildAdd } = useMutation({
  mutationFn: buildAdd,
  onSuccess: afterBuildAdd,
  onError: (err: any) => {
    closeBuilding()
    ElMessage.error(err.message)
    if (IS_DEV) throw err
  },
})

async function doAddLiquidity() {
  openBuilding()
  // all kinds of checks
  if (!connectionStore.connected) {
    openConnectionModal()
    return
  }
  if (!hasEnough.value) return
  if (!hasAmount.value) return
  if (!token2Amount.value) return
  if (unmet.value) {
    if (unmet.value.handler) {
      unmet.value.handler()
    }
    return
  }

  // go for it!
  mutateBuildAdd({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    source: 'token2',
    sourceAmount: token2Amount.value,
    inscriptionIds: token2InscriptionIds.value,
  })
}
</script>

<template>
  <div class="my-4 space-y-0.5 text-sm">
    <!-- brc first -->
    <SwapSideBrc
      v-model:symbol="token2Symbol"
      v-model:amount="token2Amount"
      v-model:inscription-ids="token2InscriptionIds"
      @has-enough="hasEnough = true"
      @not-enough="hasEnough = false"
      @amount-entered="hasAmount = true"
      @amount-cleared="onAmountCleared"
    />

    <!-- plus icon -->
    <div class="py-2">
      <PlusIcon class="mx-auto h-5 w-5 text-zinc-500" />
    </div>

    <SwapSideBtc
      v-model:symbol="token1Symbol"
      v-model:amount="token1Amount"
      :calculating="calculatingToken1"
      :side="'pay'"
      @has-enough="hasEnough = true"
      @not-enough="hasEnough = false"
    />
  </div>

  <AddPricesAndShares
    class="my-4"
    v-if="ratio.gt(0) && poolEquity.gt(0)"
    :token-1-symbol="token1Symbol"
    :token-2-symbol="token2Symbol"
    :ratio="ratio"
    :add-equity="addEquity"
    :pool-equity="poolEquity"
  />

  <SwapGasStats v-show="ratio.gt(0) && poolEquity.gt(0)" :task-type="'add'" />

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
  <MainBtn v-else @click="doAddLiquidity"> Add Liquidity </MainBtn>
</template>
