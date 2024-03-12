<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ChevronDownIcon } from 'lucide-vue-next'
import Decimal from 'decimal.js'
import { computed } from 'vue'

import { prettySymbol } from '@/lib/formatters'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipArrow,
} from '@/components/ui/tooltip'
import { useFiat } from '@/hooks/use-fiat'

const props = defineProps({
  token1Symbol: {
    type: String,
    required: true,
  },
  token2Symbol: {
    type: String,
    required: true,
  },
  ratio: {
    required: true,
  },
  poolRatio: {
    required: true,
  },
  calculating: {
    type: Boolean,
    default: false,
  },
  priceImpact: {
    required: true,
  },
  hasImpactWarning: {
    type: Boolean,
    default: false,
  },
  serviceFee: {
    required: true,
  },
})

const { isShowingFiat, useFiatRateQuery, getFiatPriceDisplay } = useFiat()
const { data: fiatRate } = useFiatRateQuery()

const ratioDisplay = computed(() => {
  const radioRawNumber = (props.ratio as Decimal).div(1e8)
  const useDP = radioRawNumber.gte(100) ? 2 : 8
  return radioRawNumber.toDP(useDP).toFixed()
})
const reversedRatioDisplay = computed(() => {
  const radioRawNumber = (props.ratio as Decimal).div(1e8).pow(-1)
  const useDP = radioRawNumber.gte(100) ? 2 : 8
  return radioRawNumber.toDP(useDP).toFixed()
})

const impactColor = computed(() => {
  const impactInDecimal = props.priceImpact as Decimal

  if (impactInDecimal.gte(5)) return 'text-red-500'
  if (impactInDecimal.gte(3)) return 'text-yellow-500'

  return 'text-zinc-300'
})

const serviceFeeDisplay = computed(() => {
  const serviceFee = props.serviceFee as Decimal

  if (serviceFee.eq(2000)) return '0.00002000 BTC'

  return serviceFee.div(1e8).toFixed(8) + ' BTC (1%)'
})
</script>

<template>
  <div class="">
    <!-- price impact warning -->
    <TooltipProvider v-if="hasImpactWarning">
      <Tooltip>
        <TooltipTrigger
          class="mt-2 flex cursor-pointer items-center justify-between rounded-2xl border border-red-500/30 p-3 text-xs lg:text-sm"
          as="div"
        >
          <div>Price Impact Warning</div>
          <span class="text-red-500">~{{ priceImpact }}%</span>
        </TooltipTrigger>

        <TooltipContent side="left" :side-offset="2" class="w-96 px-4 py-6">
          <p>
            A swap of this size may have a high price impact, given the current
            liquidity in the pool. There may be a large difference between the
            amount of your input token and what you will receive in the output
            token
          </p>

          <TooltipArrow class="fill-zinc-700" size="12" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <Disclosure
      v-slot="{ open }"
      as="div"
      :default-open="true"
      class="mt-2 rounded-2xl border border-zinc-700 p-4"
    >
      <div class="text-zinc-500" v-if="calculating">Calculating...</div>
      <template v-else>
        <DisclosureButton
          class="flex w-full items-center justify-between text-xs text-zinc-300 focus:outline-none lg:text-sm"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div class="">{{ `1 ${prettySymbol(token1Symbol)}` }}</div>
              <div>≈</div>
              <div class="">
                {{ `${reversedRatioDisplay} ${prettySymbol(token2Symbol)}` }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="">{{ `1 ${prettySymbol(token2Symbol)}` }}</div>
              <div>≈</div>
              <div class="">
                {{ `${ratioDisplay} ${prettySymbol(token1Symbol)}` }}
              </div>
            </div>
          </div>

          <ChevronDownIcon
            class="h-5 w-5 text-zinc-500 duration-200"
            :class="{ 'rotate-180 transform': open }"
          />
        </DisclosureButton>

        <div v-if="open">
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-y-1 opacity-0 "
            enter-to-class="translate-y-0 opacity-100 "
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 opacity-100 "
            leave-to-class="translate-y-1 opacity-0 "
          >
            <DisclosurePanel
              class="mt-4 flex flex-col gap-2 border-t border-zinc-700 pt-4 text-xs lg:text-sm"
              static
            >
              <div class="flex w-full items-center justify-between">
                <span class="label">Price impact</span>
                <span :class="impactColor">~{{ priceImpact }}%</span>
              </div>

              <div class="flex w-full items-center justify-start gap-2">
                <span class="label">Service fee</span>
                <span class="ml-auto">{{ serviceFeeDisplay }}</span>
                <div
                  class="text-right text-xs text-zinc-500 lg:text-sm"
                  v-if="isShowingFiat && fiatRate && serviceFee"
                >
                  {{
                    getFiatPriceDisplay(
                      (serviceFee as Decimal).toNumber(),
                      fiatRate,
                    )
                  }}
                </div>
              </div>
            </DisclosurePanel>
          </transition>
        </div>
      </template>
    </Disclosure>
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply text-zinc-300;
}
</style>
