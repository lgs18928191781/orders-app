import { PsbtTxOutput, type Psbt, TxOutput } from 'bitcoinjs-lib'
import { Buffer } from 'buffer'
import { isTaprootInput } from 'bitcoinjs-lib/src/psbt/bip371'

import { useAddressStore, useBtcJsStore } from '@/store'
import {
  DUST_UTXO_VALUE,
  FEEB_MULTIPLIER,
  MIN_FEEB,
  MS_BRC20_UTXO_VALUE,
  MS_FEEB_MULTIPLIER,
  SIGHASH_ALL,
  SIGHASH_ALL_ANYONECANPAY,
  SIGHASH_ANYONECANPAY,
} from '@/data/constants'
import { getFeebPlans, getTxHex, getUtxos } from '@/queries/proxy'
import { getLowestFeeb, raise } from './helpers'
import { Output } from 'bitcoinjs-lib/src/transaction'
import { getListingUtxos } from '@/queries/orders-api'
import Decimal from 'decimal.js'

const TX_EMPTY_SIZE = 4 + 1 + 1 + 4
const TX_INPUT_BASE = 32 + 4 + 1 + 4 // 41
const TX_INPUT_PUBKEYHASH = 107
const TX_INPUT_SEGWIT = 27
const TX_INPUT_TAPROOT = 17 // round up 16.5 bytes
const TX_OUTPUT_BASE = 8 + 1
const TX_OUTPUT_PUBKEYHASH = 25
const TX_OUTPUT_SCRIPTHASH = 23
const TX_OUTPUT_SEGWIT = 22
const TX_OUTPUT_SEGWIT_SCRIPTHASH = 34

function uintOrNaN(v: any) {
  if (typeof v !== 'number') return NaN
  if (!isFinite(v)) return NaN
  if (Math.floor(v) !== v) return NaN
  if (v < 0) return NaN
  return v
}

function sumOrNaN(txOutputs: TxOutput[] | Output[]) {
  return txOutputs.reduce(function (a: number, x: any) {
    return a + uintOrNaN(x.value)
  }, 0)
}

type PsbtInput = (typeof Psbt.prototype.data.inputs)[0]
function inputBytes(input: PsbtInput) {
  // todo: script length
  if (isTaprootInput(input)) {
    return TX_INPUT_BASE + TX_INPUT_TAPROOT
  }

  if (input.witnessUtxo) return TX_INPUT_BASE + TX_INPUT_SEGWIT

  return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH

  // return (
  //   TX_INPUT_BASE +
  //   (input.script
  //     ? input.script.length
  //     : input.isTaproot
  //     ? TX_INPUT_TAPROOT
  //     : input.witnessUtxo
  //     ? TX_INPUT_SEGWIT
  //     : TX_INPUT_PUBKEYHASH)
  // )
}

function outputBytes(output: PsbtTxOutput) {
  return (
    TX_OUTPUT_BASE +
    (output.script
      ? output.script.length
      : output.address?.startsWith('bc1') || output.address?.startsWith('tb1')
      ? output.address?.length === 42
        ? TX_OUTPUT_SEGWIT
        : TX_OUTPUT_SEGWIT_SCRIPTHASH
      : output.address?.startsWith('3') || output.address?.startsWith('2')
      ? TX_OUTPUT_SCRIPTHASH
      : TX_OUTPUT_PUBKEYHASH)
  )
}

function transactionBytes(inputs: PsbtInput[], outputs: PsbtTxOutput[]) {
  const inputsSize = inputs.reduce(function (a, x) {
    return a + inputBytes(x)
  }, 0)
  const outputsSize = outputs.reduce(function (a, x) {
    return a + outputBytes(x)
  }, 0)

  console.log({
    inputsSize,
    outputsSize,
    TX_EMPTY_SIZE,
  })
  return TX_EMPTY_SIZE + inputsSize + outputsSize
}

export function calcFee(
  psbt: Psbt,
  feeRate: number,
  extraSize: number = 31 // 31 is the size of the segwit change output
  // extraInputValue?: number
) {
  const inputs = psbt.data.inputs
  const outputs = psbt.txOutputs

  let bytes = transactionBytes(inputs, outputs)
  if (extraSize) {
    bytes += extraSize
  }
  console.log({ bytes })

  let fee = Math.ceil(bytes * feeRate)
  // if (extraInputValue) {
  //   fee -= extraInputValue
  // }

  return fee
}

export function calculateFee(feeRate: number, vinLen: number, voutLen: number) {
  const baseTxSize = 10
  const inSize = 180
  const outSize = 34

  const txSize = baseTxSize + vinLen * inSize + (voutLen + 1) * outSize

  const fee = Math.round((txSize * feeRate) / 2)

  return fee
}

export function calculatePsbtFee(psbt: Psbt, feeRate: number, isMs?: boolean) {
  // clone a new psbt to mock the finalization
  const clonedPsbt = psbt.clone()
  const address =
    useAddressStore().get ??
    raise('Please connect to your UniSat wallet first.')

  // mock the change output
  clonedPsbt.addOutput({
    address,
    value: DUST_UTXO_VALUE,
  })
  const virtualSize = (
    clonedPsbt.data.globalMap.unsignedTx as any
  ).tx.virtualSize()
  const fee = Math.max(virtualSize * feeRate, 546)

  // return fee

  // bump up the fee
  const multiplier = isMs ? MS_FEEB_MULTIPLIER : FEEB_MULTIPLIER
  return Math.round(fee * multiplier)
}

// the difference between exclusiveChange and change
// is that we filter out all the utxos that are currently listing
// that way we dont generate contradictory psbts
export async function exclusiveChange({
  psbt,
  feeb,
  pubKey,
  extraSize,
  extraInputValue,
  sighashType = SIGHASH_ALL_ANYONECANPAY,
  estimate = false,
}: {
  psbt: Psbt
  feeb?: number
  pubKey?: Buffer
  extraSize?: number
  extraInputValue?: number
  sighashType?: number
  estimate?: boolean
}) {
  // check if address is set
  const address =
    useAddressStore().get ??
    raise('Please connect to your UniSat wallet first.')

  // Add payment input
  const listingUtxos = await getListingUtxos()
  const paymentUtxo = await getUtxos(address).then((result) => {
    // first, filter out all the utxos that are currently listing
    const filtered = result.filter((utxo) => {
      return !listingUtxos.some((listingUtxo) => {
        const [txId, outputIndex] = listingUtxo.dummyId.split(':')
        return utxo.txId === txId && utxo.outputIndex === Number(outputIndex)
      })
    })
    console.log({ result, listingUtxos, filtered })

    // choose the largest utxo
    const utxo = filtered.reduce((prev, curr) => {
      if (prev.satoshis > curr.satoshis) {
        return prev
      } else {
        return curr
      }
    }, result[0])
    return utxo
  })

  if (!paymentUtxo) {
    throw new Error(
      'You have no usable You have no usable BTC UTXO. Please deposit more BTC into your address to receive additional UTXO. utxo'
    )
  }

  // query rawTx of the utxo
  // const rawTx = await getTxHex(paymentUtxo.txId)
  // // decode rawTx
  // const btcjs = useBtcJsStore().get!
  // const tx = btcjs.Transaction.fromHex(rawTx)

  // construct input
  const btcjs = useBtcJsStore().get!
  const paymentPrevOutput = btcjs.address.toOutputScript(address)
  const paymentWitnessUtxo = {
    value: paymentUtxo.satoshis,
    script: paymentPrevOutput,
  }
  const paymentInput: any = {
    hash: paymentUtxo.txId,
    index: paymentUtxo.outputIndex,
    witnessUtxo: paymentWitnessUtxo,
    sighashType,
  }
  if (pubKey) {
    paymentInput.tapInternalPubkey = pubKey
  }
  const paymentUtxoValue = paymentUtxo.satoshis

  if (estimate) {
    const psbtClone = psbt.clone()
    psbtClone.addInput(paymentInput)

    // Add change output
    if (!feeb) {
      feeb = await getLowestFeeb()
    }

    let fee = calcFee(psbtClone, feeb, extraSize)
    console.log({ fee, feeb, extraSize, extraInputValue })
    const totalOutput = sumOrNaN(psbtClone.txOutputs)
    const totalInput = sumOrNaN(
      psbtClone.data.inputs.map(
        (input) =>
          input.witnessUtxo ||
          input.nonWitnessUtxo ||
          raise(
            'Input invalid. Please try again or contact customer service for assistance.'
          )
      )
    )
    const changeValue = totalInput - totalOutput - fee + (extraInputValue || 0)
    console.log({
      changeValue,
      totalInput,
      totalOutput,
      fee,
      paymentUtxoValue,
      difference: paymentUtxoValue - changeValue,
    })

    if (changeValue < 0) {
      throw new Error(
        'Insufficient balance. Please ensure that the address has a sufficient balance and try again.'
      )
    }

    // return the difference，which feans how much we actually paying
    return {
      difference: paymentUtxoValue - changeValue,
      feeb,
      fee,
      paymentValue: paymentUtxoValue - changeValue,
      changeValue: 0,
    }
  }

  psbt.addInput(paymentInput)

  // Add change output
  if (!feeb) {
    feeb = await getLowestFeeb()
  }

  let fee = calcFee(psbt, feeb, extraSize)
  const totalOutput = sumOrNaN(psbt.txOutputs)
  const totalInput = sumOrNaN(
    psbt.data.inputs.map(
      (input) =>
        input.witnessUtxo ||
        input.nonWitnessUtxo ||
        raise(
          'Input invalid. Please try again or contact customer service for assistance.'
        )
    )
  )
  const changeValue = totalInput - totalOutput - fee
  console.log({ fee, totalInput, totalOutput, changeValue })
  console.log({ paymentUtxoValue, changeValue })

  if (changeValue < 0) {
    throw new Error(
      'Insufficient balance. Please ensure that the address has a sufficient balance and try again.'
    )
  }

  if (changeValue >= DUST_UTXO_VALUE) {
    psbt.addOutput({
      address,
      value: safeOutputValue(changeValue),
    })
  } else {
    fee += changeValue
  }

  return {
    psbt,
    fee,
    paymentValue: paymentUtxo.satoshis,
    feeb,
    changeValue,
  }
}

export async function change({
  psbt,
  feeb,
  pubKey,
  extraSize,
  extraInputValue,
  sighashType = SIGHASH_ALL_ANYONECANPAY,
  estimate = false,
}: {
  psbt: Psbt
  feeb?: number
  pubKey?: Buffer
  extraSize?: number
  extraInputValue?: number
  sighashType?: number
  estimate?: boolean
}) {
  // check if address is set
  const address =
    useAddressStore().get ??
    raise('Please connect to your UniSat wallet first.')

  // Add payment input
  const paymentUtxo = await getUtxos(address).then((result) => {
    // choose the largest utxo
    const utxo = result.reduce((prev, curr) => {
      if (prev.satoshis > curr.satoshis) {
        return prev
      } else {
        return curr
      }
    }, result[0])
    return utxo
  })

  if (!paymentUtxo) {
    throw new Error(
      'You have no You have no usable BTC UTXO. Please deposit more BTC into your address to receive additional UTXO. BTC utxo'
    )
  }

  // query rawTx of the utxo
  const rawTx = await getTxHex(paymentUtxo.txId)
  // decode rawTx
  const btcjs = useBtcJsStore().get!
  const tx = btcjs.Transaction.fromHex(rawTx)

  // construct input
  const paymentInput: any = {
    hash: paymentUtxo.txId,
    index: paymentUtxo.outputIndex,
    witnessUtxo: tx.outs[paymentUtxo.outputIndex],
    sighashType,
  }
  if (pubKey) {
    paymentInput.tapInternalPubkey = pubKey
  }
  const paymentUtxoValue = paymentUtxo.satoshis

  if (estimate) {
    const psbtClone = psbt.clone()
    psbtClone.addInput(paymentInput)

    // Add change output
    if (!feeb) {
      feeb = await getLowestFeeb()
    }

    let fee = calcFee(psbtClone, feeb, extraSize)
    console.log({ fee, feeb, extraSize, extraInputValue })
    const totalOutput = sumOrNaN(psbtClone.txOutputs)
    const totalInput = sumOrNaN(
      psbtClone.data.inputs.map(
        (input) =>
          input.witnessUtxo ||
          input.nonWitnessUtxo ||
          raise(
            'Input invalid. Please try again or contact customer service for assistance.'
          )
      )
    )
    const changeValue = totalInput - totalOutput - fee + (extraInputValue || 0)
    console.log({
      changeValue,
      totalInput,
      totalOutput,
      fee,
      paymentUtxoValue,
      difference: paymentUtxoValue - changeValue,
    })

    if (changeValue < 0) {
      throw new Error(
        'Insufficient balance. Please ensure that the address has a sufficient balance and try again.'
      )
    }

    // return the difference，which feans how much we actually paying
    return {
      difference: paymentUtxoValue - changeValue,
      feeb,
      fee,
      paymentValue: paymentUtxoValue - changeValue,
      changeValue: 0,
    }
  }

  psbt.addInput(paymentInput)

  // Add change output
  if (!feeb) {
    feeb = await getLowestFeeb()
  }

  let fee = calcFee(psbt, feeb, extraSize)
  const totalOutput = sumOrNaN(psbt.txOutputs)
  const totalInput = sumOrNaN(
    psbt.data.inputs.map(
      (input) =>
        input.witnessUtxo ||
        input.nonWitnessUtxo ||
        raise(
          'Input invalid. Please try again or contact customer service for assistance.'
        )
    )
  )
  const changeValue = totalInput - totalOutput - fee
  console.log({ fee, totalInput, totalOutput, changeValue })
  console.log({ paymentUtxoValue, changeValue })

  if (changeValue < 0) {
    throw new Error(
      'Insufficient balance. Please ensure that the address has a sufficient balance and try again.'
    )
  }

  if (changeValue >= DUST_UTXO_VALUE) {
    psbt.addOutput({
      address,
      value: safeOutputValue(changeValue),
    })
  } else {
    fee += changeValue
  }

  return {
    psbt,
    fee,
    paymentValue: paymentUtxo.satoshis,
    feeb,
    changeValue,
  }
}

export function safeOutputValue(value: number | Decimal): number {
  // if value is less than 1k sats, throw an error
  if (typeof value === 'number') {
    if (value < MS_BRC20_UTXO_VALUE) {
      throw new Error(
        `The amount you are trying is too small. Maybe try a larger amount.`
      )
    }
  } else {
    if (value.lessThan(MS_BRC20_UTXO_VALUE)) {
      throw new Error(
        `The amount you are trying is too small. Maybe try a larger amount.`
      )
    }
  }

  // make sure value is a whole number
  if (typeof value === 'number') {
    return Math.round(value)
  }

  return value.round().toNumber()
}
