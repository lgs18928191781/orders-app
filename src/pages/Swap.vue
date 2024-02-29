<script lang="ts" setup>
import { ref, watch, type Ref, computed, onMounted } from 'vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import Decimal from 'decimal.js'
import { ElMessage } from 'element-plus'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useBtcJsStore } from '@/stores/btcjs'

import { useConnectionModal } from '@/hooks/use-connection-modal'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { useOngoingTask } from '@/hooks/use-ongoing-task'

import {
  SwapType,
  build2xSwap,
  postTask,
  previewSwap,
  build1xSwap,
  buildX2Swap,
} from '@/queries/swap'
import { exclusiveChange } from '@/lib/build-helpers'
import { ERRORS } from '@/data/errors'
import { IS_DEV, SIGHASH_ALL, USE_UTXO_COUNT_LIMIT } from '@/data/constants'
import { sleep } from '@/lib/helpers'
import { type InscriptionUtxo } from '@/queries/swap/types'

const { openConnectionModal } = useConnectionModal()
const connectionStore = useConnectionStore()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const btcjsStore = useBtcJsStore()
const networkStore = useNetworkStore()

// symbol & amount
const { token1Symbol, token2Symbol } = useSwapPoolPair()
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const token2InscriptionUtxos = ref<InscriptionUtxo[]>([])

const ratio = ref<Decimal>(new Decimal(0))
const poolRatio = ref<Decimal>(new Decimal(0))
const priceImpact = ref<Decimal>(new Decimal(0))
const hasImpactWarning = computed(() => {
  // greater than 15%
  return priceImpact.value.gte(15)
})

const calculatingPay = ref(false)
const calculatingReceive = ref(false)
const calculating = computed(
  () => calculatingPay.value || calculatingReceive.value,
)

// swap & flip related
const swapType = ref<SwapType>('1x')
const flipped = computed(() => ['2x', 'x1'].includes(swapType.value))
const flippedControl = ref(false)
const sourceAmount = computed(() => {
  if (swapType.value.includes('1')) {
    return token1Amount.value
  } else {
    return token2Amount.value
  }
})

// watch for swapType
// if changed, calculate the other amount
watch(swapType, async (newSwapType) => {
  if (!sourceAmount.value) return

  // if is flipping to x1 or 2x, clear every amounts and return (since arbitrary brc as input is not supported)
  if (flipped.value) {
    token1Amount.value = undefined
    token2Amount.value = undefined
    return
  }

  // calculating
  if (newSwapType.indexOf('x') === 0) {
    calculatingPay.value = true
  } else {
    calculatingReceive.value = true
  }

  previewSwap({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    swapType: newSwapType,
    sourceAmount: sourceAmount.value,
  })
    .then((preview) => {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-liquidity') {
          c.met = true
        }
        return c
      })

      ratio.value = new Decimal(preview.ratio)
      poolRatio.value = new Decimal(preview.poolRatio)
      priceImpact.value = new Decimal(preview.priceImpact)

      if (newSwapType.includes('1')) {
        token2Amount.value = preview.targetAmount
      } else {
        token1Amount.value = preview.targetAmount
      }
    })
    .catch((e) => {
      if (e.message === ERRORS.INSUFFICIENT_LIQUIDITY) {
        if (newSwapType.includes('1')) {
          token2Amount.value = undefined
        } else {
          token1Amount.value = undefined
        }

        conditions.value = conditions.value.map((c) => {
          if (c.condition === 'insufficient-liquidity') {
            c.met = false
          }
          return c
        })
      }
    })
    .finally(() => {
      calculatingPay.value = false
      calculatingReceive.value = false
    })
})

// watch for sourceAmount
watch(
  [token1Amount, token2Amount],
  async (
    [newToken1Amount, newToken2Amount],
    [oldToken1Amount, oldToken2Amount],
  ) => {
    const sourceChanging = swapType.value.includes('1')
      ? newToken1Amount !== oldToken1Amount
      : newToken2Amount !== oldToken2Amount
    if (!sourceChanging) return

    if (!sourceAmount.value) return

    if (Number(sourceAmount.value) === 0) {
      token1Amount.value = undefined
      token2Amount.value = undefined
      return
    }

    // calculating
    if (swapType.value.indexOf('x') === 0) {
      calculatingPay.value = true
    } else {
      calculatingReceive.value = true
    }

    previewSwap({
      token1: token1Symbol.value.toLowerCase(),
      token2: token2Symbol.value.toLowerCase(),
      swapType: swapType.value,
      sourceAmount: sourceAmount.value,
    })
      .then((preview) => {
        conditions.value = conditions.value.map((c) => {
          if (c.condition === 'insufficient-liquidity') {
            c.met = true
          }
          return c
        })

        ratio.value = new Decimal(preview.ratio)
        poolRatio.value = new Decimal(preview.poolRatio)
        priceImpact.value = new Decimal(preview.priceImpact)

        if (swapType.value.includes('1')) {
          token2Amount.value = preview.targetAmount
        } else {
          token1Amount.value = preview.targetAmount
        }
      })
      .catch((e) => {
        if (e.message === ERRORS.INSUFFICIENT_LIQUIDITY) {
          if (swapType.value.includes('1')) {
            token2Amount.value = undefined
          } else {
            token1Amount.value = undefined
          }

          conditions.value = conditions.value.map((c) => {
            if (c.condition === 'insufficient-liquidity') {
              c.met = false
            }
            return c
          })
        }
      })
      .finally(() => {
        calculatingPay.value = false
        calculatingReceive.value = false
      })
  },
)

// flip
const flipAsset = async () => {
  // flip characters of type
  flippedControl.value = !flippedControl.value

  await sleep(200)

  switch (swapType.value) {
    case '1x':
      swapType.value = '2x'
      break
    case '2x':
      swapType.value = '1x'
      break
    case 'x1':
      swapType.value = '1x'
      break
    case 'x2':
      swapType.value = '2x'
      break
  }

  // clear amounts and reset conditions
  token1Amount.value = undefined
  token2Amount.value = undefined
  hasAmount.value = false
  moreThanThreshold.value = true

  // clear token2InscriptionUtxos
  token2InscriptionUtxos.value = []
}

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
    condition: 'insufficient-liquidity',
    message: 'Insufficient liquidity',
    priority: 3,
    met: true,
  },
  {
    condition: 'enter-amount',
    message: 'Enter an amount',
    priority: 4,
    met: false,
  },
  {
    condition: 'insufficient-balance',
    message: 'Insufficient balance',
    priority: 5,
    met: false,
  },
  {
    condition: 'more-than-threshold',
    message: 'Amount too small',
    priority: 6,
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
  { immediate: true },
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
  { immediate: true },
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
  { immediate: true },
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
  { immediate: true },
)

// 5th watcher: more-than-threshold
const moreThanThreshold = ref(true)
watch(
  () => moreThanThreshold.value,
  (moreThanThreshold) => {
    if (moreThanThreshold) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'more-than-threshold') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'more-than-threshold') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true },
)

// mutations
const { pushOngoing } = useOngoingTask()
const queryClient = useQueryClient()
const { mutate: mutatePostSwap } = useMutation({
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
const buildSwapFn = computed(() => {
  switch (swapType.value) {
    case '1x':
      return build1xSwap
    case '2x':
      return build2xSwap
    case 'x2':
      return buildX2Swap
  }
})
const afterBuildSwap = async ({
  rawPsbt,
  buildId,
  type,
}: {
  rawPsbt: string
  buildId: string
  type: SwapType
}) => {
  const btcjs = btcjsStore.get!
  switch (type) {
    case '1x':
      // continue building and add change to the psbt
      const psbt1x = btcjs.Psbt.fromHex(rawPsbt, {
        network: networkStore.typedNetwork,
      })
      const { psbt: psbt1xFinished } = await exclusiveChange({
        psbt: psbt1x,
        maxUtxosCount: USE_UTXO_COUNT_LIMIT,
        sighashType: SIGHASH_ALL,
      })
      if (!psbt1xFinished) throw new Error('Failed to add change')

      const signed1x = await connectionStore.adapter.signPsbt(
        psbt1xFinished.toHex(),
        {
          autoFinalized: false,
        },
      )
      if (!signed1x) return
      if (!sourceAmount.value) return

      mutatePostSwap({
        rawPsbt: signed1x,
        buildId,
      })
      break

    case 'x2':
      // continue building and add change to the psbt
      const psbtX2 = btcjs.Psbt.fromHex(rawPsbt, {
        network: networkStore.typedNetwork,
      })
      const { psbt: psbtX2Finished } = await exclusiveChange({
        psbt: psbtX2,
        maxUtxosCount: USE_UTXO_COUNT_LIMIT,
        sighashType: SIGHASH_ALL,
      })
      if (!psbtX2Finished) throw new Error('Failed to add change')

      const signedX2 = await connectionStore.adapter.signPsbt(
        psbtX2Finished.toHex(),
        {
          autoFinalized: false,
        },
      )
      if (!signedX2) return
      if (!sourceAmount.value) return

      mutatePostSwap({
        rawPsbt: signedX2,
        buildId,
      })
      break

    case '2x':
      const signed2x = await connectionStore.adapter.signPsbt(rawPsbt, {
        autoFinalized: false,
      })
      if (!signed2x) return
      if (!sourceAmount.value) return

      mutatePostSwap({
        rawPsbt: signed2x,
        buildId,
      })
      break
  }
}
const { mutate: mutateBuildSwap } = useMutation({
  mutationFn: buildSwapFn,
  onSuccess: afterBuildSwap,
  onError: (err: any) => {
    closeBuilding()
    ElMessage.error(err.message)
    if (IS_DEV) throw err
  },
})
async function doSwap() {
  openBuilding()
  // all kinds of checks
  if (!connectionStore.connected) {
    openConnectionModal()
    return
  }
  if (!hasEnough.value) return
  if (!hasAmount.value) return
  if (!sourceAmount.value) return
  if (unmet.value) {
    if (unmet.value.handler) {
      unmet.value.handler()
    }
    return
  }

  // go for it!
  mutateBuildSwap({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    sourceAmount: sourceAmount.value,
    inscriptionUtxos: token2InscriptionUtxos.value,
  })
}
</script>

<template>
  <SwapLayout>
    <div
      class="swap-main-border h-full space-y-3 rounded-xl bg-zinc-900 p-2 lg:rounded-3xl lg:!pt-3"
    >
      <!-- header -->
      <div class="flex gap-4 px-3">
        <router-link
          to="/swap"
          class="flex items-center space-x-1 text-zinc-200"
        >
          Swap
        </router-link>

        <router-link
          to="/swap-pools"
          class="flex items-center space-x-1 text-zinc-400 hover:text-zinc-600"
        >
          Pools
        </router-link>

        <SwapPairSelect class="ml-auto" />
      </div>

      <!-- body -->
      <div class="text-sm">
        <SwapSideBrc
          side="pay"
          v-if="flipped"
          v-model:symbol="token2Symbol"
          v-model:amount="token2Amount"
          v-model:inscription-utxos="token2InscriptionUtxos"
          @has-enough="hasEnough = true"
          @not-enough="hasEnough = false"
          @amount-entered="hasAmount = true"
          @amount-cleared="hasAmount = false"
          @became-source="swapType = '2x'"
        />
        <SwapSideWithInput
          side="pay"
          v-else
          v-model:symbol="token1Symbol"
          v-model:amount="token1Amount"
          :calculating="calculatingPay"
          @has-enough="hasEnough = true"
          @not-enough="hasEnough = false"
          @more-than-threshold="moreThanThreshold = true"
          @less-than-threshold="moreThanThreshold = false"
          @amount-entered="hasAmount = true"
          @amount-cleared="hasAmount = false"
          @became-source="swapType = '1x'"
        />

        <!-- flip -->
        <div class="relative z-30 my-0.5 flex h-0 justify-center">
          <div
            class="group absolute -translate-y-1/2 rounded-xl bg-zinc-900 p-1 transition-all duration-150 hover:scale-110"
          >
            <ArrowDownIcon
              class="box-content inline h-4 w-4 rounded-lg bg-zinc-800 p-2 group-hover:hidden"
            />

            <button
              class="box-content hidden rounded-lg bg-zinc-800 p-2 shadow-sm shadow-primary/80 transition-all duration-200 group-hover:inline"
              :class="{
                'rotate-180': flippedControl,
              }"
              @click="flipAsset"
            >
              <ArrowUpDownIcon class="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>

        <SwapSideBtc
          side="receive"
          use-case="swap"
          v-if="flipped"
          v-model:symbol="token1Symbol"
          v-model:amount="token1Amount"
          @more-than-threshold="moreThanThreshold = true"
          @less-than-threshold="moreThanThreshold = false"
          :calculating="calculatingReceive"
          @became-source="swapType = 'x1'"
        />
        <SwapSideWithInput
          side="receive"
          v-else
          v-model:symbol="token2Symbol"
          v-model:amount="token2Amount"
          @more-than-threshold="moreThanThreshold = true"
          @less-than-threshold="moreThanThreshold = false"
          :calculating="calculatingReceive"
          @became-source="swapType = 'x2'"
        />

        <SwapPriceDisclosure
          :token1-symbol="token1Symbol"
          :token2-symbol="token2Symbol"
          v-show="!!Number(sourceAmount)"
          :price-impact="priceImpact"
          :has-impact-warning="hasImpactWarning"
          :ratio="ratio"
          :pool-ratio="poolRatio"
          :calculating="calculating"
        />

        <SwapGasStats v-show="!!Number(sourceAmount)" :task-type="'swap'" />
      </div>

      <!-- disabled buttons: calculating or have unmets  -->
      <MainBtn class="disabled" v-if="calculating" :disabled="true">
        <Loader2Icon class="mx-auto animate-spin text-zinc-400" />
      </MainBtn>

      <MainBtn
        :class="[!!unmet && !unmet.handler && 'disabled']"
        v-else-if="unmet"
        :disabled="!unmet.handler"
        @click="!!unmet.handler && unmet.handler()"
      >
        {{ unmet.message || '' }}
      </MainBtn>

      <!-- confirm button -->
      <MainBtn v-else @click="doSwap" :dangerous="hasImpactWarning">
        {{ hasImpactWarning ? 'Swap Anyway' : 'Swap' }}
      </MainBtn>
    </div>
  </SwapLayout>
</template>
