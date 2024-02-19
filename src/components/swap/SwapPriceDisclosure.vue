<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import Decimal from 'decimal.js'
import { ChevronDownIcon } from 'lucide-vue-next'
import { computed } from 'vue'

import { prettySymbol } from '@/lib/formatters'

const props = defineProps({
  paySymbol: {
    type: String,
    required: true,
  },
  receiveSymbol: {
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
})

const ratioDisplay = computed(() => {
  if (props.receiveSymbol.toLowerCase() === 'btc') {
    return {
      receiveSymbol: 'BTC',
      paySymbol: prettySymbol(props.paySymbol),
      ratio: (props.ratio as Decimal).mul(1e8).toDP().toFixed(),
    }
  }

  return {
    receiveSymbol: prettySymbol(props.receiveSymbol),
    paySymbol: 'sats',
    ratio: (props.ratio as Decimal).toDP().toFixed(),
  }
})

const impact = computed(() => {
  const poolRatio = props.poolRatio as Decimal
  const ratio = props.ratio as Decimal
  const impact = poolRatio
    .sub(ratio)
    .div(poolRatio)
    .mul(100)
    .toDP(2)
    .abs()
    .toFixed()

  return impact
})
</script>

<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="rounded-2xl border border-zinc-700 p-4 mt-2"
  >
    <div class="text-zinc-500" v-if="calculating">Calculating...</div>
    <template v-else>
      <DisclosureButton
        class="flex w-full items-center justify-between text-sm focus:outline-none"
      >
        <div class="flex items-center gap-2">
          <div class="">{{ `1 ${ratioDisplay.receiveSymbol}` }}</div>
          <div>≈</div>
          <div class="">
            {{ `${ratioDisplay.ratio} ${ratioDisplay.paySymbol}` }}
          </div>
        </div>
        <ChevronDownIcon
          class="h-5 w-5 duration-200 text-zinc-500"
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
            class="text-sm border-t border-zinc-700 pt-4 mt-4 flex flex-col gap-2"
            static
          >
            <div class="flex w-full items-center justify-between">
              <span class="label">Price impact</span>
              <span class="value">~{{ impact }}%</span>
            </div>

            <div class="flex w-full items-center justify-start gap-2">
              <span class="label">Service fee</span>
              <span class="ml-auto line-through text-zinc-500 decoration-2">
                1.5%
              </span>
              <span
                class="rounded bg-green-700/30 px-2 text-xs font-bold text-green-500"
              >
                FREE
              </span>
            </div>
          </DisclosurePanel>
        </transition>
      </div>
    </template>
  </Disclosure>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply text-zinc-300;
}
</style>
