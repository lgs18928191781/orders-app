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
  const fees = await getRewardClaimFees()
  claimFee.value = new Decimal(fees.rewardInscriptionFee)
    .plus(fees.rewardSendFee)
    .toNumber()
}

function getPoolActionsPriceDisplay(
  actionSize: number,
  equalitySymbol: string = '>=',
  isClaim?: boolean
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
      get(useBtcUnit)
    ) +
    ' ' +
    unit.value

  const fiatPriceDisplay =
    fiatRate.value && actionSize > 0
      ? getFiatPriceDisplay(
          actionSize * selectedFeebPlan.value.feeRate,
          get(fiatRate)
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
    (plan) => plan.title === selectedFeebPlanTitle.value
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
  { immediate: true, deep: true }
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
    class="relative text-sm text-zinc-300 z-50"
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
        <div class="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            class="w-[720px] origin-top-right overflow-hidden rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none px-4 shadow-primary/20"
          >
            <div class="divide-y-2 divide-zinc-700">
              <div class="py-4">
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

                    <div class="font-bold py-1" :class="trafficColorClass.text">
                      {{ traffic }}
                    </div>
                  </div>
                </div>

                <div class="text-zinc-500 mt-4 text-xs">
                  <p>
                    BTC network traffic is
                    <span
                      class="font-bold text-xs bg-black py-1 px-2 rounded whitespace-nowrap"
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

              <div class="grid grid-cols-5 divide-x-2 divide-zinc-700 py-4">
                <div
                  class="flex flex-col items-stretch gap-4 justify-between pr-4 col-span-2"
                >
                  <div class="item-label leading-none">Choose Gas Plan</div>

                  <div class="grow">
                    <RadioGroup name="feebPlan" v-model="selectedFeebPlanTitle">
                      <div class="space-y-4">
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
                            class="relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none"
                          >
                            <div
                              class="flex w-full items-center justify-between"
                            >
                              <div class="flex items-center">
                                <div class="text-sm">
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
                                      class="font-medium text-lg"
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
                                        class="flex gap-1 items-center mb-1"
                                        v-if="
                                          plan.title.toLowerCase() === 'custom'
                                        "
                                      >
                                        <input
                                          type="text"
                                          class="bg-transparent text-sm w-8 border-0 outline-none border-b !border-zinc-500 py-0.5 px-0 focus:ring-0 focus:ring-transparent text-center rounded"
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

                <div class="pl-4 col-span-3">
                  <div class="item-label align-top leading-none">
                    Estimated Gas
                  </div>

                  <div class="mt-4">
                    <h3 class="text-zinc-500">Make Order Actions</h3>
                    <div class="mt-1.5">
                      <div
                        class="flex items-center justify-between py-3 border-y border-zinc-700"
                        v-for="action in makeActions"
                        :key="action.title"
                      >
                        <div class="text-primary">
                          {{ action.title }}
                        </div>

                        <div class="text-right flex gap-4">
                          <div class="font-bold">
                            {{
                              getPoolActionsPriceDisplay(action.size).inCrypto
                            }}
                            <div class="pl-2 text-zinc-500 text-xs">
                              {{
                                getPoolActionsPriceDisplay(action.size).inFiat
                              }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 class="text-zinc-500 mt-12">Take Order Actions</h3>
                    <div class="mt-1.5">
                      <div
                        class="flex items-center justify-between py-3 border-y border-zinc-700"
                        v-for="action in takeActions"
                        :key="action.title"
                      >
                        <div class="text-primary">
                          {{ action.title }}
                        </div>

                        <div class="text-right flex gap-4">
                          <div class="font-bold">
                            {{
                              getPoolActionsPriceDisplay(action.size).inCrypto
                            }}
                            <div class="pl-2 text-zinc-500 text-xs">
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
  @apply text-zinc-300 shrink-0;
}
</style>
