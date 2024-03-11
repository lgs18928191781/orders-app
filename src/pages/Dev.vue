<script lang="ts" setup>
import { useBtcJsStore } from '@/stores/btcjs'

async function connectToOkx() {}

const btcjs = useBtcJsStore().get
</script>

<template>
  <div class="p-8">
    <button class="rounded-md border p-2" @click="connectToOkx">
      connect to okx
    </button>
    <img src="http://localhost:3001/icons" alt="okx logo" />

    <div class="">
      {{ btcjs }}
    </div>
  </div>
</template>
