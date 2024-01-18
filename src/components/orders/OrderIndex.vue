<script lang="ts" setup>
import { ref } from 'vue'

import OrderConfirmationModal from '../ConfirmationModal.vue'
import PanelOrderBook from '@/components/orders/PanelOrderBook.vue'
import PanelPairInfo from '@/components/orders/PanelPairInfo.vue'
import PanelOrderHistory from '@/components/orders/PanelOrderHistory.vue'
import PanelTrade from '@/components/orders/PanelTrade.vue'

// confirm modal
const isOpen = ref(false)
const isBuilding = ref(false)
const builtInfo = ref()

// limit exchange mode
const isLimitExchangeMode = ref(false)
</script>

<template>
  <div class="grid grid-cols-10 mx-auto px-3 mb-3 grow w-full max-w-9xl gap-3">
    <div class="col-span-7 flex flex-col">
      <div class="grid grid-cols-7 gap-3 mb-3">
        <PanelPairInfo class="col-span-4" />

        <!-- table -->
        <PanelTrade class="col-span-3 grow" />
      </div>

      <PanelOrderHistory />
    </div>

    <PanelOrderBook class="col-span-3" />

    <!-- modal -->
    <OrderConfirmationModal
      v-model:is-open="isOpen"
      v-model:is-building="isBuilding"
      v-model:built-info="builtInfo"
      v-model:is-limit-exchange-mode="isLimitExchangeMode"
      :build-process-tip="'Building Transaction'"
    />
  </div>
</template>
