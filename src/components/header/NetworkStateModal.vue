<script setup lang="ts">
import { Ref, computed, ref, watch } from 'vue'
import { get, useStorage } from '@vueuse/core'
import Decimal from 'decimal.js'
import {
  RadioGroup,
  RadioGroupLabel,
  RadioGroupDescription,
  RadioGroupOption,
  Dialog,
  DialogPanel,
} from '@headlessui/vue'
import { useQuery } from '@tanstack/vue-query'
import {
  CarIcon,
  CheckIcon,
  BikeIcon,
  RocketIcon,
  BusIcon,
  SailboatIcon,
  PlaneIcon,
  XIcon,
} from 'lucide-vue-next'

import { useNetworkStore } from '@/stores/network'
import { useFeebStore } from '@/stores/feeb'
import { useFiat } from '@/hooks/use-fiat'
import { useNetworkStateModal } from '@/hooks/use-network-state-modal'

import { FeebPlan, getFeebPlans } from '@/queries/orders-api'
import { sleep, unit, useBtcUnit } from '@/lib/helpers'
import { prettyBalance } from '@/lib/formatters'
import { BID_TX_SIZE, BUY_TX_SIZE, SELL_TX_SIZE } from '@/data/constants'
import { getRewardClaimFees } from '@/queries/pool'
import { useCredentialsStore } from '@/stores/credentials'

const { useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()
const { isOpen, closeModal } = useNetworkStateModal()

// custom feeb plan
const customFeeb = useStorage('customFeeb', 2)
const customFeebPlan: Ref<FeebPlan> = ref({
  title: 'Custom',
  feeRate: customFeeb,
  ref: 'customFeebPlan',
})
function updateCustomFeeb(e: any) {
  const target = e.target as HTMLInputElement
  const value = Number(target.value)

  if (Number.isNaN(value)) return

  customFeeb.value = value
}

// feeb plan icons
function getFeePlanIcon(planTitle: FeebPlan['title']) {
  switch (planTitle) {
    case 'Eco':
      return BikeIcon
    case 'Slow':
      return BusIcon
    case 'Avg':
      return PlaneIcon
    case 'Fast':
      return RocketIcon
    case 'Custom':
      return SailboatIcon
  }
}

// estimate miner fee for every actions
const makeActions = [
  {
    title: 'Ask',
    size: 0,
  },
  {
    title: 'Bid',
    size: BID_TX_SIZE,
  },
]
const takeActions = [
  {
    title: 'Buy',
    size: BUY_TX_SIZE,
  },
  {
    title: 'Sell',
    size: SELL_TX_SIZE,
  },
]

// fetch claim fees dynamically
const claimFee = ref(0)
async function getClaimFee() {
  if (!useCredentialsStore().get) return
  const fees = await getRewardClaimFees()
  claimFee.value = new Decimal(fees.rewardInscriptionFee)
    .plus(fees.rewardSendFee)
    .toNumber()
}

function getPoolActionsPriceDisplay(
  actionSize: number,
  equalitySymbol: string = '>=',
  isClaim?: boolean,
) {
  if (!selectedFeebPlan.value)
    return {
      inCrypto: '-',
      inFiat: '-',
    }

  if (isClaim) {
    const prefix = actionSize > 0 ? `${equalitySymbol} ` : ''
    const btcPriceDisplay =
      prettyBalance(claimFee.value, get(useBtcUnit)) + ' ' + unit.value

    const fiatPriceDisplay = fiatRate.value
      ? getFiatPriceDisplay(claimFee.value, get(fiatRate))
      : ''

    return {
      inCrypto: prefix + btcPriceDisplay,
      inFiat: fiatPriceDisplay ?? '$0',
    }
  }

  const prefix = actionSize > 0 ? `${equalitySymbol} ` : ''
  const btcPriceDisplay =
    prettyBalance(
      actionSize * selectedFeebPlan.value.feeRate,
      get(useBtcUnit),
    ) +
    ' ' +
    unit.value

  const fiatPriceDisplay =
    fiatRate.value && actionSize > 0
      ? getFiatPriceDisplay(
          actionSize * selectedFeebPlan.value.feeRate,
          get(fiatRate),
        )
      : ''

  return {
    inCrypto: prefix + btcPriceDisplay,
    inFiat: fiatPriceDisplay ?? '$0',
  }
}

const networkStore = useNetworkStore()
const { data: feebPlans, isLoading: isLoadingFeebPlans } = useQuery({
  queryKey: ['feebPlans', { network: networkStore.network }],
  queryFn: () => getFeebPlans(),
})
const selectableFeebPlans = computed(() => {
  if (!feebPlans.value) return

  return [...feebPlans.value, customFeebPlan.value]
})

const selectedFeebPlanTitle = useStorage('selectedFeebPlanTitle', 'Avg')
const selectedFeebPlan = computed(() => {
  if (!feebPlans.value) return

  if (selectedFeebPlanTitle.value === 'Custom') {
    return customFeebPlan.value
  }

  return feebPlans.value.find(
    (plan) => plan.title === selectedFeebPlanTitle.value,
  )
})
// tell feebStore whenever selectedFeebPlan changes
const feebStore = useFeebStore()
watch(
  selectedFeebPlan,
  (plan, oldValue) => {
    if (!plan) return
    if (!plan.feeRate) return

    feebStore.set(plan.feeRate)

    // if ()
    sleep(1000).then(async () => {
      await getClaimFee()
    })
  },
  { immediate: true, deep: true },
)

const traffic = computed(() => {
  if (!feebPlans.value) return '-'

  const avgFeeRate = feebPlans.value[2].feeRate

  if (avgFeeRate < 20) return 'Low'
  if (avgFeeRate < 50) return 'Normal'
  if (avgFeeRate < 150) return 'Busy'

  return 'Extremely Busy'
})
const trafficColorClass = computed(() => {
  switch (traffic.value) {
    case 'Low':
      return {
        text: 'text-green-500',
        bg: 'bg-green-500',
        secondaryBg: 'bg-green-400',
      }
    case 'Normal':
      return {
        text: 'text-yellow-500',
        bg: 'bg-yellow-500',
        secondaryBg: 'bg-yellow-400',
      }
    case 'Busy':
    case 'Extremely Busy':
      return {
        text: 'text-red-500',
        bg: 'bg-red-500',
        secondaryBg: 'bg-red-400',
      }
    default:
      return {
        text: 'text-zinc-500',
        bg: 'bg-zinc-500',
        secondaryBg: 'bg-zinc-400',
      }
  }
})
// cars symbol
const colorCarsCount = computed(() => {
  if (!feebPlans.value) return 0

  switch (traffic.value) {
    case 'Low':
      return 1
    case 'Normal':
      return 2
    case 'Busy':
      return 3
    case 'Extremely Busy':
      return 4
    default:
      return 0
  }
})
const delayedControl = ref(false)
watch(isOpen, (open) => {
  if (open) {
    setTimeout(() => {
      delayedControl.value = true
    }, 500)
  } else {
    delayedControl.value = false
  }
})
</script>

<template>
  <Dialog
    class="relative z-50 text-xs text-zinc-300 lg:text-sm"
    :open="isOpen"
    @close="closeModal"
  >
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div class="fixed inset-0 overflow-y-auto text-zinc-300">
        <div class="flex min-h-full items-center justify-center lg:p-4">
          <DialogPanel
            class="min-h-svh w-svw origin-top-right overflow-hidden rounded-md bg-zinc-800 px-4 shadow-lg shadow-primary/20 ring-1 ring-black ring-opacity-5 focus:outline-none lg:min-h-fit lg:w-[720px]"
          >
            <div class="divide-y-2 divide-zinc-700">
              <div class="py-4">
                <!-- mobile close button -->
                <div class="flex justify-end pb-2 lg:hidden">
                  <button @click="closeModal" class="">
                    <XIcon class="size-8 rounded-full bg-zinc-700 p-1.5" />
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <div class="item-label">BTC Network Traffic</div>

                  <div class="flex items-center gap-4">
                    <transition
                      enter-active-class="transition duration-1000 ease-out"
                      enter-from-class="-translate-x-9 opacity-50"
                      enter-to-class="translate-x-0 opacity-100"
                    >
                      <div class="flex gap-1" v-show="delayedControl">
                        <CarIcon
                          class="h-6 w-6"
                          :class="trafficColorClass.text"
                          aria-hidden="true"
                          v-for="i in Array.from({ length: colorCarsCount })"
                        />
                        <!-- zinc cars -->
                        <CarIcon
                          class="h-6 w-6 text-zinc-700"
                          aria-hidden="true"
                          v-for="i in Array.from({
                            length: 4 - colorCarsCount,
                          })"
                        />
                      </div>
                    </transition>

                    <div class="py-1 font-bold" :class="trafficColorClass.text">
                      {{ traffic }}
                    </div>
                  </div>
                </div>

                <div class="mt-4 text-xs text-zinc-500">
                  <p>
                    BTC network traffic is
                    <span
                      class="whitespace-nowrap rounded bg-black px-2 py-1 text-xs font-bold"
                      :class="[trafficColorClass.text]"
                    >
                      {{ traffic }}
                    </span>
                    now.
                  </p>
                  <p class="mt-2">
                    This affects the confirm speed of your transactions. The
                    higher the traffic, the higher the fee rate you need to pay
                    to get your transaction confirmed in time.
                  </p>
                </div>
              </div>

              <div
                class="grid grid-cols-2 divide-x-2 divide-zinc-700 py-4 lg:grid-cols-5"
              >
                <div
                  class="col-span-1 flex flex-col items-stretch justify-between gap-4 pr-2 lg:col-span-2 lg:pr-4"
                >
                  <div class="item-label leading-none">Choose Gas Plan</div>

                  <div class="grow">
                    <RadioGroup name="feebPlan" v-model="selectedFeebPlanTitle">
                      <div class="space-y-2 lg:space-y-4">
                        <RadioGroupOption
                          as="template"
                          v-for="plan in selectableFeebPlans"
                          :key="plan.title"
                          :value="plan.title"
                          v-slot="{ active, checked }"
                        >
                          <div
                            :class="[
                              active
                                ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-primary'
                                : '',
                              checked
                                ? 'bg-primary/75 text-white '
                                : 'bg-black ',
                            ]"
                            class="lg:ph-4 relative flex cursor-pointer rounded-lg px-2 py-2 shadow-md focus:outline-none lg:px-5"
                          >
                            <div
                              class="flex w-full items-center justify-between"
                            >
                              <div class="flex items-center">
                                <div class="text-xs lg:text-sm">
                                  <div class="flex items-center gap-3">
                                    <component
                                      :is="getFeePlanIcon(plan.title)"
                                      class="size-6"
                                    ></component>

                                    <RadioGroupLabel
                                      as="p"
                                      :class="
                                        checked ? 'text-white' : 'text-zinc-300'
                                      "
                                      class="text-sm font-medium lg:text-lg"
                                    >
                                      {{ plan.fullTitle || plan.title }}
                                    </RadioGroupLabel>
                                  </div>

                                  <RadioGroupDescription
                                    as="span"
                                    :class="
                                      checked
                                        ? 'text-orange-100'
                                        : 'text-zinc-500'
                                    "
                                    class="inline"
                                  >
                                    <div class="mt-1">
                                      <div
                                        class="mb-1 flex items-center gap-1"
                                        v-if="
                                          plan.title.toLowerCase() === 'custom'
                                        "
                                      >
                                        <input
                                          type="text"
                                          class="w-8 rounded border-0 border-b !border-zinc-500 bg-transparent px-0 py-0.5 text-center text-xs outline-none focus:ring-0 focus:ring-transparent lg:text-sm"
                                          autocomplete="off"
                                          :class="
                                            checked
                                              ? 'text-white'
                                              : 'text-zinc-300'
                                          "
                                          :value="customFeeb"
                                          name="customFeeb"
                                          @input="
                                            (event) => updateCustomFeeb(event)
                                          "
                                        />

                                        <span>
                                          {{ `sat/vB` }}
                                        </span>
                                      </div>

                                      <span v-else>
                                        {{ `${plan.feeRate} sat/vB` }}
                                      </span>
                                    </div>
                                  </RadioGroupDescription>
                                </div>
                              </div>
                              <div v-show="checked" class="shrink-0 text-white">
                                <CheckIcon
                                  class="h-6 w-6 rounded-full bg-white/40 p-1"
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                          </div>
                        </RadioGroupOption>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div class="col-span-1 pl-2 lg:col-span-3 lg:pl-4">
                  <div class="item-label align-top leading-none">
                    Estimated Gas
                  </div>

                  <div class="mt-4">
                    <h3 class="text-zinc-500">Make Order Actions</h3>
                    <div class="mt-1.5">
                      <div
                        class="flex items-center justify-between border-y border-zinc-700 py-3"
                        v-for="action in makeActions"
                        :key="action.title"
                      >
                        <div class="text-primary">
                          {{ action.title }}
                        </div>

                        <div class="flex gap-4 text-right">
                          <div class="font-bold">
                            {{
                              getPoolActionsPriceDisplay(action.size).inCrypto
                            }}
                            <div class="pl-2 text-xs text-zinc-500">
                              {{
                                getPoolActionsPriceDisplay(action.size).inFiat
                              }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 class="mt-12 text-zinc-500">Take Order Actions</h3>
                    <div class="mt-1.5">
                      <div
                        class="flex items-center justify-between border-y border-zinc-700 py-3"
                        v-for="action in takeActions"
                        :key="action.title"
                      >
                        <div class="text-primary">
                          {{ action.title }}
                        </div>

                        <div class="flex gap-4 text-right">
                          <div class="font-bold">
                            {{
                              getPoolActionsPriceDisplay(action.size).inCrypto
                            }}
                            <div class="pl-2 text-xs text-zinc-500">
                              {{
                                getPoolActionsPriceDisplay(action.size).inFiat
                              }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </transition>
  </Dialog>
</template>

<style scoped>
.item-label {
  @apply shrink-0 text-zinc-300;
}
</style>
