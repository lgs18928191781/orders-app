<script setup lang="ts"></script>

<template>
  <div class="base blur"></div>
  <div class="base blur-md"></div>
  <div class="base blur-lg"></div>
  <div class="base blur-xl"></div>
  <div class="base blur-2xl"></div>
  <div class="base blur-3xl"></div>
</template>

<style scoped>
.base {
  @apply absolute inset-0 -z-10 rounded-ee-3xl bg-primary/[0.03];
}
</style>
