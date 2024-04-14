<script setup lang="ts">
import { ChevronsLeftIcon } from 'lucide-vue-next'

import { useExpandSwap } from '@/hooks/use-expand-swap'
const { isExpanded, toggleExpand } = useExpandSwap()
</script>

<template>
  <button
    class="group absolute left-0 top-0 -z-10 hidden h-full -translate-x-[60%] justify-center rounded-l-3xl from-transparent to-primary/[0.2] px-2 pb-8 pr-8 transition-all hover:bg-gradient-to-r lg:flex"
    @click="toggleExpand"
  >
    <ChevronsLeftIcon
      class="mr-2 mt-16 size-8 text-zinc-500 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary/80"
      :class="{
        'rotate-180': isExpanded,
      }"
    />
  </button>
</template>

<style scoped></style>
