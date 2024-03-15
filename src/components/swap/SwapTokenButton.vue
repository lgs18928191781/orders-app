<script setup lang="ts">
defineProps<{
  token: string
}>()
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-full border-2 border-black bg-black p-1.5 pr-2 text-zinc-300 hover:border-primary hover:text-primary"
  >
    <TokenIcon :token="token" class="size-6 rounded-full" />
    <span>{{ token }}</span>
  </button>
</template>
