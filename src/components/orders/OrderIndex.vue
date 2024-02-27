<script lang="ts" setup>
import OrderConfirmationModal from '@/components/overlays/ConfirmationModal.vue'
import PanelOrderBook from '@/components/orders/PanelOrderBook.vue'
import PanelPairInfo from '@/components/orders/PanelPairInfo.vue'
import PanelHistoryIndex from '@/components/orders/history/PanelHistoryIndex.vue'
import PanelTrade from '@/components/orders/PanelTrade.vue'
</script>

<template>
  <div
    class="mx-auto mb-6 grid w-full max-w-9xl grow grid-flow-dense grid-cols-10 grid-rows-5 gap-3 px-3"
  >
    <!-- <div class="col-span-7 flex flex-col">
      <div class="grid grid-cols-7 gap-3 mb-3"> -->
    <PanelPairInfo class="col-span-4 row-span-3" />

    <!-- table -->
    <PanelTrade class="col-span-3 row-span-3 grow" />
    <!-- </div> -->

    <PanelHistoryIndex class="col-span-10 row-span-2 2xl:col-span-7" />
    <!-- </div> -->

    <PanelOrderBook class="col-span-3 row-span-3 2xl:row-span-5" />

    <!-- modal -->
    <OrderConfirmationModal />
  </div>
</template>
