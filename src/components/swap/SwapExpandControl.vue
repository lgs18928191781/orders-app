<script setup lang="ts">
import { ChevronsDownIcon, ChevronsLeftIcon } from 'lucide-vue-next'

import { useExpandSwap } from '@/hooks/use-expand-swap'
const { isExpanded, toggleExpand } = useExpandSwap()
</script>

<template>
  <button
    class="group absolute left-0 top-0 -z-10 hidden h-full -translate-x-[60%] justify-center rounded-l-3xl from-transparent to-primary/[0.15] px-2 pb-8 pr-8 transition-all hover:bg-gradient-to-r lg:flex"
    @click="toggleExpand"
  >
    <ChevronsLeftIcon
      class="mt-16 h-5 w-5 text-zinc-700 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary/80"
      :class="{
        'rotate-180': isExpanded,
      }"
    />
  </button>

  <!-- <button
    class="inline-flex justify-center w-full lg:hidden text-zinc-500 items-center gap-2 mt-2"
    @click="toggleExpand"
  >
    <ChevronsDownIcon
      class="h-5 w-5 group-hover:-translate-x-1 group-hover:text-primary/80 transition-all duration-300"
      :class="{
        'rotate-180': isExpanded,
      }"
    />
    <span> Show pool stats </span>
  </button> -->
</template>

<style scoped></style>
