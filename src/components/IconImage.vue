<script setup lang="ts">
import { UseImage } from '@vueuse/components'
import { FileXIcon } from 'lucide-vue-next'

const props = defineProps(['src', 'class'])
</script>

<template>
  <UseImage :src="src" :class="props.class">
    <!-- <template #loading> Loading.. </template> -->

    <template #error>
      <FileXIcon
        class="rounded-full border-2 border-zinc-500 bg-black p-0.5 text-zinc-300"
        :class="props.class"
      />
    </template>
  </UseImage>
</template>
