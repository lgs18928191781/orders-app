<script setup lang="ts">
import OrderList from '@/components/orders/List.vue'
import OrdersPanelHeader from '@/components/orders/PanelHeader.vue'
</script>

<template>
  <div class="primary-panel">
    <OrderList
      :askOrders="askOrders"
      :bidOrders="bidOrders"
      class="col-span-1 self-stretch p-4"
      @use-buy-price="(price: number, orderId: string) => setUseBuyPrice(price, orderId)"
      @use-sell-price="(price: number, orderId: string) => setUseSellPrice(price, orderId)"
    />
  </div>
</template>

<style scoped></style>
