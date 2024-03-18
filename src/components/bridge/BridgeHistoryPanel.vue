<template>
  <div
    class="min-h-96 max-h-96 h-96 flex flex-col items-center overflow-y-auto"
  >
    <div
      class="w-full h-full flex flex-col justify-center items-center text-zinc-500"
      v-if="list.length === 0 && !loading"
    >
      No Transfers yet
    </div>
    <div class="w-full flex flex-col items-center py-1">
      <div
        v-for="tx in list"
        :key="tx.originTxid"
        class="w-full p-5 rounded-lg opacity-100 bg-zinc-900 mt-4"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 font-geist-mono text-base font-semibold text-white"
          >
            <img
              :src="tx.originNetwork == 'BTC' ? BtcIcon : MVC"
              class="h-6 w-6 rounded-full"
            /><span>{{ tx.originNetwork }}</span>
            <div
              class="w-6 h-6 flex items-center justify-center rounded bg-gray-800"
            >
              <ArrowRight :size="20" class="text-gray-500" />
            </div>

            <img
              :src="tx.targetNetwork == 'BTC' ? BtcIcon : MVC"
              class="h-6 w-6 rounded-full"
            /><span>{{ tx.targetNetwork }}</span>
          </div>
          <div
            class="text-base"
            :class="tx.status === 'success' ? 'text-green-500' : 'text-primary'"
          >
            {{ tx.status }}
          </div>
        </div>
        <div class="h-px my-4 bg-gray-800"></div>
        <div
          class="flex items-center justify-between font-geist-mono text-xl font-semibold text-white"
        >
          <div>
            {{
              tx.amount
            }}
            {{ tx.symbol }}
          </div>
          <div class="text-xs">
            {{ tx.timestamp }}
          </div>
        </div>
      </div>
      <Loader2Icon
        class="mt-2 size-6 text-zinc-300 animate-spin-slow"
        v-if="loading"
      />
      <div
        class="cursor-pointer mt-2"
        v-if="!loading && !isEnd"
        @click="loadMore"
      >
        load More
      </div>
      <div class="mt-2" v-if="isEnd && list.length !== 0">no More</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { HsitoryDetail, getBridgeHistory } from '@/queries/bridge-api'
import { Ref, computed, ref, watch, useAttrs } from 'vue'
import { Loader2Icon, ArrowRight } from 'lucide-vue-next'
import BtcIcon from '@/assets/btc.svg?url'
import MVC from '@/assets/mvc_logo.png?url'
import { formatUnitToBtc, prettyTimestamp } from '@/lib/formatters'
type TxType = 'btcToMvc' | 'brc20ToMvc' | 'mvcToBtc' | 'mvcToBrc20'
const props = defineProps({
  txType: {
    type: String,
    default: 'mvcToBrc20',
  },
  address: {
    type: String,
    default: '',
  },
})
const page = ref<number>(0)
const size = 10
const list = ref<HsitoryDetail[]>([])
const loading = ref<boolean>(false)
const isEnd = ref<boolean>(false)

watch(props, () => {
  fetchBridgeHistory()
})
async function loadMore() {
  page.value += 1
  fetchBridgeHistory()
}
async function fetchBridgeHistory() {
  loading.value = true
  try {
    const { address, txType } = props
    if (!address) throw new Error('not connect')
    const { txList } = await getBridgeHistory({
      type: txType as TxType,
      cursor: page.value,
      size: size,
      order: 'desc',
      address: '1AkCkdHBv3hedT1gPyDpZmBa7tkLmVM7b3',
    })
    if (txList.length < size) {
      isEnd.value = true
    }
    list.value = [
      ...list.value,
      ...txList.map((item) => {
        if (txType === 'btcToMvc' || txType === 'brc20ToMvc') {
          item.originNetwork = 'BTC'
          item.targetNetwork = 'MVC'
        }
        if (txType === 'mvcToBtc' || txType === 'mvcToBrc20') {
          item.originNetwork = 'MVC'
          item.targetNetwork = 'BTC'
        }
        item.timestamp = prettyTimestamp(Number(item.timestamp), true)
        item.amount=String(formatUnitToBtc(
                Number(item.amount),
                (item.originNetwork === 'BTC')||(item.originNetwork === 'MVC'&&item.decimals <= 8)?item.decimals:  item.decimals - 8 
              ))
        return item
      }),
    ]
    // list.value = [...list.value, ...list.value]
  } catch (err) {}

  loading.value = false
}
fetchBridgeHistory()
</script>