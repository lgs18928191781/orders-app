<script lang="ts" setup>
import { ref, watch, type Ref, computed, toRaw } from 'vue'
import { ArrowDownIcon } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { useConnectionModal } from '@/hooks/use-connection-modal'

import SwapBlur from '@/components/swap/SwapBlur.vue'
import ConnectionModal from '@/components/header/ConnectionModal.vue'
import WalletMissingModal from '@/components/header/WalletMissingModal.vue'
import { formatSat, formatTok, removeTrailingZeros } from '@/lib/utils'
import SwapAlgo from '@/lib/swapAlgo'
import Decimal from 'decimal.js'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
const { openConnectionModal } = useConnectionModal()

enum swapOp {
  pay = 'pay',
  receive = 'receive',
}

const fromSymbol = ref('RDEX')
const toSymbol = ref('btc')
// amount
const fromAmount = ref()
const toAmount = ref()
const tiggleRate = ref(false)
const swapCalc = new SwapAlgo(
  new Decimal(240367974941).toNumber(),
  new Decimal(2320854897223186).toNumber()
)
// watch for changes to both symbols
// the rule is when one changes from brc to btc, the other changes from btc to brc
watch(fromSymbol, (newSymbol) => {
  if (newSymbol === 'btc' && toSymbol.value === 'btc') {
    toSymbol.value = ''
  } else if (newSymbol !== 'btc' && toSymbol.value !== 'btc') {
    toSymbol.value = 'btc'
  }
})
watch(toSymbol, (newSymbol) => {
  if (newSymbol === 'btc' && fromSymbol.value === 'btc') {
    fromSymbol.value = ''
  } else if (newSymbol !== 'btc' && fromSymbol.value !== 'btc') {
    fromSymbol.value = 'btc'
  }
})

const tokenRateCalc = computed(() => {
  if (fromSymbol.value === 'btc') {
    const token1RemoveAmount = formatSat(1, 8)
    const { token2AddAmount } = swapCalc.swapToken2ToToken1ByToken1(
      token1RemoveAmount,
      swapCalc.token1SwapAmount,
      swapCalc.token2SwapAmount
    )
    return formatTok(token2AddAmount, 8, 8)
  } else {
    const token2RemoveAmount = formatSat(1, 8)
    const { token1AddAmount } = swapCalc.swapToken1ToToken2ByToken2(
      token2RemoveAmount,
      swapCalc.token1SwapAmount,
      swapCalc.token2SwapAmount
    )
    return formatTok(token1AddAmount, 8, 8)
  }
})

const calcTokenSwap = (e: Event, op: swapOp) => {
  if (op == swapOp.pay) {
    if (fromSymbol.value === 'btc') {
      const token2AddAmount = formatSat(e.target?.value, 8)
      const { token1RemoveAmount } = swapCalc.swapToken2ToToken1(
        token2AddAmount,
        swapCalc.token1SwapAmount,
        swapCalc.token2SwapAmount
      )
      toAmount.value = formatTok(token1RemoveAmount, 8, 8)
    } else {
      const token1AddAmount = formatSat(e.target?.value, 8)
      const { token2RemoveAmount } = swapCalc.swapToken1ToToken2(
        token1AddAmount,
        swapCalc.token1SwapAmount,
        swapCalc.token2SwapAmount
      )
      toAmount.value = formatTok(token2RemoveAmount, 8, 8)
    }
  } else {
    if (fromSymbol.value === 'btc') {
      const token1RemoveAmount = formatSat(e.target?.value, 8)
      const { token2AddAmount } = swapCalc.swapToken2ToToken1ByToken1(
        token1RemoveAmount,
        swapCalc.token1SwapAmount,
        swapCalc.token2SwapAmount
      )
      fromAmount.value = formatTok(token2AddAmount, 8, 8)
    } else {
      const token2RemoveAmount = formatSat(e.target?.value, 8)
      const { token1AddAmount } = swapCalc.swapToken1ToToken2ByToken2(
        token2RemoveAmount,
        swapCalc.token1SwapAmount,
        swapCalc.token2SwapAmount
      )
      fromAmount.value = formatTok(token1AddAmount, 8, 8)
    }
  }
}

function accept(open, close) {
  console.log(open)
  if (open) {
    close()
  } else {
    open = true
  }
}

// flip
const flipAsset = () => {
  const from = fromSymbol.value
  const to = toSymbol.value
  fromSymbol.value = to
  toSymbol.value = from

  const fromAmt = fromAmount.value
  const toAmt = toAmount.value
  fromAmount.value = toAmt
  toAmount.value = fromAmt
}

const tokenImspact = computed(() => {
  const pairData = {
    swapToken1Amount: swapCalc.token1SwapAmount,
    swapToken2Amount: swapCalc.token2SwapAmount,
  }

  const originAddAmount = fromAmount.value || 0
  const aimAddAmount = toAmount.value || 0
  const dirForward = fromSymbol.value == 'btc' ? true : false
  const { slip1, slip2 } = swapCalc.tokenPriceImpact(
    originAddAmount,
    aimAddAmount,
    pairData,
    dirForward
  )

  console.log('token1Impact, token2Impact', slip1, slip2)
  return {
    slip1: Math.abs(+slip1) >= 100 ? 100 : slip1,
    slip2: Math.abs(+slip2) >= 100 ? 100 : slip2,
  }
})

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
    message: 'Enter an amount',
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
  () => [fromSymbol.value, toSymbol.value],
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
</script>

<template>
  <ConnectionModal />
  <WalletMissingModal />

  <div class="relative mx-auto mt-16 max-w-md rounded-3xl">
    <div
      class="space-y-3 rounded-3xl border border-orange-300/30 bg-zinc-900 p-2 pt-3 shadow-md"
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
      </div>

      <!-- body -->
      <div class="space-y-0.5 text-sm">
        <SwapSide
          side="pay"
          v-model:symbol="fromSymbol"
          v-model:amount="fromAmount"
          @has-enough="hasEnough = true"
          @not-enough="hasEnough = false"
          @amount-entered="hasAmount = true"
          @amount-cleared="hasAmount = false"
          @keyup="calcTokenSwap($event, swapOp.pay)"
        />

        <!-- flip -->
        <div class="relative flex h-0 justify-center">
          <div class="absolute -translate-y-1/2 rounded-xl bg-zinc-900 p-1">
            <button
              class="rounded-lg bg-zinc-800 p-2 hover:text-orange-300"
              @click="flipAsset"
            >
              <ArrowDownIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <SwapSide
          side="receive"
          v-model:symbol="toSymbol"
          v-model:amount="toAmount"
          @keyup="calcTokenSwap($event, swapOp.receive)"
        />
      </div>

      <Popover
        v-slot="{ open, close }"
        class="rounded-2xl border border-zinc-700 p-3"
      >
        <PopoverButton
          class="flex w-full items-center justify-between text-sm focus:outline-none"
        >
          <div class="flex items-center">
            <span class="mr-1">1</span
            ><span class="mr-1">{{ toSymbol.toUpperCase() }}</span>
            <span class="mr-1"
              ><span class="mr-1">≈</span>{{ tokenRateCalc }}</span
            ><span class="mr-1">{{ fromSymbol.toUpperCase() }}</span>
          </div>
          <ChevronDownIcon
            class="h-6 w-6"
            :class="{ 'rotate-180 transform': open }"
          />
        </PopoverButton>
        <div v-if="open">
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-y-1 opacity-0 "
            enter-to-class="translate-y-0 opacity-100 "
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 opacity-100 "
            leave-to-class="translate-y-1 opacity-0 "
          >
            <PopoverPanel class="text-sm" static>
              <div class="mt-2 grid grid-cols-1">
                <div class="mt-1 flex w-full items-center justify-between">
                  <span>Exchange rate impact:</span>
                  <span>{{ tokenImspact.slip2 }}%</span>
                </div>
                <div class="mt-3 flex w-full items-center justify-between">
                  <span>Swap fee:</span>
                  <span></span>
                </div>
              </div>

              <img src="" alt="" />
            </PopoverPanel>
          </transition>
        </div>
      </Popover>

      <!--price impact-->
      <div
        v-if="
          Math.abs(+tokenImspact.slip1) > 1 || Math.abs(+tokenImspact.slip2) > 1
        "
        class="flex items-center justify-between rounded-2xl border border-orange-300/30 p-3 text-sm"
      >
        <div>Price Impact Warning</div>

        <div>
          <span class="mr-5"
            >${{ fromSymbol.toUpperCase() }}:<span class="text-red-500"
              >{{ tokenImspact.slip1 }}%</span
            ></span
          >
          <span
            >{{ toSymbol.toUpperCase() }}:<span class="text-green-500"
              >{{ tokenImspact.slip2 }}%</span
            >
          </span>
        </div>
      </div>

      <!-- disabled button -->
      <button
        :class="[!!unmet && !unmet.handler && 'disabled', 'main-btn']"
        v-if="unmet"
        :disabled="!unmet.handler"
        @click="!!unmet.handler && unmet.handler()"
      >
        {{ unmet.message || '' }}
      </button>

      <!-- confirm button -->
      <button class="main-btn" v-else>Swap</button>
    </div>

    <!-- background blur -->
    <SwapBlur />
  </div>
</template>

<style scoped>
.main-btn {
  @apply block w-full rounded-2xl bg-orange-300/20 py-3 text-xl font-medium text-orange-300 hover:bg-orange-300/30;
}

.main-btn.disabled {
  @apply cursor-not-allowed bg-zinc-800 text-zinc-300/50;
}
</style>
