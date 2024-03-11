<script lang="ts" setup>
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { HelpCircleIcon } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { computed, inject, ref } from 'vue'

import { defaultPoolPair, selectedPoolPairKey } from '@/data/trading-pairs'
import { useConnectionStore } from '@/stores/connection'
import { getMyRewardsEssential, claimReward } from '@/queries/pool'
import { DEBUG, IS_DEV, POOL_REWARDS_TICK } from '@/data/constants'

import ClaimRecords from '@/components/pool/PanelClaimRecords.vue'
import { sleep } from '@/lib/helpers'
import { buildRewardClaim } from '@/lib/builders/pool'
import { useBtcJsStore } from '@/stores/btcjs'

const selectedPair = inject(selectedPoolPairKey, defaultPoolPair)
const connectionStore = useConnectionStore()

const { data: rewardsEssential, isLoading: isLoadingRewardsEssential } =
  useQuery({
    queryKey: [
      'poolRewardsEssential',
      { address: connectionStore.getAddress, tick: selectedPair.fromSymbol },
    ],
    queryFn: () =>
      getMyRewardsEssential({
        address: connectionStore.getAddress,
        tick: selectedPair.fromSymbol,
      }),
    select: (data) => {
      let total =
        data.totalRewardAmount +
        data.totalRewardExtraAmount -
        data.hadClaimRewardAmount
      if (total < 0) total = 0
      if (!total && IS_DEV) total = 100

      return {
        ...data,
        total,
      }
    },
    enabled: computed(() => connectionStore.connected),
  })

// hasReleasable
const hasReleasable = computed(() => {
  if (!rewardsEssential.value) return false

  return !!rewardsEssential.value?.hasReleasePoolOrderCount
})
const emit = defineEmits(['goRelease'])

const queryClient = useQueryClient()
const { mutate: mutateClaimReward } = useMutation({
  mutationFn: claimReward,
  onSuccess: () => {
    ElMessage.success('Reward claimed')
    queryClient.invalidateQueries({
      queryKey: [
        'poolRewardsEssential',
        {
          address: connectionStore.getAddress,
          tick: selectedPair.fromSymbol,
        },
      ],
    })
  },
  onError: (err: any) => {
    ElMessage.error(err.message)
  },
})

const isBuilding = ref(false)
const isOpenConfirmationModal = ref(false)
const builtInfo = ref<void | Awaited<ReturnType<typeof buildRewardClaim>>>()
async function onClaimReward() {
  try {
    if (!rewardsEssential.value) return

    // build pay Tx
    isOpenConfirmationModal.value = true
    isBuilding.value = true

    const res = await buildRewardClaim().catch(async (e) => {
      await sleep(500)
      console.log(e)

      ElMessage.error(e.message)
      builtInfo.value = undefined
      isOpenConfirmationModal.value = false
    })
    isBuilding.value = false
    builtInfo.value = res

    if (!res) return

    // ask unisat to sign
    const signed = await window.unisat.signPsbt(res.order.toHex())
    // derive txid from signed psbt
    const bitcoinjs = useBtcJsStore().get!
    const signedPsbt = bitcoinjs.Psbt.fromHex(signed)
    const payTxid = signedPsbt.extractTransaction().getId()
    const feeRawTx = signedPsbt.extractTransaction().toHex()

    mutateClaimReward({
      rewardAmount: rewardsEssential.value.total,
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
</script>

<template>
  <div class="mx-auto flex h-[40vh] max-w-xl flex-col">
    <div class="">
      <!-- releasable alert -->
      <div
        v-if="hasReleasable"
        class="-mx-4 mb-4 flex items-center justify-between gap-4 rounded bg-primary/10 px-4 py-2 text-sm"
      >
        <div class="text-xs text-primary">
          <p>
            Your liquidity reward has been generated. Please release promptly to
            claim.
          </p>
          <p class="mt-2">
            Note: Rewards may decrease if not released within 3 days of
            liquidity being used.
          </p>
        </div>

        <button
          class="rounded bg-primary px-4 py-1 text-orange-950"
          @click="$emit('goRelease')"
        >
          Release
        </button>
      </div>

      <!-- title -->
      <div class="flex items-center gap-4">
        <h3 class="text-sm font-medium leading-6 text-zinc-300">My Rewards</h3>
        <el-popover
          placement="bottom-start"
          :width="400"
          trigger="hover"
          content="You can earn records by providing liquidity to the pool, which will be compensated in RDEX tokens. When you choose to claim your records, you simultaneously release your locked liquidity."
          popper-class="!bg-zinc-800 !text-zinc-300 !shadow-lg !shadow-primary/10 "
        >
          <template #reference>
            <HelpCircleIcon class="h-4 w-4 text-zinc-400" aria-hidden="true" />
          </template>
        </el-popover>
      </div>

      <!-- total -->
      <div class="mt-2 flex items-center gap-4">
        <div class="gap- flex items-baseline text-primary">
          <span class="text-lg font-bold">
            {{ isLoadingRewardsEssential ? '-' : rewardsEssential?.total }}
          </span>

          <span class="ml-1 text-sm uppercase">
            ${{ POOL_REWARDS_TICK.toUpperCase() }}
          </span>
        </div>

        <!-- claim button -->
        <button
          class="rounded bg-primary px-4 py-1 text-sm text-orange-950 shadow-md shadow-primary/20 hover:shadow-primary/50 disabled:opacity-30 disabled:shadow-none disabled:saturate-50"
          @click="onClaimReward"
          :disabled="!rewardsEssential || rewardsEssential.total === 0"
          v-if="rewardsEssential && rewardsEssential.total > 0"
        >
          Claim
        </button>
      </div>
    </div>

    <!-- claim records -->
    <ClaimRecords class="nicer-scrollbar mt-8 overflow-y-scroll" />
  </div>
</template>
