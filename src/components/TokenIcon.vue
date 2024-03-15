<script setup lang="ts">
import { UseImage } from '@vueuse/components'
import { CircleEllipsisIcon } from 'lucide-vue-next'
import { computed, ref, toRef } from 'vue'

import { useTokenIcon } from '@/hooks/use-token-icon'

const props = defineProps(['class', 'token'])

const { iconUrl } = useTokenIcon(toRef(props.token))

const firstChar = computed(() => {
  if (!props.token) {
    return ''
  }
  return toRef(props.token).value.charAt(0).toUpperCase()
})
</script>

<template>
  <UseImage :src="iconUrl" :class="props.class">
    <template #loading>
      <CircleEllipsisIcon
        class="rounded-full bg-black text-zinc-500"
        :class="props.class"
      />
    </template>

    <template #error>
      <div
        :class="[
          'flex items-center justify-center rounded-full border-2 border-zinc-500 bg-black p-px text-base font-bold text-zinc-300',
          props.class,
        ]"
      >
        <div class="">
          {{ firstChar }}
        </div>
      </div>
    </template>
  </UseImage>
</template>
