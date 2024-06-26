<script lang="ts" setup>
import { Ref, computed, inject, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  Switch,
  SwitchLabel,
  SwitchGroup,
} from '@headlessui/vue'
import { CheckIcon, ChevronsUpDownIcon, HelpCircleIcon } from 'lucide-vue-next'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { useStorage } from '@vueuse/core'

import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import {
  Brc20Transferable,
  getMarketPrice,
  getOneBrc20,
} from '@/queries/orders-api'
import { getMyPooledInscriptions } from '@/queries/pool'
import { buildAddBrcLiquidity, buildAddBtcLiquidity } from '@/lib/builders/pool'
import { sleep, unit, useBtcUnit } from '@/lib/helpers'
import { prettyBalance } from '@/lib/formatters'

import OrderConfirmationModal from './PoolConfirmationModal.vue'
import funArrowSvg from '@/assets/fun-arrow.svg?url'

const queryClient = useQueryClient()
const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)

const { data: poolableBrc20s } = useQuery({
  queryKey: [
    'poolableBrc20s',
    {
      address: connectionStore.getAddress,
      network: networkStore.network,
      tick: selectedPair.fromSymbol,
    },
  ],
  queryFn: () =>
    Promise.all([
      getOneBrc20({
        address: connectionStore.getAddress,
        tick: selectedPair.fromSymbol,
      }),
      getMyPooledInscriptions({
        address: connectionStore.getAddress,
        tick: selectedPair.fromSymbol,
      }),
    ]).then(([allBrc20s, pooledBrc20s]) => {
      // filter out pooled brc20s
      const poolableBrc20s = allBrc20s.transferBalanceList.filter((brc20) => {
        return !pooledBrc20s.some(
          (pooledBrc20) => pooledBrc20.inscriptionId === brc20.inscriptionId,
        )
      })

      return poolableBrc20s
    }),
  enabled: computed(
    () => networkStore.network !== 'testnet' && connectionStore.connected,
  ),
})
const selected: Ref<undefined | Brc20Transferable> = ref()

const { data: marketPrice } = useQuery({
  queryKey: [
    'marketPrice',
    { network: networkStore.network, tick: selectedPair.fromSymbol },
  ],
  queryFn: () =>
    getMarketPrice({ tick: selectedPair.fromSymbol }).then((res) => {
      return res
    }),
})

const multipliers = [1.2, 1.5, 1.8, 3, 5, 10]
const defaultSelectIndex = useStorage('default-multiplier-select-index', 2)
const selectedMultiplier = ref(multipliers[defaultSelectIndex.value])
watch(
  selectedMultiplier,
  (val) => {
    defaultSelectIndex.value = multipliers.indexOf(val)
  },
  { immediate: true },
)

const providesBtc = useStorage('provides-btc', true)

const reversePrice = computed(() => {
  if (!selected.value) return 0

  // prevent float number precision problem

  // round up to 8 decimal places
  const useMultiplier = selectedMultiplier.value || 1.8
  const useMarketPrice = marketPrice.value || 0
  // times together and round up to 8 decimal places
  const useUnitPrice = new Decimal(useMarketPrice)
    .times(useMultiplier)
    .toDecimalPlaces(8, Decimal.ROUND_HALF_CEIL)

  return useUnitPrice.times(selected.value.amount).round().toNumber()
})

const builtInfo = ref<
  undefined | Awaited<ReturnType<typeof buildAddBrcLiquidity>>
>()
const builtBtcInfo = ref<
  undefined | Awaited<ReturnType<typeof buildAddBtcLiquidity>>
>()
const isOpenConfirmationModal = ref(false)
const isBuilding = ref(false)
const buildProcessTip = ref('Building Transaction...')
async function submitAdd() {
  if (!selected.value) return

  // check if reversePrice has more than dust value (0.00000546)
  const reverse = new Decimal(reversePrice.value)
  if (reverse.lt(0.00000546)) {
    ElMessage.error('BTC amount is too small to add liquidity.')
    return
  }

  isOpenConfirmationModal.value = true
  isBuilding.value = true

  const builtBrcRes = await buildAddBrcLiquidity({
    total: new Decimal(reversePrice.value),
    amount: new Decimal(selected.value.amount),
    selectedPair: selectedPair,
  }).catch(async (e) => {
    await sleep(500)
    console.log(e)

    ElMessage.error(e.message)
    builtInfo.value = undefined
    isOpenConfirmationModal.value = false
  })

  // bidirectional
  let builtBtcRes: any
  if (providesBtc.value) {
    builtBtcRes = await buildAddBtcLiquidity({
      total: new Decimal(reversePrice.value),
    }).catch(async (e) => {
      await sleep(500)
      console.log(e)

      ElMessage.error(e.message)
      builtInfo.value = undefined
      isOpenConfirmationModal.value = false
    })
  }

  isBuilding.value = false

  if (!builtBrcRes) return
  if (providesBtc.value && !builtBtcRes) return
  builtInfo.value = builtBrcRes
  if (providesBtc.value) builtBtcInfo.value = builtBtcRes

  // bidirectional
  console.log({ builtBrcRes, builtBtcRes })

  return
}

async function onConfirm() {
  queryClient.invalidateQueries({ queryKey: ['poolableBrc20s'] })
  queryClient.invalidateQueries({ queryKey: ['poolRecords'] })
  // cancel select state
  selected.value = undefined
}
</script>

<template>
  <div class="mx-auto max-w-md">
    <form action="" class="flex min-h-[40vh] flex-col">
      <Listbox
        as="div"
        v-model="selected"
        class="grid grid-cols-6 items-center justify-center gap-x-6"
      >
        <ListboxLabel
          class="col-span-1 block text-base font-medium uppercase leading-6 text-zinc-300"
        >
          ${{ selectedPair.fromSymbol }}
        </ListboxLabel>

        <div class="relative col-span-5">
          <ListboxButton
            class="relative w-full rounded-md bg-zinc-800 py-2 pl-3 pr-10 text-left text-zinc-300 shadow-sm ring-1 ring-inset ring-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
          >
            <span class="block truncate">
              {{ selected ? selected.amount : '-' }}
            </span>
            <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <ChevronsUpDownIcon
                class="h-5 w-5 text-zinc-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-inset ring-zinc-700 focus:outline-none sm:text-sm"
              v-if="typeof poolableBrc20s === 'object'"
            >
              <ListboxOption
                v-if="poolableBrc20s.length === 0"
                :disabled="true"
                class="px-4 py-2 text-right text-sm text-zinc-500"
              >
                No poolable ${{ selectedPair.fromSymbol.toUpperCase() }}
              </ListboxOption>

              <ListboxOption
                as="template"
                v-for="transferable in poolableBrc20s"
                :key="transferable.inscriptionId"
                :value="transferable"
                v-slot="{ active, selected }"
              >
                <li
                  :class="[
                    active ? 'bg-primary text-orange-950' : 'text-zinc-300',
                    'relative  select-none py-2 pl-3 pr-9',
                  ]"
                >
                  <span
                    :class="[
                      selected ? 'font-semibold' : 'font-normal',
                      'block truncate',
                    ]"
                    >{{ transferable.amount }}</span
                  >

                  <span
                    v-if="selected"
                    :class="[
                      active ? 'text-white' : 'text-primary',
                      'absolute inset-y-0 right-0 flex items-center pr-4',
                    ]"
                  >
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>

      <SwitchGroup>
        <div class="mt-8 flex items-center">
          <Switch
            v-model="providesBtc"
            :class="[
              providesBtc ? 'bg-primary' : 'bg-primary/10',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ring-offset-zinc-900 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            ]"
          >
            <span class="sr-only">Also Provide BTC Liquidity</span>
            <span
              :class="[
                providesBtc
                  ? 'translate-x-5 bg-zinc-300'
                  : 'translate-x-0 bg-zinc-600',
                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out',
              ]"
            >
              <span
                :class="[
                  providesBtc
                    ? 'opacity-100 duration-200 ease-in'
                    : 'opacity-0 duration-100 ease-out',
                  'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                ]"
                aria-hidden="true"
              >
                <CheckIcon class="h-3 w-3 text-orange-950" aria-hidden="true" />
              </span>
            </span>
          </Switch>

          <SwitchLabel class="ml-4 text-sm text-zinc-300">
            Also Provide BTC Liquidity
          </SwitchLabel>

          <el-popover
            placement="bottom"
            title="What does it mean?"
            :width="400"
            trigger="hover"
            content="You will also provide BTC liquidity to the pool. This will gets you additional rewards."
            popper-class="!bg-zinc-800 !text-zinc-300 !shadow-lg !shadow-primary/10 "
          >
            <template #reference>
              <HelpCircleIcon
                class="ml-2 h-4 w-4 text-zinc-300"
                aria-hidden="true"
              />
            </template>
          </el-popover>
        </div>
      </SwitchGroup>

      <transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div class="mt-4 grow" v-show="providesBtc">
          <div class="grid grow grid-cols-6 items-center gap-x-4 gap-y-2">
            <div class="col-span-1 text-zinc-300">{{ unit }}</div>

            <div
              class="col-span-5 flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-300 shadow-sm sm:text-sm sm:leading-6"
            >
              <div class="flex flex-col items-start gap-1">
                <span class="font-bold text-zinc-100">
                  {{ prettyBalance(reversePrice, useBtcUnit) }}
                </span>
              </div>

              <Listbox as="div" v-model="selectedMultiplier">
                <div class="relative w-20">
                  <ListboxButton
                    class="relative inline-flex w-full items-center rounded bg-black px-2 py-1.5 pl-3 pr-10 text-left text-xs font-bold text-zinc-400 shadow-sm ring-1 ring-inset ring-zinc-950 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
                  >
                    <span class="block truncate">{{ selectedMultiplier }}</span>
                    <span
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                    >
                      <ChevronsUpDownIcon
                        class="h-5 w-5 text-zinc-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>

                  <transition
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-950 py-1 text-base shadow-lg ring-1 ring-zinc-700 ring-opacity-5 focus:outline-none sm:text-sm"
                    >
                      <ListboxOption
                        as="template"
                        v-for="multiplier in multipliers"
                        :key="multiplier"
                        :value="multiplier"
                        v-slot="{ active, selected }"
                      >
                        <li
                          :class="[
                            active
                              ? 'bg-primary text-orange-950'
                              : 'text-zinc-300',
                            'relative select-none py-2 pl-3 pr-9',
                          ]"
                        >
                          <span
                            :class="[
                              selected ? 'font-semibold' : 'font-normal',
                              'block truncate',
                            ]"
                          >
                            {{ multiplier }}
                          </span>

                          <span
                            v-if="selected"
                            :class="[
                              active ? 'text-white' : 'text-primary',
                              'absolute inset-y-0 right-0 flex items-center pr-2',
                            ]"
                          >
                            <CheckIcon class="h-5 w-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>

                  <img
                    :src="funArrowSvg"
                    class="pointer-events-none absolute right-0 top-0 size-16 translate-x-[80%] translate-y-[50%] -rotate-[60deg] object-fill"
                  />
                </div>
              </Listbox>
            </div>

            <div class="col-span-1"></div>
            <div
              class="col-span-5 flex items-center gap-2 pl-2 text-xs text-zinc-400"
            >
              <span>{{ '=' }}</span>
              <el-popover
                placement="bottom"
                trigger="hover"
                popper-class="whitespace-nowrap text-center"
                :width="250"
                :content="
                  marketPrice
                    ? prettyBalance(marketPrice, useBtcUnit) + ' ' + unit
                    : '-'
                "
              >
                <template #reference>
                  <span
                    class="cursor-pointer rounded bg-black px-2 py-1 text-zinc-300 transition hover:text-primary"
                  >
                    Market Price
                  </span>
                </template>
              </el-popover>

              <span>*</span>

              <el-popover
                placement="bottom"
                trigger="hover"
                :content="selected ? selected.amount : '-'"
              >
                <template #reference>
                  <span
                    class="cursor-pointer rounded bg-black px-2 py-1 text-zinc-300 transition hover:text-primary"
                  >
                    Quantity
                  </span>
                </template>
              </el-popover>

              <span>*</span>

              <el-popover
                placement="bottom"
                trigger="hover"
                :content="
                  selectedMultiplier ? selectedMultiplier.toString() + 'x' : '-'
                "
              >
                <template #reference>
                  <span
                    class="cursor-pointer rounded bg-black px-2 py-1 text-zinc-300 transition hover:text-primary"
                  >
                    Multiplier
                  </span>
                </template>
              </el-popover>
            </div>
          </div>

          <p class="mb-8 mt-4 text-sm text-primary">
            Friendly reminder: In the continuously rising market conditions, we
            strongly recommend choosing higher leverage to ensure the
            effectiveness of liquidity. Of course, once liquidity is utilized,
            you will also receive higher rewards.
          </p>
        </div>
      </transition>

      <div class="flex grow items-end justify-center">
        <button
          class="mx-auto w-full rounded-md bg-primary py-3 text-orange-950 disabled:cursor-not-allowed disabled:opacity-30"
          @click.prevent="submitAdd"
          :disabled="!selected"
        >
          Submit
        </button>
      </div>
    </form>

    <OrderConfirmationModal
      v-model:is-open="isOpenConfirmationModal"
      v-model:is-building="isBuilding"
      v-model:built-info="builtInfo"
      v-model:built-btc-info="builtBtcInfo"
      :build-process-tip="buildProcessTip"
      :selected-multiplier="selectedMultiplier"
      @confirm="onConfirm"
    />
  </div>
</template>
