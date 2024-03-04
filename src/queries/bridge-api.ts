import { bridgeApiFetch } from '@/lib/fetch'

export const getAssetPairList = async () => {
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
