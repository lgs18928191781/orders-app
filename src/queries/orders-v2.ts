import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import sign from '@/lib/sign'
import { ordersApiFetch, ordersV2Fetch } from '@/lib/fetch'
import Decimal from 'decimal.js'
import { sleep } from '@/lib/helpers'

export const getPlatformPublicKey = async (): Promise<{
  platformPublicKey: string
}> => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    network: useNetworkStore().network,
  })

  const res = await ordersV2Fetch(`bid/key?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return res
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
  orderTypeStr: 'ask' | 'bid'
  orderTypeStrInDisplay: 'buy' | 'sell'
  price: Decimal
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

  const params = new URLSearchParams({
    net: network,
    orderType: String(orderType),
    orderState: '1',
    sortKey: 'coinPrice',
    sortType: String(sortType),
    tick,
  })
  const orders: Order[] = await ordersV2Fetch(`orders?${params}`, {})
    .then(({ results }) => results)
    .then((orders) => {
      // if orders is empty, return empty array
      if (!orders) return []

      // order's coinRatePrice is incorrect, so we need to calculate it
      orders.forEach((order: Order) => {
        order.coinRatePrice = new Decimal(
          order.amount / order.coinAmount
        ).toNumber()

        // add price and orderTypeStr
        order.price = new Decimal(order.amount / order.coinAmount)
        order.orderTypeStr = order.orderType === 1 ? 'ask' : 'bid'
        order.orderTypeStrInDisplay = order.orderType === 1 ? 'sell' : 'buy'
      })

      return orders
    })

  return orders
}

export const getMyOpenOrders = async ({ address }: { address: string }) => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    orderState: '1',
    sortKey: 'timestamp',
    sortType: '-1',
  })

  const orders: Order[] = await ordersV2Fetch(
    `orders/user/${address}?${params}`,
    {
      headers: {
        'X-Signature': signature,
        'X-Public-Key': publicKey,
      },
    }
  )
    .then(({ results }) => results)
    .then((orders) => {
      // if orders is empty, return empty array
      if (!orders) return []

      // order's coinRatePrice is incorrect, so we need to calculate it
      orders.forEach((order: Order) => {
        order.coinRatePrice = new Decimal(
          order.amount / order.coinAmount
        ).toNumber()

        // add price and orderTypeStr
        order.price = new Decimal(order.amount / order.coinAmount)
        order.orderTypeStr = order.orderType === 1 ? 'ask' : 'bid'
        order.orderTypeStrInDisplay = order.orderType === 1 ? 'sell' : 'buy'
      })

      return orders
    })
    .then((orders) => {
      // copy 10 times to mock the real-time data
      const copiedOrders = [...orders]
      // for (let i = 0; i < 10; i++) {
      //   copiedOrders.push(...orders)
      // }

      return copiedOrders
    })

  return orders
}

type OrderHistory = Order & {
  orderStateStr: 'open' | 'done' | 'canceled'
}
export const getMyOrderHistory = async ({ address }: { address: string }) => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    orderState: '21',
    sortKey: 'timestamp',
    sortType: '-1',
  })

  const orders: OrderHistory[] = await ordersV2Fetch(
    `orders/user/${address}?${params}`,
    {
      headers: {
        'X-Signature': signature,
        'X-Public-Key': publicKey,
      },
    }
  )
    .then(({ results }) => results)
    .then((orders) => {
      // if orders is empty, return empty array
      if (!orders) return []

      // order's coinRatePrice is incorrect, so we need to calculate it
      orders.forEach((order: OrderHistory) => {
        order.coinRatePrice = new Decimal(
          order.amount / order.coinAmount
        ).toNumber()

        // add price and orderTypeStr
        order.price = new Decimal(order.amount / order.coinAmount)
        order.orderTypeStr = order.orderType === 1 ? 'ask' : 'bid'
        order.orderTypeStrInDisplay = order.orderType === 1 ? 'sell' : 'buy'
        switch (order.orderState) {
          case 1:
            order.orderStateStr = 'open'
            break
          case 2:
            order.orderStateStr = 'done'
            break
          case 3:
            order.orderStateStr = 'canceled'
            break
          default:
            order.orderStateStr = 'open'
            break
        }
      })

      return orders
    })
    .then((orders) => {
      // copy 10 times to mock the real-time data
      const copiedOrders = [...orders]
      // for (let i = 0; i < 10; i++) {
      //   copiedOrders.push(...orders)
      // }

      return copiedOrders
    })

  return orders
}

export const getMarketTrades = async ({ tick = 'rdex' }: { tick: string }) => {
  const network = useNetworkStore().network

  const params = new URLSearchParams({
    net: network,
    orderState: '2',
    sortKey: 'timestamp',
    sortType: '-1',
    tick,
    limit: '20',
  })
  const orders: Order[] = await ordersV2Fetch(`orders?${params}`, {})
    .then(({ results }) => results)
    .then((orders) => {
      // if orders is empty, return empty array
      if (!orders) return []

      // order's coinRatePrice is incorrect, so we need to calculate it
      orders.forEach((order: Order) => {
        order.coinRatePrice = new Decimal(
          order.amount / order.coinAmount
        ).toNumber()

        // add price and orderTypeStr
        order.price = new Decimal(order.amount / order.coinAmount)
        order.orderTypeStr = order.orderType === 1 ? 'ask' : 'bid'
        order.orderTypeStrInDisplay = order.orderType === 1 ? 'sell' : 'buy'
      })

      return orders
    })

  return orders
}

type DetailedOrder = Order & {
  psbtRaw: string
  takePsbtRaw: string
  platformFee: number
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
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    buyerAddress: address,
    tick,
    platformDummy: '1',
  })

  const order: DetailedOrder = await ordersV2Fetch(`${orderId}?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return order
}

export const postBuyTake = async ({
  network,
  psbtRaw,
  orderId,
}: {
  network: 'livenet' | 'testnet'
  psbtRaw: string
  orderId: string
}) => {
  const address = useConnectionStore().getAddress

  const { publicKey, signature } = await sign()

  const updateRes = await ordersV2Fetch(`update`, {
    method: 'POST',
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
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

export const postBidOrder = async ({
  network,
  address,
  tick,
  preTxRaw,
  mergeTxRaw,
  total,
  coinAmount,
}: {
  network: 'livenet' | 'testnet'
  address: string
  tick: string
  preTxRaw: string
  mergeTxRaw?: string
  total: number
  coinAmount: number
}) => {
  try {
    const { publicKey, signature } = await sign()
    const createRes = await ordersV2Fetch(`bid/push`, {
      method: 'POST',
      headers: {
        'X-Signature': signature,
        'X-Public-Key': publicKey,
      },
      body: JSON.stringify({
        net: network,
        address,
        tick,
        preTxRaw,
        mergeTxRaw,
        amount: total,
        coinAmount,
      }),
    })

    return createRes
  } catch (e) {
    throw e
  }
}

export const getSellFees = async ({
  orderId,
}: {
  orderId: string
}): Promise<{
  feeAddress: string
  platformFee: number
}> => {
  const { publicKey, signature } = await sign()
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    orderId,
  })

  const res = await ordersV2Fetch(`bid/cal/fee?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return !res ? { feeAddress: '', platformFee: 0 } : res
}

export const getSellEssentials = async ({
  orderId,
  inscriptionId,
  feeb,
}: {
  orderId: string
  inscriptionId: string
  feeb: number
}): Promise<{
  orderId: string
  psbtRaw: string
}> => {
  const { publicKey, signature } = await sign()
  const address = useConnectionStore().getAddress
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    orderId,
    sellerAddress: address,
    inscriptionId,
    networkFeeRate: String(feeb),
  })

  const res = await ordersV2Fetch(`bid/do/pre?${params}`, {
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
  })

  return res
}

export const postSellTake = async ({
  orderId,
  psbtRaw,
  networkFee,
  networkFeeRate,
}: {
  orderId: string
  psbtRaw: string
  networkFee: number
  networkFeeRate: number
}): Promise<{
  txId: string
}> => {
  const { publicKey, signature } = await sign()

  const res = await ordersV2Fetch(`bid/do`, {
    method: 'POST',
    headers: {
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    },
    body: JSON.stringify({
      net: useNetworkStore().network,
      networkFee,
      networkFeeRate,
      orderId,
      psbtRaw,
    }),
  })

  return res
}

export type KLineInterval = '15m' | '1h' | '4h' | '1d' | '1w'
export const getKLineStats = async ({
  tick,
  interval,
  limit,
}: {
  tick: string
  interval: KLineInterval
  limit: number
}): Promise<
  {
    open: string
    close: string
    high: string
    low: string
    volume: number
    timestamp: number
  }[]
> => {
  const params = new URLSearchParams({
    net: useNetworkStore().network,
    tick,
    interval,
  })
  if (limit) {
    params.append('limit', String(limit))
  }

  const res = await ordersV2Fetch(`kline?${params}`, {})
    .then(({ list }) => list)
    .then((list) => {
      // sorted by timestamp
      return list.sort((a: any, b: any) => a.timestamp - b.timestamp)
    })
    .catch(() => {
      return []
    })

  return res
}
