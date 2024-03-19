import { type Ref, computed, ref } from 'vue'
import {
  getAssetPairList,
  createPrepayOrderMintBtcReq,
  createPrepayOrderMintBrc20Req,
  submitPrepayOrderMintBtcReq,
  submitPrepayOrderMintBrc20Req,
  type assetReqReturnType,
  type bridgeAssetPairReturnType,
} from '@/queries/bridge-api'
import { useBtcJsStore } from '@/stores/btcjs'
import { Buffer } from 'buffer'
import Decimal from 'decimal.js'
import { useNetworkStore } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { getRawTx } from '@/queries/orders-api'
import { Payment, Transaction, Psbt, address as Address } from 'bitcoinjs-lib'
import { determineAddressInfo, formatSat } from '@/lib/utils'
import { exclusiveChange } from '@/lib/build-helpers'
import { SIGHASH_ALL, USE_UTXO_COUNT_LIMIT } from '@/data/constants'
export enum AssetBridgeNetwork {
  BRC20 = 'BRC20',
  BTC = 'BTC',
  MVC = 'MVC',
}

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

export type inscriptionInfo = {
  amount: string
  inscriptionId: string
  inscriptionNumber: string
  outValue: number
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
  addressType: string
  publicKey: string
  publicKeySign: string
  publicKeyReceive: string
  publicKeyReceiveSign: string
  feeBtc?: number
  inscription?: inscriptionInfo[] | inscriptionInfo
}

export function useBridgeTools() {
  const publicKey: string = ''
  const addressType: string = ''
  const MINER_FEE = 31
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

    return res
  }

  async function createPrepayOrderMintBRC20(
    data: prepayOrderParams
  ): Promise<prepayOrderReturnType> {
    const res = await createPrepayOrderMintBrc20Req(data)

    return res
  }

  async function submitPrepayOrderMintBtc(data: any) {
    const res = await submitPrepayOrderMintBtcReq(data)
    return res
  }

  async function submitPrepayOrderMintBrc20(data: any) {
    const res = await submitPrepayOrderMintBrc20Req(data)
    return res
  }

  async function createPayment() {
    const btcJsStore = useBtcJsStore().get!
    const networkStore = useNetworkStore()
    const connectionStore = useConnectionStore()
    const pubkey = await getPublicKey()
    const address = await connectionStore.adapter.getAddress()
    const addressType = determineAddressInfo(address)
    switch (addressType.type.toUpperCase()) {
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

  function addressToScript(address: string) {
    const networkStore = useNetworkStore()
    if (!address) return
    return Address.toOutputScript(address, networkStore.typedNetwork)
  }

  async function buildTx(parmas: {
    toAddress: string
    satoshis: number
    options: {
      noBroadcast: boolean
      feeRate: number
    }
  }) {
    const connectionStore = useConnectionStore()

    const { txHex } = await connectionStore.provider.btc.transfer(parmas)
    console.log(txHex, txHex)
    return txHex
  }

  async function sendBRC(recipient: string, utxoList: UTXO[], feeRate: number) {
    const networkStore = useNetworkStore()
    const connectionStore = useConnectionStore()
    try {
      const address = await connectionStore.adapter.getAddress()
      const payment = await createPayment()
      const utxos = await connectionStore.provider.btc.getUtxos(address)
      if (!utxos.length) {
        throw new Error('your account currently has no available UTXO.')
      }
      const psbt = new Psbt({ network: networkStore.typedNetwork })
      if (utxoList.length) {
        for (let utxo of utxoList) {
          const payInput = await createPayInput({ utxo, payment })
          psbt.addInput(payInput)
          psbt.addOutput({
            value: utxo.satoshi,
            address: recipient,
          })
        }
      }
      const { psbt: psbt1xFinished } = await exclusiveChange({
        psbt: psbt,
        maxUtxosCount: USE_UTXO_COUNT_LIMIT,
        sighashType: SIGHASH_ALL,
        feeb: feeRate,
      })
      console.log('psbt1xFinished', psbt1xFinished)
      debugger
      const signPsbt = await connectionStore.adapter.signPsbt(
        psbt1xFinished!.toHex()
      )

      return Psbt.fromHex(signPsbt)
    } catch (error) {
      throw new Error((error as any).message)
    }
  }

  async function createPayInput({
    utxo,
    payment,
  }: {
    payment: Payment
    utxo: UTXO
  }) {
    const networkStore = useNetworkStore()
    const payInput: any = {
      hash: utxo.txId,
      index: utxo.vout,
      sequence: 0xffffffff, // These are defaults. This line is not needed.
    }
    const pubkey = await getPublicKey()

    const addressType = payment.name!.toUpperCase()
    if (['P2TR'].includes(addressType)) {
      payInput['tapInternalKey'] = pubkey.subarray(1)
      payInput['witnessUtxo'] = { value: utxo.satoshi, script: payment.output }
    }
    if (['P2WPKH'].includes(addressType)) {
      payInput['witnessUtxo'] = { value: utxo.satoshi, script: payment.output }
    }
    if (['P2PKH'].includes(addressType)) {
      const rawTx = await getRawTx(utxo.txId, networkStore.btcNetwork)
      const tx = Transaction.fromHex(rawTx)
      payInput['nonWitnessUtxo'] = tx.toBuffer()
    }
    return payInput
  }
  //
  async function sumitBridgeOrderForBrc20(orderParams: prepayOrderParams) {
    const {
      amount,
      originTokenId,
      addressType,
      publicKey,
      publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign,
      feeBtc,
      inscription,
    } = orderParams

    const createPrepayOrderDto = {
      amount,
      originTokenId,
      addressType,
      publicKey,
      publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign,
    }

    try {
      const createResp = await createPrepayOrderMintBRC20(createPrepayOrderDto)
      const inscriptionUtxo: UTXO[] = []
      const { orderId, bridgeAddress } = createResp
      if ((inscription as inscriptionInfo[])!.length) {
        ;(inscription as inscriptionInfo[])?.forEach((item) => {
          inscriptionUtxo.push({
            txId: item!.inscriptionId?.slice(0, -2),
            vout: +item!.inscriptionId?.split('i')[1],
            satoshi: +item!.outValue,
            confirmed: true,
            inscriptions: null,
          })
        })
      }

      const psbt = await sendBRC(bridgeAddress, inscriptionUtxo, feeBtc!)

      const submitPrepayOrderMintDto = {
        orderId,
        txHex: psbt!.extractTransaction().toHex(),
      }
      await submitPrepayOrderMintBrc20(submitPrepayOrderMintDto)
      //成功
    } catch (error) {
      throw new Error((error as any).message)
    }
  }

  async function sumitBridgeOrderForBtc(orderParams: prepayOrderParams) {
    const {
      amount,
      originTokenId,
      addressType,
      publicKey,
      publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign,
      feeBtc,
    } = orderParams
    const createPrepayOrderDto = {
      amount,
      originTokenId,
      addressType,
      publicKey,
      publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign,
    }
    try {
      const createResp = await createPrepayOrderMintBtc(createPrepayOrderDto)
      const { orderId, bridgeAddress } = createResp
      const txHex = await buildTx({
        toAddress: bridgeAddress,
        satoshis: amount,
        options: {
          noBroadcast: true,
          feeRate: feeBtc!,
        },
      })
      const submitPrepayOrderMintDto = {
        orderId,
        txHex: txHex,
      }
      await submitPrepayOrderMintBtc(submitPrepayOrderMintDto)
      //成功
    } catch (error) {
      throw new Error((error as any).message)
    }
  }

  const selectUTXOs = (utxos: UTXO[], targetAmount: Decimal): UTXO[] => {
    let totalAmount = new Decimal(0)
    const selectedUtxos: typeof utxos = []
    for (const utxo of utxos) {
      selectedUtxos.push(utxo)
      totalAmount = totalAmount.add(utxo.satoshi)

      if (totalAmount.gte(targetAmount)) {
        break
      }
    }
    if (totalAmount.lt(targetAmount)) {
      throw new Error('Insufficient funds to reach the target amount')
    }

    return selectedUtxos
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

  function calcReceiveInfo(
    mintAmount: number,
    assetInfo: bridgeAssetPairReturnType,
    currentAssetInfo: assetReqReturnType
  ) {
    console.log('mintAmount', mintAmount, assetInfo)
    const {
      btcPrice,
      mvcPrice,
      feeBtc,
      feeMvc,
      amountLimitMaximum,
      amountLimitMinimum,
      confirmSequence,
      transactionSize,
    } = assetInfo
    let mintBrc20EqualBtcAmount = 0

    if (currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC) {
      if (
        formatSat(mintAmount, currentAssetInfo.decimals) < amountLimitMinimum ||
        formatSat(mintAmount, currentAssetInfo.decimals) > amountLimitMaximum
      ) {
        const error = JSON.stringify({
          amountLimitMinimum,
          amountLimitMaximum,
        })
        throw Error(error)
      }
    } else {
      mintBrc20EqualBtcAmount =
        // ((currentAssetInfo.price * Number(mintAmount)) / btcPrice) * 10 ** 8
        mintBrc20EqualBtcAmount = new Decimal(currentAssetInfo.price)

          .mul(mintAmount)

          .div(btcPrice)
          .mul(10 ** 8)
          .toNumber()

      if (
        mintBrc20EqualBtcAmount < amountLimitMinimum ||
        mintBrc20EqualBtcAmount > amountLimitMaximum
      ) {
        const error = JSON.stringify({
          amountLimitMinimum,
          amountLimitMaximum,
        })
        throw Error(error)
      }
    }
    const finallyMintAmount =
      currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC
        ? mintAmount
        : mintBrc20EqualBtcAmount

    const confirmNumber = confirmNumberBySeqAndAmount(
      finallyMintAmount,
      confirmSequence,
      // mint btc -> mvc, get mvc confirm number
      currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC
        ? AssetBridgeNetwork.BTC
        : AssetBridgeNetwork.BRC20
    )

    let bridgeFee: number = 0
    let minerFee: number = 0
    if (
      currentAssetInfo.feeRateNumeratorMint > 0 ||
      currentAssetInfo.feeRateConstMint > 0
    ) {
      bridgeFee =
        currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC
          ? (finallyMintAmount * currentAssetInfo.feeRateNumeratorMint) /
              10000 +
            currentAssetInfo.feeRateConstMint
          : (finallyMintAmount * currentAssetInfo.feeRateNumeratorMint) /
              10000 +
            ((currentAssetInfo.feeRateConstMint / 10 ** 8) * btcPrice) /
              currentAssetInfo.price
      minerFee =
        currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC
          ? (transactionSize.BTC_MINT * feeMvc * mvcPrice) / btcPrice
          : (transactionSize.BTC_MINT * feeMvc * mvcPrice) /
            10 ** 8 /
            currentAssetInfo.price
    }
    const totalFee =
      currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC
        ? Math.floor(bridgeFee + minerFee)
        : bridgeFee + minerFee
    const receiveAmount = mintAmount - totalFee
    const receiveAmountFixed = receiveAmount.toFixed(
      currentAssetInfo.decimals - currentAssetInfo.trimDecimals
    )

    return {
      receiveAmount:
        currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC
          ? receiveAmount
          : receiveAmountFixed,
      confirmNumber,
    }
  }

  return {
    calcReceiveInfo,
    sumitBridgeOrderForBtc,
    sumitBridgeOrderForBrc20,
    getPublicKey,
    buildTx,
  }
}
