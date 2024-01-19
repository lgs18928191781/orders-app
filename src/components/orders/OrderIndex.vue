<script lang="ts" setup>
import OrderConfirmationModal from '@/components/overlays/ConfirmationModal.vue'
import PanelOrderBook from '@/components/orders/PanelOrderBook.vue'
import PanelPairInfo from '@/components/orders/PanelPairInfo.vue'
import PanelHistoryIndex from '@/components/orders/history/PanelHistoryIndex.vue'
import PanelTrade from '@/components/orders/PanelTrade.vue'
</script>

<template>
  <div class="grid grid-cols-10 mx-auto px-3 mb-6 grow w-full max-w-9xl gap-3">
    <div class="col-span-7 flex flex-col">
      <div class="grid grid-cols-7 gap-3 mb-3">
        <PanelPairInfo class="col-span-4" />

        <!-- table -->
        <PanelTrade class="col-span-3 grow" />
      </div>

      <PanelHistoryIndex />
    </div>

    <PanelOrderBook class="col-span-3" />

    <!-- modal -->
    <OrderConfirmationModal />
  </div>
</template>
