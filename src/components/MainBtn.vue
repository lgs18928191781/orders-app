<script setup lang="ts"></script>

<template>
  <button
    class="relative inline-flex overflow-hidden rounded-2xl group w-full cursor-pointer z-30"
  >
    <span
      class="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-enabled:bg-[conic-gradient(from_90deg_at_50%_50%,#FFA02A_0%,#dff7cc_30%,#FFA02A_100%)] group-disabled:bg-zinc-800!"
    ></span>
    <span
      class="inline-flex h-full w-full cursor-pointer items-center justify-center bg-black px-3 py-3 font-medium text-primary backdrop-blur-3xl text-xl rounded-2xl group-disabled:text-zinc-300/50 group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed m-px group-hover:bg-opacity-80 group-hover:text-orange-100 transition-all duration-200"
    >
      <slot></slot>
    </span>
  </button>
</template>
