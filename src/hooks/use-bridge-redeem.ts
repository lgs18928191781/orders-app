import { sleep } from '@/lib/helpers'
import {
  createPrepayOrderRedeemBrc20,
  createPrepayOrderRedeemBtc,
  submitPrepayOrderRedeemBrc20,
  submitPrepayOrderRedeemBtc,
} from '@/queries/bridge-api'
export type Asset = {
  decimals: number
  feeRateConstMint: number
  feeRateConstRedeem: number
  feeRateNumeratorMint: number
  feeRateNumeratorRedeem: number
  isEnableMint: boolean
  isEnableRedeem: boolean
  network: 'BTC' | 'BRC20'
  originName: string
  originSymbol: string
  originTokenId: string
  price: number
  targetName: string
  targetSymbol: string
  targetTokenCodeHash: string
  targetTokenGenesis: string
  targetTokenId: string
  trimDecimals: number
}

export type BridgeAssetPairReturnType = {
  amountLimitMaximum: string
  amountLimitMinimum: string
  assetList: Asset[]
  btcPrice: number
  confirmSequence: number[][]
  feeBtc: number
  feeMvc: number
  net: string
  transactionSize: {
    BRC20_MINT: number
    BRC20_REDEEM: number
    BTC_MINT: number
    BTC_REDEEM: number
  }
}

export type SupportRedeemAddressType = 'P2TR' | 'P2WPKH' | 'P2PKH'
export const supportRedeemAddressType: SupportRedeemAddressType[] = [
  'P2TR',
  'P2WPKH',
  'P2PKH',
]
const confirmNumberBySeqAndAmount = function (
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
export function useBridgeRedeem() {
  async function sendToken(
    amount: string,
    address: string,
    targetTokenCodeHash: string,
    targetTokenGenesis: string,
  ): Promise<string> {
    const res = await window.metaidwallet
      .transfer({
        broadcast: true,
        tasks: [
          {
            type: 'token',
            codehash: targetTokenCodeHash,
            genesis: targetTokenGenesis,
            receivers: [{ address, amount }],
          },
        ],
      })
      .catch((e) => {
        throw new Error(e as any)
      })
    if (res.res[0].txid) {
      return res.res[0].txid
    } else {
      return ''
    }
  }

  async function signPublicKey(): Promise<{
    publicKey: string
    publicKeySign: string
    publicKeyReceiveSign: string
    publicKeyReceive: string
  }> {
    const publicKey = await window.metaidwallet.getPublicKey()
    const publicKeyReceive = await window.metaidwallet.btc.getPublicKey()
    const publicKeyReceiveSign =
      await window.metaidwallet.btc.signMessage(publicKeyReceive)
    const {
      signature: { signature: publicKeySign },
    } = await window.metaidwallet.signMessage({
      message: publicKey,
      encoding: 'base64',
    })
    const verifyObj = {
      message: publicKey,
      signature: publicKeySign,
      encoding: 'base64',
    }

    const ret = await window.metaidwallet.verifySignature(verifyObj)
    console.log(verifyObj, ret)

    return {
      publicKey,
      publicKeySign,
      publicKeyReceiveSign,
      publicKeyReceive,
    }
  }

  async function redeemBtc(
    redeemAmount: number,
    btcAsset: Asset,
    addressType: SupportRedeemAddressType,
  ): Promise<{ orderId: string; txid: string }> {
    try {
      const {
        publicKey,
        publicKeySign,
        publicKeyReceiveSign,
        publicKeyReceive,
      } = await signPublicKey()

      const createPrepayOrderDto = {
        amount: redeemAmount,
        originTokenId: btcAsset.originTokenId,
        addressType,
        publicKey,
        publicKeySign,
        publicKeyReceive,
        publicKeyReceiveSign,
      }
      const createResp = await createPrepayOrderRedeemBtc(createPrepayOrderDto)
      const { orderId, bridgeAddress } = createResp
      const { targetTokenCodeHash, targetTokenGenesis } = btcAsset
      const txid = await sendToken(
        String(redeemAmount),
        bridgeAddress,
        targetTokenCodeHash,
        targetTokenGenesis,
      )

      const submitPrepayOrderRedeemDto = {
        orderId,
        txid: txid,
      }
      await sleep(3000)
      const ret = await submitPrepayOrderRedeemBtc(submitPrepayOrderRedeemDto)
      if (!ret.success) {
        throw new Error(ret.msg)
      }
      return {
        orderId,
        txid,
      }
    } catch (error) {
      throw new Error(error as any)
    }
  }

  async function calcRedeemBtcInfo(
    redeemAmount: number,
    assetInfo: BridgeAssetPairReturnType,
  ) {
    const {
      feeBtc,
      amountLimitMaximum,
      amountLimitMinimum,
      confirmSequence,
      transactionSize,
      assetList,
    } = assetInfo
    if (!assetList) throw new Error('assetList Error')
    if (
      redeemAmount < Number(amountLimitMinimum) ||
      redeemAmount > Number(amountLimitMaximum)
    ) {
      throw new Error('redeem Amount Error')
    }
    const confirmNumber = confirmNumberBySeqAndAmount(
      redeemAmount,
      confirmSequence,
      // mint btc -> mvc, get mvc confirm number
      'MVC',
    )
    const btcAsset = assetList.find((item) => item.network === 'BTC')
    if (!btcAsset) throw new Error('no assrt')
    const bridgeFee =
      (redeemAmount * btcAsset.feeRateNumeratorRedeem) / 10000 +
      btcAsset.feeRateConstRedeem
    const minerFee = transactionSize.BTC_REDEEM * feeBtc
    const totalFee = Math.floor(bridgeFee + minerFee)
    const receiveAmount = redeemAmount - totalFee
    return {
      receiveAmount,
      minerFee,
      totalFee,
      confirmNumber,
    }
  }

  async function calcRedeemBrc20Info(
    redeemAmount: number,
    assetInfo: BridgeAssetPairReturnType,
    asset: Asset,
  ) {
    const {
      btcPrice,
      feeBtc,
      amountLimitMaximum,
      amountLimitMinimum,
      confirmSequence,
      transactionSize,
      assetList,
    } = assetInfo

    const brcAmount = redeemAmount / 10 ** (asset.decimals - asset.trimDecimals)
    const redeemBrc20EqualBtcAmount =
      ((asset.price * Number(brcAmount)) / btcPrice) * 10 ** 8
    if (
      redeemBrc20EqualBtcAmount < Number(amountLimitMinimum) ||
      redeemBrc20EqualBtcAmount > Number(amountLimitMaximum)
    ) {
      throw new Error('redeem Amount Error')
    }
    const confirmNumber = confirmNumberBySeqAndAmount(
      redeemBrc20EqualBtcAmount,
      confirmSequence,
      // mint btc -> mvc, get mvc confirm number
      'MVC',
    )
    const bridgeFeeConst = BigInt(
      Math.floor(
        (((asset.feeRateConstRedeem / 10 ** 8) * btcPrice) / asset.price) *
          10 ** (asset.decimals - asset.trimDecimals),
      ),
    )
    const bridgeFeePercent =
      (BigInt(redeemAmount) * BigInt(asset.feeRateNumeratorRedeem)) / 10000n
    const bridgeFee = bridgeFeeConst + bridgeFeePercent
    const minerFee = BigInt(
      Math.floor(
        (((transactionSize.BRC20_REDEEM / 10 ** 8) * feeBtc * btcPrice) /
          asset.price) *
          10 ** (asset.decimals - asset.trimDecimals),
      ),
    )
    const totalFee = bridgeFee + minerFee
    const receiveAmount = BigInt(redeemAmount) - totalFee
    return {
      receiveAmount,
      minerFee,
      totalFee,
      confirmNumber,
    }
  }

  async function redeemBrc20(
    redeemAmount: number,
    asset: Asset,
    addressType: SupportRedeemAddressType,
  ): Promise<{ orderId: string; txid: string }> {
    try {
      const {
        publicKey,
        publicKeySign,
        publicKeyReceiveSign,
        publicKeyReceive,
      } = await signPublicKey()
      const createPrepayOrderDto = {
        amount: redeemAmount,
        originTokenId: asset.originTokenId,
        addressType,
        publicKey,
        publicKeySign,
        publicKeyReceive,
        publicKeyReceiveSign,
      }
      const createResp =
        await createPrepayOrderRedeemBrc20(createPrepayOrderDto)
      const { orderId, bridgeAddress } = createResp
      const { targetTokenCodeHash, targetTokenGenesis } = asset
      const txid = await sendToken(
        String(redeemAmount),
        bridgeAddress,
        targetTokenCodeHash,
        targetTokenGenesis,
      )
      const submitPrepayOrderRedeemDto = {
        orderId,
        txid: txid,
      }
      await sleep(3000)
      const ret = await submitPrepayOrderRedeemBrc20(submitPrepayOrderRedeemDto)
      if (!ret.success) {
        throw new Error(ret.msg)
      }
      return {
        orderId,
        txid,
      }
    } catch (error) {
      throw new Error(error as any)
    }
  }

  return {
    redeemBtc,
    calcRedeemBtcInfo,
    redeemBrc20,
    calcRedeemBrc20Info,
  }
}
