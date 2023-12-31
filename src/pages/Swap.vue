<script lang="ts" setup>
import SwapBlur from '@/components/swap/SwapBlur.vue'

import RdexLogo from '@/assets/rdex.png?url'
import BtcLogo from '@/assets/btc.svg?url'
import { ChevronDownIcon } from 'lucide-vue-next'
</script>

<template>
  <div class="relative max-w-lg mt-16 mx-auto rounded-3xl">
    <div
      class="border border-orange-300/30 rounded-3xl shadow-md p-2 pt-3 bg-zinc-900 space-y-3"
    >
      <!-- header -->
      <h3 class="px-3">Swap</h3>

      <!-- body -->
      <div class="text-sm space-y-1">
        <div
          class="p-4 bg-zinc-800 rounded-2xl border border-transparent hover:border-zinc-700"
        >
          <div class="text-zinc-500">You pay</div>

          <!-- main control -->
          <div class="flex items-center space-x-2 justify-between">
            <input
              class="bg-transparent text-4xl quiet-input caret-orange-300 flex-1 w-12"
              type="text"
              placeholder="0"
            />

            <div
              class="rounded-full bg-zinc-900 p-1 px-2 text-xl flex items-center gap-1"
            >
              <img :src="RdexLogo" class="w-6 h-6" />
              <div>$RDEX</div>
              <ChevronDownIcon class="h-5 w-5" />
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-zinc-800 rounded-2xl border border-transparent hover:border-zinc-700"
        >
          <div class="text-zinc-500">You receive</div>

          <!-- main control -->
          <div class="flex items-center space-x-2 justify-between">
            <input
              class="bg-transparent text-4xl quiet-input caret-orange-300 flex-1 w-12"
              type="text"
              placeholder="0"
            />

            <div
              class="rounded-full bg-zinc-900 p-1 px-2 text-xl flex items-center gap-1"
            >
              <img :src="BtcLogo" class="w-6 h-6" />
              <div>BTC</div>
              <ChevronDownIcon class="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <!-- confirm button -->
      <button
        class="bg-orange-300/20 text-orange-300 font-medium block w-full py-4 rounded-2xl text-xl"
      >
        Swap
      </button>
    </div>

    <!-- background blur -->
    <SwapBlur />
  </div>
</template>
