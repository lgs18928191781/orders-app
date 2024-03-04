import { ordersV2Fetch } from '@/lib/fetch'

export type Issue = {
  amount: number
  buyerAddress: string
  coinAmount: number
  coinDecimalNum: number
  coinPrice: number
  coinPriceDecimalNum: number
  coinRatePrice: number
  decimalNum: number
  freeState: 1
  inscriptionId: string
  net: string
  orderId: string
  orderState: 1
  orderType: 1
  platformFee: number
  psbtRaw: string
  sellerAddress: string
  takePsbtRaw: string
  tick: string
  timestamp: number
}
export const getIssues = async ({
  address,
}: {
  address: string
}): Promise<Issue[]> => {
  const params = new URLSearchParams({
    buyerAddress: address,
    orderState: '50', // 50: issue
  })

  return await ordersV2Fetch(`orders?${params}`, { auth: true }).then(
    ({ results }) => results ?? []
  )
}

export type IssueDetail = {
  coinAmount: number
  coinPsbtRaw: string
  coinTransferPsbtRaw: string
  fee: number
  inscriptionId: string
  net: string
  orderId: string
  psbtRaw: string
  rewardCoinAmount: number
  rewardPsbtRaw: string
  tick: string
}
export const getIssueDetail = async ({
  orderId,
  networkFeeRate,
}: {
  orderId: string
  networkFeeRate: string
}): Promise<{
  psbtRaw: string
}> => {
  const params = new URLSearchParams({
    orderId: orderId,
    net: 'livenet',
    networkFeeRate,
  })

  return ordersV2Fetch(`bid/recover/info?${params}`, {
    method: 'GET',
    auth: true,
  }).then((result) => {
    return result
  })
}

export const submitRecover = async ({
  orderId,
  psbtRaw,
  networkFeeRate,
}: {
  orderId: string
  psbtRaw: string
  networkFeeRate: string
}): Promise<IssueDetail> => {
  return ordersV2Fetch(`bid/recover`, {
    method: 'POST',
    body: JSON.stringify({
      net: 'livenet',
      orderId,
      psbtRaw,
      networkFeeRate: Number(networkFeeRate),
    }),
    auth: true,
  }).then((result) => {
    return result
  })
}
