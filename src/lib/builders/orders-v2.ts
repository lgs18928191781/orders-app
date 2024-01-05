import { TradingPair } from '@/data/trading-pairs'
import {
  constructBidPsbt,
  getOneBidOrder,
  getOneBrc20,
} from '@/queries/orders-api'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import {
  exclusiveChange,
  fillInternalKey,
  safeOutputValue,
} from '../build-helpers'
import {
  EXTRA_INPUT_MIN_VALUE,
  ONE_SERVICE_FEE,
  SIGHASH_ALL,
  SIGHASH_ALL_ANYONECANPAY,
  USE_UTXO_COUNT_LIMIT,
} from '@/data/constants'
import { getPlatformPublicKey, getSellFees } from '@/queries/orders-v2'
import { generateP2wshPayment, getBothPubKeys } from './helpers'
import { raise } from '../helpers'
import { useFeebStore } from '@/stores/feeb'
import { getExcludedUtxos } from '@/queries/excluded-utxos'
import { useBtcJsStore } from '@/stores/btcjs'
import { SimpleUtxo, getTxHex } from '@/queries/proxy'

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
  const btcNetwork = networkStore.btcNetwork
  const btcjs = window.bitcoin
  const address = useConnectionStore().getAddress

  // 1. get the platform public key
  await getPlatformPublicKey()

  // 2. construct a 1-2 multisig address
  const multiSigPayment = await generateP2wshPayment()
  const multiSigAddress =
    multiSigPayment.address ?? raise('Error when generating multisig address')

  // 3. build bid grant transaction; estimate one single UTXO as input
  const bidGrant = new btcjs.Psbt({
    network: btcjs.networks[btcNetwork],
  }).addOutput({
    address: multiSigAddress,
    value: safeOutputValue(total),
  })

  const { fee: bidGrantFee, feeb } = await exclusiveChange({
    psbt: bidGrant,
    sighashType: SIGHASH_ALL,
    estimate: true,
    extraSize: 0,
  })

  // the value of the input should be the total value plus the fee
  const bidGrantInputValue = total + bidGrantFee

  // 3.5 Optimization: if we find a utxo with roughly the same value as bidGrantInputValue, we can skip the next step and use it directly
  const excludedUtxos = await getExcludedUtxos()
  // roughly the same means the value of the utxo is should be [bidGrantInputValue, bidGrantInputValue + 1000]
  const foundUtxo = excludedUtxos.find(
    (utxo) =>
      utxo.satoshis >= bidGrantInputValue &&
      utxo.satoshis <= bidGrantInputValue + 1000
  )

  let pay: any
  let payFee = 0
  if (foundUtxo) {
    bidGrant.addInput(
      fillInternalKey({
        hash: foundUtxo.txId,
        index: foundUtxo.outputIndex,
        witnessUtxo: {
          script: btcjs.address.toOutputScript(address),
          value: foundUtxo.satoshis,
        },
      })
    )
  } else {
    // 4. build pay transaction in order to generate such a UTXO
    pay = new btcjs.Psbt({
      network: btcjs.networks[btcNetwork],
    }).addOutput({
      address,
      value: safeOutputValue(bidGrantInputValue),
    })
    const { fee } = await exclusiveChange({
      psbt: pay,
      maxUtxosCount: USE_UTXO_COUNT_LIMIT,
      sighashType: SIGHASH_ALL,
    })
    payFee = fee
  }

  return {
    order: bidGrant,
    secondaryOrder: pay,
    type: 'bid',
    feeb,
    networkFee: payFee + bidGrantFee,
    mainFee: bidGrantFee,
    secondaryFee: payFee,
    total,
    fromSymbol: selectedPair.toSymbol, // reversed
    toSymbol: selectedPair.fromSymbol,
    fromValue: total,
    toValue: coinAmount,
    serviceFee: 0,
    totalPrice: total,
    totalSpent: payFee + bidGrantFee + total,
  }
}

export async function buildSellTake({
  orderId,
  total,
  amount,
  selectedPair,
}: {
  orderId: string
  total: number
  amount: number
  selectedPair: TradingPair
}) {
  const networkStore = useNetworkStore()
  const address = useConnectionStore().getAddress
  const btcjs = useBtcJsStore().get ?? raise('Btcjs not initialized')

  // // 1: Get the ordinal utxo as input
  // // the amount must match
  // let ordinalUtxo: SimpleUtxo
  // let transferable = await getOneBrc20({
  //   tick: selectedPair.fromSymbol,
  //   address,
  // }).then((brc20Info) => {
  //   // choose a real ordinal with the right amount, not the white amount (Heil Uncle Roger!)
  //   return brc20Info.transferBalanceList.find(
  //     (brc20) => Number(brc20.amount) === amount
  //   )
  // })
  // if (!transferable) {
  //   throw new Error(
  //     'No suitable BRC20 tokens. Please ensure that you have enough of the inscribed BRC20 tokens.'
  //   )
  // }

  // // 2. fetch and decode rawTx of the utxo
  // const [ordinalTxId, ordinalOutputIndex] =
  //   transferable.inscriptionId.split('i')
  // ordinalUtxo = {
  //   txId: ordinalTxId,
  //   satoshis: 546,
  //   outputIndex: Number(ordinalOutputIndex),
  //   addressType: 2,
  // }
  // const rawTx = await getTxHex(ordinalUtxo.txId)
  // // decode rawTx
  // const ordinalPreTx = btcjs.Transaction.fromHex(rawTx)
  // const ordinalDetail = ordinalPreTx.outs[ordinalUtxo.outputIndex]
  // const ordinalValue = ordinalDetail.value

  // 3. get fees
  const fees = await getSellFees({ orderId })
  console.log({ fees })
  return

  // 4. get bid order
  // const bidEssential

  // Step 2: Get limit order
  const order = await getOneBidOrder({
    orderId,
    inscriptionId: transferable.inscriptionId,
  })

  // Step 3: Reconstruct the psbt and check if the amount is correct
  const sell = btcjs.Psbt.fromHex(order.psbtRaw, {
    network: btcjs.networks[networkStore.btcNetwork],
  })
  // check if the amount is correct
  const sellerOutputIndex = 2
  const sellerOutputAmount = sell.txOutputs[sellerOutputIndex].value
  raiseUnless(sellerOutputAmount === total, 'Amount mismatch')

  // check if the fee amount is met
  const { platformFee, releaseInscriptionFee } = order
  const platformFeeIndex = 7
  const releaseInscriptionFeeIndex = 6
  raiseUnless(
    sell.txOutputs[platformFeeIndex].value === platformFee,
    'Platform fee mismatch'
  )
  raiseUnless(
    sell.txOutputs[releaseInscriptionFeeIndex].value === releaseInscriptionFee,
    'Release inscription fee mismatch'
  )

  console.log({ sell, order })

  // Step 4: Change
  const predefinedInputsLength = 5
  const { fee, feeb } = await exclusiveChange({
    psbt: sell,
    maxUtxosCount: USE_UTXO_COUNT_LIMIT,
    sighashType: SIGHASH_ALL,
    partialPay: true,
    cutFrom: predefinedInputsLength,
    extraInputValue: -(platformFee + releaseInscriptionFee),
  })

  return {
    order: sell,
    type: 'sell',
    value: ordinalValue,
    totalPrice: 0,
    networkFee: fee + order.furtherFee,
    selfFee: fee,
    networkFeeRate: feeb,
    serviceFee: order.platformFee,
    totalSpent: fee + order.platformFee + order.furtherFee,
    fromSymbol: selectedPair.fromSymbol,
    toSymbol: selectedPair.toSymbol,
    fromValue: amount,
    toValue: total,
  }
}
