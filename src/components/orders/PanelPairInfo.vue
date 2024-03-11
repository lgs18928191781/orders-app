<script setup lang="ts">
import OrdersPanelHeader from '@/components/orders/PanelHeader.vue'
</script>

<template>
  <div class="primary-panel flex flex-col">
    <OrdersPanelHeader />
    <div class="flex grow flex-col space-y-4 p-4">
      <KLineChart />
    </div>
  </div>
</template>

<style scoped></style>
