<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import gsap from 'gsap'
import {
  CheckCircleIcon,
  Loader2Icon,
  PackagePlusIcon,
  CircleIcon,
} from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useSwapPool } from '@/hooks/use-swap-pool'

import {
  type Brc20Transferable,
  getBrcFiatRate,
  getFiatRate,
} from '@/queries/orders-api'
import { getOneBrc20Query } from '@/queries/orders-api.query'
import { calcFiatPrice } from '@/lib/helpers'
import { prettyInscriptionId, prettySymbol } from '@/lib/formatters'
import { type InscriptionUtxo } from '@/queries/swap/types'

const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const { token2 } = useSwapPool()

const props = defineProps({
  side: {
    type: String,
    required: false,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
})
const symbol = defineModel('symbol', { required: true, type: String })
const inscriptionUtxos = defineModel('inscriptionUtxos', {
  required: true,
  type: Array as () => InscriptionUtxo[],
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

const { data: myOneBrc20, isLoading } = useQuery(
  getOneBrc20Query(
    {
      address: connectionStore.getAddress,
      network: networkStore.network,
      tick: token2,
    },
    computed(() => connectionStore.connected),
  ),
)

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
const toggleSelectAll = () => {
  if (!myOneBrc20.value?.transferBalanceList) return

  if (selecteds.value.length === myOneBrc20.value?.transferBalanceList.length) {
    selecteds.value = []
  } else {
    selecteds.value = myOneBrc20.value?.transferBalanceList || []
  }
}
function isSelected(transferable: Brc20Transferable) {
  return selecteds.value.includes(transferable)
}

watch(
  selecteds,
  (newSelecteds) => {
    // update amount and inscriptionUtxos when selecteds changed
    amount.value = newSelecteds
      .reduce((prev, curr) => {
        return prev.add(new Decimal(curr.amount))
      }, new Decimal(0))
      .toFixed(0)
    inscriptionUtxos.value = newSelecteds.map((t) => {
      return {
        id: t.inscriptionId,
        satoshis: t.outValue,
      }
    })

    // if has selecteds, emit hasAmount; else emit amountCleared
    if (newSelecteds.length > 0) {
      emit('amountEntered')
    } else {
      emit('amountCleared')
    }
  },
  { deep: true },
)

const tweenedAmount = reactive({
  number: 0,
})
watch(amount, (n) => {
  gsap.to(tweenedAmount, { duration: 0.2, number: Number(n) || 0 })
})

async function goInscribe() {
  const adapter = connectionStore.adapter
  if (!token2.value) return

  await adapter?.inscribe(token2.value)
}
</script>

<template>
  <div class="swap-sub-control-panel">
    <div class="flex items-center gap-2">
      <div class="text-zinc-400" v-if="side">You {{ side }}</div>

      <div class="ml-auto text-lg text-zinc-100">
        {{ tweenedAmount.number.toFixed(0) }}
      </div>
      <div
        :class="[
          'flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-base',
        ]"
      >
        <TokenIcon :token="token2" class="size-5 rounded-full" v-if="token2" />
        <div class="mr-1">
          {{ prettySymbol(symbol) }}
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <Loader2Icon class="size-6 animate-spin text-zinc-500" />
    </div>

    <div v-else-if="myOneBrc20?.transferBalanceList.length === 0" class="my-4">
      <div class="mb-2 text-xs text-zinc-400">
        No transferable {{ prettySymbol(symbol) }}.
      </div>

      <!-- inscribe button -->
      <button
        @click="goInscribe"
        class="cute-button relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-md p-2 text-xs text-zinc-300"
        v-if="myOneBrc20 && new Decimal(myOneBrc20.availableBalance || 0).gt(0)"
      >
        <PackagePlusIcon class="size-4" />
        <span>Inscribe</span>
      </button>
    </div>

    <div
      class="nicer-scrollbar -mr-2 mb-4 mt-2 grid max-h-[20vh] grid-cols-3 items-center gap-2 overflow-auto pr-2 pt-2"
      v-else
    >
      <div
        v-if="
          myOneBrc20?.transferBalanceList &&
          myOneBrc20?.transferBalanceList.length > 3
        "
        class="col-span-3"
      >
        <button
          class="text-xs text-zinc-300 hover:text-primary hover:underline"
          @click="toggleSelectAll"
        >
          {{
            myOneBrc20.transferBalanceList.length > 10
              ? 'Select first 10'
              : 'Select all'
          }}
        </button>
      </div>
      <button
        class="group relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-md border p-2 hover:border-primary/60"
        :class="[
          isSelected(transferable)
            ? 'border-primary/60 bg-black text-primary'
            : 'border-zinc-700 bg-zinc-800 text-zinc-300',
        ]"
        v-for="transferable in myOneBrc20?.transferBalanceList"
        :key="transferable.inscriptionId"
        @click="toggleSelect(transferable)"
      >
        <div class="self-center text-sm">
          {{ transferable.amount }}
        </div>
        <div class="rounded-sm bg-zinc-700 px-1 text-xs text-zinc-400">
          {{ prettyInscriptionId(transferable.inscriptionId) }}
        </div>

        <CheckCircleIcon
          class="absolute right-0 top-0 size-5 translate-x-[33%] translate-y-[-33%] rotate-12 rounded-full bg-black/80 p-0.5 text-primary/80"
          v-if="isSelected(transferable)"
        ></CheckCircleIcon>

        <CircleIcon
          class="absolute right-0 top-0 size-5 translate-x-[33%] translate-y-[-33%] rotate-12 rounded-full bg-zinc-800 p-0.5 text-zinc-700 group-hover:text-primary/60"
          v-else
        ></CircleIcon>
      </button>

      <!-- inscribe button -->
      <button
        @click="goInscribe"
        class="relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-md border border-zinc-700 p-2 text-xs text-zinc-300 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
        v-if="myOneBrc20 && new Decimal(myOneBrc20.availableBalance || 0).gt(0)"
      >
        <PackagePlusIcon class="size-4" />
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
        class="flex gap-1 text-xs text-zinc-400"
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
