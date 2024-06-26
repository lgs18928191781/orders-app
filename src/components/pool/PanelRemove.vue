<script lang="ts" setup>
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-vue-next'
import { Ref, computed, inject, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Decimal from 'decimal.js'

import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import {
  getMyPoolRecords,
  removeLiquidity,
  type PoolRecord,
} from '@/queries/pool'
import { useConnectionStore } from '@/stores/connection'
import { prettyBalance, prettyTimestamp } from '@/lib/formatters'
import { unit, useBtcUnit } from '@/lib/helpers'

const queryClient = useQueryClient()
const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const connectionStore = useConnectionStore()
const enabled = computed(() => !!connectionStore.connected)

const { isLoading: isLoadingRecords, data: poolRecords } = useQuery({
  queryKey: [
    'poolRecords',
    {
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    },
  ],
  queryFn: () =>
    getMyPoolRecords({
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    }),
  enabled,
})

const selectedRecord: Ref<undefined | PoolRecord> = ref(undefined)

const { mutate: mutateRemoveLiquidity } = useMutation({
  mutationFn: removeLiquidity,
  onSuccess: () => {
    ElMessage.success('Liquidity removed')
    queryClient.invalidateQueries({
      queryKey: [
        'poolRecords',
        {
          address: connectionStore.getAddress,
          tick: selectedPair.fromSymbol,
        },
      ],
    })
    queryClient.invalidateQueries({ queryKey: ['poolableBrc20s'] })
    // reset selected record
    selectedRecord.value = undefined
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})
async function submitRemove() {
  if (!selectedRecord.value) return

  mutateRemoveLiquidity({ orderId: selectedRecord.value.orderId })
}
</script>

<template>
  <div class="mx-auto max-w-md">
    <form action="" class="flex min-h-[40vh] flex-col">
      <Listbox as="div" v-model="selectedRecord" class="grow">
        <ListboxLabel
          class="block text-base font-medium leading-6 text-zinc-300"
        >
          My Liquidity Records
        </ListboxLabel>

        <div class="relative col-span-5 mt-4">
          <ListboxButton
            class="relative w-full rounded-md bg-zinc-800 py-2 pl-3 pr-10 text-left text-zinc-300 shadow-sm ring-1 ring-inset ring-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
          >
            <div v-if="selectedRecord" class="flex items-center gap-4">
              <span class="text-primary" v-if="selectedRecord.poolType === 1">
                {{
                  `${
                    selectedRecord.coinAmount
                  } ${selectedRecord.tick.toUpperCase()}`
                }}
              </span>
              <span
                class="text-primary"
                v-else-if="selectedRecord.poolType === 3"
              >
                {{
                  `${
                    selectedRecord.coinAmount
                  } ${selectedRecord.tick.toUpperCase()} / ${prettyBalance(
                    selectedRecord.amount,
                    useBtcUnit,
                  )} ${unit}`
                }}
              </span>
              <span class="text-xs">
                {{ ` ${prettyTimestamp(selectedRecord.timestamp)}` }}
              </span>
            </div>
            <span v-else>{{ '-' }}</span>
            <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <ChevronsUpDownIcon
                class="h-5 w-5 text-zinc-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-inset ring-zinc-700 focus:outline-none sm:text-sm"
            >
              <ListboxOption
                v-if="!poolRecords?.length"
                :disabled="true"
                class="px-4 py-2 text-right text-sm text-zinc-500"
              >
                No Records
              </ListboxOption>

              <ListboxOption
                as="template"
                v-for="(record, index) in poolRecords"
                :key="record.orderId"
                :value="record"
                v-slot="{ active, selected }"
              >
                <li
                  :class="[
                    active ? 'bg-primary text-orange-950' : 'text-zinc-300',
                    'group relative flex cursor-pointer select-none items-center gap-4 py-2 pl-3 pr-9',
                  ]"
                >
                  <span class="shrink-0 text-xs text-zinc-500"
                    >#{{ index + 1 }}</span
                  >
                  <div
                    :class="[
                      selected ? 'font-semibold' : 'font-normal',
                      'flex w-full items-center justify-between truncate',
                    ]"
                  >
                    <span
                      :class="active ? 'text-orange-950' : 'text-primary'"
                      v-if="record.poolType === 1"
                    >
                      {{ `${record.coinAmount} ${record.tick.toUpperCase()}` }}
                    </span>
                    <span
                      :class="active ? 'text-orange-950' : 'text-primary'"
                      v-else-if="record.poolType === 3"
                    >
                      {{
                        `${
                          record.coinAmount
                        } ${record.tick.toUpperCase()} / ${prettyBalance(
                          record.amount,
                          useBtcUnit,
                        )} ${unit}`
                      }}
                    </span>
                    <span class="text-xs text-zinc-500">
                      {{ `${prettyTimestamp(record.timestamp)}` }}
                    </span>
                  </div>

                  <span
                    v-if="selected"
                    :class="[
                      active ? 'text-white' : 'text-primary',
                      'absolute inset-y-0 right-0 flex items-center pr-2',
                    ]"
                  >
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>

      <div class="flex justify-center">
        <button
          class="mx-auto w-full rounded-md bg-primary py-3 text-orange-950 disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="!selectedRecord"
          @click.prevent="submitRemove"
        >
          Remove
        </button>
      </div>
    </form>
  </div>
</template>
