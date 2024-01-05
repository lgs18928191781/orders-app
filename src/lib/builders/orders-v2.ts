import { TradingPair } from '@/data/trading-pairs'
import { constructBidPsbt } from '@/queries/orders-api'
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
import { getPlatformPublicKey } from '@/queries/orders-v2'
import { generateP2wshPayment, getBothPubKeys } from './helpers'
import { raise } from '../helpers'
import { useFeebStore } from '@/stores/feeb'
import { getExcludedUtxos } from '@/queries/excluded-utxos'

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
