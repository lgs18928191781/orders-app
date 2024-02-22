<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ArrowRightIcon,
  FrownIcon,
  CheckIcon,
  XIcon,
  HammerIcon,
  PlusIcon,
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
    () => (taskStatus.value === 'running' ? 1000 : false)
  )
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
  { immediate: true }
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
    class="fixed inset-0 bg-black/40 backdrop-blur flex flex-col items-center justify-center gap-8 px-8 z-[100]"
    v-show="hasOngoing"
  >
    <div class="text-zinc-300 bg-zinc-800 rounded-xl min-w-96 px-8 py-6">
      <div class="flex items-center justify-between">
        <h3>Ongoing Task</h3>
        <button
          @click="closeModal"
          class="text-zinc-300"
          v-if="taskStatus !== 'running'"
        >
          <XIcon class="w-6 h-6 text-zinc-300 hover:text-zinc-500" />
        </button>
      </div>

      <!-- body -->
      <div class="mt-8 flex justify-center flex-col items-center gap-8">
        <template v-if="taskStatus === 'running'">
          <HammerIcon class="w-16 h-16 animate-bounce text-primary" />
          <p class="capitalize text-lg">Running...</p>
        </template>

        <template v-else-if="taskStatus === 'completed'">
          <CheckIcon
            class="w-16 h-16 text-zinc-800 bg-green-500 rounded-full p-2"
            :stroke-width="3"
          />

          <div class="flex items-center justify-between self-stretch">
            <p class="capitalize text-lg mr-auto">Success!</p>

            <button
              @click="toExplorer"
              class="text-sm text-primary hover:underline"
            >
              View on Explorer
            </button>
          </div>
        </template>

        <template v-else-if="taskStatus === 'failed'">
          <FrownIcon class="w-16 h-16 text-red-500" />
          <div class="self-stretch">
            <p class="capitalize text-lg text-center">Failed</p>
            <div
              class="bg-zinc-900 rounded-lg p-2 mt-2 text-sm cursor-pointer group"
              v-if="task?.failedReason"
              @click="copyFailedReason"
            >
              <h5 class="text-zinc-500">Error Message:</h5>
              <p
                class="mt-1 group-hover:bg-primary/10 group-hover:text-white rounded p-1 -m-1"
              >
                {{ task.failedReason }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <div class="border border-zinc-700 rounded-3xl mt-4 p-2">
        <div class="flex items-center justify-center my-2 gap-2">
          <h5
            class="font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 text-lg leading-none"
          >
            {{ extendedTask?.typeDisplay }}
          </h5>
        </div>

        <div class="bg-black px-4 py-2 rounded-2xl" v-if="extendedTask">
          <div
            class="flex items-center gap-2 text-sm"
            v-if="extendedTask.type === 'swap'"
          >
            <img
              :src="extendedTask.fromIcon"
              :alt="extendedTask.fromToken"
              class="w-6 h-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.fromAmount, extendedTask.fromToken)
            }}</span>

            <ArrowRightIcon class="w-4 h-4 mx-2" />

            <img
              :src="extendedTask.toIcon"
              :alt="extendedTask.toToken"
              class="w-6 h-6"
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
                class="w-6 h-6"
              />
              <span>{{
                prettyCoinDisplay(
                  extendedTask.fromAmount,
                  extendedTask.fromToken
                )
              }}</span>

              <PlusIcon class="w-4 h-4 mx-2" />

              <img
                :src="extendedTask.toIcon"
                :alt="extendedTask.toToken"
                class="w-6 h-6"
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
              class="w-6 h-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.fromAmount, extendedTask.fromToken)
            }}</span>

            <PlusIcon class="w-4 h-4 mx-2" />

            <img
              :src="extendedTask.toIcon"
              :alt="extendedTask.toToken"
              class="w-6 h-6"
            />
            <span>{{
              prettyCoinDisplay(extendedTask.toAmount, extendedTask.toToken)
            }}</span>
          </div>
        </div>

        <div class="bg-black px-4 py-2 rounded-full text-center" v-else>
          ...
        </div>
      </div>
    </div>
  </div>
</template>
