<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import gsap from 'gsap'
import { CheckCircleIcon } from 'lucide-vue-next'

import {
  Brc20Transferable,
  getBrcFiatRate,
  getFiatRate,
  getOneBrc20,
} from '@/queries/orders-api'
import { calcFiatPrice } from '@/lib/helpers'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { prettyInscriptionId, prettySymbol } from '@/lib/formatters'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { PackagePlusIcon } from 'lucide-vue-next'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const { selectedPair, token2Symbol } = useSwapPoolPair()

const props = defineProps({
  side: {
    type: String,
    required: true,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
  calculating: {
    type: Boolean,
    default: false,
  },
})
const symbol = defineModel('symbol', { required: true, type: String })
const icon = computed(() => {
  if (!selectedPair.value) {
    return null
  }

  if (symbol.value === selectedPair.value.token1Symbol) {
    return selectedPair.value.token1Icon
  }

  return selectedPair.value.token2Icon
})

const emit = defineEmits([
  'hasEnough',
  'notEnough',
  'amountEntered',
  'amountCleared',
  'update:symbol',
  'becameSource',
])

// fiat price
const { data: btcFiatRate } = useQuery({
  queryKey: ['fiatRate', { coin: 'btc' }],
  queryFn: getFiatRate,
})
const { data: brcFiatRates } = useQuery({
  queryKey: ['brcFiatRate'],
  queryFn: getBrcFiatRate,
  enabled: computed(() => false),
})

const fiatPrice = computed(() => {
  if (!amount.value) {
    return null
  }

  if (symbol.value === 'btc') {
    if (!btcFiatRate.value) {
      return null
    }

    return calcFiatPrice(amount.value, btcFiatRate.value)
  }

  if (!brcFiatRates.value) {
    return null
  }

  const rate = brcFiatRates.value[symbol.value.toLowerCase()]
  return calcFiatPrice(amount.value, rate)
})

const { data: myOneBrc20 } = useQuery({
  queryKey: [
    'myOneBrc20',
    {
      address: connectionStore.getAddress,
      network: networkStore.network,
      tick: token2Symbol,
    },
  ],
  queryFn: () =>
    getOneBrc20({
      address: connectionStore.getAddress,
      tick: token2Symbol.value,
    }),
  enabled: computed(() => connectionStore.connected),
})

// amount
const amount = defineModel('amount', { type: String })
const selecteds = ref<Brc20Transferable[]>([])
const toggleSelect = (transferable: Brc20Transferable) => {
  if (isSelected(transferable)) {
    selecteds.value = selecteds.value.filter((t) => t !== transferable)
  } else {
    selecteds.value.push(transferable)
  }
}
function isSelected(transferable: Brc20Transferable) {
  return selecteds.value.includes(transferable)
}

watch(
  selecteds,
  (newSelecteds) => {
    // update amount when selecteds changed
    amount.value = newSelecteds
      .reduce((prev, curr) => {
        return prev.add(new Decimal(curr.amount))
      }, new Decimal(0))
      .toFixed(0)

    // if has selecteds, emit hasAmount; else emit amountCleared
    if (newSelecteds.length > 0) {
      emit('amountEntered')
    } else {
      emit('amountCleared')
    }
  },
  { deep: true }
)

const tweenedAmount = reactive({
  number: 0,
})
watch(amount, (n) => {
  gsap.to(tweenedAmount, { duration: 0.2, number: Number(n) || 0 })
})

async function goInscribe() {
  const adapter = connectionStore.adapter
  if (!selectedPair.value) return

  await adapter?.inscribe(selectedPair.value.exactName)
}
</script>

<template>
  <div
    class="px-4 py-5 bg-zinc-800 rounded-2xl border border-transparent hover:border-zinc-700"
  >
    <div class="flex items-center gap-2">
      <div class="text-zinc-400 mr-auto">You {{ side }}</div>

      <div class="text-zinc-100 text-lg">
        {{ tweenedAmount.number.toFixed(0) }}
      </div>
      <div
        :class="[
          'rounded-full p-1 px-4 text-base flex items-center gap-1 bg-zinc-900',
        ]"
      >
        <img :src="icon" class="w-5 h-5 rounded-full" v-if="icon" />
        <div class="mr-1">
          {{ prettySymbol(symbol) }}
        </div>
      </div>
    </div>

    <!-- main control -->
    <div v-if="myOneBrc20?.transferBalanceList.length === 0" class="my-4">
      <div class="text-xs text-zinc-400 mb-2">
        No transferable {{ prettySymbol(symbol) }}.
      </div>

      <!-- inscribe button -->
      <button
        @click="goInscribe"
        class="border p-2 rounded-md flex flex-col gap-0.5 items-center hover:border-primary/60 relative h-16 justify-center border-zinc-700 text-xs text-zinc-300 hover:bg-primary/5 hover:text-primary"
        v-if="myOneBrc20 && new Decimal(myOneBrc20.availableBalance || 0).gt(0)"
      >
        <PackagePlusIcon class="w-4 h-4" />
        <span>Inscribe</span>
      </button>
    </div>

    <div class="grid items-center grid-cols-3 gap-2 my-4" v-else>
      <button
        class="border p-2 rounded-md flex flex-col gap-0.5 items-center hover:border-primary/60 relative h-16 justify-center"
        :class="[
          isSelected(transferable)
            ? 'bg-black border-primary/60 text-primary'
            : 'bg-zinc-800 border-zinc-700 text-zinc-300',
        ]"
        v-for="transferable in myOneBrc20?.transferBalanceList"
        :key="transferable.inscriptionId"
        @click="toggleSelect(transferable)"
      >
        <div class="text-sm self-center">
          {{ transferable.amount }}
        </div>
        <div class="text-xs text-zinc-400 bg-zinc-700 rounded-sm px-1">
          {{ prettyInscriptionId(transferable.inscriptionId) }}
        </div>

        <CheckCircleIcon
          class="absolute right-0 top-0 w-5 h-5 text-primary translate-x-[33%] translate-y-[-33%] bg-black/80 rounded-full p-0.5 rotate-12"
          v-if="isSelected(transferable)"
        ></CheckCircleIcon>
      </button>

      <!-- inscribe button -->
      <button
        @click="goInscribe"
        class="border p-2 rounded-md flex flex-col gap-0.5 items-center hover:border-primary/60 relative h-16 justify-center border-zinc-700 text-xs text-zinc-300 hover:bg-primary/5 hover:text-primary"
        v-if="myOneBrc20 && new Decimal(myOneBrc20.availableBalance || 0).gt(0)"
      >
        <PackagePlusIcon class="w-4 h-4" />
        <span>Inscribe</span>
      </button>
    </div>

    <!-- data footer -->
    <div
      class="flex items-center justify-between"
      v-if="connectionStore.connected"
    >
      <!-- fiat price -->
      <div class="text-sm text-zinc-400" v-if="fiatPrice">
        {{ fiatPrice ? '$' + fiatPrice : '-' }}
      </div>
      <div class="w-1" v-else></div>

      <!-- balance -->
      <div
        class="text-xs text-zinc-400 flex gap-1"
        v-if="!!symbol && !!myOneBrc20"
      >
        <div>Balance:</div>
        <div class="text-primary">
          {{ myOneBrc20.transferBalance || 0 }}
        </div>
        <div class="">+</div>
        <div class="">
          {{ myOneBrc20.availableBalance || 0 }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  /* display: none; <- Crashes Chrome on hover */
  -webkit-appearance: none;
  margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type='number'] {
  -moz-appearance: textfield; /* Firefox */
}
</style>
