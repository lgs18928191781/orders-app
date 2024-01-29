<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ChevronDownIcon } from 'lucide-vue-next'

const props = defineProps({
  paySymbol: {
    type: String,
    required: true,
  },
  receiveSymbol: {
    type: String,
    required: true,
  },
  // tokenRate: {
  //   type: Number,
  //   required: true,
  // },
  // tokenImpact: {
  //   type: Object,
  //   required: true,
  // },
})
</script>

<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="rounded-2xl border border-zinc-800 p-3 mt-1"
  >
    <DisclosureButton
      class="flex w-full items-center justify-between text-sm focus:outline-none"
    >
      <div class="flex items-center">
        <span class="mr-1">1</span
        ><span class="mr-1">{{ receiveSymbol.toUpperCase() }}</span>
        <span class="mr-1"><span class="mr-1">≈</span>{{ tokenRateCalc }}</span
        ><span class="mr-1">{{ paySymbol.toUpperCase() }}</span>
      </div>
      <ChevronDownIcon
        class="h-6 w-6 duration-200"
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
        <DisclosurePanel class="text-sm" static>
          <div class="mt-2 grid grid-cols-1">
            <div class="mt-1 flex w-full items-center justify-between">
              <span>Exchange rate impact:</span>
              <span>{{ tokenImpact.slip2 }}%</span>
            </div>
            <div class="mt-3 flex w-full items-center justify-between">
              <span>Swap fee:</span>
              <span></span>
            </div>
          </div>

          <img src="" alt="" />
        </DisclosurePanel>
      </transition>
    </div>
  </Disclosure>
</template>

<style scoped></style>
