<template>
  <div>
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
      class="nicer-scrollbar -mr-2 mb-4 mt-2 grid max-h-[20vh] grid-cols-2 items-center gap-2 overflow-auto pr-2 pt-2"
      v-else
    >
      <!-- <div
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
          Select all
        </button>
      </div> -->
      <button
        class="group relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-md border p-2"
        :class="[
          isSelected(transferable)
            ? 'border-primary/60 bg-black text-primary'
            : 'border-zinc-700 bg-zinc-800 text-zinc-300',
          +transferable.inscriptionNumber <= 0 ? '' : 'hover:border-primary/60',
        ]"
        v-for="transferable in myOneBrc20?.transferBalanceList"
        :key="transferable.inscriptionId"
        @click="toggleSelect(transferable)"
      >
        <div
          class="self-center text-sm"
          :class="+transferable.inscriptionNumber <= 0 ? 'text-zinc-400' : ''"
        >
          {{ transferable.amount }}
        </div>
        <div class="rounded-sm bg-zinc-700 px-1 text-xs text-zinc-400">
          {{ prettyInscriptionId(transferable.inscriptionId) }}
        </div>
        <div
          v-if="+transferable.inscriptionNumber <= 0"
          class="rounded-sm bg-zinc-700 px-1 text-xs text-zinc-400"
        >
          pending
        </div>

        <CheckCircleIcon
          class="absolute right-0 top-0 size-5 translate-x-[33%] translate-y-[-33%] rotate-12 rounded-full bg-black/80 p-0.5 text-primary/80"
          v-if="isSelected(transferable)"
        ></CheckCircleIcon>

        <CircleIcon
          :class="
            +transferable.inscriptionNumber <= 0
              ? ''
              : 'group-hover:text-primary/60'
          "
          class="absolute right-0 top-0 size-5 translate-x-[33%] translate-y-[-33%] rotate-12 rounded-full bg-zinc-800 p-0.5 text-zinc-700"
          v-else
        ></CircleIcon>
      </button>

      <!-- inscribe button -->

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
    <!-- <div
      class="flex items-center justify-between"
      v-if="connectionStore.connected"
    > -->
    <!-- fiat price -->

    <!-- <div class="w-1"></div> -->

    <!-- balance -->
    <!-- <div
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
      </div> -->
    <!-- </div> -->
  </div>
</template>
<script lang="ts" setup>
import { computed, ref, watch, toRaw, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getOneBrc20Query } from '@/queries/orders-api.query'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { prettyInscriptionId, prettySymbol } from '@/lib/formatters'
import {
  CheckCircleIcon,
  Loader2Icon,
  PackagePlusIcon,
  CircleIcon,
} from 'lucide-vue-next'
import Decimal from 'decimal.js'
import { type Brc20Transferable } from '@/queries/orders-api'
import { type InscriptionUtxo } from '@/queries/swap/types'
import { ElMessage } from 'element-plus'

const isOpen = ref(false)
const networkStore = useNetworkStore()
const connectionStore = useConnectionStore()
const selecteds = ref<Brc20Transferable[]>([])
const emit = defineEmits([
  'hasEnough',
  'notEnough',
  'amountEntered',
  'amountCleared',
  'update:symbol',
  'becameSource',
])
const symbol = defineModel('symbol', { required: true, type: String })
const initAmount = defineModel('initAmount', { required: false, type: Number })
const amount = defineModel('amount')

const inscriptionUtxos = defineModel('inscriptionUtxos', {
  required: true,
  type: Array as () => InscriptionUtxo[],
})

watch(
  selecteds,
  (newSelecteds) => {
    // update amount and inscriptionUtxos when selecteds changed
    const minusValue = newSelecteds
      .reduce((prev, curr) => {
        return prev.add(new Decimal(curr.amount))
      }, new Decimal(0))
      .toFixed(0)
    amount.value = new Decimal(initAmount.value!).minus(minusValue).toString()
    inscriptionUtxos.value = newSelecteds.map((t) => {
      return {
        id: t.inscriptionId,
        satoshis: t.outValue,
        amount: t.amount,
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

const { data: myOneBrc20, isLoading } = useQuery(
  getOneBrc20Query(
    {
      address: connectionStore.getAddress,
      network: networkStore.network,
      tick: computed(() => symbol.value),
    },
    computed(() => connectionStore.connected),
  ),
)

function selectMore() {
  isOpen.value = true
}

function closeModal() {
  isOpen.value = false
}

function isSelected(transferable: Brc20Transferable) {
  return selecteds.value.includes(transferable)
}

const toggleSelect = (transferable: Brc20Transferable) => {
  if (+transferable.inscriptionNumber <= 0) {
    return ElMessage.error(
      'The inscription is not confirmed and cannot be traded.',
    )
  }

  if (isSelected(transferable)) {
    selecteds.value = selecteds.value.filter((t) => t !== transferable)
  } else {
    selecteds.value = []
    selecteds.value.push(transferable)
  }
}

async function goInscribe() {
  const adapter = connectionStore.adapter
  await adapter?.inscribe(symbol.value)
}

const toggleSelectAll = () => {
  if (!myOneBrc20.value?.transferBalanceList) return

  if (selecteds.value.length === myOneBrc20.value?.transferBalanceList.length) {
    selecteds.value = []
  } else {
    selecteds.value = myOneBrc20.value?.transferBalanceList || []
  }
}
</script>

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
