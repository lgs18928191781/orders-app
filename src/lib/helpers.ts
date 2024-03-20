import { computedEager, useStorage } from '@vueuse/core'
import Decimal from 'decimal.js'
import terminal from 'virtual:terminal'

import { IS_DEV } from '@/data/constants'

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const raise = (err: string): never => {
  throw new Error(err)
}

export const raiseIf = (cond: boolean, err: string): void => {
  if (cond) raise(err)
}

export const raiseUnless = (cond: boolean, err: string): void => {
  if (!cond) raise(err)
}

export const isUnsupportedAddress = (address: string) => {
  return (
    address.startsWith('1') ||
    address.startsWith('3') ||
    address.startsWith('m') ||
    address.startsWith('n')
  )
}

export const generateRandomString = (length: number = 32) => {
  let randomString = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length),
    )
  }

  return randomString
}

export const useBtcUnit = computedEager(() => {
  return useStorage('use-btc-unit', true)
})
export const unit = computedEager(() => {
  const useBtcUnit = useStorage('use-btc-unit', true)
  return useBtcUnit.value ? 'BTC' : 'sat'
})

export type BidTxSpec = {
  inputs: {
    type: 'dummy' | 'btc' | 'brc'
    value: number
    tick?: string
    address?: string
  }[]
  outputs: {
    type: 'dummy' | 'btc' | 'brc' | 'change'
    value: number
    tick?: string
    address?: string
  }[]
}

export const toTx = (
  txid: string,
  network: 'livenet' | 'testnet' = 'livenet',
) => {
  if (network === 'livenet') {
    window.open(`https://mempool.space/tx/${txid}`, '_blank')
    return
  }

  window.open(`https://mempool.space/testnet/tx/${txid}`, '_blank')
}

export const toBlock = (blockId: number) => {
  window.open(`https://mempool.space/block/${blockId}`, '_blank')
}

export const calcFiatPrice = (price: number | string, rate: number) => {
  const fiatPrice = new Decimal(price).times(rate)

  // if it's less than 0.0001, use fixed(8)
  if (fiatPrice.lt(0.0001)) return fiatPrice.toFixed(8)

  // if it's less than 0.01, use fixed(4)
  if (fiatPrice.lt(0.01)) return fiatPrice.toFixed(4)

  return fiatPrice.toFixed(2)
}

export const isRestrictedRegion = (geo: string) => {
  return geo === 'CN'
}

export const getOkxLink = () => {
  const dappUrl = IS_DEV
    ? 'https://app.orders.exchange/'
    : 'https://' + window.location.host + '/'
  const encodedDappUrl = encodeURIComponent(dappUrl)
  const deepLink = 'okx://wallet/dapp/url?dappUrl=' + encodedDappUrl
  const encodedUrl =
    'https://www.okx.com/download?deeplink=' + encodeURIComponent(deepLink)

  return encodedUrl
}

export const isMobile = () => {
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod|ios/i.test(ua)
  const isAndroid = /android|XiaoMi|MiuiBrowser/i.test(ua)
  return isIOS || isAndroid
}

export const isOKApp = () => {
  const ua = navigator.userAgent
  return /OKApp/i.test(ua)
}

export const log = (msg: any) => {
  if (isMobile()) {
    return terminal.log(msg)
  }

  return console.log(msg)
}
