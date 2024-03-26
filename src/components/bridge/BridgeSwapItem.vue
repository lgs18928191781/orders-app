<template>
  <div class="item-center grid">
    <div class="flex items-center justify-between">
      <div class="textGray text-base">{{ opName }}</div>

      <div class="flex items-center text-base">
        <div class="textGray mr-1">
          <img :src="walletIcon" alt="" />
        </div>
        <div class="flex">
          <div class="text-primary">
            <span class="mr-1">{{ formatNum(assetInfo.balance) }} </span
            ><span class="textGray mr-1" v-if="assetInfo?.availableBalance"
              ><span class="mr-1">+</span
              >{{ assetInfo?.availableBalance }}</span
            >
            <span>{{ assetInfo.symbol }}</span>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="item-wrap mt-2.5 grid grid-cols-2 rounded-xl">
        <div class="flex items-center py-4 text-left">
          <button
            :class="[
              'bg-zinc-800',
              'mx-2.5 flex items-center rounded-lg px-2 py-3 text-sm hover:bg-zinc-700',
            ]"
          >
            <img
              :src="assetInfo.network == AssetNetwork.BTC ? BtcIcon : MVC"
              class="h-6 w-6 rounded-full"
            />

            <div class="flex pl-2 text-sm">
              {{ assetInfo.network }}<span class="ml-1.5">Network</span>
            </div>
            <ChevronDownIcon class="h-5 w-5" color="#71717A" />
          </button>
        </div>

        <div class="relative flex w-full items-center">
          <div v-if="showInscription">
            <InscribeItem
              v-model:initAmount="assetInfo.initAmount"
              v-model:symbol="assetInfo.symbol"
              v-model:amount="assetInfo.balance"
              v-model:inscription-utxos="InscriptionUtxos"
              @amount-entered="onAmountChange"
              @amount-cleared="onAmountCleared"
            ></InscribeItem>
          </div>

          <input
            v-else
           
            :value="props.modelValue"
            placeholder="0"
            @input="validateInput"
            type="number"
            :readonly="disableInput"
            class="input-wrap quiet-input mr-2.5 w-full rounded-md py-1 pl-2 text-right placeholder-zinc-500"
            :class="[inputColorDanger ? 'danger' : '']"
          />
        </div>
      </div>
      <div>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { reactive, ref, computed, watch, toRaw } from 'vue'
import BtcIcon from '@/assets/btc.svg?url'
import MVC from '@/assets/mvc_logo.png?url'
import { ChevronDownIcon, CheckIcon } from 'lucide-vue-next'
import { formatNum } from '@/lib/formatters'
import { AssetNetwork } from '@/data/constants'
import { formatUnitToBtc, formatUnitToSats } from '@/lib/formatters'
import InscribeItem from './InscribeItem.vue'
import { type InscriptionUtxo } from '@/queries/swap/types'
import Decimal from 'decimal.js'
import walletIcon from '@/assets/wallet-icon.svg?url'
interface AssetInfo {
  network: AssetNetwork
  balance: number
  symbol: string
  decimal: number
  initAmount?: number
  availableBalance?: number
}

interface Props {
  opName: string
  assetInfo: AssetInfo
  modelValue: string | number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '0',
})

console.log('assetInfo12313212', props.assetInfo)

const emit = defineEmits(['update:modelValue','validate'])

const curretnNetwork = ref('BTC')
const InscriptionUtxos = ref<InscriptionUtxo[]>([])

const useNetwork = reactive(['BTC', 'MVC'])
const showInscription = computed(() => {
  return (
    props.opName == 'From' &&
    props.assetInfo.network == AssetNetwork.BTC &&
    props.assetInfo.symbol !== 'BTC'
  )
})

function validateInput(e:Event){
  
  emit('update:modelValue', (e as any).target!.value)
  emit('validate')
}

function onAmountChange() {
  const totalValue = InscriptionUtxos.value.reduce((pre: any, cur: any) => {
    return new Decimal(pre).add(cur.amount!).toNumber()
  }, new Decimal(0))
  emit('update:modelValue', totalValue)
}

const inputColorDanger = computed(() => {
  if (props.opName == 'To') {
    return
  }
  if (
    formatUnitToBtc(props.modelValue, props.assetInfo.decimal) >
    formatUnitToBtc(props.assetInfo.balance, props.assetInfo.decimal)
  ) {
    return true
  } else return
})

const disableInput = computed(() => {
  return props.opName == 'To'
})

const selectNetwork = computed(() => {
  const selected = useNetwork.find((item) => item === curretnNetwork.value)
  if (!selected) {
    return null
  }

  return selected
})

function onAmountCleared() {
  InscriptionUtxos.value = []
}

defineExpose({
  InscriptionUtxos,
})
</script>
<style scoped>
.textGray {
  color: #71717a;
}
.item-wrap {
  border: 1px solid #6f6f6f;
  &:hover {
    box-shadow: 0 0 0px 0.5px #71717a;
  }
}
/* .text-color-primary {
  color: #fdba74;
} */

.input-wrap {
  background: transparent;
}

.danger {
  color: #ef4444;
}
</style>
