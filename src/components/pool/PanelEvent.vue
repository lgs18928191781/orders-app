<script lang="ts" setup>
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { computed, inject, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import {
  claimEventReward,
  getMyEventRecords,
  getMyEventRewardsEssential,
} from '@/queries/pool'
import { useBtcJsStore } from '@/stores/btcjs'
import { useConnectionStore } from '@/stores/connection'
import { buildEventClaim } from '@/lib/builders/pool'
import { DEBUG, EVENT_REWARDS_TICK } from '@/data/constants'

import EventClaimRecords from './EventClaimRecords.vue'
import PanelEventRecordItem from './PanelEventRecordItem.vue'
import { sleep } from '@/lib/helpers'
import { HelpCircleIcon } from 'lucide-vue-next'

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const connectionStore = useConnectionStore()
const enabled = computed(() => connectionStore.connected)

const { data: eventRecords, isLoading: isLoadingEventRecords } = useQuery({
  queryKey: [
    'eventRecords',
    {
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    },
  ],
  queryFn: () =>
    getMyEventRecords({
      address: connectionStore.getAddress,
      tick: selectedPair.fromSymbol,
    }),
  enabled,
})

const { data: eventRewardsEssential, isLoading: isLoadingRewardsEssential } =
  useQuery({
    queryKey: [
      'eventRewardsEssential',
      { address: connectionStore.getAddress, tick: selectedPair.fromSymbol },
    ],
    queryFn: () =>
      getMyEventRewardsEssential({
        address: connectionStore.getAddress,
        tick: selectedPair.fromSymbol,
      }),
    select: (data) => {
      let total =
        data.totalRewardAmount +
        data.totalRewardExtraAmount -
        data.hadClaimRewardAmount
      if (total < 0) total = 0

      return {
        ...data,
        total,
      }
    },
    enabled: computed(() => connectionStore.connected),
  })

const queryClient = useQueryClient()
const { mutate: mutateClaimEventReward } = useMutation({
  mutationFn: claimEventReward,
  onSuccess: () => {
    ElMessage.success('Reward claimed')
    queryClient.invalidateQueries({
      queryKey: [
        'eventRewardsEssential',
        {
          address: connectionStore.getAddress,
          tick: selectedPair.fromSymbol,
        },
      ],
    })
    queryClient.invalidateQueries({
      queryKey: [
        'eventRewardsClaimRecords',
        { address: connectionStore.getAddress, tick: EVENT_REWARDS_TICK },
      ],
    })
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})

const isBuilding = ref(false)
const isOpenConfirmationModal = ref(false)
const builtInfo = ref<void | Awaited<ReturnType<typeof buildEventClaim>>>()
async function onClaimReward() {
  try {
    if (!eventRewardsEssential.value) return

    // build pay Tx
    isOpenConfirmationModal.value = true
    isBuilding.value = true

    const res = await buildEventClaim().catch(async (e) => {
      await sleep(500)
      console.log(e)

      ElMessage.error(e.message)
      builtInfo.value = undefined
      isOpenConfirmationModal.value = false
    })
    isBuilding.value = false
    builtInfo.value = res

    if (!res) return

    const signed = await connectionStore.adapter.signPsbt(res.order.toHex())
    // derive txid from signed psbt
    const bitcoinjs = useBtcJsStore().get!
    const signedPsbt = bitcoinjs.Psbt.fromHex(signed)
    const payTxid = signedPsbt.extractTransaction().getId()
    const feeRawTx = signedPsbt.extractTransaction().toHex()

    mutateClaimEventReward({
      rewardAmount: eventRewardsEssential.value.total,
      tick: selectedPair.fromSymbol,
      feeSend: res.feeSend,
      feeInscription: res.feeInscription,
      networkFeeRate: res.feeb,
      feeUtxoTxId: payTxid,
      feeRawTx,
    })
  } catch (e: any) {
    if (DEBUG) {
      console.log(e)
      ElMessage.error(e.message)
    } else {
      ElMessage.error('Error while claiming reward.')
    }
  }
}
async function onConfirm() {}
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col">
    <!-- title -->
    <div class="flex items-center gap-4">
      <h3 class="text-sm font-medium leading-6 text-zinc-300">
        My Event Rewards
      </h3>
    </div>

    <!-- total -->
    <div class="mt-2 flex items-center gap-4">
      <div class="gap- flex items-baseline text-primary">
        <span class="text-lg font-bold">
          {{ isLoadingRewardsEssential ? '-' : eventRewardsEssential?.total }}
        </span>

        <span class="ml-1 text-sm uppercase">
          ${{ EVENT_REWARDS_TICK.toUpperCase() }}
        </span>
      </div>

      <!-- claim button -->
      <button
        class="rounded bg-primary px-4 py-1 text-sm text-orange-950 shadow-md shadow-primary/20 hover:shadow-primary/50 disabled:opacity-30 disabled:shadow-none disabled:saturate-50"
        @click="onClaimReward"
        :disabled="!eventRewardsEssential || eventRewardsEssential.total === 0"
        v-if="eventRewardsEssential && eventRewardsEssential.total > 0"
      >
        Claim
      </button>

      <el-tooltip
        content="You need to pay a small amount of gas for claiming rewards."
        placement="bottom"
        effect="light"
      >
        <HelpCircleIcon class="box-content h-4 w-4 pr-2 text-zinc-300" />
      </el-tooltip>
    </div>

    <div class="my-8 w-64 border-b-2 border-zinc-500/30"></div>

    <TabGroup :default-index="0" as="div">
      <TabList class="flex items-center gap-8" v-slot="{ selectedIndex }">
        <Tab
          :class="[
            'text-sm font-medium leading-6',
            selectedIndex === 0
              ? 'text-primary underline decoration-2 underline-offset-4'
              : 'text-zinc-500 hover:text-zinc-300',
          ]"
        >
          Deal Orders
        </Tab>
        <Tab
          :class="[
            'text-sm font-medium leading-6',
            selectedIndex === 1
              ? 'text-primary underline decoration-2 underline-offset-4'
              : 'text-zinc-500 hover:text-zinc-300',
          ]"
        >
          Claim History
        </Tab>
      </TabList>

      <TabPanels class="mt-4">
        <TabPanel
          class="nicer-scrollbar -mx-4 mt-4 h-[40vh] grow space-y-2 overflow-y-auto rounded"
        >
          <p
            v-if="isLoadingEventRecords"
            class="pt-4 text-center text-zinc-500"
          >
            Loading...
          </p>

          <div
            class="flex h-full items-center justify-center text-zinc-500"
            v-else-if="!eventRecords || eventRecords.length === 0"
          >
            No Records Currently.
          </div>

          <PanelEventRecordItem
            v-for="record in eventRecords"
            :key="record.orderId"
            :record="record"
          />
        </TabPanel>

        <TabPanel class="nicer-scrollbar h-[40vh] grow overflow-y-scroll">
          <!-- claim records -->
          <EventClaimRecords />
        </TabPanel>
      </TabPanels>
    </TabGroup>

    <!-- <OrderConfirmationModal
      v-model:is-open="isOpenConfirmationModal"
      v-model:is-building="isBuilding"
      v-model:built-info="builtInfo"
      :build-process-tip="ref('Building Transaction...')"
      @confirm="onConfirm"
    /> -->
  </div>
</template>
