import { useBtcJsStore } from '@/stores/btcjs'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'

import { fillInternalKey, safeOutputValue } from '@/lib/build-helpers'

import { SIGHASH_SINGLE_ANYONECANPAY } from '@/data/constants'
import { type TradingPair } from '@/data/trading-pairs'

import { getOneBrc20 } from '@/queries/orders-api'
import { getUtxos, type SimpleUtxo, getTxHex } from '@/queries/proxy'

export async function buildAskLimit({
  total,
  amount,
  selectedPair,
}: {
  total: number
  amount: number
  selectedPair: TradingPair
}) {
  const networkStore = useNetworkStore()
  const btcjs = useBtcJsStore().get!
  const address = useConnectionStore().getAddress

  // Get address
  // Step 1: Get the ordinal utxo as input
  // if testnet, we use a cardinal utxo as a fake one
  let ordinalUtxo: SimpleUtxo
  if (networkStore.isTestnet) {
    const cardinalUtxo = await getUtxos(address).then((result) => {
      // choose the smallest utxo, but bigger than 600
      const smallOne = result.reduce((prev, curr) => {
        if (
          (curr.satoshis < prev.satoshis && curr.satoshis > 600) ||
          (prev && prev.satoshis <= 600)
        ) {
          return curr
        } else {
          return prev
        }
      }, result[0])

      return smallOne
    })

    if (!cardinalUtxo) {
      throw new Error('no utxo')
    }

    ordinalUtxo = cardinalUtxo
  } else {
    let transferable = await getOneBrc20({
      tick: selectedPair.fromSymbol,
      address,
    }).then((brc20Info) => {
      // choose a real ordinal with the right amount, not the white amount (Heil Uncle Roger!)
      return brc20Info.transferBalanceList.find(
        (brc20) => Number(brc20.amount) === amount,
      )
    })
    if (!transferable) {
      throw new Error(
        'No suitable BRC20 tokens. Please ensure that you have enough of the inscribed BRC20 tokens.',
      )
    }

    // find out the ordinal utxo
    const ordinalTxId = transferable.inscriptionId.slice(0, -2)
    ordinalUtxo = {
      txId: ordinalTxId,
      satoshis: 546,
      outputIndex: 0,
      addressType: 2,
    }
  }

  // fetch and decode rawTx of the utxo
  const rawTx = await getTxHex(ordinalUtxo.txId)
  // decode rawTx
  const ordinalPreTx = btcjs.Transaction.fromHex(rawTx)
  const ordinalDetail = ordinalPreTx.outs[ordinalUtxo.outputIndex]
  const ordinalValue = ordinalDetail.value

  // build psbt
  const ask = useConnectionStore().adapter.initPsbt()

  for (const output in ordinalPreTx.outs) {
    try {
      ordinalPreTx.setWitness(parseInt(output), [])
    } catch (e: any) {}
  }

  const input = fillInternalKey({
    hash: ordinalUtxo.txId,
    index: ordinalUtxo.outputIndex,
    witnessUtxo: ordinalPreTx.outs[ordinalUtxo.outputIndex],
    sighashType: SIGHASH_SINGLE_ANYONECANPAY,
  })
  ask.addInput(input)

  // Step 2: Build output as what the seller want (BTC)
  ask.addOutput({
    address,
    value: safeOutputValue(total),
  })

  return {
    order: ask,
    type: 'ask',
    typeForDisplay: 'limit sell',
    value: ordinalValue,
    amount,
    totalPrice: 0,
    networkFee: 0,
    serviceFee: 0,
    totalSpent: 0,
    fromSymbol: selectedPair.fromSymbol,
    toSymbol: selectedPair.toSymbol,
    fromValue: amount,
    toValue: safeOutputValue(total),
    observing: {
      txId: ordinalUtxo.txId,
      outputIndex: ordinalUtxo.outputIndex,
    },
  }
}
