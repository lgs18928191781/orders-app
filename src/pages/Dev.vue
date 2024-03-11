<script lang="ts" setup>
import { useBtcJsStore } from '@/stores/btcjs'
import { Ref, ref } from 'vue'

async function connectToOkx() {}
const w = window
const bitcoin1 = window.bitcoin
// @ts-ignore
// import * as bitcoin2 from '@/bitcoin-lib'
const bitcoin3: Ref<any> = ref()
// @ts-ignore
// import('@/bitcoin-lib').then((module) => {
//   bitcoin3.value = module
// })
</script>

<template>
  <div class="p-8">
    <button class="rounded-md border p-2" @click="connectToOkx">
      connect to okx
    </button>

    <h3>bitcoin1</h3>
    <div class="">{{ bitcoin1 }}</div>
    <div class="">{{ w.bitcoin }}</div>

    <h3>bitcoin2</h3>
    <!-- <div class="">{{ bitcoin2 }}</div> -->

    <h3>bitcoin3</h3>
    <div class="">{{ bitcoin3 }}</div>
  </div>
</template>
