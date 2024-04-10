<template>
  <div v-if="curPair">
    <div class="swap-sub-control-panel">
      <div class="flex h-16 items-center justify-between space-x-2">
        <input
          type="number"
          v-model="token1Amount"
          @input="handelToken1Change"
          class="quiet-input w-12 flex-1 bg-transparent p-0 leading-loose"
          placeholder="Enter an amount"
        />
        <div
          class="flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-xl"
        >
          <MVCSwapIcon :token="curPair.token1" />
          <div class="mr-1">
            {{ curPair.token1.symbol }}
          </div>
        </div>
      </div>
      <div class="flex gap-1 text-xs text-zinc-400">
        Balance: {{ token1Bal }}
      </div>
    </div>
    <div class="py-2">
      <PlusIcon class="mx-auto h-5 w-5 text-zinc-500" />
    </div>
    <div class="swap-sub-control-panel">
      <div class="flex h-16 items-center justify-between space-x-2">
        <input
          type="number"
          v-model="token2Amount"
          @input="handelToken2Change"
          class="quiet-input w-12 flex-1 bg-transparent p-0 leading-loose"
          placeholder="Enter an amount"
        />
        <div
          class="flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-xl"
        >
          <MVCSwapIcon :token="curPair.token2" />
          <div class="mr-1">
            {{ curPair.token2.symbol }}
          </div>
        </div>
      </div>
      <div class="flex gap-1 text-xs text-zinc-400">
        Balance: {{ token2Bal }}
      </div>
    </div>
    <div class="mt-5 grid grid-rows-2 gap-y-1 text-sm">
      <div class="item-center flex justify-between">
        <span class="text-[#C1C0C0]">Price</span>
        <span class="text-[#fff]">{{ priceLabel }}</span>
      </div>
    </div>
    <div class="my-2">
      <MVCSwapSubmitBtn
        :conditions="conditions"
        @submit="handleSubmit"
        :submiting="submiting"
      >
        Supply liquidity
      </MVCSwapSubmitBtn>
    </div>
  </div>
  <MVCSwapSuccess
    :isOpen="successVisible"
    @handleSuccessVisible="handleSuccessVisible"
  />
</template>
<script setup lang="ts">
import { addLiq, reqSwap } from '@/queries/mvcswap'
import { useMVCSwapStore } from '@/stores/mvcswap'
import { useConnectionStore } from '@/stores/connection'
import { formatAmount, formatSat } from '@/lib/formatters'
import {
  countLpAddAmount,
  countLpAddAmountWithToken2,
  formatTok,
} from '@/utils/mvcswap'
import { PlusIcon, Loader2Icon, DropletsIcon } from 'lucide-vue-next'
import { gzip } from 'node-gzip'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import BigNumber from 'bignumber.js'
import { ElMessage } from 'element-plus'
const successVisible = ref(false)
const handleSuccessVisible = (visible: boolean) => {
  successVisible.value = visible
}
const submiting = ref(false)
const store = useMVCSwapStore()
const { fetchPairs, fetchBalance, fetchPairInfo } = store
const { curPair, userBalance } = storeToRefs(store)
const mvcAddress = ref<string>('')
const lastMod = ref<'token1' | 'token2'>('token1')
const connectionStore = useConnectionStore()
async function getAddress() {
  mvcAddress.value = await connectionStore.adapter.getMvcAddress()
}
getAddress()
const token1Amount = ref('')
const token2Amount = ref('')
const token1Bal = computed(() => {
  if (curPair && curPair.value) {
    if (curPair.value.token1.symbol === 'SPACE') {
      return userBalance.value.space || '0'
    } else {
      return userBalance.value[curPair.value.token1.tokenID] || '0'
    }
  }
  return '0'
})
const token2Bal = computed(() => {
  if (curPair && curPair.value) {
    if (curPair.value.token2.symbol === 'SPACE') {
      return userBalance.value.space || '0'
    } else {
      return userBalance.value[curPair.value.token2.tokenID] || '0'
    }
  }
  return '0'
})
const priceLabel = computed(() => {
  if (!curPair.value) return ''
  const _swapToken1Amount = formatSat(
    curPair.value.token1Amount,
    curPair.value.token1.decimal,
  )
  const _swapToken2Amount = formatSat(
    curPair.value.token2Amount,
    curPair.value.token2.decimal,
  )
  const price1 = formatAmount(
    Number(_swapToken2Amount) / Number(_swapToken1Amount),
    curPair.value.token2.decimal,
  )
  const price2 = formatAmount(
    Number(_swapToken1Amount) / Number(_swapToken2Amount),
    curPair.value.token1.decimal,
  )
  const price1_ui = `1 ${curPair.value.token1.symbol.toUpperCase()} = ${price1} ${curPair.value.token2.symbol.toUpperCase()}`
  const price2_ui = `1 ${curPair.value.token2.symbol.toUpperCase()} = ${price2} ${curPair.value.token1.symbol.toUpperCase()}`

  return price1_ui
})
const conditions = computed(() => {
  if (!curPair.value) return []

  return [
    {
      condition: !Boolean(token1Amount.value),
      text: 'Enter an amount',
      danger: false,
      disabled: true,
    },
    {
      condition: Number(token1Amount.value) > Number(token1Bal.value),
      text: `Insufficient ${curPair.value.token1.symbol} Balance`,
      danger: true,
      disabled: false,
    },
    {
      condition: Number(token2Amount.value) > Number(token2Bal.value),
      text: `Insufficient ${curPair.value.token2.symbol} Balance`,
      danger: true,
      disabled: false,
    },
  ]
})

watch(
  curPair,
  (newVlue, oldValue) => {
    if (newVlue) {
      if (oldValue && newVlue.swapID !== oldValue.swapID) {
        token1Amount.value = ''
        token2Amount.value = ''
      }
    }
  },
  { deep: true },
)
const handelToken1Change = (e: any) => {
  console.log(e.target.value)
  const { value } = e.target
  if (!curPair.value) return
  const {
    token1,
    token2,
    swapToken1Amount = '',
    swapToken2Amount = '',
    swapLpAmount = '',
  } = curPair.value
  if (swapToken1Amount === '0' && swapToken2Amount === '0') {
    //第一次添加流动性
    return
  }
  const origin_amount = formatTok(value, token1.decimal)

  const [lpMinted, token2AddAmount] = countLpAddAmount({
    token1AddAmount: origin_amount.toString(),
    swapToken1Amount: swapToken1Amount,
    swapToken2Amount: swapToken2Amount,
    swapLpTokenAmount: swapLpAmount,
  })
  const user_aim_amount = formatSat(token2AddAmount.toString(), token2.decimal)
  token2Amount.value = user_aim_amount
  lastMod.value = 'token1'
}

const handelToken2Change = (e: any) => {
  console.log(e.target.value)
  const { value } = e.target
  if (!curPair.value) return
  const {
    token1,
    token2,
    swapToken1Amount = '',
    swapToken2Amount = '',
    swapLpAmount = '',
  } = curPair.value
  if (swapToken1Amount === '0' && swapToken2Amount === '0') {
    //第一次添加流动性
    return
  }
  const aim_amount = formatTok(value, token2.decimal)

  const [lpMinted, token1AddAmount] = countLpAddAmountWithToken2({
    token2AddAmount: aim_amount.toString(),
    swapToken1Amount: swapToken1Amount,
    swapToken2Amount: swapToken2Amount,
    swapLpTokenAmount: swapLpAmount,
  })
  const user_origin_amount = formatSat(
    token1AddAmount.toString(),
    token1.decimal,
  )
  token1Amount.value = user_origin_amount
  lastMod.value = 'token2'
}
const handleSubmit = async () => {
  if (!curPair.value || !mvcAddress.value) return
  try {
    submiting.value = true
    const pairName = curPair.value.pairName || ''
    const address = await connectionStore.adapter.getMvcAddress()
    const res = await reqSwap({
      symbol: pairName,
      address,
      op: 1,
      source: 'mvcswap.com',
    })
    const { code, data, msg } = res
    if (code) {
      throw new Error(msg)
    }
    const {
      swapToken1Amount,
      swapToken2Amount,
      swapLpAmount,
      mvcToAddress,
      tokenToAddress,
      requestIndex,
      txFee,
    } = data
    const { token1, token2 } = curPair.value
    let _token1Amount
    let _token2Amount

    let _origin_amount, _aim_amount
    let isMvc = curPair.value.token1.symbol.toLowerCase() === 'space'
    if (
      isMvc &&
      BigNumber(token1Amount.value)
        .plus(BigNumber(txFee + 100000).div(Math.pow(10, token1.decimal)))
        .isGreaterThan(userBalance.value.space || 0)
    ) {
      _token1Amount = BigNumber(token1Amount.value).minus(
        BigNumber(txFee + 100000).div(Math.pow(10, token1.decimal)),
      )
      if (_token1Amount.toNumber() <= 0) {
        throw new Error('Insufficient Space Balance')
      }
      lastMod.value = 'token1'
    }
    if (lastMod.value === 'token1') {
      let token1AddAmount = formatTok(token1Amount.value, token1.decimal)
      let token2AddAmount
      if (swapToken1Amount === '0' && swapToken2Amount === '0') {
        token2AddAmount = formatTok(token2Amount.value, token2.decimal)
      } else {
        token2AddAmount = countLpAddAmount({
          token1AddAmount: token1AddAmount.toString(),
          swapToken1Amount,
          swapToken2Amount,
          swapLpTokenAmount: swapLpAmount,
        })[1]
      }
      _origin_amount = token1AddAmount
      _aim_amount = token2AddAmount
    } else {
      const token2AddAmount = formatTok(token2Amount.value, token2.decimal)
      let token1AddAmount
      if (swapToken1Amount === '0' && swapToken2Amount === '0') {
        // token1AddAmount = BigNumber(origin_amount)
        //   .multipliedBy(Math.pow(10, token1.decimal))
        //   .toString();
        token1AddAmount = formatTok(token1Amount.value, token1.decimal)
        // console.log(token1AddAmount, formatTok(origin_amount, token1.decimal))
      } else {
        token1AddAmount = countLpAddAmountWithToken2({
          token2AddAmount: token2AddAmount.toString(),
          swapToken1Amount,
          swapToken2Amount,
          swapLpTokenAmount: swapLpAmount,
        })[1]
      }
      _origin_amount = token1AddAmount
      _aim_amount = token2AddAmount
    }
    let liq_data
    if (isMvc) {
      const tx_res: any = await window.metaidwallet.transfer({
        broadcast: false,
        tasks: [
          {
            type: 'space',
            receivers: [
              {
                address: mvcToAddress,
                amount: (
                  BigInt(_origin_amount.toString()) + BigInt(txFee)
                ).toString(),
              },
            ],
          },
          {
            type: 'token',
            codehash: token2.codeHash,
            genesis: token2.tokenID,
            receivers: [
              { address: tokenToAddress, amount: _aim_amount.toString() },
            ],
          },
        ],
      })
      if (tx_res.status === 'canceled') throw new Error(tx_res.status)
      if (!tx_res) {
        throw new Error('Transaction failed')
      }
      if (tx_res.msg) {
        throw new Error(tx_res.msg)
      }
      const retData = tx_res.res
      if (
        !retData[0] ||
        !retData[0].txHex ||
        !retData[1] ||
        !retData[1].txHex
      ) {
        throw new Error('Transaction failed')
      }
      liq_data = {
        symbol: curPair.value.pairName || '',
        requestIndex: requestIndex,
        mvcRawTx: retData[0].txHex,
        mvcOutputIndex: 0,
        token2RawTx: retData[1].txHex,
        token2OutputIndex: 0,
        token1AddAmount: _origin_amount.toString(),
        amountCheckRawTx: retData[1].routeCheckTxHex,
      }
    } else {
      const tx_res: any = await window.metaidwallet.transfer({
        broadcast: false,
        tasks: [
          {
            type: 'space',
            receivers: [{ address: mvcToAddress, amount: String(txFee) }],
          },
          {
            type: 'token',
            codehash: token1.codeHash,
            genesis: token1.tokenID,
            receivers: [
              { address: tokenToAddress, amount: _origin_amount.toString() },
            ],
          },
          {
            type: 'token',
            codehash: token2.codeHash,
            genesis: token2.tokenID,
            receivers: [
              { address: tokenToAddress, amount: _aim_amount.toString() },
            ],
          },
        ],
      })
      if (tx_res.status === 'canceled') throw new Error(tx_res.status)
      if (!tx_res) {
        throw new Error('Transaction failed')
      }
      if (tx_res.msg) {
        throw new Error(tx_res.msg)
      }
      const retData = tx_res.res
      if (
        !retData[0] ||
        !retData[0].txHex ||
        !retData[1] ||
        !retData[1].txHex
      ) {
        throw new Error('Transaction failed')
      }
      liq_data = {
        symbol: curPair.value.pairName || '',
        requestIndex: requestIndex,
        mvcRawTx: retData[0].txHex,
        mvcOutputIndex: 0,
        token1AddAmount: _origin_amount.toString(),
        token1RawTx: retData[1].txHex,
        token1OutputIndex: 0,
        amountCheck1RawTx: retData[1].routeCheckTxHex,
        token2RawTx: retData[2].txHex,
        token2OutputIndex: 0,
        amountCheck2RawTx: retData[2].routeCheckTxHex,
      }
    }

    liq_data = JSON.stringify(liq_data)
    liq_data = await gzip(liq_data)
    const ret = await addLiq({ data: liq_data })
    if (ret.code) throw new Error(ret.msg)
    await Promise.all([fetchPairs(), fetchBalance(), fetchPairInfo()])
    token1Amount.value = ''
    token2Amount.value = ''
    handleSuccessVisible(true)
  } catch (err: any) {
    console.log(err)
    ElMessage.error(err.message)
  }
  submiting.value = false
}
</script>
