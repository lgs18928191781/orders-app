<script lang="ts" setup>
import OrderConfirmationModal from '@/components/overlays/ConfirmationModal.vue'
import PanelOrderBook from '@/components/orders/PanelOrderBook.vue'
import PanelPairInfo from '@/components/orders/PanelPairInfo.vue'
import PanelHistoryIndex from '@/components/orders/history/PanelHistoryIndex.vue'
import PanelTrade from '@/components/orders/PanelTrade.vue'
</script>

<template>
  <div
    class="mx-auto mb-6 grid w-full max-w-9xl grow grid-cols-1 gap-3 px-3 lg:grid-flow-dense lg:grid-cols-10 lg:grid-rows-5"
  >
    <PanelPairInfo class="col-span-1 lg:col-span-4 lg:row-span-3" />

    <!-- table -->
    <PanelTrade class="col-span-1 grow lg:col-span-3 lg:row-span-3" />

    <PanelHistoryIndex
      class="col-span-1 lg:col-span-10 lg:row-span-2 2xl:col-span-7"
    />

    <PanelOrderBook
      class="col-span-1 lg:col-span-3 lg:row-span-3 2xl:row-span-5"
    />

    <!-- modal -->
    <OrderConfirmationModal />
  </div>
</template>
