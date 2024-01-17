<script setup lang="ts">
import OrdersPanelHeader from '@/components/orders/PanelHeader.vue'
import KLineChart from '@/components/orders/KLineChart.vue'
</script>

<template>
  <div class="primary-panel flex flex-col">
    <OrdersPanelHeader />
    <div class="p-4 space-y-4 flex flex-col grow">
      <KLineChart />
    </div>
  </div>
</template>

<style scoped></style>
