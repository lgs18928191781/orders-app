<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import {
  ChevronRightIcon,
  CheckIcon,
  CalendarSearchIcon,
  ExternalLinkIcon,
} from 'lucide-vue-next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'

import {
  prettyBalance,
  prettyOneSideAddress,
  prettySymbol,
} from '@/lib/formatters'
import { getTransactionsQuery } from '@/queries/swap/transactions.query'
import { toTx } from '@/lib/helpers'

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

const { token1Symbol, token2Symbol } = useSwapPoolPair()

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const address = connectionStore.getAddress
const network = networkStore.network

const transactionTypes = ['all', 'swaps', 'adds', 'removes']
const selectedTransactionType = ref(transactionTypes[0])
const onlyMyTransactions = ref(false)

const { data: transactions, isLoading: isLoadingTransactions } = useQuery(
  getTransactionsQuery(
    {
      token1: token1Symbol,
      token2: token2Symbol,
      address,
      network,
      selectedTransactionType: computed(() => selectedTransactionType.value),
      onlyMyTransactions: computed(() => onlyMyTransactions.value),
    },
    computed(() => !!address)
  )
)

function viewAddress(address: string) {
  const browserHost =
    networkStore.network === 'testnet'
      ? 'https://mempool.space/testnet'
      : 'https://mempool.space'
  window.open(`${browserHost}/address/${address}`, '_blank')
}

function prettyType(type: '1x' | '2x' | 'x1' | 'x2' | 'add' | 'remove') {
  switch (type) {
    case 'add':
      return 'Add Liquidity'
    case 'remove':
      return 'Remove Liquidity'

    case '1x':
    case 'x2':
      return `Swap ${prettySymbol(token1Symbol.value)} for ${prettySymbol(
        token2Symbol.value
      )}`
    case '2x':
    case 'x1':
      return `Swap ${prettySymbol(token2Symbol.value)} for ${prettySymbol(
        token1Symbol.value
      )}`
    default:
      return type
  }
}

function isMe(address: string) {
  return address === connectionStore.getAddress
}
</script>

<template>
  <div class="">
    <div
      class="flex items-center gap-8 justify-between"
      v-if="connectionStore.connected"
    >
      <legend class="text-xl text-zinc-300 capitalize">transactions</legend>

      <div class="flex items-center gap-2 cursor-pointer group">
        <input
          id="onlyMyTransactions"
          v-model="onlyMyTransactions"
          aria-describedby="comments-description"
          name="comments"
          type="checkbox"
          class="h-5 w-5 rounded-md border-gray-500 text-primary cursor-pointer bg-zinc-900"
        />

        <label
          for="onlyMyTransactions"
          class="text-zinc-500 text-sm group-hover:text-zinc-300 cursor-pointer select-none"
          @click="selectedTransactionType = 'all'"
        >
          View my transactions
        </label>
      </div>
    </div>

    <div class="p-8 rounded-3xl bg-zinc-900 mt-4 grid">
      <div class="grid-row pr-6 -mr-4">
        <div class="">
          <Listbox v-model="selectedTransactionType">
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-28 rounded-lg bg-zinc-900 py-2 pl-3 pr-8 text-left shadow-md focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm border border-zinc-700"
              >
                <span class="block truncate capitalize">{{
                  selectedTransactionType
                }}</span>
                <span
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1"
                >
                  <ChevronRightIcon
                    class="h-5 w-5 text-zinc-400"
                    aria-hidden="true"
                  />
                </span>
              </ListboxButton>

              <transition
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <ListboxOptions
                  class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                >
                  <ListboxOption
                    v-slot="{ active, selected }"
                    v-for="t in transactionTypes"
                    :key="t"
                    :value="t"
                    as="template"
                  >
                    <li
                      :class="[
                        active ? 'bg-primary/70' : 'bg-black',
                        'relative select-none py-2 pl-4 pr-10 cursor-pointer capitalize',
                      ]"
                    >
                      {{ t }}

                      <span
                        v-if="selected"
                        class="absolute inset-y-0 right-0 flex items-center pr-3 text-primary"
                      >
                        <CheckIcon class="h-5 w-5" aria-hidden="true" />
                      </span>
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>
        <!-- <div class="">Total Value</div> -->
        <div class="">{{ prettySymbol(token1Symbol) }} Amount</div>
        <div class="">{{ prettySymbol(token2Symbol) }} Amount</div>
        <div class="">Account</div>
        <div class="">Status</div>
        <div class="">Time</div>
      </div>

      <div
        class="mt-8 flex items-center justify-center text-zinc-500 text-sm"
        v-if="isLoadingTransactions"
      >
        <Loader2Icon class="animate-spin h-8 w-8 text-zinc-500" />
      </div>

      <div
        v-else-if="transactions && transactions.length === 0"
        class="text-center mt-8 text-zinc-500 text-base flex flex-col items-center justify-center gap-2"
      >
        <CalendarSearchIcon class="h-10 w-10 text-zinc-500" />
        <div class="">No transactions</div>
      </div>

      <div v-else class="max-h-96 overflow-auto nicer-scrollbar pr-4 -mr-4">
        <div
          v-for="(transaction, index) in transactions"
          :key="transaction.id"
          class="grid-row"
        >
          <div class="">{{ prettyType(transaction.type) }}</div>
          <!-- <div class="">{{ transaction.amount1 }}</div> -->
          <div class="">{{ prettyBalance(transaction.amount1) }}</div>
          <div class="">{{ transaction.amount2 }}</div>
          <div
            class="text-primary hover:underline cursor-pointer"
            @click="viewAddress(transaction.address)"
          >
            <span class="font-bold" v-if="isMe(transaction.address)">
              (You)
            </span>
            <span v-else>{{ prettyOneSideAddress(transaction.address) }}</span>
          </div>
          <div class="inline-flex items-center justify-end gap-1">
            {{ transaction.status }}
            <button
              v-if="transaction.txid && isMe(transaction.address)"
              @click="toTx(transaction.txid, networkStore.network)"
            >
              <ExternalLinkIcon
                class="h-4 w-4 text-zinc-500 hover:text-primary"
              />
            </button>
          </div>
          <!-- <div class="">{{ prettyDate(transaction.updatedAt) }}</div> -->
          <div class="">{{ dayjs(transaction.updatedAt).fromNow() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-row {
  @apply grid gap-6 items-center text-2xs text-zinc-300 border-b border-zinc-800 py-2 xl:text-xs 2xl:text-sm xl:py-4;
  grid-template-columns: 1.5fr repeat(4, 1fr) 1.5fr;
}
.grid-row div {
  @apply text-right;
}

.grid-row div:nth-child(1) {
  @apply text-start;
}
</style>
