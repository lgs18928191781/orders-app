<template>
  <div v-if="curPair && tokenIn && tokenOut">
    <div class="swap-sub-control-panel">
      <span>You pay</span>
      <div class="flex h-16 items-center justify-between space-x-2">
        <input
          type="number"
          v-model="tokenInAmount"
          class="quiet-input w-12 flex-1 bg-transparent p-0 leading-loose"
          placeholder="Enter an amount"
        />
        <div
          class="flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-xl"
        >
          <MVCSwapIcon :token="tokenIn" />
          <div class="mr-1">
            {{ tokenIn.symbol }}
          </div>
        </div>
      </div>
      <div class="flex gap-1 text-xs text-zinc-400">
        Balance: {{ tokenInBal }}
      </div>
    </div>
    <div>
      <div class="relative z-30 my-0.5 flex h-0 justify-center">
        <div
          class="group absolute -translate-y-1/2 rounded-xl bg-zinc-900 p-1 transition-all duration-500 hover:scale-110 lg:duration-150"
        >
          <ArrowDownIcon
            class="box-content inline h-4 w-4 rounded-lg bg-zinc-800 p-2 group-hover:hidden"
          />

          <button
            class="shadow-mvc/80 box-content hidden rounded-lg bg-zinc-800 p-2 shadow-sm transition-all duration-500 group-hover:inline lg:duration-200"
            @click="switchToken"
          >
            <ArrowUpDownIcon class="text-mvc h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="swap-sub-control-panel">
      <span>You receive</span>
      <div class="flex h-16 items-center justify-between space-x-2">
        <input
          v-model="tokenOutAmount"
          type="number"
          class="quiet-input w-12 flex-1 bg-transparent p-0 leading-loose"
          placeholder="0"
          disabled
        />
        <div
          class="flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-xl"
        >
          <MVCSwapIcon :token="tokenOut" />
          <div class="mr-1">
            {{ tokenOut.symbol }}
          </div>
        </div>
      </div>
      <div class="flex gap-1 text-xs text-zinc-400">
        Balance: {{ tokenOutBal }}
      </div>
    </div>
    <div class="mt-5 grid grid-rows-3 gap-y-2 text-sm">
      <div class="item-center flex justify-between">
        <span class="text-[#C1C0C0]">Price</span>
        <span class="text-[#fff]">{{ priceLabel }}</span>
      </div>
      <div class="item-center flex justify-between">
        <span class="text-[#C1C0C0]">Price Impact</span>
        <span :class="beyond ? 'text-red-500' : 'text-[#fff]'"
          >{{ tokenIn.symbol }} {{ slip || '0%' }}, {{ tokenOut.symbol }}
          {{ slip1 || '0%' }}</span
        >
      </div>
      <div class="item-center flex justify-between">
        <span class="text-[#C1C0C0]">Fee</span>
        <span class="text-[#fff]">{{ fee }}</span>
      </div>
    </div>
    <div class="my-2">
      <MVCSwapSubmitBtn
        :conditions="conditions"
        @submit="handleSubmit"
        :submiting="submiting"
      >
        {{ beyond ? 'Swap Anyway' : 'Swap' }}
      </MVCSwapSubmitBtn>
    </div>
  </div>
  <div class="flex h-full w-full items-center justify-center" v-else>
    <Loader2Icon class="h-8 w-8 animate-spin text-zinc-500" />
  </div>
  <MVCSwapSuccess
    :isOpen="successVisible"
    @handleSuccessVisible="handleSuccessVisible"
  />
</template>
<script setup lang="ts">
import { useMVCSwapStore } from '@/stores/mvcswap'
import { useConnectionStore } from '@/stores/connection'
import { formatAmount, formatSat } from '@/lib/formatters'
import { calcAmount, formatTok, MINAMOUNT } from '@/utils/mvcswap'
import { storeToRefs } from 'pinia'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { gzip } from 'node-gzip'
import BigNumber from 'bignumber.js'
import { reqSwap, token1totoken2, token2toToken1 } from '@/queries/mvcswap'
import { ElMessage } from 'element-plus'
const store = useMVCSwapStore()
const { fetchPairs, fetchBalance, fetchPairInfo } = store

const { curPair, userBalance } = storeToRefs(store)
const tokenIn = ref<MS.Token | undefined>(curPair.value?.token1 || undefined)
const tokenOut = ref<MS.Token | undefined>(curPair.value?.token2 || undefined)
const tokenInAmount = ref()
const successVisible = ref(false)
const handleSuccessVisible = (visible: boolean) => {
  successVisible.value = visible
}
const defaultSlipValue = 1
const slip = ref('0%')
const slip1 = ref('0%')
const tokenOutAmount = ref()
const submiting = ref(false)
const fee = ref('--')

const tokenInBal = computed(() => {
  if (tokenIn && tokenIn.value) {
    if (tokenIn.value.symbol === 'SPACE') {
      return userBalance.value.space || '0'
    } else {
      return userBalance.value[tokenIn.value.tokenID] || '0'
    }
  }
  return '0'
})
const tokenOutBal = computed(() => {
  if (tokenOut && tokenOut.value) {
    if (tokenOut.value.symbol === 'SPACE') {
      return userBalance.value.space || '0'
    } else {
      return userBalance.value[tokenOut.value.tokenID] || '0'
    }
  }
  return '0'
})

const priceLabel = computed(() => {
  if (!curPair.value || !tokenIn.value) return ''
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
  if (tokenIn.value?.symbol === 'SPACE') {
    return price1_ui
  }
  return price2_ui
})

const conditions = computed(() => {
  if (!tokenIn.value) return []
  return [
    {
      condition: !Boolean(tokenInAmount.value),
      text: 'Enter an amount',
      danger: false,
      disabled: true,
    },
    {
      condition: Number(tokenInAmount.value) > Number(tokenInBal.value),
      text: `Insufficient ${tokenIn.value.symbol} Balance`,
      danger: true,
      disabled: false,
    },
  ]
})
const beyond = computed(() => {
  return Math.abs(parseFloat(slip.value)) > defaultSlipValue
})
watch(
  curPair,
  (newVlue, oldValue) => {
    if (newVlue) {
      if (oldValue) {
        if (newVlue.swapID !== oldValue.swapID) {
          tokenInAmount.value = ''
          tokenIn.value = newVlue.token1
          tokenOut.value = newVlue.token2
        } else if (tokenIn.value && tokenOut.value) {
          let _newTokenIn: any
          let _newTokenOut: any
          if (tokenIn.value.tokenID === newVlue.token1.tokenID) {
            _newTokenIn = newVlue.token1
          }
          if (tokenIn.value.tokenID === newVlue.token2.tokenID) {
            _newTokenIn = newVlue.token2
          }
          if (tokenOut.value.tokenID === newVlue.token1.tokenID) {
            _newTokenOut = newVlue.token1
          }
          if (tokenOut.value.tokenID === newVlue.token2.tokenID) {
            _newTokenOut = newVlue.token2
          }
          tokenIn.value = _newTokenIn
          tokenOut.value = _newTokenOut
        }
      } else {
        tokenIn.value = newVlue.token1
        tokenOut.value = newVlue.token2
      }
    }
  },
  { deep: true },
)

watch(tokenInAmount, (newVlue) => {
  if (!curPair.value || !tokenIn.value || !tokenOut.value) return
  const dirForward = tokenIn.value.symbol === curPair.value.token1.symbol
  const value = formatAmount(newVlue, curPair.value.token1.decimal)

  const _fee = formatAmount(
    BigNumber(value)
      .multipliedBy(curPair.value.swapFeeRate || 0)
      .div(10000),
    tokenIn.value.decimal,
  )
  const obj = calcAmount({
    tokenIn: tokenIn.value,
    tokenOut: tokenOut.value,
    dirForward,
    originAddAmount: newVlue,
    pairData: curPair.value,
  })
  tokenOutAmount.value = obj.newAimAddAmount
  fee.value = `${_fee} ${tokenIn.value.symbol.toUpperCase()}`
  slip.value = obj.slip.indexOf('NaN') > -1 ? '0%' : obj.slip
  slip1.value = obj.slip1.indexOf('NaN') > -1 ? '0%' : obj.slip1
})
const switchToken = () => {
  tokenInAmount.value = ''
  const tmp = tokenIn.value
  tokenIn.value = tokenOut.value
  tokenOut.value = tmp
}

const connectionStore = useConnectionStore()

const handleSubmit = async () => {
  if (!curPair.value || !tokenIn.value || !tokenOut.value) return
  try {
    submiting.value = true
    const address = await connectionStore.adapter.getMvcAddress()
    const dirForward = tokenIn.value.symbol === curPair.value.token1.symbol
    const pairName = curPair.value.pairName || ''
    const ret = await reqSwap({
      symbol: pairName,
      address: address,
      op: dirForward ? 3 : 4,
      source: 'mvcswap.com',
    })
    if (ret.code !== 0) throw new Error(ret.msg)
    const { mvcToAddress, tokenToAddress, txFee, requestIndex } = ret.data
    let payload: Record<string, any> = {
      symbol: pairName,
      requestIndex: requestIndex,
      op: dirForward ? 3 : 4,
    }
    let amount: any = formatTok(tokenInAmount.value, tokenIn.value.decimal)
    if (dirForward) {
      let isMvc = tokenIn.value.symbol.toLowerCase() === 'space'
      // isMvc always true
      if (isMvc) {
        const userTotal = BigNumber(userBalance.value.space).multipliedBy(1e8)
        let total: bigint | BigNumber = BigInt(amount) + BigInt(txFee)
        const _allBalance = total > BigInt(userTotal.toString())
        if (_allBalance) {
          total = userTotal
          amount = BigInt(userTotal.toString()) - BigInt(txFee)
        }
        if (amount < MINAMOUNT) {
          throw new Error(`Minimum ${MINAMOUNT} Sats required`)
        }
        const params = {
          address: mvcToAddress,
          amount: total.toString(),
          changeAddress: undefined,
          note: 'mvcswap.com(swap)',
          noBroadcast: true,
        }
        const res: any = await window.metaidwallet.transfer({
          broadcast: false,
          tasks: [
            {
              type: 'space',
              receivers: [{ address: mvcToAddress, amount: total.toString() }],
            },
          ],
        })

        if (res.status === 'canceled') throw new Error(res.status)
        if (res.msg) throw new Error(res.msg)
        payload = {
          ...payload,
          // token1TxID: ts_res.txid,
          mvcOutputIndex: 0,
          mvcRawTx: res.res ? res.res[0].txHex : res.txHex,
          token1AddAmount: amount.toString(),
        }
      } else {
        throw new Error('not support yet')
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
            codehash: tokenIn.value.codeHash,
            genesis: tokenIn.value.tokenID,
            receivers: [{ address: tokenToAddress, amount }],
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
      payload = {
        ...payload,
        mvcRawTx: retData[0].txHex,
        mvcOutputIndex: 0,
        token2RawTx: retData[1].txHex,
        token2OutputIndex: 0,
        amountCheckRawTx: retData[1].routeCheckTxHex,
      }
    }

    let swap_data: any = JSON.stringify(payload)

    swap_data = await gzip(swap_data)
    let res = dirForward
      ? await token1totoken2({ data: swap_data })
      : await token2toToken1({ data: swap_data })
    console.log(res)
    if (res.code) throw new Error(res.msg)
    await Promise.all([fetchPairs(), fetchBalance(), fetchPairInfo()])
    tokenInAmount.value = ''
    handleSuccessVisible(true)
  } catch (err: any) {
    console.log(err)
    ElMessage.error(err.message)
  }
  submiting.value = false
}
</script>
