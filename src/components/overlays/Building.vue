<script lang="ts" setup>
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { Loader2Icon } from 'lucide-vue-next'

const { isBuilding } = useBuildingOverlay()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/40 px-8 backdrop-blur"
    v-show="isBuilding"
  >
    <div
      class="flex h-48 w-96 max-w-lg items-center justify-center gap-4 rounded-xl bg-zinc-800 text-center text-zinc-300"
    >
      <Loader2Icon class="h-8 w-8 animate-spin text-primary" />
      <p>Building Transaction...</p>
    </div>
  </div>
</template>
