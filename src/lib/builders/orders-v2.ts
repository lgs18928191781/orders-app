import { TradingPair } from '@/data/trading-pairs'
import { constructBidPsbt } from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { exclusiveChange, safeOutputValue } from '../build-helpers'
import {
  EXTRA_INPUT_MIN_VALUE,
  ONE_SERVICE_FEE,
  SIGHASH_ALL,
  SIGHASH_ALL_ANYONECANPAY,
  USE_UTXO_COUNT_LIMIT,
} from '@/data/constants'
import { getPlatformPublicKey } from '@/queries/orders-v2'
import { generateP2wshPayment, getBothPubKeys } from './helpers'
import { raise } from '../helpers'

export async function buildBidOffer({
  total,
  coinAmount,
  selectedPair,
}: {
  total: number
  coinAmount: number
  selectedPair: TradingPair
}) {
  const networkStore = useNetworkStore()
  const orderNetwork = networkStore.network
  const btcNetwork = networkStore.btcNetwork
  const btcjs = window.bitcoin
  const address = useConnectionStore().getAddress

  // 1. get the platform public key
  await getPlatformPublicKey()

  // 2. construct a 1-2 multisig address
  const multiSigPayment = await generateP2wshPayment()
  const multiSigAddress =
    multiSigPayment.address ?? raise('Error when generating multisig address')

  // 3. build pre-transfer transaction
  const pay = new btcjs.Psbt({ network: btcjs.networks[btcNetwork] })
  pay.addOutput({
    address: multiSigAddress,
    value: safeOutputValue(total),
  })

  await exclusiveChange({
    psbt: pay,
    maxUtxosCount: USE_UTXO_COUNT_LIMIT,
    sighashType: SIGHASH_ALL,
  })

  // 4. build bid grant transaction; use the utxo generated from step 3 as input
  const bidGrant = new btcjs.Psbt({ network: btcjs.networks[btcNetwork] })
  const grantInput = {
    hash: pay.extractTransaction().getId(),
    index: 0,
    witnessUtxo: {
      script: pay.extractTransaction().outs[0].script,
      value: pay.extractTransaction().outs[0].value,
    },
    sighashType: SIGHASH_ALL_ANYONECANPAY,
  }
  bidGrant.addInput({
    hash: pay.txOutputs[0].hash,
    index: pay.txOutputs[0].index,
    witnessUtxo: pay.txOutputs[0],
  })

  console.log({ pay })

  return

  // new version of building bid
  // 1. we define a bid schema, ask api to build the psbt for us
  const bidSchema: {
    inputs: {
      type: 'dummy' | 'brc' | 'brc'
      value: number
      tick?: string
      address?: string
    }[]
    outputs: {
      type: 'dummy' | 'brc' | 'brc' | 'change'
      value: number
      tick?: string
      address?: string
    }[]
  } = {
    inputs: [],
    outputs: [],
  }
  // bidSchema.outputs.push({
  //   type: 'change',
  //   value: changeValue,
  //   address,
  // })

  // 2. build the transaction with the schema
  // const constructInfo = await constructBidPsbt({
  //   network: orderNetwork,
  //   tick: selectedPair.fromSymbol,
  //   inscriptionId,
  //   inscriptionNumber,
  //   coinAmount,
  //   total,
  //   poolOrderId: poolOrderId as string,
  //   bidSchema,
  // })

  // const bid = btcjs.Psbt.fromHex(constructInfo.psbtRaw, {
  //   network: btcjs.networks[btcNetwork],
  // })

  // // 3. estimate how much we have to pay
  // const extraInputValue = bid.txOutputs[2].value - total
  // const { difference, fee: bidFee } = await exclusiveChange({
  //   psbt: bid,
  //   estimate: true,
  //   extraInputValue,
  // })
  // if (!difference) {
  //   throw new Error(
  //     'Change calculation failed, please contact customer service.'
  //   )
  // }

  // // 4. construct a tx to split such a utxo with the value of difference
  // const pay = new btcjs.Psbt()
  // pay.addOutput({
  //   address,
  //   value: safeOutputValue(difference),
  // })
  // const {
  //   feeb,
  //   fee: payFee,
  //   changeValue,
  // } = await exclusiveChange({
  //   maxUtxosCount: USE_UTXO_COUNT_LIMIT,
  //   psbt: pay,
  //   sighashType: SIGHASH_ALL,
  // })

  // const uploadFee = bidFee - (EXTRA_INPUT_MIN_VALUE - extraInputValue)

  // return {
  //   order: bid,
  //   secondaryOrder: pay,
  //   orderId: constructInfo.orderId,
  //   type: 'bid',
  //   feeb,
  //   networkFee: payFee + bidFee,
  //   mainFee: bidFee,
  //   secondaryFee: payFee,
  //   uploadFee,
  //   total,
  //   using: difference,
  //   fromSymbol: selectedPair.toSymbol, // reversed
  //   toSymbol: selectedPair.fromSymbol,
  //   fromValue: total,
  //   toValue: coinAmount,
  //   serviceFee: ONE_SERVICE_FEE * 2,
  //   totalPrice: total,
  //   totalSpent: difference + payFee,
  //   changeValue,
  // }
}
