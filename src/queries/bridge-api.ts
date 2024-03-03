import { bridgeApiFetch } from '@/lib/fetch'

export const getAssetPairList = async () => {
  return await bridgeApiFetch(`/assetList`, {
    method: 'GET',
  })
}

export const createPrepayOrderMintBrc20Req = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderMintBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
