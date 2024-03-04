<script setup lang="ts">
import { ChevronsLeftIcon } from 'lucide-vue-next'

import { useExpandSwap } from '@/hooks/use-expand-swap'
const { isExpanded, toggleExpand } = useExpandSwap()
</script>

<template>
  <button
    class="absolute top-0 left-0 flex justify-center -translate-x-[60%] px-2 h-full -z-10 pr-8 rounded-l-3xl transition-all group hover:bg-gradient-to-r from-transparent to-primary/[0.15] pb-8"
    @click="toggleExpand"
  >
    <ChevronsLeftIcon
      class="h-5 w-5 text-zinc-700 mt-16 group-hover:-translate-x-1 group-hover:text-primary/80 transition-all duration-300"
      :class="{
        'rotate-180': isExpanded,
      }"
    />
  </button>
</template>

<style scoped></style>
