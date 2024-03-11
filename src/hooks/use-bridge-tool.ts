import { type Ref, computed, ref } from 'vue'
import {
  getAssetPairList,
  createPrepayOrderMintBtcReq,
  submitPrepayOrderMintBtcReq,
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

  async function submitPrepayOrderMintBtc(data: any) {
    const res = await submitPrepayOrderMintBtcReq(data)
    return res
  }

  // async function createPayment() {
  //   const btcJsStore = useBtcJsStore().get!
  //   const networkStore = useNetworkStore()
  //   const pubkey = await getPublicKey()
  //   const addressType = 'P2WPKH'

  //   switch (addressType) {
  //     case AddressType.P2PKH:
  //       return btcJsStore.payments.p2pkh({
  //         pubkey: pubkey,
  //         network: networkStore.typedNetwork,
  //       })
  //     case AddressType.P2WPKH:
  //       return btcJsStore.payments.p2wpkh({
  //         pubkey: pubkey,
  //         network: networkStore.typedNetwork,
  //       })
  //     case AddressType.P2TR:
  //       return btcJsStore.payments.p2tr({
  //         internalPubkey: pubkey.subarray(1),
  //         network: networkStore.typedNetwork,
  //       })
  //     default:
  //       return btcJsStore.payments.p2pkh({
  //         pubkey: pubkey,
  //         network: networkStore.typedNetwork,
  //       })
  //   }
  // }

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
    const addressType = 'P2WPKH'
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

  async function sumitBridgeOrderForBrc20(orderParams: prepayOrderParams) {}

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

  function calcReceiveInfo(
    mintAmount: number,
    assetInfo: bridgeAssetPairReturnType,
    currentAssetInfo: assetReqReturnType
  ) {
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
      if (mintAmount < amountLimitMinimum || mintAmount > amountLimitMaximum) {
        const error = JSON.stringify({
          amountLimitMinimum,
          amountLimitMaximum,
        })
        throw Error(error)
      }
    } else {
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
    const receiveAmount = finallyMintAmount - totalFee
    const receiveAmountFixed = receiveAmount.toFixed(
      currentAssetInfo.decimals - currentAssetInfo.trimDecimals
    )
    return {
      receiveAmount:
        currentAssetInfo.originTokenId == AssetBridgeNetwork.BTC ??
        receiveAmountFixed,
      confirmNumber,
    }
  }

  return {
    calcReceiveInfo,
    sumitBridgeOrderForBtc,
    getPublicKey,
    buildTx,
  }
}
