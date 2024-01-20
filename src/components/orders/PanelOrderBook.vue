<script lang="ts" setup>
import { Switch, SwitchGroup } from '@headlessui/vue'
import { useStorage } from '@vueuse/core'
import { watch } from 'vue'
import { DollarSignIcon } from 'lucide-vue-next'

import { useScrollOrdersArea } from '@/hooks/use-scroll-orders-area'
import { useFiat } from '@/hooks/use-fiat'

import OrderList from './OrderList.vue'

const { isShowingFiat } = useFiat()
const { scroll } = useScrollOrdersArea()

watch(isShowingFiat, () => {
  scroll()
})
</script>

<template>
  <div class="primary-panel flex flex-col">
    <div
      class="p-4 bg-zinc-800 flex items-center lg:flex-row gap-4 rounded-t-lg justify-between"
    >
      <div class="font-bold">Order Book</div>

      <SwitchGroup
        as="div"
        class="flex items-center justify-between font-normal gap-2"
      >
        <Switch
          v-model="isShowingFiat"
          :class="isShowingFiat ? 'bg-primary' : 'bg-black'"
          class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
          v-slot="{ checked }"
        >
          <span
            aria-hidden="true"
            :class="isShowingFiat ? 'translate-x-6' : 'translate-x-0'"
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
          >
            <DollarSignIcon
              class="h-5 w-5 text-orange-800 transition"
              :class="{ '-rotate-12': checked }"
            />
          </span>
        </Switch>
      </SwitchGroup>
    </div>

    <OrderList />
  </div>
</template>
