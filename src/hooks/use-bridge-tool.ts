import { type Ref, computed, ref } from 'vue'
import {
  getAssetPairList,
  createPrepayOrderMintBtcReq,
  submitPrepayOrderMintBtcReq,
} from '@/queries/bridge-api'
import { useBtcJsStore } from '@/stores/btcjs'
import Decimal from 'decimal.js'
import { useNetworkStore } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { Payment, Transaction, Psbt } from 'bitcoinjs-lib'
export enum AddressType {
  P2TR = 'P2TR',
  P2PKH = 'P2PKH',
  P2WPKH = 'P2WPKH',
}

export interface UTXO {
  txId: string
  vout: number
  satoshi: number
  confirmed: boolean
  inscriptions:
    | {
        id: string
        num: number
      }[]
    | null
}

type prepayOrderReturnType = {
  bridgeAddress: string
  confirmNumber: number
  feeAmount: string
  orderId: string
  receiveAddress: string
  receiveAmount: string
}

type prepayOrderParams = {
  amount: number
  originTokenId: string
  addressType: AddressType
  publicKey: string
  publicKeySign: string
  feeBtc: number
}

export function useBridgeTools() {
  const publicKey: string = ''
  const addressType: string = ''

  async function getPublicKey() {
    const btcJsStore = useBtcJsStore()
    const connectionStore = useConnectionStore()
    const publickeyStr = await connectionStore.adapter.getPubKey()
    const publicKeyBuffer = Buffer.from(publickeyStr, 'hex')
    return btcJsStore.ECPair!.fromPublicKey(publicKeyBuffer).publicKey
  }

  function confirmNumberBySeqAndAmount(
    amount: number,
    seq: number[][],
    network: 'BTC' | 'BRC20' | 'MVC'
  ) {
    for (const item of seq) {
      const [start, end, confirmBtc, confirmMvc] = item
      if (end) {
        if (start <= amount && amount <= end) {
          if (network === 'MVC') {
            return confirmMvc
          } else {
            return confirmBtc
          }
        }
      } else {
        if (start <= amount) {
          if (network === 'MVC') {
            return confirmMvc
          } else {
            return confirmBtc
          }
        }
      }
    }
    return 5
  }

  async function createPrepayOrderMintBtc(
    data: prepayOrderParams
  ): Promise<prepayOrderReturnType> {
    const res = await createPrepayOrderMintBtcReq(data)
    return res.data
  }

  async function submitPrepayOrderMintBtc(data: any) {
    const res = await submitPrepayOrderMintBtcReq(data)

    return res.data
  }

  async function createPayment() {
    const btcJsStore = useBtcJsStore().get!
    const networkStore = useNetworkStore()
    const pubkey = await getPublicKey()
    switch (addressType) {
      case AddressType.P2PKH:
        return btcJsStore.payments.p2pkh({
          pubkey: pubkey,
          network: networkStore.typedNetwork,
        })
      case AddressType.P2WPKH:
        return btcJsStore.payments.p2wpkh({
          pubkey: pubkey,
          network: networkStore.typedNetwork,
        })
      case AddressType.P2TR:
        return btcJsStore.payments.p2tr({
          internalPubkey: pubkey.subarray(1),
          network: networkStore.typedNetwork,
        })
      default:
        return btcJsStore.payments.p2pkh({
          pubkey: pubkey,
          network: networkStore.typedNetwork,
        })
    }
  }

  async function createPayInput({
    utxo,
    payment,
  }: {
    payment: Payment
    utxo: UTXO
  }) {
    const payInput: any = {
      hash: utxo.txId,
      index: utxo.vout,
      sequence: 0xffffffff, // These are defaults. This line is not needed.
    }
    const pubkey = await getPublicKey()
    if (['P2TR'].includes(addressType)) {
      payInput['tapInternalKey'] = pubkey.subarray(1)
      payInput['witnessUtxo'] = { value: utxo.satoshi, script: payment.output }
    }
    if (['P2WPKH'].includes(addressType)) {
      payInput['witnessUtxo'] = { value: utxo.satoshi, script: payment.output }
    }
    if (['P2PKH'].includes(addressType)) {
      // const rawTx = await this.mempoolReturn.bitcoin.transactions.getTxHex({
      //   txid: utxo.txId,
      // })
      // const tx = Transaction.fromHex(rawTx)
      // payInput['nonWitnessUtxo'] = tx.toBuffer()
    }
    return payInput
  }

  async function sumitBridgeOrder(orderParams: prepayOrderParams) {
    const connectionStore = useConnectionStore()
    const {
      amount,
      originTokenId,
      addressType,
      publicKey,
      publicKeySign,
      feeBtc,
    } = orderParams
    const createPrepayOrderDto = {
      amount,
      originTokenId,
      addressType,
      publicKey,
      publicKeySign,
      feeBtc,
    }
    try {
      const createResp = await createPrepayOrderMintBtc(createPrepayOrderDto)
      const { orderId, bridgeAddress } = createResp
      console.log('createResp', createResp)
      console.log('connectionStore', connectionStore)
      const psbt = await send(bridgeAddress, amount, feeBtc)
      console.log(psbt.extractTransaction().toHex())
      const submitPrepayOrderMintDto = {
        orderId,
        txHex: psbt.extractTransaction().toHex(),
      }
      await submitPrepayOrderMintBtc(submitPrepayOrderMintDto)
    } catch (error) {}
  }

  const selectUTXOs = (utxos: UTXO[], targetAmount: Decimal): UTXO[] => {
    return utxos
  }

  function getTotalSatoshi(utxos: UTXO[]): Decimal {
    return utxos.reduce(
      (total, utxo) => total.add(utxo.satoshi),
      new Decimal(0)
    )
  }

  function calculateFee(psbt: Psbt, feeRate: number): number {
    const tx = psbt.extractTransaction()

    const size = tx.virtualSize()

    return size * feeRate
  }

  async function send(
    recipient: string,
    amount: Decimal | number,
    feeRate = 57
  ) {
    const connectionStore = useConnectionStore()
    const btcJsStore = useBtcJsStore().get!
    const networkStore = useNetworkStore()
    if (typeof amount === 'number') {
      amount = new Decimal(amount)
    }

    const account = connectionStore.last.address

    const payment = await createPayment()
    const utxos = await connectionStore.provider.btc.getUtxos()
    utxos.sort((a: UTXO, b: UTXO) => b.satoshi - a.satoshi)
    const buildPsbt = async (selectedUtxos: UTXO[], change: Decimal) => {
      const psbt = new btcJsStore.Psbt({ network: networkStore.typedNetwork })
      if (change.gt(546)) {
        psbt.addOutput({
          value: change.toNumber(),
          address: account,
        })
      }

      for (const utxo of selectedUtxos) {
        try {
          const payInput = await createPayInput({ utxo, payment })
          psbt.addInput(payInput)
        } catch (e: any) {
          console.log(e)
        }
      }
      psbt.addOutput({
        value: new Decimal(amount).toNumber(),
        address: recipient,
      })

      return psbt
    }

    let selectedUTXOs = selectUTXOs(utxos, amount)
    let total = getTotalSatoshi(selectedUTXOs)
    let psbt = await buildPsbt(selectedUTXOs, total.minus(amount))
    let fee = calculateFee(psbt, feeRate)
    while (total.lt(amount.add(fee))) {
      if (selectedUTXOs.length === utxos.length) {
        throw new Error('Insufficient funds')
      }
      selectedUTXOs = selectUTXOs(utxos, amount.add(fee))
      total = getTotalSatoshi(selectedUTXOs)
      const psbt = await buildPsbt(
        selectedUTXOs,
        total.minus(amount).minus(fee)
      )
      fee = calculateFee(psbt, feeRate)
    }
    const change = total.minus(amount).minus(fee)
    psbt = await buildPsbt(selectedUTXOs, change)
    return psbt
  }

  function calcReceiveInfo(mintAmount: number, assetInfo: any) {
    const {
      btcPrice,
      mvcPrice,
      feeBtc,
      feeMvc,
      amountLimitMaximum,
      amountLimitMinimum,
      confirmSequence,
      transactionSize,
      assetList,
    } = assetInfo
    console.log('assetInfo', assetInfo)

    if (mintAmount < amountLimitMinimum || mintAmount > amountLimitMaximum) {
      const error = JSON.stringify({
        amountLimitMinimum,
        amountLimitMaximum,
      })
      throw Error(error)
    }

    const confirmNumber = confirmNumberBySeqAndAmount(
      mintAmount,
      confirmSequence,
      // mint btc -> mvc, get mvc confirm number
      'BTC'
    )
    const btcAsset = assetList[0]
    let bridgeFee: number = 0
    let minerFee: number = 0
    if (btcAsset.feeRateNumeratorMint > 0 || btcAsset.feeRateConstMint > 0) {
      bridgeFee =
        (mintAmount * btcAsset.feeRateNumeratorMint) / 10000 +
        btcAsset.feeRateConstMint
      minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / btcPrice
    }
    const totalFee = Math.floor(bridgeFee + minerFee)
    const receiveAmount = mintAmount - totalFee
    return {
      receiveAmount,
      confirmNumber,
    }
  }

  return {
    calcReceiveInfo,
    sumitBridgeOrder,
    getPublicKey,
  }
}
