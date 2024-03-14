import { bridgeApiFetch } from '@/lib/fetch'

export type assetReqReturnType =
  | {
      decimals: number
      feeRateConstMint: number
      feeRateConstRedeem: number
      feeRateNumeratorMint: number
      feeRateNumeratorRedeem: number
      isEnableMint: boolean
      isEnableRedeem: boolean
      network: string
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
  | any

export type bridgeAssetPairReturnType =
  | {
      amountLimitMaximum: string
      amountLimitMinimum: string
      assetList: assetReqReturnType[]
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
  | any

export const getAssetPairList =
  async (): Promise<bridgeAssetPairReturnType> => {
    return await bridgeApiFetch(`/assetList`, {
      method: 'GET',
    })
  }

export const createPrepayOrderMintBtcReq = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderMintBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderMintBrc20Req = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderMintBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderMintBtcReq = async (
  data: any
): Promise<{
  msg: string
  success: boolean
}> => {
  return await bridgeApiFetch(`/submitPrepayOrderMintBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderMintBrc20Req = async (
  data: any
): Promise<{
  msg: string
  success: boolean
}> => {
  return await bridgeApiFetch(`/submitPrepayOrderMintBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderRedeemBtc = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderRedeemBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderRedeemBtc = async (
  data: any
): Promise<{ success: boolean; msg: string }> => {
  return await bridgeApiFetch(`/submitPrepayOrderRedeemBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderRedeemBrc20 = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderRedeemBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderRedeemBrc20 = async (
  data: any
): Promise<{ success: boolean; msg: string }> => {
  return await bridgeApiFetch(`/submitPrepayOrderRedeemBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
