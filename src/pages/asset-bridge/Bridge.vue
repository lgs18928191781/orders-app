<template>
  <!-- <ConnectionModal />
  <WalletMissingModal /> -->
  <div class="bridge-wrap relative mx-auto mt-16 max-w-md origin-top">
    <div
      class="bridge-container flex flex-col space-y-3 rounded-xl border border-primary/30 bg-zinc-900 py-7 shadow-md"
    >
      <div
        class="container-header flex items-center justify-between gap-4 px-7 pb-7 text-sm text-zinc-300 lg:flex"
      >
        <div class="flex items-center">
          <span class="mr-1.5">Select Asset:</span>
          <BridgePairSelect class="col-span-1"></BridgePairSelect>
        </div>

        <div
          class="flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-black"
          @click="handleHistoryVisible(true)"
        >
          <MenuSquare :size="20" />
        </div>
      </div>
      <div class="grid p-7 pb-12 pt-3">
        <div>
          <BridgeSwapItem
            ref="bridgeSwapItem"
            v-model="swapFromAmount"
            opName="From"
            :assetInfo="fromAsset.val"
          ></BridgeSwapItem>
        </div>
        <div class="item-center my-6 flex justify-center text-primary">
          <div
            @click="converSwapItem"
            class="triggle-icon flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 p-3"
          >
            <img
              class="h-4 w-4 transition-all duration-300 hover:scale-105"
              :class="{
                'rotate-180': fromAsset.val.network === AssetNetwork.BTC,
              }"
              :src="swap"
              alt=""
            />
          </div>
        </div>
        <div>
          <BridgeSwapItem
            :modelValue="+swapToAmount!"
            opName="To"
            :assetInfo="toAsset.val"
          ></BridgeSwapItem>
        </div>
        <!-- <div class="fee-wrap mt-2.5 flex">
          <span class="mr-4">Fee rate:{{ feeInfo.val.feeRate }}%</span>
          <span
            >{{ feeInfo.val.comfirmation }} confirmation on
            {{ toAsset.val.network }} TXs</span
          >
        </div> -->
      </div>
      <div class="op-btn w-full px-7">
        <button
          :disabled="btnStatus.disable"
          @click="BtnOperate"
          :class="[
            'w-full',
            'text-base',

            'rounded-xl',
            'py-3',
            'flex',
            'item-center',
            'justify-center',
            'font-bold',
            btnStatus.color,
          ]"
        >
          <!-- <Loader2Icon  class="mr-1.5 h-5 animate-spin" /> -->
          <span
            :class="[
              btnStatus.color == BtnColor.default ||
              btnStatus.color == BtnColor.disable
                ? 'textBlack'
                : '',
              'w-10/12',
            ]"
            >{{ btnStatus.value }}</span
          >
        </button>
      </div>
    </div>

    <TransitionRoot :show="showConfrimDialog" as="template">
      <Dialog class="relative z-30" as="div" @close="() => {}">
        <!-- Modal背景 -->
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 rounded-xl bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
            @close="() => {}"
          />
        </TransitionChild>
        <!-- Modal內容 -->
        <div class="fixed inset-0 overflow-y-auto text-zinc-300">
          <div class="mt-32 flex justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0"
              enter-to="opacity-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100"
              leave-to="opacity-0"
            >
              <DialogPanel
                v-if="!bridgeSuccess"
                class="relative w-[515px] transform overflow-hidden rounded-xl bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-[0_0px_10px_rgba(255,255,255,0.3)] transition-all sm:p-7"
              >
                <DialogTitle
                  as="h3"
                  class="flex items-center justify-between text-2xl leading-6 text-gray-300 text-zinc-100"
                >
                  Summary
                  <div
                    class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-neutral-500"
                    @click="
                      ;(showConfrimDialog = false), (bridgeLoading = false)
                    "
                  >
                    <X :size="20" class="text-zinc-800"></X>
                  </div>
                </DialogTitle>
                <div class="mt-14 flex flex-col">
                  <div
                    class="confrim-top flex flex-col items-center justify-center border-b border-b-[#313131] pb-12 text-lg"
                  >
                    <div
                      class="flex w-full flex-row items-center justify-between"
                    >
                      <div class="text-[#6F6F6F]">From</div>
                      <div class="flex text-xl text-[#FFFFFF]">
                        <span class="mr-3"> {{ swapFromAmount }}</span
                        ><span>{{ fromAsset.val.symbol }}</span>
                      </div>
                    </div>
                    <div class="my-7 flex flex-row">
                      <img :src="Arrow" alt="" />
                    </div>
                    <div
                      class="flex w-full flex-row items-center justify-between"
                    >
                      <div class="flex text-[#6F6F6F]">To</div>
                      <div class="text-xl text-[#FFFFFF]">
                        <span class="mr-3"> {{ swapToAmount }}</span
                        ><span>{{ toAsset.val.symbol }}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    class="confrim-body mt-7 grid grid-rows-4 gap-y-5 text-sm"
                  >
                    <div
                      class="item-center flex justify-between"
                      v-for="(item, index) in bridgeInfo"
                      :key="index"
                    >
                      <div class="text-[#C1C0C0]">{{ item.title }}</div>
                      <div class="flex text-[#fff]">
                        <span class="mr-2">{{ item.value }}</span>
                        <span>{{ item.symbol }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="confrim-foot mt-14 w-full">
                    <button
                      @click="confrimSwap"
                      :class="[
                        'w-full',
                        'text-base',

                        'rounded-xl',
                        'py-3',
                        'flex',
                        'item-center',
                        'justify-center',
                        'font-bold',
                        BtnColor.default,
                      ]"
                    >
                      <Loader2Icon
                        v-if="bridgeLoading"
                        class="mr-1.5 h-5 animate-spin text-[#181614]"
                      />
                      <span class="text-[#181614]">Confirm Bridge</span>
                    </button>
                  </div>
                </div>
              </DialogPanel>
              <DialogPanel
                class="relative w-[515px] transform overflow-hidden rounded-xl bg-zinc-800 text-left shadow-[0_0px_10px_rgba(255,255,255,0.3)] transition-all sm:p-7"
                v-else
              >
                <div class="flex flex-col items-center justify-center">
                  <div
                    class="mt-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#ffa02a] p-7"
                  >
                    <img :src="shape" alt="" />
                  </div>
                  <div class="mt-5 text-2xl text-[#ffa02a]">
                    <span>Successfully</span>
                  </div>
                </div>
                <div class="mb-7 mt-16">
                  <button
                    @click="closeSuccessDialog"
                    :class="[
                      'w-full',
                      'text-base',

                      'rounded-xl',
                      'py-3',
                      'flex',
                      'item-center',
                      'justify-center',
                      'font-bold',
                      BtnColor.default,
                    ]"
                  >
                    <!-- <Loader2Icon  class="mr-1.5 h-5 animate-spin" /> -->
                    <span class="text-[#181614]">OK</span>
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
        <SwapBlur />
      </Dialog>
    </TransitionRoot>

    <!-- <div
      v-else
      class="swap-success-wrap rounded-xl border-primary/30 bg-zinc-900"
    >
      <div class="swap-success-container grid p-8 shadow-md">
        <div class="success-header flex items-center justify-between">
          <div class="text-base">Summary</div>
          <div></div>
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
    </div> -->

    <!-- background blur -->
    <SwapBlur />

    <CheckMetaletProvider></CheckMetaletProvider>
    <BridgeHistory
      :isOpen="historyVisible"
      @handleHistoryVisible="handleHistoryVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, toRaw, onMounted, watch } from 'vue'
import BridgePairSelect from '@/components/bridge/BridgeSelectPairs.vue'
import swap from '@/assets/icon_swap.svg?url'
import BridgeSwapItem from '@/components/bridge/BridgeSwapItem.vue'
import BridgeHistory from '@/components/bridge/BridgeHistory.vue'
import { useConnectionStore } from '@/stores/connection'
import { Loader2Icon, MenuSquare, X } from 'lucide-vue-next'
import shape from '@/assets/shape.svg?url'
import {
  AssetNetwork,
  BRIDGE_CONST_FEE,
  BTC_CONST_FEE,
  MVC_CONST_FEE,
  MVC_PRICE,
  BTC_CONST_REDEEM_FEE,
} from '@/data/constants'
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
  type inscriptionInfo,
  BridgeOp,
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
import { determineAddressInfo, formatSat } from '@/lib/utils'
import { useQuery } from '@tanstack/vue-query'
import { getOneBrc20Query } from '@/queries/orders-api.query'
import { GetMvcTokenDetail } from '@/queries/metasv-api'
import { useNetworkStore } from '@/stores/network'
import {
  SupportRedeemAddressType,
  supportRedeemAddressType,
  useBridgeRedeem,
} from '@/hooks/use-bridge-redeem'
import Arrow from '@/assets/arrow.svg?url'
import { type InscriptionUtxo } from '@/queries/swap/types'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@headlessui/vue'
import { Buffer } from 'buffer'

const { selectBridgePair, selectedPair } = useBridgePair()
enum BtnColor {
  default = 'default',
  error = 'error',
  confrimingAndDone = 'confrimingAndDone',
  unLogin = 'unLogin',
  disable = 'disable',
}

enum BridgeType {
  BRC20_MINT = 'BRC20_MINT',
  BRC20_REDEEM = 'BRC20_REDEEM',
  BTC_MINT = 'BTC_MINT',
  BTC_REDEEM = 'BTC_REDEEM',
}

const { openConnectionModal, closeConnectionModal } =
  useCheckMetaletLoginModal()
const connectionStore = useConnectionStore()
const btcJsStore = useBtcJsStore()
const networkStore = useNetworkStore()
const BridgeTools = useBridgeTools()
const BridgeRedeem = useBridgeRedeem()
const bridgeSwapItem = ref()
const swapFromAmount = ref(0)
const myBrc20s = ref()
const showConfrimDialog = ref(false)
const bridgeSuccess = ref(false)
const bridgeLoading = ref(false)
const feeInfo = reactive({
  val: {
    feeRate: '--',
    comfirmation: 0,
  },
})
const swapSuccess = ref(true)
const bridgeInfo = reactive({
  feeRate: {
    title: 'Fee Rate',
    value: 0,
    symbol: 'BTC',
  },
  bridgeFee: {
    title: "You're pay in bridge fees",
    value: 0,
    symbol: 'BTC',
  },
  newtworkFee: {
    title: 'Network fee',
    value: 0,
    symbol: 'BTC',
  },
  estimatedTime: {
    title: 'Estimated Time of Arrival',
    value: 0,
    symbol: 'minutes',
  },
})
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
    initAmount: 0,
  },
})
const toAsset = reactive({
  val: {
    network: AssetNetwork.MVC,
    balance: 0,
    availableBalance: 0,
    symbol: '--',
    decimal: 0,
    initAmount: 0,
  },
})

const bridgeType = computed(() => {
  if (fromAsset.val.network == AssetNetwork.BTC) {
    if (fromAsset.val.symbol == 'BTC') {
      return BridgeType.BTC_MINT
    } else {
      return BridgeType.BRC20_MINT
    }
  } else {
    if (fromAsset.val.symbol == 'TBTC') {
      return BridgeType.BTC_REDEEM
    } else {
      return BridgeType.BRC20_REDEEM
    }
  }
})

// function calcFeeRate() {
//   let gas = 0
//   switch (bridgeType.value) {
//     case BridgeType.BTC_MINT:
//       gas=new Decimal(MVC_CONST_FEE).mul(MVC_PRICE).div(assetInfo.val.price).toNumber()
//       return new Decimal(swapFromAmount.value).mul(BRIDGE_CONST_FEE).minus(BTC_CONST_FEE).minus(gas).toNumber()
//     case BridgeType.BRC20_MINT:
//       return formatUnitToBtc(assetInfo.val.feeBtc * BRC20_MINT_SIZE)
//     case BridgeType.BTC_REDEEM:
//       return formatUnitToBtc(assetInfo.val.feeMvc * BTC_REDEEM_SIZE)
//     case BridgeType.BRC20_REDEEM:
//       console.log('currentAssetInfo', currentAssetInfo)
//       debugger
//       return formatUnitToBtc(assetInfo.val.feeMvc * BTC_REDEEM_SIZE)
//   }
// }

async function publickeyToAddress() {
  const publicKey = await connectionStore.adapter.getMvcPublickey()
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const { address } = btcJsStore.btcjs!.payments.p2pkh({
    pubkey: publicKeyBuffer,
    network: btcJsStore.btcjs!.networks.bitcoin,
  })
  return address
}

function closeSuccessDialog() {
  bridgeSuccess.value = false
  showConfrimDialog.value = false
  window.location.reload()
}

async function getAssetInfo() {
  if (!connectionStore.connected) return
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

    currentAssetInfo.val = currentPairs[0]
    console.log('assetInfo.val', currentAssetInfo.val)
    // debugger
    const mvcAddress = await publickeyToAddress()
    if (connectionStore.connected) {
      if (fromAsset.val.network == AssetNetwork.BTC) {
        queryAddress = connectionStore.last.address
      } else if (fromAsset.val.network == AssetNetwork.MVC) {
        queryAddress = await connectionStore.adapter.getMvcAddress()
      }
      if (network == AssetBridgeNetwork.BRC20) {
        // debugger
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
            myBrc20s.value = res[0]
            const fromBalance = res[0]
            fromAsset.val.balance = new Decimal(
              fromBalance.transferBalance
            ).toNumber()
            fromAsset.val.initAmount = new Decimal(
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

const fromNetworkIsBrc20 = computed(() => {
  return (
    currentAssetInfo.val.network == AssetBridgeNetwork.BRC20 &&
    fromAsset.val.network == AssetNetwork.BTC
  )
})

const btnStatus = computed(() => {
  if (fromAsset.val.network == AssetNetwork.BTC) {
    if (networkStore.network !== 'testnet') {
      return {
        value: 'BTC => MVC requires Metalet wallet to switch to Testnet',
        color: BtnColor.error,
        disable: true,
      }
    }
  } else {
    if (networkStore.network !== 'livenet') {
      return {
        value: 'MVC => BTC requires Metalet wallet to switch to Mainnet',
        color: BtnColor.error,
        disable: true,
      }
    }
  }

  if (swapFromAmount.value == 0) {
    return {
      value: `Convert to ${fromAsset.val.symbol} on ${toAsset.val.network} network`,
      color: BtnColor.disable,
      disable: true,
    }
  }

  if (
    swapFromAmount.value &&
    fromNetworkIsBrc20.value &&
    new Decimal(swapFromAmount.value).toNumber() <=
      myBrc20s.value.transferBalance
  ) {
    return {
      value: `Bridge`,
      color: BtnColor.default,
      disable: false,
    }
  }
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
  } else {
    return {
      value: `Bridge`,
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

    if (currentAssetInfo.val.network == AssetBridgeNetwork.BTC) {
      try {
        const op =
          fromAsset.val.network == AssetNetwork.BTC
            ? BridgeOp.BtcToMvcByBtc
            : BridgeOp.MVCToBtcByBtc
        const { confirmNumber, receiveAmount } = BridgeTools.calcReceiveInfo(
          formatUnitToSats(swapFromAmount.value, currentAssetInfo.val.decimal),
          assetInfo.val,
          currentAssetInfo.val,
          op
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
        const op =
          fromAsset.val.network == AssetNetwork.BTC
            ? BridgeOp.BtcToMvcByBrc20
            : BridgeOp.MvcToBtcByBrc20
        const { confirmNumber, receiveAmount } = BridgeTools.calcReceiveInfo(
          swapFromAmount.value,
          assetInfo.val,
          currentAssetInfo.val,
          op
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
  console.log('assetInfo.val', currentAssetInfo.val)
}

function BtnOperate() {
  if (btnStatus.value.color == BtnColor.unLogin) {
    connetMetalet()
  } else if (btnStatus.value.color == BtnColor.default) {
    bridgeInfo.bridgeFee.value =
      fromAsset.val.symbol == 'BTC' || fromAsset.val.symbol == 'TBTC'
        ? 0
        : new Decimal(1000).div(10 ** 8).toNumber()

    bridgeInfo.estimatedTime.value = feeInfo.val.comfirmation * 10

    showConfrimDialog.value = true
  }
}
async function redeem() {
  const addressInfo = determineAddressInfo(
    await connectionStore.adapter.getAddress()
  )
  const addressType: SupportRedeemAddressType =
    addressInfo.type.toLocaleUpperCase() as SupportRedeemAddressType

  try {
    if (!supportRedeemAddressType.includes(addressType)) {
      throw new Error('unsupport address tyep')
    }
    if (currentAssetInfo.val.network === AssetBridgeNetwork.BTC) {
      await BridgeRedeem.redeemBtc(
        formatSat(swapFromAmount.value, currentAssetInfo.val.decimals),
        currentAssetInfo.val,
        addressType
      )
    }
    if (currentAssetInfo.val.network === AssetBridgeNetwork.BRC20) {
      await BridgeRedeem.redeemBrc20(
        formatSat(
          swapFromAmount.value,
          currentAssetInfo.val.decimals - currentAssetInfo.val.trimDecimals
        ),
        currentAssetInfo.val,
        addressType
      )
    }
  } catch (err) {
    throw new Error(err as any)
  }
}

async function connetMetalet() {
  await connectionStore.connect('metalet')
}

async function confrimSwap() {
  if (swapFromAmount.value <= 0) {
    return
  }
  bridgeLoading.value = true
  if (fromAsset.val.network === AssetNetwork.BTC) {
    try {
      const publicKey = await connectionStore.adapter.getPubKey()
      const publicKeySign = await connectionStore.adapter.signMessage(publicKey)
      const publicKeyReceive = await connectionStore.adapter.getMvcPublickey()
      const publicKeyReceiveSign = await connectionStore.adapter.signMvcMessage(
        {
          message: publicKeyReceive,
        }
      )
      console.log('publicKeyReceiveSign', publicKeyReceiveSign)

      const addressType = determineAddressInfo(
        await connectionStore.adapter.getAddress()
      )
      console.log('addressType', bridgeSwapItem.value.InscriptionUtxos)
      if (fromAsset.val.symbol == 'BTC') {
        await BridgeTools.sumitBridgeOrderForBtc({
          amount: String(
            formatUnitToSats(swapFromAmount.value, currentAssetInfo.val.decimal)
          ),
          originTokenId: currentAssetInfo.val.originTokenId,
          addressType: addressType.type.toUpperCase(),
          publicKey: publicKey,
          publicKeySign: publicKeySign,
          publicKeyReceive,
          publicKeyReceiveSign: publicKeyReceiveSign,
          feeBtc: assetInfo.val.feeBtc,
        })
      } else {
        let inscriptions: inscriptionInfo =
          myBrc20s.value.transferBalanceList.find((item: inscriptionInfo) => {
            return (
              item.inscriptionId == bridgeSwapItem.value.InscriptionUtxos[0].id
            )
          })

        await BridgeTools.sumitBridgeOrderForBrc20({
          amount: String(swapFromAmount.value),
          originTokenId: currentAssetInfo.val.originTokenId,
          addressType: addressType.type.toUpperCase(),
          publicKey: publicKey,
          publicKeySign: publicKeySign,
          publicKeyReceive,
          publicKeyReceiveSign: publicKeyReceiveSign,
          feeBtc: assetInfo.val.feeBtc,
          inscription: inscriptions,
        })
      }
      bridgeLoading.value = false
      bridgeSuccess.value = true
    } catch (error) {
      bridgeLoading.value = false
      return ElMessage.error((error as any).message)
    }
  } else if (fromAsset.val.network === AssetNetwork.MVC) {
    try {
      await redeem()
      bridgeLoading.value = false
      bridgeSuccess.value = true
    } catch (error) {
      bridgeLoading.value = false
      return ElMessage.error((error as any).message)
    }
  }

  successInfo.send.amount = swapFromAmount.value
  successInfo.send.desc =
    (fromAsset.val.network as AssetNetwork) == AssetNetwork.BTC
      ? 'BTC Wallet'
      : 'MVC Wallet'
  successInfo.send.symbol = fromAsset.val.symbol
  successInfo.receive.amount = +swapToAmount.value!
  successInfo.receive.desc =
    toAsset.val.network == AssetNetwork.BTC ? 'BTC Wallet' : 'MVC Wallet'
  successInfo.receive.symbol = toAsset.val.symbol
  successInfo.networkFee.symbol = fromAsset.val.symbol
  successInfo.time.amount = prettyTimestamp(Date.now())
}

getAssetInfo()

// history
const historyVisible = ref<boolean>(false)
const handleHistoryVisible = (visible: boolean) => {
  historyVisible.value = visible
}
</script>
<style scoped lang="scss">
.bridge-wrap {
  .bridge-container {
    width: 515px;
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
.disable {
  background-color: #ffa02a;
  opacity: 0.7;
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
.triggle-icon {
  cursor: pointer;
  &:hover {
    box-shadow: 0 0 2px 2px #464038;
  }
}
.triggle-icon > img {
  color: #ffa02a;
  &:hover {
    scale: 1.2;
  }
}
</style>
