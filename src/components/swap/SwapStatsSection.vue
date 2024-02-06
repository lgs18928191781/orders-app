<script setup lang="ts">
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'
import { prettyBalance, prettySymbol } from '@/lib/formatters'
import { getPoolStatusQuery } from '@/queries/swap.query'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { ChevronRightIcon } from 'lucide-vue-next'
import { CheckIcon } from 'lucide-vue-next'

const { token1Symbol, token2Symbol, selectedPair, pairStr } = useSwapPoolPair()
const token1Icon = computed(() => selectedPair.value?.token1Icon)
const token2Icon = computed(() => selectedPair.value?.token2Icon)

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const router = useRouter()
const address = connectionStore.getAddress
const network = networkStore.network

const { data: poolStatus, isLoading: isLoadingPoolStatus } = useQuery(
  getPoolStatusQuery(
    {
      token1: token1Symbol,
      token2: token2Symbol,
      address,
      network,
    },
    computed(() => !!address)
  )
)

function toAdd() {
  router.push(`/swap-pools/${pairStr.value}/add`)
}

function toSwap() {
  router.push(`/swap/${pairStr.value}`)
}

const transactionTypes = ['all', 'swaps', 'adds', 'removes']
const selectedTransactionType = ref(transactionTypes[0])
</script>

<template>
  <div class="grid gap-8" v-if="poolStatus">
    <!-- row 1 -->
    <div class="flex items-end justify-between gap-48">
      <!-- left -->
      <div class="flex flex-col gap-6">
        <!-- title -->
        <div class="flex items-center text-2xl">
          <img
            :src="token1Icon"
            class="w-6 h-6 rounded-full"
            v-if="token1Icon"
          />
          <img
            :src="token2Icon"
            class="w-6 h-6 rounded-full -ml-2"
            v-if="token2Icon"
          />
          <div class="ml-2">
            <p
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 "
            >
              {{ prettySymbol(token1Symbol) }}/{{ prettySymbol(token2Symbol) }}
            </p>
          </div>
        </div>

        <!-- ratio -->
        <div class="space-y-2">
          <div
            class="flex items-center text-base text-zinc-300 gap-2 bg-zinc-800/80 px-4 py-2 rounded-xl"
          >
            <img
              :src="token1Icon"
              class="w-6 h-6 rounded-full"
              v-if="token1Icon"
            />

            <div class="">
              {{
                `1 ${prettySymbol(token1Symbol)} = ${
                  poolStatus.token2PerToken1UsingBtcUnit
                } ${prettySymbol(token2Symbol)}`
              }}
            </div>
          </div>

          <div
            class="flex items-center text-base text-zinc-300 gap-2 bg-zinc-800/80 px-4 py-2 rounded-xl"
          >
            <img
              :src="token2Icon"
              class="w-6 h-6 rounded-full"
              v-if="token2Icon"
            />

            <div class="">
              {{
                `1 ${prettySymbol(token2Symbol)} = ${
                  poolStatus.token1PerToken2UsingBtcUnit
                } ${prettySymbol(token1Symbol)}`
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- right -->
      <div class="text-zinc-300 space-x-3">
        <button
          class="py-3 px-4 bg-zinc-700 rounded-xl hover:text-zinc-400"
          @click="toAdd"
        >
          Add Liquidity
        </button>

        <button
          class="py-2.5 px-6 rounded-xl bg-transparent border-2 border-primary text-orange-50 bg-opacity-80 hover:bg-opacity-100 border-opacity-60 hover:border-opacity-100 hover:text-primary"
          @click="toSwap"
        >
          Swap
        </button>
      </div>
    </div>

    <!-- row 2 -->
    <div
      className="w-full dark:bg-zinc-900 bg-white dark:bg-grid-small-white/[0.25] bg-grid-black/[0.2] relative rounded-3xl text-base"
    >
      <div
        className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-zinc-900 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,#18181b)] rounded-3xl z-10"
      ></div>
      <div class="z-20 text-zinc-300 p-4 relative flex items-start gap-8">
        <div class="p-4 bg-zinc-800/50 rounded-2xl w-72">
          <div class="label">Total Tokens Locked</div>

          <div class="flex items-center text-zinc-300 gap-2 mt-4">
            <img
              :src="token1Icon"
              class="w-6 h-6 rounded-full"
              v-if="token1Icon"
            />

            <div class="">
              {{ `${prettySymbol(token1Symbol)}` }}
            </div>

            <div class="ml-auto font-bold">
              {{ prettyBalance(poolStatus.token1Pool) }}
            </div>
          </div>

          <div class="flex items-center text-zinc-300 gap-2 mt-2">
            <img
              :src="token2Icon"
              class="w-6 h-6 rounded-full"
              v-if="token2Icon"
            />

            <div class="">
              {{ `${prettySymbol(token2Symbol)}` }}
            </div>

            <div class="ml-auto font-bold">
              {{ poolStatus.token2Pool }}
            </div>
          </div>
        </div>

        <!-- right stats area -->
        <div class="grid grid-cols-3 grow gap-x-4 gap-y-2 text-sm">
          <div class="col-span-3 text-primary/80 font-bold text-base">
            Pool Overview
          </div>
          <div class="">
            <div class="label">TVL</div>

            <div class="value">
              {{ '$225.18m' }}
            </div>
          </div>

          <div class="">
            <div class="label">Volume 24h</div>

            <div class="value">
              {{ '$3.42m' }}
            </div>
          </div>

          <div class="">
            <div class="label">24h Fees</div>

            <div class="value">
              {{ '$10.27k' }}
            </div>
          </div>

          <div class="col-span-3 text-primary/80 font-bold mt-6 text-base">
            Your Position
          </div>

          <div class="">
            <div class="label">Pool Share</div>

            <div class="value">
              {{ poolStatus.poolShare }}
            </div>
          </div>

          <div class="">
            <div class="label">{{ prettySymbol(token1Symbol) }}</div>

            <div class="value">
              {{ poolStatus.token1AmountUsingBtcUnit }}
            </div>
          </div>

          <div class="">
            <div class="label">{{ prettySymbol(token2Symbol) }}</div>

            <div class="value">
              {{ poolStatus.token2Amount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- row 3 -->
    <div class="">
      <div class="text-xl text-zinc-300">Transactions</div>

      <div class="p-8 rounded-3xl bg-zinc-900 mt-4 grid">
        <div class="grid-row">
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
          <div class="">Total Value</div>
          <div class="">{{ prettySymbol(token1Symbol) }} Amount</div>
          <div class="">{{ prettySymbol(token2Symbol) }} Amount</div>
          <div class="">Account</div>
          <div class="">Time</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply flex items-center text-zinc-300 gap-2 mt-1 font-bold;
}

.grid-row {
  @apply grid gap-6 items-center text-sm text-zinc-300;
  grid-template-columns: 1.5fr repeat(5, 1fr);

  div {
    @apply text-right;
  }

  div:nth-child(1) {
    @apply text-start;
  }
}
</style>
