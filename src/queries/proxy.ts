import { useNetworkStore } from '@/stores/network'
import fetch, { originalFetch } from '@/lib/fetch'

export type SimpleUtxo = {
  txId: string
  satoshis: number
  outputIndex: number
  addressType: any
  confirmed?: boolean
}
export const getUtxos = async (address: string) => {
  const network = useNetworkStore().network
  if (network === 'livenet') {
    return getUtxosFromYouKnowWhere(address)
  }

  const url = `https://api2.orders.exchange/api/utxos3?address=${address}&network=${network}`
  const paymentUtxos: SimpleUtxo[] = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(({ data: utxos }) => {
    return (
      utxos
        .map(
          (utxo: {
            confirmed: boolean
            inscriptions: string
            satoshi: number
            txId: string
            vout: number
          }) => {
            return {
              txId: utxo.txId,
              satoshis: utxo.satoshi,
              outputIndex: utxo.vout,
              confirmed: utxo.confirmed,
              addressType: 2,
            }
          }
        )
        // filter out unconfirmed utxos
        .filter((utxo: SimpleUtxo) => utxo.confirmed)
    )
  })

  return paymentUtxos
}

type Balance = {
  confirmed: number
  unconfirmed: number
  address: string
}
export const fetchBalance = async (address: string) => {
  const url = `https://api2.orders.exchange/api/balance?address=${address}`
  const balance: Balance = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return balance
}

export const getUtxosFromYouKnowWhere = async (address: string) => {
  const network = useNetworkStore().network

  const url = `https://api2.orders.exchange/api/utxos?address=${address}&network=${network}`
  const paymentUtxos: SimpleUtxo[] = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(({ result }) => result)

  return paymentUtxos
}

export type FeebPlan = {
  title: string
  desc: string
  feeRate: number
}
export const getFeebPlans = async ({
  network,
}: {
  network?: 'livenet' | 'testnet'
}): Promise<FeebPlan[]> => {
  if (!network) network = 'livenet'

  const url = `https://api2.orders.exchange/api/feeb-plans?network=${network}`
  const feebPlans = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(({ result: { list } }) => list)

  return feebPlans
}

export const getTxHex = async (txId: string) => {
  const network = useNetworkStore().network

  const url = `https://api2.orders.exchange/api/tx-hex?id=${txId}&network=${network}`

  const txHex: string = await originalFetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.text())
    .then((txHex: string) => {
      if (txHex === 'Transaction not found') {
        throw new Error(
          'Some error happened when finding BTC to pay. Please try again later.'
        )
      }

      return txHex
    })

  return txHex
}
