<template>
  <ConnectionModal />
  <WalletMissingModal />
  <div
    class="bridge-wrap relative mx-auto mt-16 max-w-md origin-top lg:scale-125 xl:scale-150"
  >
    <div
      v-if="!swapSuccess"
      class="bridge-container flex flex-col space-y-3 rounded-lg border bg-zinc-900 py-3"
    >
      <div
        class="container-header grid grid-cols-2 items-center justify-between gap-4 px-3.5 py-2 text-sm text-zinc-300 lg:flex"
      >
        <span>Select Asset:</span>
        <BridgePairSelect class="col-span-1"></BridgePairSelect>
      </div>
      <div class="grid p-6">
        <div>
          <BridgeSwapItem
            opName="From"
            :assetInfo="fromAsset.val"
            ref="swapItem"
          ></BridgeSwapItem>
        </div>
        <div class="item-center triggle-icon my-8 flex justify-center">
          <img
            class="h-5 w-5 transition-all duration-300 hover:scale-105"
            :class="{
              'rotate-180': fromAsset.val.network === AssetNetwork.BTC,
            }"
            @click="converSwapItem"
            :src="swap"
            alt=""
          />
        </div>
        <div>
          <BridgeSwapItem opName="To" :assetInfo="toAsset.val"></BridgeSwapItem>
        </div>
        <div class="fee-wrap mt-2.5 flex">
          <span class="mr-4">Fee rate:0.1%</span>
          <span>20 confirmation on MVC TXs</span>
        </div>
      </div>
      <div class="op-btn mt-20 w-full px-6">
        <button
          :class="[
            'w-full',
            'text-base',
            'mb-5',
            'rounded-lg',
            'py-5',
            'flex',
            'item-center',
            'justify-center',
            'font-bold',
            btnStatus.color,
          ]"
        >
          <Loader2Icon class="mr-1.5 h-5 animate-spin" />
          <span
            :class="[btnStatus.color == BtnColor.default ? 'textBlack' : '']"
            >{{ btnStatus.value }}</span
          >
        </button>
      </div>
    </div>
    <div v-else class="swap-success-wrap rounded-lg">
      <div class="swap-success-container grid px-8 pt-16 shadow-md">
        <div class="success-header flex flex-col items-center justify-center">
          <div>
            <CheckCircle2 color="#22C55E" :size="60" />
          </div>
          <div class="mt-3.5 flex flex-col items-center justify-center text-sm">
            <span>Convert ORDI</span>
            <span>from 'BTC Network' to 'MVC Network' success.</span>
          </div>
        </div>
        <div class="success-body mt-4 grid grid-rows-4 gap-y-4 text-xs">
          <div
            v-for="item in successInfo"
            class="item flex items-center justify-between"
          >
            <div class="left">
              <span>{{ item.title }}</span
              ><span class="desc" v-if="item?.desc">({{ item?.desc }})</span>
            </div>
            <div class="right">
              <span>{{ item.amount }}</span
              ><span>{{ item.symbol }}</span>
            </div>
          </div>
        </div>
        <div class="success-footer mt-12">
          <button
            @click="confrimSwap"
            :class="[
              'w-full',
              'text-sm',
              'mb-5',
              'rounded-lg',
              'py-3',
              'flex',
              'item-center',
              'justify-center',
              'font-bold',
              btnStatus.color,
            ]"
          >
            <span>{{ btnStatus.value }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, toRaw, onMounted } from 'vue'
import BridgePairSelect from '@/components/bridge/BridgeSelectPairs.vue'
import swap from '@/assets/icon_swap.svg?url'
import BridgeSwapItem from '@/components/bridge/BridgeSwapItem.vue'
import { useConnectionStore } from '@/stores/connection'
import { Loader2Icon } from 'lucide-vue-next'
import { CheckCircle2 } from 'lucide-vue-next'
import { AssetNetwork } from '@/data/constants'
import { getAssetPairList } from '@/queries/bridge-api'
enum BtnColor {
  default = 'default',
  error = 'error',
  confrimingAndDone = 'confrimingAndDone',
  unLogin = 'unLogin',
}

const swapItem = ref()
const swapSuccess = ref(false)
const fromAsset = reactive({
  val: {
    network: AssetNetwork.BTC,
    balance: 1000,
    symbol: 'RDEX',
    decimal: 0,
  },
})
const toAsset = reactive({
  val: {
    network: AssetNetwork.MVC,
    balance: 2000,
    symbol: 'RDEX',
    decimal: 0,
  },
})
const successInfo: {
  [key: string]: {
    title: string
    desc?: string
    symbol: string
    amount: number
  }
} = reactive({
  send: {
    title: 'Send',
    desc: '',
    symbol: '',
    amount: 0,
  },
  receive: {
    title: 'Receive',
    desc: '1321321',
    symbol: '',
    amount: 0,
  },
  networkFee: {
    title: 'Network Fee',
    symbol: '',
    amount: 0,
  },
  time: {
    title: 'Time',

    symbol: '',
    amount: 0,
  },
})
const connectionStore = useConnectionStore()
console.log('connectionStore', connectionStore.connected)
const btnStatus = computed(() => {
  if (swapItem.value?.swapAmount > swapItem.value?.accountBalance) {
    return {
      value: 'The balance is not enough',
      color: BtnColor.error,
    }
  } else if (!connectionStore.connected) {
    return {
      value: 'Connect Wallet',
      color: BtnColor.unLogin,
    }
  } else if (swapSuccess.value) {
    return {
      value: 'Done',
      color: BtnColor.confrimingAndDone,
    }
  } else {
    return {
      value: 'Convert to ORDI on MVC network',
      color: BtnColor.default,
    }
  }
})

function converSwapItem() {
  const temp = toRaw(fromAsset.val)
  fromAsset.val = toAsset.val
  toAsset.val = temp
}

function confrimSwap() {
  swapSuccess.value = !swapSuccess.value
}
</script>
<style scoped lang="scss">
.bridge-wrap {
  width: 540px;
  .bridge-container {
    border: 1px solid #453c35;
    box-shadow: 0px 3px 5px 0px rgba(77, 58, 44, 0.75);
  }
  .swap-success-wrap {
    border: 1px solid #453c35;
    box-shadow: 0px 3px 5px 0px rgba(77, 58, 44, 0.75);
  }
}

.swap-success-container {
  .success-body {
    .item {
      .left {
        .desc {
          color: #d4d4d8;
        }
      }
    }
  }
}

.op-btn {
  button {
    .textBlack {
      color: #17171a;
    }
  }
}

.container-header {
  border-bottom: 1px solid #453c35;
}
.fee-wrap {
  font-size: 13px;
}
.default {
  background-color: #fdba74;
  &:hover {
    box-shadow: 0 0 8px #fdba74;
  }
}
.error {
  background-color: #ef4444;
  &:hover {
    box-shadow: 0 0 8px #ef4444;
  }
}
.confrimingAndDone {
  background-color: #22c55e;
  &:hover {
    box-shadow: 0 0 8px #22c55e;
  }
}

.unLogin {
  background-color: transparent;
  border: 1px solid #fdba74;
  &:hover {
    box-shadow: 0 0 8px #fdba74;
  }
}
.triggle-icon > img {
  cursor: pointer;
  &:hover {
    scale: 1.2;
  }
}
</style>
