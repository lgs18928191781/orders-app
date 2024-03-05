<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ArrowRightIcon,
  FrownIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  Loader2Icon,
} from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { useOngoingTask } from '@/hooks/use-ongoing-task'
import { getOngoingTaskQuery } from '@/queries/swap/ongoing-task.query'
import { useSwapPoolPair } from '@/hooks/use-swap-pool-pair'

import { prettyCoinDisplay } from '@/lib/formatters'
import { toTx } from '@/lib/helpers'
import { ElMessage } from 'element-plus'

const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const address = connectionStore.getAddress
const network = networkStore.network
const { hasOngoing, taskId, clearOngoing } = useOngoingTask()
const { selectedPair } = useSwapPoolPair()

const taskStatus = ref('running')
const { data: task } = useQuery(
  getOngoingTaskQuery(
    {
      address,
      network,
      taskId,
    },
    hasOngoing,
    () => (taskStatus.value === 'running' ? 1000 : false),
  ),
)
watch(
  task,
  (newTask) => {
    if (taskStatus.value !== 'running') return
    if (!newTask) return

    if (newTask.status !== 'built') {
      taskStatus.value = newTask.status
    }
  },
  { immediate: true },
)

const extendedTask = computed(() => {
  if (!task.value || !selectedPair.value) {
    return null
  }

  switch (task.value.type) {
    case '1x':
    case 'x2':
      return {
        type: 'swap',
        typeDisplay: 'Swap',
        fromToken: task.value.token1,
        toToken: task.value.token2,
        fromAmount: task.value.amount1,
        toAmount: task.value.amount2,
        fromIcon: selectedPair.value.token1Icon,
        toIcon: selectedPair.value.token2Icon,
      }
    case '2x':
    case 'x1':
      return {
        type: 'swap',
        typeDisplay: 'Swap',
        fromToken: task.value.token2,
        toToken: task.value.token1,
        fromAmount: task.value.amount2,
        toAmount: task.value.amount1,
        fromIcon: selectedPair.value.token2Icon,
        toIcon: selectedPair.value.token1Icon,
      }
    case 'add':
      return {
        type: 'add',
        typeDisplay: 'Add Liquidity',
        fromToken: task.value.token1,
        toToken: task.value.token2,
        fromAmount: task.value.amount1,
        toAmount: task.value.amount2,
        fromIcon: selectedPair.value.token1Icon,
        toIcon: selectedPair.value.token2Icon,
      }
    case 'remove':
      return {
        type: 'remove',
        typeDisplay: 'Remove Liquidity',
        fromToken: task.value.token1,
        toToken: task.value.token2,
        fromAmount: task.value.amount1,
        toAmount: task.value.amount2,
        fromIcon: selectedPair.value.token1Icon,
        toIcon: selectedPair.value.token2Icon,
      }
    default:
      return null
  }
})

function toExplorer() {
  if (!task.value) return
  if (!task.value.txid) return

  toTx(task.value.txid, networkStore.network)
}

const queryClient = useQueryClient()
function closeModal() {
  queryClient.invalidateQueries()
  clearOngoing()
  window.location.reload()
}

function copyFailedReason() {
  if (!task.value?.failedReason) return
  navigator.clipboard.writeText(task.value.failedReason)

  ElMessage.success('Error message copied to clipboard')
}
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-black/40 px-8 backdrop-blur"
    v-show="hasOngoing"
  >
    <div class="min-w-96 rounded-xl bg-zinc-800 px-8 py-6 text-zinc-300">
      <div class="flex items-center justify-between">
        <h3>Ongoing Task</h3>
        <button
          @click="closeModal"
          class="text-zinc-300"
          v-if="taskStatus !== 'running'"
        >
          <XIcon class="size-6 text-zinc-300 hover:text-zinc-500" />
        </button>
      </div>

      <!-- body -->
      <div class="mt-8 flex flex-col items-center justify-center gap-8">
        <template v-if="taskStatus === 'running'">
          <Loader2Icon class="size-24 animate-spin text-zinc-500" />
          <p class="text-lg capitalize">Running...</p>
        </template>

        <template v-else-if="taskStatus === 'completed'">
          <CheckIcon
            class="size-24 rounded-full bg-green-500 p-2 text-zinc-800"
            :stroke-width="3"
          />

          <div class="flex items-center justify-between self-stretch">
            <p class="mr-auto text-lg capitalize">Success!</p>

            <button
              @click="toExplorer"
              class="text-sm text-primary hover:underline"
            >
              View on Explorer
            </button>
          </div>
        </template>

        <template v-else-if="taskStatus === 'failed'">
          <FrownIcon class="size-24 text-red-500" />
          <div class="self-stretch">
            <p class="text-center text-lg capitalize">Failed</p>
            <div
              class="group mt-2 cursor-pointer rounded-lg bg-zinc-900 p-2 text-sm"
              v-if="task?.failedReason"
              @click="copyFailedReason"
            >
              <h5 class="text-zinc-500">Error Message:</h5>
              <p
                class="-m-1 mt-1 rounded p-1 group-hover:bg-primary/10 group-hover:text-white"
              >
                {{ task.failedReason }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <div class="mt-4 rounded-3xl border border-zinc-700 p-2">
        <div class="my-2 flex items-center justify-center gap-2">
          <h5
            class="bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-lg font-bold leading-none text-transparent"
          >
            {{ extendedTask?.typeDisplay }}
          </h5>
        </div>

        <div class="rounded-2xl bg-black px-4 py-2" v-if="extendedTask">
          <div
            class="flex items-center gap-2 text-sm"
            v-if="extendedTask.type === 'swap'"
          >
            <img
              :src="extendedTask.fromIcon"
              :alt="extendedTask.fromToken"
              class="size-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.fromAmount, extendedTask.fromToken)
            }}</span>

            <ArrowRightIcon class="mx-2 size-4" />

            <img
              :src="extendedTask.toIcon"
              :alt="extendedTask.toToken"
              class="size-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.toAmount, extendedTask.toToken)
            }}</span>
          </div>

          <div class="" v-else-if="extendedTask.type === 'add'">
            <div class="flex items-center gap-2 text-sm">
              <img
                :src="extendedTask.fromIcon"
                :alt="extendedTask.fromToken"
                class="size-6"
              />
              <span>{{
                prettyCoinDisplay(
                  extendedTask.fromAmount,
                  extendedTask.fromToken,
                )
              }}</span>

              <PlusIcon class="mx-2 size-4" />

              <img
                :src="extendedTask.toIcon"
                :alt="extendedTask.toToken"
                class="size-6"
              />
              <span>{{
                prettyCoinDisplay(extendedTask.toAmount, extendedTask.toToken)
              }}</span>
            </div>
          </div>

          <div
            class="flex items-center gap-2 text-sm"
            v-else-if="extendedTask.type === 'remove'"
          >
            <img
              :src="extendedTask.fromIcon"
              :alt="extendedTask.fromToken"
              class="size-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.fromAmount, extendedTask.fromToken)
            }}</span>

            <PlusIcon class="mx-2 size-4" />

            <img
              :src="extendedTask.toIcon"
              :alt="extendedTask.toToken"
              class="size-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.toAmount, extendedTask.toToken)
            }}</span>
          </div>
        </div>

        <div class="rounded-full bg-black px-4 py-2 text-center" v-else>
          ...
        </div>
      </div>
    </div>
  </div>
</template>