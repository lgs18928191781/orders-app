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
import { formatUnitToBtc, formatUnitToSats } from '@/lib/formatters'
import { useBtcJsStore } from '@/stores/btcjs'
import { Buffer } from 'buffer'
import Decimal from 'decimal.js'
import { useNetworkStore } from '@/stores/network'
import { useConnectionStore } from '@/stores/connection'
import { getRawTx } from '@/queries/orders-api'
import { Payment, Transaction, Psbt, address as Address } from 'bitcoinjs-lib'
import { determineAddressInfo, formatSat } from '@/lib/utils'
import { exclusiveChange } from '@/lib/build-helpers'
import {
  SIGHASH_ALL,
  USE_UTXO_COUNT_LIMIT,
  BRIDGE_CONST_FEE,
  MVC_CONST_FEE,
  BTC_CONST_FEE,
} from '@/data/constants'
const XEDR_PRICE = 400
export enum AssetBridgeNetwork {
  BRC20 = 'BRC20',
  BTC = 'BTC',
  MVC = 'MVC',
}

export enum BridgeOp {
  BtcToMvcByBtc = 1,
  MVCToBtcByBtc = 2,
  BtcToMvcByBrc20 = 3,
  MvcToBtcByBrc20 = 4,
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
  amount: string
  originTokenId: string
  addressType: string
  publicKey: string
  publicKeySign: string
  publicKeyReceive: string
  publicKeyReceiveSign: string
  feeBtc?: number
  inscription?: inscriptionInfo
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
    network: 'BTC' | 'BRC20' | 'MVC',
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
    data: prepayOrderParams,
  ): Promise<prepayOrderReturnType> {
    try {
      const res = await createPrepayOrderMintBtcReq(data)

      return res
    } catch (error) {
      throw new Error(error as any)
    }
  }

  async function createPrepayOrderMintBRC20(
    data: prepayOrderParams,
  ): Promise<prepayOrderReturnType> {
    try {
      const res = await createPrepayOrderMintBrc20Req(data)

      return res
    } catch (error) {
      throw new Error(error as any)
    }
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

  async function sendBRC(recipient: string, utxo: UTXO, feeRate: number) {
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

      const payInput = await createPayInput({ utxo, payment })
      psbt.addInput(payInput)
      psbt.addOutput({
        value: utxo.satoshi,
        address: recipient,
      })
      const { psbt: psbt1xFinished } = await exclusiveChange({
        psbt: psbt,
        maxUtxosCount: USE_UTXO_COUNT_LIMIT,
        sighashType: SIGHASH_ALL,
        feeb: feeRate,
      })

      const signPsbt = await connectionStore.adapter.signPsbt(
        psbt1xFinished!.toHex(),
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

      const { orderId, bridgeAddress } = createResp
      const inscriptionUtxo = {
        txId: inscription!.inscriptionId?.slice(0, -2),
        vout: +inscription!.inscriptionId?.split('i')[1],
        satoshi: +inscription!.outValue,
        confirmed: true,
        inscriptions: null,
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
        satoshis: Number(amount),
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
      new Decimal(0),
    )
  }

  function calculateFee(psbt: Psbt, feeRate: number): number {
    const tx = psbt.extractTransaction()

    const size = tx.virtualSize()

    return size * feeRate
  }

  function tokenConvertBtcRate(params: {
    inputAmount: number
    brc20Price: number
    btcPrice: number
  }) {
    return new Decimal(params.inputAmount)
      .mul(params.brc20Price)
      .div(params.btcPrice)
      .mul(10 ** 8)
      .toNumber()
  }

  function calcReceiveInfo(
    mintAmount: number,
    assetInfo: bridgeAssetPairReturnType,
    currentAssetInfo: assetReqReturnType,
    op: BridgeOp,
  ): {
    bridgeFee: string
    fixedFee: string
    networkFee: string
    receiveAmount: number
    confirmNumber: number
  } {
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

    if (op == BridgeOp.BtcToMvcByBtc || op == BridgeOp.MVCToBtcByBtc) {
      if (mintAmount < amountLimitMinimum || mintAmount > amountLimitMaximum) {
        const error = JSON.stringify({
          amountLimitMinimum,
          amountLimitMaximum,
        })
        throw Error(error)
      }
    } else {
      if (op == BridgeOp.MvcToBtcByBrc20) {
        mintAmount = new Decimal(mintAmount)
          .mul(
            10 ** (currentAssetInfo.decimals - currentAssetInfo.trimDecimals),
          )
          .toNumber()
        const brcAmount = new Decimal(mintAmount)
          .div(
            10 ** (currentAssetInfo.decimals - currentAssetInfo.trimDecimals),
          )
          .toNumber()

        // ((currentAssetInfo.price * Number(mintAmount)) / btcPrice) * 10 ** 8
        mintBrc20EqualBtcAmount = new Decimal(currentAssetInfo.price)

          .mul(brcAmount)

          .div(btcPrice)
          .mul(10 ** 8)
          .toNumber()
      } else {
        // ((currentAssetInfo.price * Number(mintAmount)) / btcPrice) * 10 ** 8
        mintBrc20EqualBtcAmount = new Decimal(currentAssetInfo.price)

          .mul(mintAmount)

          .div(btcPrice)
          .mul(10 ** 8)
          .toNumber()
      }

      if (
        mintBrc20EqualBtcAmount < +amountLimitMinimum ||
        mintBrc20EqualBtcAmount > +amountLimitMaximum
      ) {
        const error = JSON.stringify({
          amountLimitMinimum,
          amountLimitMaximum,
        })
        throw Error(error)
      }
    }
    const finallyMintAmount =
      op == BridgeOp.BtcToMvcByBtc || op == BridgeOp.MVCToBtcByBtc
        ? mintAmount
        : mintBrc20EqualBtcAmount

    const confirmNumber = confirmNumberBySeqAndAmount(
      finallyMintAmount,
      confirmSequence,
      // mint btc -> mvc, get mvc confirm number
      op == BridgeOp.BtcToMvcByBtc
        ? AssetBridgeNetwork.BTC
        : op == BridgeOp.BtcToMvcByBrc20
          ? AssetBridgeNetwork.BRC20
          : AssetBridgeNetwork.MVC,
    )

    let bridgeFee = '0'
    let networkFee = '0'
    let fixedFee = '0'
    let totalFee = 0
    let receiveAmount = 0
    let receiveAmountFixed = 0
    if (op == BridgeOp.BtcToMvcByBtc) {
      // bridgeFee = (mintAmount * currentAssetInfo.feeRateNumeratorMint) / 10000
      // minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / btcPrice
      bridgeFee = new Decimal(formatUnitToBtc(mintAmount))
        .mul(BRIDGE_CONST_FEE)
        .toNumber()
        .toFixed(8)

      fixedFee = new Decimal(BTC_CONST_FEE).toString()
      networkFee = new Decimal(MVC_CONST_FEE)
        .mul(mvcPrice)
        .div(btcPrice)
        .toNumber()
        .toFixed(8)

      totalFee = new Decimal(bridgeFee).add(fixedFee).add(networkFee).toNumber()
      receiveAmount = +(formatUnitToBtc(mintAmount) - totalFee).toFixed(8)
      return {
        bridgeFee,
        fixedFee,
        networkFee,
        receiveAmount,
        confirmNumber,
      }
    } else if (op == BridgeOp.BtcToMvcByBrc20) {
      bridgeFee = new Decimal(mintAmount).mul(BRIDGE_CONST_FEE).toString()
      fixedFee = new Decimal(BTC_CONST_FEE)
        .mul(btcPrice)
        .div(currentAssetInfo.price)
        .toString()
      networkFee = new Decimal(MVC_CONST_FEE)
        .mul(mvcPrice)
        .div(currentAssetInfo.price)
        .toString()
      totalFee = new Decimal(bridgeFee).add(fixedFee).add(networkFee).toNumber()
      receiveAmount = mintAmount - totalFee
      receiveAmountFixed = +receiveAmount.toFixed(
        currentAssetInfo.decimals - currentAssetInfo.trimDecimals,
      )
      return {
        bridgeFee,
        fixedFee,
        networkFee,
        receiveAmount: receiveAmountFixed,
        confirmNumber,
      }
    } else if (op == BridgeOp.MVCToBtcByBtc) {
      bridgeFee = new Decimal(formatUnitToBtc(mintAmount))
        .mul(BRIDGE_CONST_FEE)
        .toString()
      fixedFee = new Decimal(BTC_CONST_FEE).toString()
      networkFee = new Decimal(BRIDGE_CONST_FEE).toString()
      totalFee = new Decimal(bridgeFee).add(fixedFee).add(networkFee).toNumber()
      receiveAmount = +(formatUnitToBtc(mintAmount) - totalFee).toFixed(8)

      return {
        bridgeFee,
        fixedFee,
        networkFee,
        receiveAmount,
        confirmNumber,
      }
    } else if (op == BridgeOp.MvcToBtcByBrc20) {
      // const bridgeFeeConst = new Decimal(
      //   ((currentAssetInfo.feeRateConstRedeem / 10 ** 8) * btcPrice) /
      //     currentAssetInfo.price
      // ).toNumber()

      // const bridgeFeePercent = new Decimal(mintAmount)
      //   .mul(currentAssetInfo.feeRateNumeratorRedeem)
      //   .div(10000)
      //   .toNumber()
      // bridgeFee = bridgeFeeConst + bridgeFeePercent
      // minerFee = Math.floor(
      //   ((transactionSize.BRC20_REDEEM / 10 ** 8) * feeBtc * btcPrice) /
      //     currentAssetInfo.price
      // )

      const converMintAmount: number = new Decimal(mintAmount)
        .div(10 ** (currentAssetInfo.decimals - currentAssetInfo.trimDecimals))
        .toNumber()
      bridgeFee = new Decimal(converMintAmount).mul(BRIDGE_CONST_FEE).toString()
      fixedFee = new Decimal(BTC_CONST_FEE)
        .mul(btcPrice)
        .div(currentAssetInfo.price)
        .toString()
      networkFee = new Decimal(BRIDGE_CONST_FEE)
        .mul(btcPrice)
        .div(currentAssetInfo.price)
        .toString()
      totalFee = new Decimal(bridgeFee).add(fixedFee).add(networkFee).toNumber()
      receiveAmount = new Decimal(converMintAmount - totalFee).toNumber()
      return {
        receiveAmount: Number(
          receiveAmount.toFixed(
            currentAssetInfo.decimals - currentAssetInfo.trimDecimals,
          ),
        ),
        confirmNumber,
        bridgeFee,
        networkFee,
        fixedFee,
      }
    } else {
      return {
        receiveAmount: 0,
        confirmNumber: 0,
        bridgeFee: '0',
        networkFee: '0',
        fixedFee: '0',
      }
    }
  }

  return {
    calcReceiveInfo,
    sumitBridgeOrderForBtc,
    sumitBridgeOrderForBrc20,
    getPublicKey,
    buildTx,
    tokenConvertBtcRate,
  }
}
