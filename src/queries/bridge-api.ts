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

export const submitPrepayOrderMintBtcReq = async (data: any) => {
  return await bridgeApiFetch(`/submitPrepayOrderMintBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
