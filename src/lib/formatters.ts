import { RemovableRef } from '@vueuse/core'
import dayjs from 'dayjs/esm/index.js'
import Decimal from 'decimal.js'

export function prettyTimestamp(
  timestamp: number,
  isInSeconds = false,
  cutThisYear = false
) {
  if (isInSeconds) timestamp = timestamp * 1000

  if (cutThisYear) return dayjs(timestamp).format('MM-DD HH:mm:ss')

  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

export function prettyDate(timestamp: number, isInSeconds = false) {
  if (isInSeconds) timestamp = timestamp * 1000

  return dayjs(timestamp).format('MM-DD')
}

export const prettyAddress = (address: string, len = 6) => {
  return `${address.slice(0, len)}...${address.slice(-len)}`
}
export const prettyOneSideAddress = (address: string, len = 6) => {
  return `...${address.slice(-len)}`
}

export const prettyTxid = (txid: string, len = 6) => {
  return `${txid.slice(0, len)}...${txid.slice(-len)}`
}

export const formatUnitToSats = (
  value: number | string,
  decimal: number = 8
) => {
  if (!value) {
    return 0
  }
  return new Decimal(value).mul(10 ** decimal).toNumber()
}

export const formatUnitToBtc = (
  value: number | string,
  decimal: number = 8
) => {
  if (!value) {
    return 0
  }
  return new Decimal(value).div(10 ** decimal).toNumber()
}

export const prettyBalance = (
  balance: number | string | Decimal | undefined,
  useBtcUnit: boolean | RemovableRef<boolean> = true
) => {
  if (balance === 0 || balance === '0') return new Decimal(0)
  if (!balance) return '-'

  const useBtcUnitValue =
    typeof useBtcUnit === 'boolean' ? useBtcUnit : useBtcUnit.value
  if (useBtcUnitValue) {
    const _ = new Decimal(balance).dividedBy(1e8)

    if (_.dp() > 8) return _.toFixed()

    return _.toFixed(8)
  }

  return new Decimal(balance).toFixed()
}

export const prettyBtcDisplay = (
  balance: number | string | Decimal,
  cutDecimals = false
) => {
  if (cutDecimals) {
    const _ = new Decimal(balance).dividedBy(1e8)

    // no decimals
    return `${_.toFixed(0)} BTC`
  }
  return `${prettyBalance(balance)} BTC`
}

export const prettyCoinDisplay = (balance: number | string, symbol: string) => {
  if (symbol.toUpperCase() === 'BTC') return prettyBtcDisplay(balance)

  return `${balance} $${symbol.toUpperCase()}`
}

export const prettySymbol = (symbol: string) => {
  if (symbol.toUpperCase() === 'BTC') {
    return 'BTC'
  }

  return '$' + symbol.toUpperCase()
}

export function formatNum(num: any) {
  if (num == '--') {
    return '--'
  }
  num = new Decimal(num).toString().split('.')
  let arr = num[0].split('').reverse() // 转换成字符数组并且倒序排列
  let res: any = []
  for (var i = 0, len = arr.length; i < len; i++) {
    if (i % 3 === 0 && i !== 0) {
      res.push(',') // 添加分隔符
    }
    res.push(arr[i])
  }
  res.reverse() // 再次倒序成为正确的顺序
  if (num[1]) {
    // 如果有小数的话添加小数部分
    res = res.join('').concat('.' + num[1])
  } else {
    res = res.join('')
  }

  return res
}

export const prettyInscriptionId = (id: string) => {
  return `#${id.slice(0, 8)}`
}
