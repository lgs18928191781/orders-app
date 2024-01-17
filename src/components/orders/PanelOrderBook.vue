<script lang="ts" setup>
import OrderList from './List.vue'
</script>

<template>
  <div class="primary-panel flex flex-col">
    <div class="p-4 bg-zinc-800 flex flex-col lg:flex-row gap-4 rounded-t-lg">
      Order Book
    </div>

    <OrderList />
  </div>
</template>
