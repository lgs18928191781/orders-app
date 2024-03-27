<template>
  <div
    class="flex h-96 max-h-96 min-h-96 flex-col items-center overflow-y-auto"
  >
    <div
      class="flex h-full w-full flex-col items-center justify-center text-zinc-500"
      v-if="list.length === 0 && !loading"
    >
      No Transfers yet
    </div>
    <div class="flex w-full flex-col items-center py-1">
      <div
        v-for="tx in list"
        :key="tx.originTxid"
        class="mt-4 w-full rounded-lg bg-zinc-900 p-5 opacity-100"
      >
        <div class="flex items-center justify-between">
          <div
            class="font-geist-mono flex items-center gap-2 text-base font-semibold text-white"
          >
            <img
              :src="tx.originNetwork == 'BTC' ? BtcIcon : MVC"
              class="h-6 w-6 rounded-full"
            /><span>{{ tx.originNetwork }}</span>
            <div
              class="flex h-6 w-6 items-center justify-center rounded bg-gray-800"
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
        <div class="mt-3 flex flex-col text-sm">
          <div class="flex flex-row items-center">
            <span class="mr-1">OriginTxid</span>
            <span class="mr-1">({{ tx.originNetwork }}):</span>
            <a
              class="mr-1 hover:text-primary"
              :href="queryOriginTx(tx)"
              target="_blank"
              >{{ prettyTxid(tx.originTxid, 8) }}</a
            >

            <Copy
              @click="copyTx(tx.originTxid)"
              class="cursor-pointer hover:scale-110"
              :size="14"
            ></Copy>
          </div>
          <div class="mt-3 flex flex-row items-center">
            <span class="mr-1">TargetTxid</span>
            <span class="mr-1">({{ tx.targetNetwork }}):</span>
            <a
              class="mr-1 hover:text-primary"
              :href="queryTargetTx(tx)"
              target="_blank"
              >{{ prettyTxid(tx.targetTxid, 8) }}</a
            >

            <Copy
              @click="copyTx(tx.targetTxid)"
              class="cursor-pointer hover:scale-110"
              :size="14"
            ></Copy>
          </div>
        </div>
        <div class="my-4 h-px bg-gray-800"></div>
        <div
          class="font-geist-mono flex items-center justify-between text-xl font-semibold text-white"
        >
          <div>
            {{ tx.amount }}
            {{ tx.symbol }}
          </div>
          <div class="text-xs">
            {{ tx.timestamp }}
          </div>
        </div>
      </div>
      <Loader2Icon
        class="mt-2 size-6 animate-spin-slow text-zinc-300"
        v-if="loading"
      />
      <div
        class="mt-2 cursor-pointer"
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
import { Loader2Icon, ArrowRight, Copy } from 'lucide-vue-next'
import BtcIcon from '@/assets/btc.svg?url'
import MVC from '@/assets/mvc_logo.png?url'
import { formatUnitToBtc, prettyTimestamp, prettyTxid } from '@/lib/formatters'
import { ElMessage } from 'element-plus'
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

function copyTx(txid: string) {
  navigator.clipboard.writeText(txid)
  ElMessage.success('Txid copied to clipboard')
}

function queryOriginTx(tx: HsitoryDetail) {
  if (!tx.originTxid) {
    return ''
  } else {
    if (tx.originNetwork == 'BTC') {
      return `https://mempool.space/zh/testnet/tx/${tx.originTxid}`
    } else {
      return `https://test.mvcscan.com/tx/${tx.originTxid}`
    }
  }
}

function queryTargetTx(tx: HsitoryDetail) {
  if (!tx.targetTxid) {
    return ''
  } else {
    if (tx.targetNetwork == 'BTC') {
      return `https://mempool.space/zh/testnet/tx/${tx.targetTxid}`
    } else {
      return `https://test.mvcscan.com/tx/${tx.targetTxid}`
    }
  }
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
      address: address,
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
        item.amount = String(
          formatUnitToBtc(
            Number(item.amount),
            item.originNetwork === 'BTC' ||
              (item.originNetwork === 'MVC' && item.decimals <= 8)
              ? item.decimals
              : item.decimals - 8,
          ),
        )
        return item
      }),
    ]
    // list.value = [...list.value, ...list.value]
  } catch (err) {}

  loading.value = false
}
fetchBridgeHistory()
</script>
