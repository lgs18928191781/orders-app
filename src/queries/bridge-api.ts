import Decimal from 'decimal.js'
import { bridgeApiFetch } from '@/lib/fetch'

export const getAssetPairList = async () => {
  return await bridgeApiFetch(`/assetList`, {
    method: 'GET',
  })
}
