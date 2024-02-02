<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'radix-vue'
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  useEmitAsProps,
} from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<SliderRootProps>()
const emits = defineEmits<SliderRootEmits>()

const emitsAsProps = useEmitAsProps(emits)
</script>

<template>
  <SliderRoot
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center',
        $attrs.class ?? ''
      )
    "
    v-bind="{ ...props, ...emitsAsProps }"
  >
    <SliderTrack
      class="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700"
    >
      <SliderRange class="absolute h-full bg-zinc-900 dark:bg-primary" />
    </SliderTrack>
    <SliderThumb
      class="block h-5 w-5 rounded-full border-2 border-zinc-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-50 dark:bg-primary dark:ring-offset-primary dark:focus-visible:ring-zinc-300"
    />
  </SliderRoot>
</template>
