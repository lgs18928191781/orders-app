<script setup lang="ts">
import { ref } from 'vue'

import RemoveSlider from '@/components/swap/pools/RemoveSlider.vue'
import { ArrowDownIcon } from 'lucide-vue-next'

const removePercentage = ref([0])
</script>

<template>
  <div class="my-4 flex flex-col gap-3">
    <RemoveSlider v-model:remove-percentage="removePercentage" />

    <div class="flex justify-center">
      <ArrowDownIcon class="w-4 h-4 text-zinc-500" />
    </div>
  </div>
</template>

<style scoped></style>
