<template>
  <!-- <ConnectionModal />
  <WalletMissingModal /> -->
  <div class="bridge-wrap relative mx-auto mt-16 max-w-md origin-top">
    <div
      v-if="!swapSuccess"
      class="bridge-container flex flex-col space-y-3 rounded-3xl border border-primary/30 bg-zinc-900 py-3 shadow-md"
    >
      <div
        class="container-header grid grid-cols-2 items-center justify-between gap-4 px-3.5 pb-2 text-sm text-zinc-300 lg:flex"
      >
        <span>Select Asset:</span>
        <BridgePairSelect class="col-span-1"></BridgePairSelect>
      </div>
      <div class="grid p-6 pt-3">
        <div>
          <BridgeSwapItem
            v-model="swapFromAmount"
            opName="From"
            :assetInfo="fromAsset.val"
          ></BridgeSwapItem>
        </div>
        <div
          class="item-center triggle-icon my-6 flex justify-center text-primary"
        >
          <img
            class="h-4 w-4 transition-all duration-300 hover:scale-105"
            :class="{
              'rotate-180': fromAsset.val.network === AssetNetwork.BTC,
            }"
            @click="converSwapItem"
            :src="swap"
            alt=""
          />
        </div>
        <div>
          <BridgeSwapItem
            :modelValue="swapToAmount"
            opName="To"
            :assetInfo="toAsset.val"
          ></BridgeSwapItem>
        </div>
        <div class="fee-wrap mt-2.5 flex">
          <span class="mr-4">Fee rate:{{ feeInfo.val.feeRate }}%</span>
          <span
            >{{ feeInfo.val.comfirmation }} confirmation on
            {{ toAsset.val.network }} TXs</span
          >
        </div>
      </div>
      <div class="op-btn mt-20 w-full px-6">
        <button
          :disabled="btnStatus.disable"
          @click="BtnOperate"
          :class="[
            'w-full',
            'text-base',
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
          <Loader2Icon v-if="false" class="mr-1.5 h-5 animate-spin" />
          <span
            :class="[btnStatus.color == BtnColor.default ? 'textBlack' : '']"
            >{{ btnStatus.value }}</span
          >
        </button>
        <button @click="redeem">redeem</button>
      </div>
    </div>
    <div
      v-else
      class="swap-success-wrap rounded-3xl border-primary/30 bg-zinc-900"
    >
      <div class="swap-success-container grid px-8 pt-16 shadow-md">
        <div class="success-header flex flex-col items-center justify-center">
          <div>
            <CheckCircle2 color="#22C55E" :size="80" />
          </div>
          <div class="mt-3.5 flex flex-col items-center justify-center text-sm">
            <span>Convert {{ successInfo.send.symbol }}</span>
            <span
              >from '{{ fromAsset.val.network }} Network' to '{{
                toAsset.val.network
              }}
              Network' success.</span
            >
          </div>
        </div>
        <div class="success-body mt-4 grid grid-rows-4 gap-y-4 text-sm">
          <div
            v-for="item in successInfo"
            class="item flex items-center justify-between"
          >
            <div class="left flex items-center">
              <span class="mr-1">{{ item.title }}</span
              ><span class="desc" v-if="item?.desc">({{ item?.desc }})</span>
            </div>
            <div class="right flex items-center">
              <span>{{ item.amount }}</span
              ><span class="ml-2" v-if="item.symbol">{{ item.symbol }}</span>
            </div>
          </div>
        </div>
        <div class="success-footer mt-12">
          <button
            @click="Done"
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

    <!-- background blur -->
    <SwapBlur />

    <CheckMetaletProvider></CheckMetaletProvider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, toRaw, onMounted, watch } from 'vue'
import BridgePairSelect from '@/components/bridge/BridgeSelectPairs.vue'
import swap from '@/assets/icon_swap.svg?url'
import BridgeSwapItem from '@/components/bridge/BridgeSwapItem.vue'
import { useConnectionStore } from '@/stores/connection'
import { Loader2Icon } from 'lucide-vue-next'
import { CheckCircle2 } from 'lucide-vue-next'
import { AssetNetwork } from '@/data/constants'
import {
  getAssetPairList,
  type assetReqReturnType,
  type bridgeAssetPairReturnType,
} from '@/queries/bridge-api'
import SwapBlur from '@/components/swap/SwapBlur.vue'
import {
  useBridgeTools,
  AddressType,
  AssetBridgeNetwork,
} from '@/hooks/use-bridge-tool'
import Decimal from 'decimal.js'
import CheckMetaletProvider from '@/components/bridge/CheckMetaletProvider.vue'
import { useCheckMetaletLoginModal } from '@/hooks/use-check-metalet-modal'
import { useBridgePair } from '@/hooks/use-bridge-pair'
import { prettyTimestamp } from '@/lib/formatters'
import { ElMessage } from 'element-plus'
import { getOneBrc20 } from '@/queries/orders-api'
import { useRoute } from 'vue-router'
import { formatUnitToBtc, formatUnitToSats } from '@/lib/formatters'
import { useBtcJsStore } from '@/stores/btcjs'
import { determineAddressInfo } from '@/lib/utils'
import { useBridgeRedeem } from '@/hooks/use-bridge-redeem'
import { GetMvcTokenDetail } from '@/queries/metasv-api'
import { Payment, Transaction, Psbt, address as Address } from 'bitcoinjs-lib'
import { useNetworkStore } from '@/stores/network'
const { selectBridgePair, selectedPair } = useBridgePair()
enum BtnColor {
  default = 'default',
  error = 'error',
  confrimingAndDone = 'confrimingAndDone',
  unLogin = 'unLogin',
}

const { openConnectionModal, closeConnectionModal } =
  useCheckMetaletLoginModal()
const connectionStore = useConnectionStore()
console.log('connectionStore1111', connectionStore)
const btcJsStore = useBtcJsStore()
const route = useRoute()
const BridgeTools = useBridgeTools()
const BridgeRedeem = useBridgeRedeem()

onMounted(() => {
  const network = useNetworkStore()
  const hex = `70736274ff01009a020000000297f45a11493bf73abe0a4312987f9699ef1efe8fe3d00cae9267a4db581f25900000000000ffffffff0238a298f0742927a107063fe18579689c81ff91a56ad2ee4b132bcaa231427d0100000000ffffffff02140000000000000016001427f47faf8191d338e0550beeba38d98c5b405fad3dde0000000000001600142153b6c9d77d1596de652cb45a7225305271a6f2000000000001011f14000000000000001600142153b6c9d77d1596de652cb45a7225305271a6f201086c02483045022100ed888b709f6e7b3a93565c4e40dd3e4ad9ac930faf8d525aaddea22c4c68d18202205358a6910834b2b929eca828a108bdf609ac4c36bf83b7431b584dbcb60b62e1012103699cfa8eeae59ef3e607e1e4d90efe9156110bb21234cff6bbd9fe47afcc40e10001011f1de30000000000001600142153b6c9d77d1596de652cb45a7225305271a6f201086b02473044022031c08c8e6cc1f7cb042f88536b2e8afd2b66a86f0d5f73283125a0906a32ae8e02207b4230e005d5a071699049ed7a5ef4e12dd7327512250272f7f1172ef22f462f012103699cfa8eeae59ef3e607e1e4d90efe9156110bb21234cff6bbd9fe47afcc40e1000000`
  const psbt = Psbt.fromHex(hex, {
    network: network.typedNetwork,
  })
  console.log('psbt', psbt)
  debugger
})

const swapFromAmount = ref(0)
const feeInfo = reactive({
  val: {
    feeRate: '--',
    comfirmation: 0,
  },
})
const swapSuccess = ref(false)

const assetInfo = reactive<{ val: bridgeAssetPairReturnType }>({
  val: {},
})
const currentAssetInfo = reactive<{ val: assetReqReturnType }>({
  val: {},
})

const fromAsset = reactive({
  val: {
    network: AssetNetwork.BTC,
    balance: 0,
    availableBalance: 0,
    symbol: '--',
    decimal: 0,
  },
})
const toAsset = reactive({
  val: {
    network: AssetNetwork.MVC,
    balance: 0,
    availableBalance: 0,
    symbol: '--',
    decimal: 0,
  },
})

async function publickeyToAddress() {
  const publicKey = await connectionStore.adapter.getMvcPublickey()
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const { address } = btcJsStore.btcjs!.payments.p2pkh({
    pubkey: publicKeyBuffer,
    network: btcJsStore.btcjs!.networks.bitcoin,
  })
  return address
}

async function getAssetInfo() {
  try {
    let queryAddress = ''
    assetInfo.val = await getAssetPairList()

    const currentPairs = assetInfo.val!.assetList!.filter((item: any) => {
      return (
        item.originSymbol == selectedPair.value.fromSymbol &&
        item.targetSymbol == selectedPair.value.toSymbol
      )
    })

    const { decimals, originSymbol, targetSymbol, network } = currentPairs[0]
    console.log('assetInfo.val', currentPairs[0])
    currentAssetInfo.val = currentPairs[0]
    const mvcAddress = await publickeyToAddress()
    if (connectionStore.connected) {
      if (fromAsset.val.network == AssetNetwork.BTC) {
        queryAddress = connectionStore.last.address
      } else if (fromAsset.val.network == AssetNetwork.MVC) {
        queryAddress = await connectionStore.adapter.getMvcAddress()
      }
      if (network == AssetBridgeNetwork.BRC20) {
        debugger
        Promise.all([
          getOneBrc20({
            tick: originSymbol,
            address: queryAddress,
          }),
          GetMvcTokenDetail(mvcAddress!, {
            codeHash: currentAssetInfo.val.targetTokenCodeHash,
            genesis: currentAssetInfo.val.targetTokenGenesis,
          }),
        ])
          .then((res) => {
            debugger
            const fromBalance = res[0]
            fromAsset.val.balance = new Decimal(
              fromBalance.transferBalance
            ).toNumber()
            fromAsset.val.availableBalance = new Decimal(
              fromBalance.availableBalance
            ).toNumber()
            if (res[1].length) {
              const toAssetInfo = res[1][0]
              toAsset.val.balance = new Decimal(toAssetInfo.confirmed)
                .add(toAssetInfo.unconfirmed)
                .div(10 ** toAssetInfo.decimal)
                .toNumber()
            }
          })
          .catch((err) => {
            ElMessage.error(err.message)
          })
      } else if (network == AssetBridgeNetwork.BTC) {
        Promise.all([
          connectionStore.adapter.getBalance(),
          GetMvcTokenDetail(mvcAddress!, {
            codeHash: currentAssetInfo.val.targetTokenCodeHash,
            genesis: currentAssetInfo.val.targetTokenGenesis,
          }),
        ])
          .then((res) => {
            const fromBalance = res[0]
            fromAsset.val.balance = new Decimal(fromBalance)
              .div(10 ** decimals)
              .toNumber()
            if (res[1].length) {
              const toAssetInfo = res[1][0]
              toAsset.val.balance = new Decimal(toAssetInfo.confirmed)
                .add(toAssetInfo.unconfirmed)
                .div(10 ** toAssetInfo.decimal)
                .toNumber()
            }
          })
          .catch((e) => {
            ElMessage.error(e.message)
          })
      }
    }

    fromAsset.val.decimal = decimals
    fromAsset.val.symbol = originSymbol

    toAsset.val.symbol = targetSymbol
    toAsset.val.decimal = decimals
  } catch (error) {
    return ElMessage.error((error as any).message)
  }
}

const successInfo: {
  [key: string]: {
    title: string
    desc?: string
    symbol: string
    amount: number | string
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
    desc: '',
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
    amount: '',
  },
})

watch(
  () => connectionStore.connected,
  (staus) => {
    if (staus) {
      getAssetInfo()
    }
  }
)

const btnStatus = computed(() => {
  if (new Decimal(swapFromAmount.value).toNumber() > fromAsset.val.balance) {
    return {
      value: 'The balance is not enough',
      color: BtnColor.error,
      disable: true,
    }
  } else if (lessThanMinLimited.value) {
    return {
      value: 'Less than Bridge MinmumLimit',
      color: BtnColor.error,
      disable: true,
    }
  } else if (lastThanMaxLimited.value) {
    return {
      value: 'Over than Bridge MaxmumLimit',
      color: BtnColor.error,
      disable: true,
    }
  } else if (!connectionStore.connected) {
    return {
      value: 'Connect Wallet',
      color: BtnColor.unLogin,
      disable: false,
    }
  } else if (swapSuccess.value) {
    return {
      value: 'Done',
      color: BtnColor.confrimingAndDone,
      disable: false,
    }
  } else {
    return {
      value: `Convert to ${fromAsset.val.symbol} on ${toAsset.val.network} network`,
      color: BtnColor.default,
      disable: false,
    }
  }
})

const lessThanMinLimited = ref(false)
const lastThanMaxLimited = ref(false)

const swapToAmount = computed(() => {
  if (swapFromAmount.value == 0 || !swapFromAmount.value) {
    return 0
  } else {
    lessThanMinLimited.value = false
    lastThanMaxLimited.value = false
    if (currentAssetInfo.val.symbol == AssetBridgeNetwork.BTC) {
      try {
        console.log('swapFromAmount', swapFromAmount)
        console.log('currentAssetInfo.val', currentAssetInfo.val)

        const { confirmNumber, receiveAmount } = BridgeTools.calcReceiveInfo(
          formatUnitToSats(swapFromAmount.value, currentAssetInfo.val.decimal),
          assetInfo.val,
          currentAssetInfo.val
        )
        feeInfo.val.comfirmation = confirmNumber
        return formatUnitToBtc(receiveAmount, currentAssetInfo.val.decimal)
      } catch (error) {
        if ((error as any).message) {
          if (
            +swapFromAmount.value <
            formatUnitToBtc(
              JSON.parse((error as any).message).amountLimitMinimum,
              currentAssetInfo.val.decimal
            )
          ) {
            lessThanMinLimited.value = true
          } else if (
            +swapFromAmount.value >
            formatUnitToBtc(
              JSON.parse((error as any).message).amountLimitMaximum,
              currentAssetInfo.val.decimal
            )
          ) {
            lastThanMaxLimited.value = true
          }
        }
      }
    } else {
      try {
        console.log('swapFromAmount', swapFromAmount)
        console.log('currentAssetInfo.val', currentAssetInfo.val)

        const { confirmNumber, receiveAmount } = BridgeTools.calcReceiveInfo(
          swapFromAmount.value,
          assetInfo.val,
          currentAssetInfo.val
        )
        feeInfo.val.comfirmation = confirmNumber
        return receiveAmount
      } catch (error) {
        if ((error as any).message) {
          if (
            +swapFromAmount.value <
            JSON.parse((error as any).message).amountLimitMinimum
          ) {
            lessThanMinLimited.value = true
          } else if (
            +swapFromAmount.value >
            JSON.parse((error as any).message).amountLimitMaximum
          ) {
            lastThanMaxLimited.value = true
          }
        }
      }
    }
  }
})

function converSwapItem() {
  const temp = toRaw(fromAsset.val)
  fromAsset.val = toAsset.val
  toAsset.val = temp
}

function BtnOperate() {
  if (btnStatus.value.color == BtnColor.unLogin) {
    connetMetalet()
  } else if (btnStatus.value.color == BtnColor.default) {
    confrimSwap()
  }
}
async function redeem() {
  //TODO 限定metalet 钱包
  try {
    if (currentAssetInfo.val.network === 'BTC') {
      await BridgeRedeem.redeemBtc(10000, currentAssetInfo.val)
    }
    if (currentAssetInfo.val.network === 'BRC20') {
      await BridgeRedeem.redeemBrc20(1000000000, currentAssetInfo.val)
    }
  } catch (err) {
    console.log(err)
  }
}

async function connetMetalet() {
  await connectionStore.connect('metalet')
}

async function confrimSwap() {
  if (swapFromAmount.value <= 0) {
    return
  }

  const publicKey = await connectionStore.adapter.getPubKey()
  const publicKeySign = await connectionStore.adapter.signMessage(publicKey)
  const publicKeyReceive = await connectionStore.adapter.getMvcPublickey()
  const publicKeyReceiveSign = await connectionStore.adapter.signMvcMessage({
    message: publicKeyReceive,
  })
  console.log('publicKeyReceiveSign', publicKeyReceiveSign)

  const addressType = determineAddressInfo(
    await connectionStore.adapter.getAddress()
  )
  console.log('addressType', addressType)

  await BridgeTools.sumitBridgeOrderForBrc20({
    amount: swapFromAmount.value,
    originTokenId: currentAssetInfo.val.originTokenId,
    addressType: addressType.type.toUpperCase(),
    publicKey: publicKey,
    publicKeySign: publicKeySign,
    publicKeyReceive,
    publicKeyReceiveSign: publicKeyReceiveSign,
    feeBtc: assetInfo.val.feeBtc,
    inscription: {
      amount: `${swapFromAmount.value}`,
      inscriptionId:
        '90251f58dba46792ae0cd0e38ffe1eef99967f9812430abe3af73b49115af497i0',
      inscriptionNumber: '2460758',
      outValue: 546,
    },
  })

  return

  await BridgeTools.sumitBridgeOrderForBtc({
    amount: formatUnitToSats(
      swapFromAmount.value,
      currentAssetInfo.val.decimal
    ),
    originTokenId: currentAssetInfo.val.originTokenId,
    addressType: addressType.type.toUpperCase(),
    publicKey: publicKey,
    publicKeySign: publicKeySign,
    publicKeyReceive,
    publicKeyReceiveSign: publicKeyReceiveSign,
    feeBtc: assetInfo.val.feeBtc,
  })
  successInfo.send.amount = swapFromAmount.value
  successInfo.send.desc =
    fromAsset.val.network == AssetNetwork.BTC ? 'BTC Wallet' : 'MVC Wallet'
  successInfo.send.symbol = fromAsset.val.symbol
  successInfo.receive.amount = +swapToAmount.value!
  successInfo.receive.desc =
    toAsset.val.network == AssetNetwork.BTC ? 'BTC Wallet' : 'MVC Wallet'
  successInfo.receive.symbol = toAsset.val.symbol
  successInfo.networkFee.symbol = fromAsset.val.symbol
  successInfo.time.amount = prettyTimestamp(Date.now())
  swapSuccess.value = true
}

function Done() {
  swapSuccess.value = false
}

getAssetInfo()
</script>
<style scoped lang="scss">
.bridge-wrap {
  width: 540px;

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
    cursor: pointer;
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
  background-color: #ffa02a;
  &:hover {
    box-shadow: 0 0 8px #ffa02a;
  }
}
.error {
  background-color: #ef4444;
  &:hover {
    opacity: 0.85;
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
  border: 1px solid #ffa02a;
  &:hover {
    box-shadow: 0 0 8px #ffa02a;
  }
}
.triggle-icon > img {
  cursor: pointer;
  color: #ffa02a;
  &:hover {
    scale: 1.2;
  }
}
</style>
