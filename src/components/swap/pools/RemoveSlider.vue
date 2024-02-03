<script setup lang="ts">
import { Slider } from '@/components/ui/slider'

const presets = [25, 50, 75, 100]

const removePercentage = defineModel<number[]>('removePercentage', {
  required: true,
})
</script>

<template>
  <div class="swap-sub-control-panel flex flex-col gap-4">
    <h3>Remove amount</h3>

    <div class="text-6xl leading-normal">{{ removePercentage[0] }}%</div>

    <Slider v-model="removePercentage" :max="100" :step="1" />

    <!-- percentage buttons -->
    <div class="grid grid-cols-4 gap-4 justify-between mt-4">
      <button
        :key="p"
        class="cute-button py-2 rounded-lg text-zinc-300 text-sm"
        @click="removePercentage[0] = p"
        v-for="p in presets"
      >
        {{ p }}%
      </button>
    </div>
  </div>
</template>

<style scoped></style>
