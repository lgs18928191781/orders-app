<script setup lang="ts">
import { useTokenIcon } from '@/hooks/use-token-icon'
import { ref } from 'vue'

const props = defineProps<{
  token: string
}>()

const { iconUrl } = useTokenIcon(ref(props.token))
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-full border-2 border-black bg-black p-1.5 pr-2 text-zinc-300 hover:border-primary hover:text-primary"
  >
    <IconImage :src="iconUrl" class="size-6 rounded-full" />
    <span>{{ token }}</span>
  </button>
</template>
