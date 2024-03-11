<script lang="ts" setup>
import { useBtcJsStore } from '@/stores/btcjs'

async function connectToOkx() {}
const bitcoin1 = window.bitcoin
// @ts-ignore
import * as bitcoin2 from '@/bitcoin-lib'
// @ts-ignore
const bitcoin3 = import('@/bitcoin-lib')
</script>

<template>
  <div class="p-8">
    <button class="rounded-md border p-2" @click="connectToOkx">
      connect to okx
    </button>

    <h3>bitcoin1</h3>
    <div class="">{{ bitcoin1 }}</div>

    <h3>bitcoin2</h3>
    <div class="">{{ bitcoin2 }}</div>

    <h3>bitcoin3</h3>
    <div class="">{{ bitcoin3 }}
  </div>
</template>
