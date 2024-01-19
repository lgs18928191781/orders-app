<script lang="ts" setup>
import { useBuildingOverlay } from '@/hooks/use-building-overlay'
import { Loader2Icon } from 'lucide-vue-next'

const { isBuilding } = useBuildingOverlay()
</script>

<template>
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur flex flex-col items-center justify-center gap-8 px-8 z-50"
    v-show="isBuilding"
  >
    <div
      class="text-zinc-300 text-center bg-zinc-800 rounded-xl h-48 w-96 max-w-lg flex items-center justify-center gap-4"
    >
      <Loader2Icon class="animate-spin h-8 w-8 text-primary" />
      <p>Building Transaction...</p>
    </div>
  </div>
</template>
