<script setup lang="ts">
import Decimal from 'decimal.js'
import { computed } from 'vue'

import { useSwapPool } from '@/hooks/use-swap-pool'
import { prettySymbol } from '@/lib/formatters'
import { Loader2Icon } from 'lucide-vue-next'

const { token1, token2, token1Icon, token2Icon } = useSwapPool()

const props = defineProps(['poolStatus'])

const hasPending = computed(
  () =>
    props.poolStatus.poolSharePending !== '0' &&
    props.poolStatus.poolSharePending !== '0%',
)
</script>

<template>
  <div class="swap-sub-static-panel flex flex-col gap-2" v-if="poolStatus">
    <h3 class="text-zinc-300">Your position</h3>

    <div class="flex items-center text-lg">
      <img :src="token1Icon" class="size-6 rounded-full" v-if="token1Icon" />
      <img
        :src="token2Icon"
        class="-ml-2 size-6 rounded-full"
        v-if="token2Icon"
      />
      <div class="ml-2">
        {{ prettySymbol(token1) }}/{{ prettySymbol(token2) }}
      </div>

      <div class="ml-auto">
        {{ new Decimal(poolStatus.addressEquityAvailable).toDP() }}
      </div>
    </div>

    <div class="flex items-start text-sm">
      <div class="ml-2">Your pool share:</div>

      <div class="ml-auto flex flex-col items-end">
        <div class="">
          {{ poolStatus.poolShareAvailable }}
        </div>

        <div class="flex items-center gap-2 text-zinc-500" v-if="hasPending">
          {{ '+ ' + poolStatus.poolSharePending }}
          <Loader2Icon class="size-3 animate-spin" />
        </div>
      </div>
    </div>

    <div class="flex items-start text-sm">
      <div class="ml-2">{{ prettySymbol(token1) }}:</div>

      <div class="ml-auto flex flex-col items-end">
        <div class="">
          {{ poolStatus?.token1AmountUsingBtcUnitAvailable || '-' }}
        </div>

        <div class="flex items-center gap-2 text-zinc-500" v-if="hasPending">
          {{ '+ ' + poolStatus.token1AmountUsingBtcUnitPending || '-' }}
          <Loader2Icon class="size-3 animate-spin" />
        </div>
      </div>
    </div>

    <div class="flex items-start text-sm">
      <div class="ml-2">{{ prettySymbol(token2) }}:</div>

      <div class="ml-auto flex flex-col items-end">
        <div class="">
          {{ poolStatus?.token2AmountAvailable || '-' }}
        </div>

        <div class="flex items-center gap-2 text-zinc-500" v-if="hasPending">
          {{ '+ ' + poolStatus.token2AmountPending || '-' }}
          <Loader2Icon class="size-3 animate-spin" />
        </div>
      </div>
    </div>
  </div>
</template>
