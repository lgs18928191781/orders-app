import Decimal from 'decimal.js'

import { useConnectionStore } from '@/stores/connection'
import { useFeebStore } from '@/stores/feeb'
import { useNetworkStore } from '@/stores/network'
import fetchWrapper, { ordersApiFetch, ordersCommonApiFetch } from '@/lib/fetch'
import { raise } from '@/lib/helpers'

export const login = async ({
  address,
  publicKey,
  signature,
}: {
  address: string
  publicKey: string
  signature: string
}) => {
  const network = useNetworkStore().network

  const loginRes = await ordersApiFetch(`login/in`, {
    method: 'POST',
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
    body: JSON.stringify({
      net: network,
      address,
    }),
  })

  return loginRes
}

export const getFiatRate = async (): Promise<number> => {
  const res = await ordersApiFetch(`common/rate/btc`)

  // use per satoshi price
  return res?.usd?.btc ? new Decimal(res.usd.btc).dividedBy(1e8).toNumber() : 0
}

export const getBrcFiatRate = async (): Promise<Record<string, number>> => {
  const res = await fetchWrapper(
    `https://www.metalet.space/wallet-api/v3/coin/brc20/price`,
  )

  // use per satoshi price
  return res?.data?.priceInfo || {}
}

export type FeebPlan = {
  feeRate: number
  title: 'Eco' | 'Slow' | 'Avg' | 'Fast' | 'Custom'
  fullTitle?: string
}
export const getFeebPlans = async (): Promise<FeebPlan[]> => {
  const res = await ordersCommonApiFetch(`fee/recommended`)

  if (!res) return []

  return [
    {
      title: 'Eco',
      fullTitle: 'Economy',
      feeRate: res.economyFee,
    },
    {
      title: 'Slow',
      feeRate: res.hourFee,
    },
    {
      title: 'Avg',
      feeRate: res.halfHourFee,
    },
    {
      title: 'Fast',
      feeRate: res.fastestFee,
    },
  ]
}

export type Notification = {
  notificationCount: number
  notificationDesc: string
  notificationTitle: string
  notificationType: number
}
export const getNotifications = async (
  address: string,
): Promise<Notification[]> => {
  const notifications = await ordersApiFetch(
    `common/notification/address?address=${address}`,
  )

  return notifications?.results || []
}

export const clearNotifications = async ({
  address,
  notificationType = 0,
}: {
  address: string
  notificationType?: number
}) => {
  await ordersApiFetch(
    `common/notification/clear?address=${address}&notificationType=${notificationType}`,
    {
      method: 'GET',
    },
  )

  return 'success'
}

export const getOrdiBalance = async (
  address: string,
  network: 'livenet' | 'testnet',
) => {
  // fake data for testnet
  if (network === 'testnet') {
    // randomize, from 5 to 100
    const fakeBalance = 10
    return fakeBalance
  }

  // real data for livenet
  return 1
}

export type BidCandidate = {
  inscriptionId: string
  inscriptionNumber: string
  coinAmount: string
  poolOrderId?: string
  bidCount: number
  coinRatePrice: number
  coinPrice: number
  coinPriceDecimalNum: number
}
export const getBidCandidates = async (
  network: 'livenet' | 'testnet',
  tick: string,
  isPool: boolean = true,
): Promise<BidCandidate[]> => {
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    net: network,
    address,
    tick,
    isPool: String(isPool),
  })
  let candidates: BidCandidate[] = await ordersApiFetch(
    `order/bid/pre?${params}`,
  ).then(({ availableList }) => availableList)

  if (candidates) {
    candidates = candidates.map((candidate) => {
      let inscriptionId
      if (candidate.inscriptionId.includes(':')) {
        inscriptionId =
          candidate.inscriptionId.split(':')[0] +
          'i' +
          candidate.inscriptionId.split(':')[1]
      } else {
        inscriptionId = candidate.inscriptionId
      }

      candidate.inscriptionId = inscriptionId

      // fix coinRatePrice
      candidate.coinRatePrice = new Decimal(
        candidate.coinPrice / 10 ** candidate.coinPriceDecimalNum,
      ).toNumber()

      return candidate
    })
  }

  return candidates || []
}

export const getBidCandidateInfo = async ({
  network,
  tick,
  inscriptionId,
  inscriptionNumber,
  coinAmount,
  total,
  isPool,
  poolOrderId,
}: {
  network: 'livenet' | 'testnet'
  tick: string
  inscriptionId: string
  inscriptionNumber: string
  coinAmount: string | number
  total: number
  isPool: boolean
  poolOrderId?: string
}): Promise<{
  net: 'livenet' | 'testnet'
  tick: string
  psbtRaw: string
  orderId: string
}> => {
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    net: network,
    tick,
    inscriptionNumber,
    coinAmount: String(coinAmount),
    total: String(total),
    amount: String(total),
    address,
    switchPrice: '1',
    // inscriptionId,
  })
  if (isPool) {
    params.append('isPool', String(isPool))

    if (poolOrderId) params.append('poolOrderId', poolOrderId)
  }

  const candidateInfo = await ordersApiFetch(
    `order/bid?${params}&inscriptionId=${inscriptionId}`,
  )

  // validate
  if (!candidateInfo.psbtRaw) {
    throw new Error('Psbt is not provided.')
  }

  return candidateInfo
}

export const constructBidPsbt = async ({
  network,
  tick,
  inscriptionId,
  inscriptionNumber,
  coinAmount,
  total,
  poolOrderId,
  bidSchema,
}: {
  network: 'livenet' | 'testnet'
  tick: string
  inscriptionId: string
  inscriptionNumber: string
  coinAmount: string | number
  total: number
  poolOrderId: string
  bidSchema: {
    inputs: {
      type: 'dummy' | 'brc' | 'brc'
      value: number
      tick?: string
      address?: string
    }[]
    outputs: {
      type: 'dummy' | 'brc' | 'brc' | 'change'
      value: number
      tick?: string
      address?: string
    }[]
  }
}): Promise<{
  net: 'livenet' | 'testnet'
  tick: string
  psbtRaw: string
  orderId: string
}> => {
  const address = useConnectionStore().getAddress
  const body = {
    net: network,
    tick,
    inscriptionNumber,
    inscriptionId,
    coinAmount: String(coinAmount),
    amount: total,
    address,
    poolOrderId,
    isPool: true,
    bidTxSpec: bidSchema,
    platformDummy: 1,
    switchPrice: 1,
  }
  const constructInfo = await ordersApiFetch(`order/bid-v2`, {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })

  // validate
  if (!constructInfo.psbtRaw) {
    throw new Error('Psbt is not provided.')
  }

  return constructInfo
}

export const getSellFees = async ({ orderId }: { orderId: string }) => {
  const feeb = useFeebStore().get ?? raise('Choose a fee rate first.')

  const params = new URLSearchParams({
    version: '2',
    networkFeeRate: String(feeb),
    orderId,
  })

  const fees: {
    releaseInscriptionFee: number
    rewardInscriptionFee: number
    rewardSendFee: number
    platformFee: number
    furtherFee: number
  } = await ordersApiFetch(`order/bid/cal/fee?${params}`).then((fees) => {
    fees.furtherFee =
      fees.releaseInscriptionFee +
      fees.rewardInscriptionFee +
      fees.rewardSendFee

    return fees
  })

  return fees
}

export type Order = {
  amount: number
  buyerAddress: string
  coinAmount: number
  coinDecimalNum: number
  coinRatePrice: number
  coinPrice: number
  net: 'livenet' | 'testnet'
  orderId: string
  orderState: number
  orderType: number
  freeState?: 1 | 0
  sellerAddress: string
  tick: string
  timestamp: number
}
export const getOrders = async ({
  type,
  network,
  sort = 'asc',
  tick = 'rdex',
}: {
  type: 'bid' | 'ask'
  network: 'livenet' | 'testnet'
  sort: 'asc' | 'desc'
  tick: string
}) => {
  const orderType = type === 'ask' ? 1 : 2
  const sortType = sort === 'asc' ? 1 : -1
  const address = useConnectionStore().getAddress

  const params = new URLSearchParams({
    net: network,
    orderType: String(orderType),
    orderState: '1',
    sortKey: 'coinRatePrice',
    sortType: String(sortType),
    tick,
    address,
  })
  const orders: Order[] = await ordersApiFetch(`orders?${params}`)
    .then(({ results }) => results)
    .then((orders) => {
      // if orders is empty, return empty array
      if (!orders) return []

      // order's coinRatePrice is incorrect, so we need to calculate it
      orders.forEach((order: Order) => {
        order.coinRatePrice = new Decimal(
          order.amount / order.coinAmount,
        ).toNumber()
      })

      return orders
    })

  return orders
}

type DetailedOrder = Order & { psbtRaw: string; takePsbtRaw: string }
export const getOneOrder = async ({
  orderId,
}: {
  orderId: string
}): Promise<DetailedOrder> => {
  const address = useConnectionStore().getAddress

  const order: DetailedOrder = await ordersApiFetch(
    `order/${orderId}?buyerAddress=${address}`,
    { auth: true },
  )

  return order
}

export type BidV20Order = {
  orderId: string
  psbtRaw: string
  platformFee: number
  releaseInscriptionFee: number
  rewardInscriptionFee: number
  rewardSendFee: number
  furtherFee: number
}
export const getOneBidOrder = async ({
  orderId,
  inscriptionId,
}: {
  orderId: string
  inscriptionId: string
}): Promise<BidV20Order> => {
  const address = useConnectionStore().getAddress
  const feeb = useFeebStore().get ?? raise('Choose a fee rate first.')

  const params = new URLSearchParams({
    net: 'livenet',
    orderId,
    inscriptionId,
    sellerAddress: address,
    version: '2',
    networkFeeRate: String(feeb),
  })

  const order: BidV20Order = await ordersApiFetch(
    `order/bid-v2/do/pre?${params}`,
    { auth: true },
  ).then((order) => {
    order.furtherFee =
      order.releaseInscriptionFee +
      order.rewardInscriptionFee +
      order.rewardSendFee

    return order
  })
  return order
}

export const getBuyEssentials = async ({
  orderId,
  address,
  tick,
  buyerChangeAmount,
}: {
  orderId: string
  address: string
  tick: string
  buyerChangeAmount: number
}): Promise<DetailedOrder> => {
  const params = new URLSearchParams({
    buyerAddress: address,
    tick,
    platformDummy: '1',
  })

  const order: DetailedOrder = await ordersApiFetch(
    `order/${orderId}?${params}`,
    { auth: true },
  )

  return order
}

export type Ticker = {
  amount: string
  avgPrice: string
  tick: string
  pair: string
  net: 'livenet' | 'testnet'
}
export const getMarketPrice = async ({ tick }: { tick: string }) => {
  // const network = useNetworkStore().network
  const network = 'livenet' // TODO
  const marketPrice: number = await ordersApiFetch(
    `tickers?tick=${tick}&net=${network}`,
  )
    .then(({ results: tickers }) => tickers)
    .then((tickers: Ticker[]) => {
      if (tickers.length === 0) return 0

      const theTicker = tickers.find(
        (ticker) => ticker.tick === tick && ticker.net === network,
      )

      return theTicker ? Number(theTicker.avgPrice) : 0
    })

  return marketPrice
}

export type Brc20Transferable = {
  inscriptionId: string
  inscriptionNumber: string
  amount: string
  outValue: number
}

export type Brc20 = {
  availableBalance: string
  balance: string
  limit: string
  transferBalance: string
  transferBalanceList: Brc20Transferable[]
}
export const getOneBrc20 = async ({
  tick,
  address,
}: {
  tick: string
  address: string
}) => {
  const network = useNetworkStore().network
  let brc20: Brc20 = await ordersApiFetch(
    `address/${address}/${tick}?net=${network}`,
  )

  // map inscriptionId into : notation
  if (brc20) {
    brc20.transferBalanceList = brc20.transferBalanceList.map((transfer) => {
      const inscriptionNumber = transfer.inscriptionNumber
      const amount = transfer.amount
      const outValue = transfer.outValue

      let inscriptionId
      if (transfer.inscriptionId.includes(':')) {
        inscriptionId =
          transfer.inscriptionId.split(':')[0] +
          'i' +
          transfer.inscriptionId.split(':')[1]
      } else {
        inscriptionId = transfer.inscriptionId
      }

      return {
        inscriptionId,
        inscriptionNumber,
        amount,
        outValue,
      }
    })

    // filter out unconfirmed (inscriptionNumber is -1)
    const filtered = brc20.transferBalanceList.filter(
      (brc) => brc.inscriptionNumber !== '-1',
    )
    brc20.transferBalanceList = filtered

    // copy 10 times
    // const copied = [...brc20.transferBalanceList]
    // for (let i = 0; i < 10; i++) {
    //   copied.push(...brc20.transferBalanceList)
    // }

    // brc20.transferBalanceList = copied
  }

  return brc20 || {}
}

export type Brx20Brief = {
  balance: string
  token: string
  availableBalance: string
  tokenType: 'BRC20'
  transferBalance: string
}
export const getBrc20s = async ({
  address,
  tick,
  network,
}: {
  address: string
  tick?: string
  network: 'livenet' | 'testnet'
}) => {
  let path = `address/${address}/balance/info?net=${network}`
  if (tick) path += `&tick=${tick}`

  const brc20s = await ordersApiFetch(path).then(
    ({ balanceList }: { balanceList: Brx20Brief[] }) => balanceList,
  )

  return brc20s || []
}

export const pushSellTake = async ({
  network,
  psbtRaw,
  orderId,
  address,
  value,
  amount,
  networkFee,
  networkFeeRate,
}: {
  network: 'livenet' | 'testnet'
  psbtRaw: string
  orderId: string
  address: string
  value: number
  amount: string
  networkFee: number
  networkFeeRate: number
}) => {
  const sellRes = await ordersApiFetch(`order/bid/do`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      net: network,
      psbtRaw,
      orderId,
      address,
      value,
      amount,
      networkFee,
      networkFeeRate,
      version: 2,
    }),
  })

  return sellRes
}

export const pushSellTakeV2 = async ({
  network,
  psbtRaw,
  orderId,
  address,
  value,
  amount,
  networkFee,
  networkFeeRate,
}: {
  network: 'livenet' | 'testnet'
  psbtRaw: string
  orderId: string
  address: string
  value: number
  amount: string
  networkFee: number
  networkFeeRate: number
}) => {
  const sellRes = await ordersApiFetch(`order/bid-v2/do`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      net: network,
      psbtRaw,
      orderId,
      address,
      value,
      amount,
      networkFee,
      networkFeeRate,
      version: 2,
    }),
  })

  return sellRes
}

export const pushAskOrder = async ({
  network,
  address,
  tick,
  psbtRaw,
  amount,
}: {
  network: 'livenet' | 'testnet'
  address: string
  tick: string
  psbtRaw: string
  amount: number
}) => {
  const createRes = await ordersApiFetch(`order/ask/push`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      psbtRaw,
      address,
      net: network,
      orderState: 1,
      orderType: 1,
      tick,
      coinAmount: amount,
    }),
  })

  return createRes
}

export const pushBuyTake = async ({
  network,
  psbtRaw,
  orderId,
}: {
  network: 'livenet' | 'testnet'
  psbtRaw: string
  orderId: string
}) => {
  const address = useConnectionStore().getAddress

  // if pushed successfully, update the Dummies
  // notify update psbt status
  const updateRes = await ordersApiFetch(`order/update`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      net: network,
      address,
      orderId,
      orderState: 2,
      psbtRaw,
      broadcastIndex: 1,
    }),
  })

  return updateRes
}

export const cancelOrder = async ({ orderId }: { orderId: string }) => {
  const address = useConnectionStore().getAddress
  const network = useNetworkStore().network
  await ordersApiFetch(`order/update`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      net: network,
      address,
      orderId,
      orderState: 3,
    }),
  })
}

export const pushBidOrder = async ({
  network,
  address,
  tick,
  psbtRaw,
  preTxRaw,
  feeb,
  fee,
  total,
  using,
  orderId,
}: {
  network: 'livenet' | 'testnet'
  address: string
  tick: string
  psbtRaw: string
  preTxRaw: string
  feeb: number
  fee: number
  total: number
  using: number
  orderId: string
}) => {
  try {
    const createRes = await ordersApiFetch(`order/bid/push`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        net: network,
        address,
        tick,
        psbtRaw,
        preTxRaw,
        rate: feeb,
        fee,
        amount: total,
        buyerInValue: using,
        orderId,
      }),
    })

    return createRes
  } catch (e) {
    throw e
  }
}

// Whitelist claim rewards
export const getOneClaim = async ({
  tick = 'rdex',
  address,
}: {
  tick?: 'rdex'
  address: string
}): Promise<{
  coinAmount: number
  availableCount: number
  fee: number
  orderId: string
  psbtRaw: string
  net: 'livenet' | 'testnet'
  tick: 'rdex'
}> => {
  const network = 'livenet'
  return await ordersApiFetch(
    `claim/order?tick=${tick}&address=${address}&net=${network}`,
  )
}

export const updateClaim = async ({
  address,
  orderId,
  psbtRaw,
}: {
  address: string
  orderId: string
  psbtRaw: string
}) => {
  const network = 'livenet'
  await ordersApiFetch(`claim/order/update`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      net: network,
      address,
      orderId,
      psbtRaw,
    }),
  })
}

export const getListingUtxos: () => Promise<
  {
    order: string
    dummyId: string
    timestamp: number
  }[]
> = async () => {
  const network = useNetworkStore().network
  const address = useConnectionStore().getAddress

  const utxos = await ordersApiFetch(
    `order/bid/dummy/${address}?net=${network}`,
  ).then(({ results }) => results || [])

  return utxos
}
