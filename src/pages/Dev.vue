<script lang="ts" setup>
import { terminal } from 'virtual:terminal'

async function connectToOkx() {
  // if (isMobile && !isOKApp) {
  //   terminal.log('in mobile browser now!')
  //   window.location.href = encodedUrl
  // } else if (window.okxwallet) {
  //   terminal.log('in okx wallet now!')
  // }
}
</script>

<template>
  <div class="p-8">
    <button class="rounded-md border p-2" @click="connectToOkx">
      connect to okx
    </button>
  </div>
</template>
