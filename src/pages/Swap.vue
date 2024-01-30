<script lang="ts" setup>
import { ref, watch, type Ref, computed } from 'vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import Decimal from 'decimal.js'

import { useConnectionStore } from '@/stores/connection'
import { useConnectionModal } from '@/hooks/use-connection-modal'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useExpandSwap } from '@/hooks/use-expand-swap'
import { SwapType, postSwap, previewSwap } from '@/queries/swap'
import { ERRORS } from '@/data/errors'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionModal from '@/components/header/ConnectionModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import SwapPairSelect from '@/components/swap/pools/SwapPairSelect.vue'
import SwapSideWithInput from '@/components/swap/SwapSideWithInput.vue'
import SwapPriceDisclosure from '@/components/swap/SwapPriceDisclosure.vue'
import SwapSideBrc from '@/components/swap/SwapSideBrc.vue'
import SwapSideBtc from '@/components/swap/SwapSideBtc.vue'
import SwapExpandControl from '@/components/swap/SwapExpandControl.vue'
import SwapDataArea from '@/components/swap/SwapDataArea.vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'

const { openConnectionModal } = useConnectionModal()
const connectionStore = useConnectionStore()
const { isExpand } = useExpandSwap()

// symbol & amount
const { token1Symbol, token2Symbol } = useSwapPoolPair()
const token1Amount = ref<string>()
const token2Amount = ref<string>()

const ratio = ref<Decimal>(new Decimal(0))
const poolRatio = ref<Decimal>(new Decimal(0))

const calculatingPay = ref(false)
const calculatingReceive = ref(false)
const calculating = computed(
  () => calculatingPay.value || calculatingReceive.value
)

// swap & flip related
const swapType = ref<SwapType>('1x')
const flipped = computed(() => ['2x', 'x1'].includes(swapType.value))
const paySymbol = computed(() => {
  if (flipped.value) {
    return token2Symbol.value
  } else {
    return token1Symbol.value
  }
})
const receiveSymbol = computed(() => {
  if (flipped.value) {
    return token1Symbol.value
  } else {
    return token2Symbol.value
  }
})
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
  console.log('flipping')
  console.log('source', newSwapType)

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

      if (newSwapType.includes('1')) {
        token2Amount.value = preview.targetAmount
      } else {
        token1Amount.value = preview.targetAmount
      }
    })
    .catch((e) => {
      if (e.message === ERRORS.INSUFFICIENT_LIQUIDITY) {
        console.log('here')

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
    [oldToken1Amount, oldToken2Amount]
  ) => {
    const sourceChanging = swapType.value.includes('1')
      ? newToken1Amount !== oldToken1Amount
      : newToken2Amount !== oldToken2Amount
    console.log({ swapType: swapType.value })
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
  }
)

// flip
const flipAsset = () => {
  // flip characters of type
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

  // clear amounts
  token1Amount.value = undefined
  token2Amount.value = undefined
}
flipAsset()

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

const queryClient = useQueryClient()
const { mutate: mutateSwap } = useMutation({
  mutationFn: postSwap,
  onSuccess: () => {
    ElMessage.success('Swap success')
    queryClient.invalidateQueries()
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})
async function doSwap() {
  // all kinds of checks
  if (!connectionStore.connected) {
    openConnectionModal()
    return
  }

  if (!hasEnough.value) {
    return
  }

  if (!hasAmount.value) {
    return
  }

  if (unmet.value) {
    if (unmet.value.handler) {
      unmet.value.handler()
    }
    return
  }

  // go for it!
  await mutateSwap({
    token1: token1Symbol.value.toLowerCase(),
    token2: token2Symbol.value.toLowerCase(),
    swapType: swapType.value,
    sourceAmount: sourceAmount.value,
  })
}
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <div class="grow flex items-start justify-center gap-16 pt-16">
    <SwapDataArea v-show="isExpand" />
    <div
      class="relative max-w-md rounded-3xl lg:scale-125 w-96 z-10"
      :class="[isExpand ? 'origin-top-left' : 'origin-top']"
    >
      <div
        class="border border-primary/30 rounded-3xl shadow-md p-2 pt-3 bg-zinc-900 space-y-3"
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
            to="/swap-pools/btc-rdex/add"
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
            :calculating="calculatingPay"
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
            @amount-entered="hasAmount = true"
            @amount-cleared="hasAmount = false"
            @became-source="swapType = '1x'"
          />

          <!-- flip -->
          <div class="h-0 relative flex justify-center z-30 my-0.5">
            <div
              class="absolute -translate-y-1/2 bg-zinc-900 p-1 rounded-xl group transition-all hover:scale-110 duration-150"
            >
              <ArrowDownIcon
                class="h-4 w-4 inline group-hover:hidden p-2 box-content bg-zinc-800 rounded-lg"
              />

              <button
                class="hidden group-hover:inline p-2 box-content transition-all duration-300 bg-zinc-800 rounded-lg shadow-sm shadow-primary/80"
                :class="{
                  'rotate-180': flipped,
                }"
                @click="flipAsset"
              >
                <ArrowUpDownIcon class="h-4 w-4 text-primary" />
              </button>
            </div>
          </div>

          <SwapSideBtc
            side="receive"
            v-if="flipped"
            v-model:symbol="token1Symbol"
            v-model:amount="token1Amount"
            :calculating="calculatingReceive"
            @became-source="swapType = 'x1'"
          />
          <SwapSideWithInput
            side="receive"
            v-else
            v-model:symbol="token2Symbol"
            v-model:amount="token2Amount"
            :calculating="calculatingReceive"
            @became-source="swapType = 'x2'"
          />

          <SwapPriceDisclosure
            :pay-symbol="paySymbol"
            :receive-symbol="receiveSymbol"
            v-show="!!Number(sourceAmount)"
            :ratio="ratio"
            :pool-ratio="poolRatio"
            :calculating="calculating"
          />
        </div>

        <!--price impact-->
        <!-- <div
        v-if="
          Math.abs(+tokenImpact.slip1) > 1 || Math.abs(+tokenImpact.slip2) > 1
        "
        class="flex items-center justify-between rounded-2xl border border-orange-300/30 p-3 text-sm"
      >
        <div>Price Impact Warning</div>

        <div>
          <span class="mr-5"
            >${{ token1Symbol.toUpperCase() }}:<span class="text-red-500"
              >{{ tokenImpact.slip1 }}%</span
            ></span
          >
          <span
            >{{ token2Symbol.toUpperCase() }}:<span class="text-green-500"
              >{{ tokenImpact.slip2 }}%</span
            >
          </span>
        </div>
      </div> -->

        <!-- disabled buttons: calculating or have unmets  -->
        <button
          :class="['disabled', 'main-btn']"
          v-if="calculating"
          :disabled="true"
        >
          <Loader2Icon class="animate-spin text-zinc-400 mx-auto" />
        </button>

        <button
          :class="[!!unmet && !unmet.handler && 'disabled', 'main-btn']"
          v-else-if="unmet"
          :disabled="!unmet.handler"
          @click="!!unmet.handler && unmet.handler()"
        >
          {{ unmet.message || '' }}
        </button>

        <!-- confirm button -->
        <button class="main-btn" v-else @click="doSwap">Swap</button>
      </div>

      <!-- background blur -->
      <SwapBlur />
      <!-- expand control -->
      <SwapExpandControl />
    </div>
  </div>
</template>

<style scoped>
.main-btn {
  @apply bg-primary/20 text-primary font-medium block w-full py-3 rounded-2xl text-xl hover:bg-primary/30;
}

.main-btn.disabled {
  @apply cursor-not-allowed bg-zinc-800 text-zinc-300/50;
}
</style>
