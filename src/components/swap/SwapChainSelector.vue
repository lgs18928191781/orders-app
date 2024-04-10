<script setup lang="ts">
import { ArrowRightLeftIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  chain: 'btc' | 'mvc'
}>()

const otherChain = computed(() => (props.chain === 'btc' ? 'mvc' : 'btc'))

const router = useRouter()
function switchChain() {
  if (props.chain === 'btc') {
    router.push({ name: 'mvcswap' })
  } else {
    router.push({ name: 'swap' })
  }
}
</script>

<template>
  <div class="mb-2">
    <button
      class="group relative z-30 inline-flex cursor-pointer overflow-hidden rounded-full"
      @click="switchChain"
    >
      <span
        class="absolute inset-[-1000%] opacity-30 group-hover:opacity-100"
        :class="[
          props.chain === 'btc'
            ? 'gorgeous-btn-bg-for-btc'
            : 'gorgeous-btn-bg-for-mvc',
        ]"
      ></span>
      <span
        class="m-0.5 inline-flex h-full w-48 cursor-pointer items-center justify-center rounded-full bg-black bg-opacity-80 py-2 text-sm backdrop-blur-3xl transition-all duration-200 group-hover:bg-opacity-60 group-disabled:cursor-not-allowed group-disabled:bg-zinc-800 group-disabled:text-zinc-300/50 lg:bg-opacity-90"
        :class="[
          props.chain === 'btc'
            ? 'text-primary/80 group-hover:text-orange-100'
            : 'text-sky-200/80 group-hover:text-sky-100',
        ]"
      >
        <span class="inline group-hover:hidden"
          >Swapping on {{ chain.toUpperCase() }}</span
        >
        <span class="hidden group-hover:inline"
          >Switch to {{ otherChain.toUpperCase() }}</span
        >
        <ArrowRightLeftIcon class="ml-2 h-3 w-3" />
      </span>
    </button>
  </div>
</template>
