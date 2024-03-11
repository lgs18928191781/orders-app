<script lang="ts" setup>
import logo from '@/assets/logo-new.png?url'
</script>

<template>
  <div
    class="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-zinc-950 px-8"
  >
    <img class="-mt-16 h-12" :src="logo" alt="Logo" />
    <div class="space-y-2 text-center text-zinc-500">
      <p>This app is not available on mobile devices.</p>
      <p>Please use a desktop browser like Chrome or Safari.</p>
    </div>
  </div>
</template>
