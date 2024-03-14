<template>
  <div class="item-center grid">
    <div class="flex items-center justify-between">
      <div class="textGray text-sm">{{ opName }}</div>

      <div class="flex text-sm">
        <span class="textGray mr-1">Balance:</span>
        <div class="flex">
          <div class="text-primary">
            <span class="mr-1">{{ formatNum(assetInfo.balance) }} </span
            ><span class="textGray mr-1" v-if="assetInfo.availableBalance"
              ><span class="mr-1">+</span>{{ assetInfo.availableBalance }}</span
            >
            <span>{{ assetInfo.symbol }}</span>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="item-wrap mt-2.5 grid grid-cols-2 rounded-lg">
        <Listbox
          as="div"
          class="relative inline-block text-left"
          :model-value="assetInfo.network"
        >
          <ListboxButton v-slot="{ open }" as="template">
            <button
              :class="[
                open ? 'bg-zinc-700' : 'bg-zinc-900',
                'mx-2.5 flex items-center px-2 py-3 text-sm hover:bg-zinc-700',
              ]"
            >
              <img
                :src="assetInfo.network == AssetNetwork.BTC ? BtcIcon : MVC"
                class="h-6 w-6 rounded-full"
              />
              <!-- <div class="mr-1" v-if="selectNetwork">
                {{ selectNetwork }}
              </div> -->
              <div class="flex pl-2 text-sm">
                {{ assetInfo.network }}<span class="ml-1.5">Network</span>
              </div>
              <ChevronDownIcon class="h-5 w-5" color="#71717A" />
            </button>
          </ListboxButton>

          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <ListboxOptions
              class="nicer-scrollbar absolute right-0 z-10 mt-2 max-h-[40vh] w-48 origin-top-left divide-y divide-zinc-800 overflow-auto rounded-md border border-primary/10 bg-zinc-900 shadow shadow-primary/30 ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <ListboxOption
                v-slot="{ active, selected }"
                v-for="asset in useNetwork"
              >
                <button
                  :class="[
                    'flex w-max min-w-full items-center gap-2 rounded p-4 text-sm',
                    active && 'bg-black',
                  ]"
                >
                  <!-- <img :src="asset.info.icon" class="h-6 rounded-full" /> -->

                  <div class="text-base font-bold">
                    <!-- {{ prettySymbol(asset.tick) }} -->
                  </div>

                  <CheckIcon
                    v-if="selected"
                    class="ml-auto h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                </button>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </Listbox>

        <div class="relative flex w-full items-center">
          <input
            :value="props.modelValue"
            @input="emit('update:modelValue', ($event as any).target!.value)"
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
import { reactive, ref, computed } from 'vue'
import BtcIcon from '@/assets/btc.svg?url'
import MVC from '@/assets/mvc_logo.png?url'
import { ChevronDownIcon, CheckIcon } from 'lucide-vue-next'
import { formatNum } from '@/lib/formatters'
import { AssetNetwork } from '@/data/constants'
import { formatUnitToBtc, formatUnitToSats } from '@/lib/formatters'
interface AssetInfo {
  network: AssetNetwork
  balance: number
  symbol: string
  decimal: number
}

interface Props {
  opName: string
  assetInfo: AssetInfo
  modelValue: number
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
})

const emit = defineEmits(['update:modelValue'])

const curretnNetwork = ref('BTC')

const useNetwork = reactive(['BTC', 'MVC'])
const inputColorDanger = computed(() => {
  console.log(
    'props.modelValue',
    props,
    props.modelValue,
    props.assetInfo.balance
  )
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
</script>
<style scoped>
.textGray {
  color: #71717a;
}
.item-wrap {
  border: 1px solid #71717a;
}
/* .text-color-primary {
  color: #fdba74;
} */

.input-wrap {
  background: #3f3f45;
}

.danger {
  color: #ef4444;
}
</style>
