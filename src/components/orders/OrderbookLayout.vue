<script lang="ts" setup>
import OrderConfirmationModal from '@/components/overlays/ConfirmationModal.vue'
</script>

<template>
  <div
    class="mx-auto mb-6 w-full max-w-9xl grow grid-cols-1 space-y-3 px-3 pt-4 lg:grid lg:grid-flow-dense lg:grid-cols-10 lg:grid-rows-5 lg:gap-3 lg:space-y-0 lg:pt-0"
  >
    <PanelPairInfo
      class="col-span-1 self-stretch lg:col-span-4 lg:row-span-3"
    />

    <!-- table -->
    <PanelTrade class="col-span-1 grow lg:col-span-3 lg:row-span-3" />

    <PanelOrderBook
      class="col-span-1 lg:col-span-3 lg:row-span-3 2xl:row-span-5"
    />

    <PanelHistoryIndex
      class="col-span-1 hidden lg:col-span-10 lg:row-span-2 lg:block 2xl:col-span-7"
    />

    <!-- modal -->
    <OrderConfirmationModal />
  </div>
</template>
