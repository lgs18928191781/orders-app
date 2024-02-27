<script setup lang="ts">
const props = defineProps({
  dangerous: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button
    class="group relative z-30 inline-flex w-full cursor-pointer overflow-hidden rounded-2xl"
  >
    <span
      class="group-disabled:bg-zinc-800! absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-enabled:bg-[conic-gradient(from_90deg_at_50%_50%,#FFA02A_0%,#dff7cc_30%,#FFA02A_100%)]"
    ></span>
    <span
      class="m-px inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-black bg-opacity-90 px-3 py-4 text-xl font-medium backdrop-blur-3xl transition-all duration-200 group-hover:bg-opacity-70 group-disabled:cursor-not-allowed group-disabled:bg-zinc-800 group-disabled:text-zinc-300/50"
      :class="[
        dangerous ? 'text-red-500' : 'text-primary group-hover:text-orange-100',
      ]"
    >
      <slot></slot>
    </span>
  </button>
</template>
