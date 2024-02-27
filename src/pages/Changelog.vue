<script lang="ts" setup>
import changelog from '@/data/changelog'
</script>

<template>
  <div class="mx-auto max-w-2xl scroll-my-12">
    <h1 class="text-center text-3xl font-bold">Changelog</h1>

    <div
      class="nicer-scrollbar mt-12 max-h-[80vh] divide-y divide-zinc-700 overflow-y-auto pr-8"
    >
      <div class="py-12 first:pt-0 last:pb-0" v-for="log in changelog">
        <div class="flex items-center">
          <h2 class="text-lg font-bold text-primary">
            {{ log.version + ' ' + log.emoji }}
          </h2>
          <span class="ml-auto text-sm text-zinc-500">{{ log.date }}</span>
        </div>
        <ul class="ml-4 mt-2 list-outside list-disc text-sm">
          <li v-for="change in log.changes" class="mt-2">
            {{ change }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
